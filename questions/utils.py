import re
import os
import openpyxl
from .models import Question, Option, QuestionType

# === Dispatcher ===
def import_questions_from_excel(file_path):
    wb = openpyxl.load_workbook(file_path, data_only=True)
    level = os.path.splitext(os.path.basename(file_path))[0][-2:]

    sheet_parser_map = {
        "grammar": parse_grammar_sheet,
        "vocabulary": parse_vocabulary_sheet,
        "reading": parse_reading_sheet,
    }

    for sheet_name in wb.sheetnames:
        matched = next((key for key in sheet_parser_map if key in sheet_name.lower()), None)

        if matched:
            print(f"📄 Parsing sheet: {sheet_name} as {matched}")
            sheet_parser_map[matched](wb[sheet_name], level)
        else:
            print(f"⚠️ Skipping unknown sheet: {sheet_name}")


def is_numbered(cell_value):
    return isinstance(cell_value, str) and re.match(r"^\d+\.", cell_value.strip())

def parse_grammar_sheet(sheet, level):
    row = 1
    while row < sheet.max_row:
        number_cell = sheet.cell(row=row, column=2).value
        text_cell = sheet.cell(row=row, column=3).value

        if is_numbered(number_cell) and isinstance(text_cell, str):
            instruction = text_cell.strip()
            question_row = row + 1
            question_text = sheet.cell(row=question_row, column=3).value

            if not question_text:
                row += 1
                continue

            # ===== Case 1: Fill-in-the-gap with prepositions (options in instruction)
            if instruction.lower().startswith("complete the sentence"):
                answer_row = question_row + 2
                answer = (sheet.cell(row=answer_row, column=3).value or "").strip().lower()
                option_list = re.split(r"[–\-•,]", instruction.split(":")[-1])
                option_list = [opt.strip().lower() for opt in option_list if opt.strip()]

                # Create question
                q = Question.objects.create(
                    type=QuestionType.GRAMMAR,
                    level=level,
                    prompt=question_text
                )

                # Create options
                for idx, opt in enumerate(option_list):
                    Option.objects.create(
                        question=q,
                        label=chr(65 + idx),  # A, B, C...
                        text=opt,
                        is_correct=(opt == answer)
                    )

                row += 4  # Skip to next block

            # ===== Case 2: MCQ with labeled answers below
            elif instruction.lower().startswith("choose the appropriate answer"):
                options = []
                correct_index = None

                for i, label in enumerate(['A', 'B', 'C', 'D']):
                    option_text = sheet.cell(row=row + 2 + i, column=3).value
                    if not option_text:
                        continue
                    option_text = option_text.strip()
                    options.append((label, option_text))

                    if option_text.lower().startswith("it seems"):  # Example heuristic
                        correct_index = i

                q = Question.objects.create(
                    type=QuestionType.GRAMMAR,
                    level=level,
                    prompt=question_text
                )

                for i, (label, opt_text) in enumerate(options):
                    Option.objects.create(
                        question=q,
                        label=label,
                        text=opt_text,
                        is_correct=(i == correct_index)
                    )

                row += 6  # Skip to next question
            else:
                row += 1
        else:
            row += 1

def parse_reading_sheet(sheet, level):
    row = 1
    while row <= sheet.max_row:
        number_cell = sheet.cell(row=row, column=2).value
        text_cell = sheet.cell(row=row, column=3).value

        # Ищем начало блока вопроса
        if is_numbered(number_cell) and isinstance(text_cell, str):
            instruction = text_cell.strip()
            paragraph_lines = []
            row += 1

            # Собираем параграф (пока не встретим пустую строку или "Answer the question.")
            while row <= sheet.max_row:
                para_text = sheet.cell(row=row, column=3).value
                if para_text is None or str(para_text).strip() == "" or "Answer the question" in str(para_text):
                    break
                paragraph_lines.append(str(para_text).strip())
                row += 1

            paragraph = "\n".join(paragraph_lines)

            # Пропускаем строку с "Answer the question."
            while row <= sheet.max_row:
                answer_line = sheet.cell(row=row, column=3).value
                if answer_line and "Answer the question" in str(answer_line):
                    row += 1
                    break
                row += 1

            # Следующая строка — текст вопроса
            question_text = sheet.cell(row=row, column=3).value
            if not question_text:
                row += 1
                continue
            question_text = str(question_text).strip()
            row += 1

            # Собираем опции (A, B, C, D, E)
            options = []
            correct_index = None
            option_labels = ['A', 'B', 'C', 'D', 'E']
            for i, label in enumerate(option_labels):
                if row > sheet.max_row:
                    break
                opt_label = sheet.cell(row=row, column=2).value
                opt_text = sheet.cell(row=row, column=3).value
                if (opt_label is None or str(opt_label).strip() != label) or not opt_text:
                    break
                opt_text = str(opt_text).strip()
                # Если вариант выделен жирным (font.bold), считаем его правильным
                cell_obj = sheet.cell(row=row, column=3)
                is_correct = getattr(cell_obj.font, 'bold', False)
                if is_correct:
                    correct_index = i
                options.append((label, opt_text))
                row += 1

            # Создаём вопрос
            q = Question.objects.create(
                type=QuestionType.READING,
                level=level,
                prompt=f"{instruction}\n\n{paragraph}\n\n{question_text}"
            )

            # Создаём опции
            for i, (label, opt_text) in enumerate(options):
                Option.objects.create(
                    question=q,
                    label=label,
                    text=opt_text,
                    is_correct=(i == correct_index)
                )
        else:
            row += 1

def parse_vocabulary_sheet(sheet, level):
    row = 1
    while row < sheet.max_row:
        number_cell = sheet.cell(row=row, column=2).value
        text_cell = sheet.cell(row=row, column=3).value

        if is_numbered(number_cell) and isinstance(text_cell, str):
            # Инструкция и опции
            instruction = text_cell.strip()
            # Извлекаем опции из инструкции (после двоеточия)
            if ":" in instruction:
                options_part = instruction.split(":")[-1]
                option_list = [opt.strip().lower() for opt in re.split(r"[\\/]", options_part) if opt.strip()]
            else:
                option_list = []

            # Текст вопроса — следующая строка
            question_row = row + 1
            question_text = sheet.cell(row=question_row, column=3).value
            if not question_text:
                row += 1
                continue
            question_text = question_text.strip()

            # Ответ — через одну строку после вопроса (row + 3)
            answer_row = row + 3
            answer = (sheet.cell(row=answer_row, column=3).value or "").strip().lower()

            # Создаём вопрос
            q = Question.objects.create(
                type=QuestionType.VOCABULARY,
                level=level,
                prompt=question_text
            )

            # Создаём опции
            for idx, opt in enumerate(option_list):
                Option.objects.create(
                    question=q,
                    label=chr(65 + idx),  # A, B, C, ...
                    text=opt,
                    is_correct=(opt == answer)
                )

            row += 4  # Переходим к следующему блоку
        else:
            row += 1



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
        # Look for a question number in column 2
        number_cell = sheet.cell(row=row, column=2).value
        if number_cell and re.match(r"^\d+\.", str(number_cell).strip()):
            # Find instruction in column 3
            instruction = sheet.cell(row=row, column=3).value
            instruction = str(instruction).strip() if instruction else ""
            # Look for reading instruction
            if re.search(r"read the (paragraph|article)", instruction, re.IGNORECASE):
                row += 1
                # Collect paragraph lines until a block marker is found
                paragraph_lines = []
                while row <= sheet.max_row:
                    para_text = sheet.cell(row=row, column=3).value
                    if para_text is None:
                        row += 1
                        continue
                    para_text_str = str(para_text).strip()
                    # Stop at block marker
                    if re.match(r"^(Complete the sentence:|Question:|Answer the questions\.)", para_text_str, re.IGNORECASE):
                        break
                    if para_text_str:
                        paragraph_lines.append(para_text_str)
                    row += 1
                paragraph = "\n".join(paragraph_lines)

                # Now at the block marker row
                question_text = ""
                if row <= sheet.max_row:
                    block_marker = sheet.cell(row=row, column=3).value
                    block_marker_str = str(block_marker).strip() if block_marker else ""
                    # If the question is on the same line as the marker
                    m = re.match(r"^(Complete the sentence:|Question:|Answer the question\.)(.*)", block_marker_str, re.IGNORECASE)
                    if m and m.group(2).strip():
                        question_text = m.group(2).strip()
                        row += 1
                    else:
                        # Otherwise, look for the next non-empty line as the question
                        row += 1
                        while row <= sheet.max_row:
                            next_text = sheet.cell(row=row, column=3).value
                            if next_text and str(next_text).strip():
                                question_text = str(next_text).strip()
                                row += 1
                                break
                            row += 1
                # Create the question in the DB
                q = Question.objects.create(
                    type=QuestionType.READING,
                    level=level,
                    prompt=f"{instruction}\n\n{question_text}",
                    paragraph = paragraph
                )
                # Read 5 options (a,b,c,d,e) from column 2/3
                option_labels = ['a', 'b', 'c', 'd', 'e']
                for label in option_labels:
                    if row > sheet.max_row:
                        break
                    opt_label = sheet.cell(row=row, column=2).value
                    opt_text = sheet.cell(row=row, column=3).value
                    if (opt_label is None or str(opt_label).strip().lower() != label) or not opt_text:
                        break
                    opt_text = str(opt_text).strip()
                    Option.objects.create(
                        question=q,
                        label=label.upper(),
                        text=opt_text,
                        is_correct=False  # Correct answer logic can be added if needed
                    )
                    row += 1
            else:
                row += 1
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



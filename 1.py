import re
import openpyxl

# === Dispatcher ===
def import_questions_from_excel(file_path):
    wb = openpyxl.load_workbook(file_path, data_only=True)

    sheet_parser_map = {
        "grammar": parse_grammar_sheet,
        "vocabulary": parse_vocabulary_sheet,
        "reading": parse_reading_sheet,
    }

    for sheet_name in wb.sheetnames:
        matched = next((key for key in sheet_parser_map if key in sheet_name.lower()), None)

        if matched:
            print(f"📄 Parsing sheet: {sheet_name} as {matched}")
            sheet_parser_map[matched](wb[sheet_name], matched.capitalize())
        else:
            print(f"⚠️ Skipping unknown sheet: {sheet_name}")


def parse_reading_sheet(sheet, level):
    pass

def parse_vocabulary_sheet(sheet, level):
    pass

def parse_grammar_sheet(sheet, level):
    pass

if __name__ == "__main__":
    # import_questions_from_excel("KELET-B2.xlsx")
    
    wb = openpyxl.load_workbook("KELET-B2.xlsx", data_only=True)
    sheet = wb["UPPER-READING"]
    print(sheet.cell(row=1, column=1).value)
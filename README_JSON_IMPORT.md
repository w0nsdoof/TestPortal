# JSON Question Import Guide

This guide explains how to import questions from JSON files into your Django application using the provided tools.

## Overview

The system provides multiple ways to import questions from JSON files:

1. **Django Management Command** - Command-line tool for importing
2. **Utility Functions** - Programmatic import functions
3. **Example Script** - Demonstrates usage patterns

## JSON Format

Your JSON files should contain an array of question objects with the following structure:

```json
[
  {
    "type": "Grammar",
    "level": "B1",
    "prompt": "What is the correct form of the verb?",
    "paragraph": "Optional paragraph for reading questions",
    "options": [
      {
        "label": "A",
        "text": "goes",
        "is_correct": true
      },
      {
        "label": "B",
        "text": "go",
        "is_correct": false
      }
    ]
  }
]
```

### Field Descriptions

- **type**: Question type - "Grammar", "Reading", or "Vocabulary"
- **level**: English level - "A1", "A2", "B1", "B2", or "C1"
- **prompt**: The main question text
- **paragraph**: Optional paragraph text (mainly for Reading questions)
- **options**: Array of answer options
  - **label**: Option label (A, B, C, D, etc.)
  - **text**: Option text
  - **is_correct**: Boolean indicating if this is the correct answer

## Usage Methods

### 1. Django Management Command

The easiest way to import questions is using the Django management command:

```bash
# Import from a single file
python manage.py import_json_questions data/ready/b1.json

# Import from a directory (all JSON files)
python manage.py import_json_questions data/ready/

# Clear existing questions before importing
python manage.py import_json_questions data/ready/b1.json --clear

# Override the level from the filename
python manage.py import_json_questions data/ready/b1.json --level A2
```

#### Command Options

- `json_path`: Path to JSON file or directory
- `--clear`: Clear existing questions for the level before importing
- `--level`: Override the level (A1, A2, B1, B2, C1)

### 2. Utility Functions

You can also import questions programmatically:

```python
from questions.utils import import_questions_from_json_file, import_questions_from_json

# Import from file
imported_count = import_questions_from_json_file(
    file_path="data/ready/b1.json",
    level="B1",  # Optional, will be detected from filename
    clear_existing=True
)

# Import from JSON data
json_data = [
    {
        "type": "Grammar",
        "prompt": "Sample question?",
        "options": [
            {"label": "A", "text": "Answer A", "is_correct": True},
            {"label": "B", "text": "Answer B", "is_correct": False}
        ]
    }
]

imported_count = import_questions_from_json(
    json_data=json_data,
    level="B1",
    clear_existing=False
)
```

### 3. Example Script

Run the example script to see all usage patterns:

```bash
python example_import.py
```

## Level Detection

The system automatically detects the English level from the filename:

- `a2.json` → A2 level
- `b1.json` → B1 level
- `b2.json` → B2 level
- `c1.json` → C1 level
- Other names → A1 level (default)

You can override this by specifying the `--level` parameter.

## Error Handling

The import process includes comprehensive error handling:

- **Invalid JSON**: Reports JSON parsing errors
- **Missing fields**: Skips questions with missing required fields
- **Invalid types**: Skips questions with unknown question types
- **Database errors**: Uses transactions to ensure data consistency

## Database Transactions

All imports use Django database transactions to ensure data consistency:

- If any error occurs during import, all changes are rolled back
- The `--clear` option only clears questions if the import succeeds
- Each file is processed in its own transaction

## Examples

### Import B1 Questions

```bash
# Import B1 questions, clearing existing ones
python manage.py import_json_questions data/ready/b1.json --clear
```

### Import All Levels

```bash
# Import all JSON files in the data/ready directory
python manage.py import_json_questions data/ready/
```

### Programmatic Import

```python
# In your Django code
from questions.utils import import_questions_from_json_file

def import_questions():
    try:
        count = import_questions_from_json_file(
            "data/ready/b1.json",
            clear_existing=True
        )
        print(f"Imported {count} questions")
    except Exception as e:
        print(f"Import failed: {e}")
```

## Troubleshooting

### Common Issues

1. **File not found**: Check the file path is correct
2. **Invalid JSON**: Validate your JSON format
3. **Permission errors**: Ensure the file is readable
4. **Database errors**: Check your database connection

### Debug Mode

For more detailed output, you can modify the management command to include debug logging:

```python
# In import_json_questions.py, add:
import logging
logging.basicConfig(level=logging.DEBUG)
```

## File Structure

```
your_project/
├── data/
│   └── ready/
│       ├── a2.json
│       ├── b1.json
│       └── b2.json
├── questions/
│   ├── management/
│   │   └── commands/
│   │       └── import_json_questions.py
│   └── utils.py
├── example_import.py
└── README_JSON_IMPORT.md
```

## Notes

- The import process is idempotent - you can run it multiple times safely
- Use `--clear` carefully as it will delete existing questions for the level
- The system validates all data before creating database records
- Large files are processed efficiently with minimal memory usage

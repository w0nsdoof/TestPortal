#!/usr/bin/env python
"""
Example script showing how to import questions from JSON files
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from questions.utils import import_questions_from_json_file, import_questions_from_json


def example_import_from_file():
    """Example: Import from a JSON file"""
    print("=== Importing from JSON file ===")
    
    # Path to your JSON file
    json_file_path = "data/ready/b1.json"
    
    if os.path.exists(json_file_path):
        try:
            # Import questions from the file
            # The level will be automatically detected from the filename (b1.json -> B1)
            imported_count = import_questions_from_json_file(
                file_path=json_file_path,
                clear_existing=True  # Clear existing B1 questions before importing
            )
            print(f"Successfully imported {imported_count} questions from {json_file_path}")
        except Exception as e:
            print(f"Error importing from file: {e}")
    else:
        print(f"File not found: {json_file_path}")


def example_import_from_data():
    """Example: Import from JSON data directly"""
    print("\n=== Importing from JSON data ===")
    
    # Sample JSON data
    sample_data = [
        {
            "type": "Grammar",
            "level": "B1",
            "prompt": "What is the correct form of the verb?",
            "options": [
                {"label": "A", "text": "goes", "is_correct": True},
                {"label": "B", "text": "go", "is_correct": False},
                {"label": "C", "text": "going", "is_correct": False},
                {"label": "D", "text": "gone", "is_correct": False}
            ]
        },
        {
            "type": "Reading",
            "level": "B1",
            "prompt": "What is the main idea of the passage?",
            "paragraph": "This is a sample paragraph for reading comprehension.",
            "options": [
                {"label": "A", "text": "Option A", "is_correct": False},
                {"label": "B", "text": "Option B", "is_correct": True},
                {"label": "C", "text": "Option C", "is_correct": False}
            ]
        }
    ]
    
    try:
        # Import questions from the data
        imported_count = import_questions_from_json(
            json_data=sample_data,
            level="B1",
            clear_existing=False  # Don't clear existing questions
        )
        print(f"Successfully imported {imported_count} questions from sample data")
    except Exception as e:
        print(f"Error importing from data: {e}")


def example_import_multiple_files():
    """Example: Import from multiple JSON files"""
    print("\n=== Importing from multiple files ===")
    
    # Directory containing JSON files
    json_directory = "data/ready"
    
    if os.path.exists(json_directory):
        json_files = [f for f in os.listdir(json_directory) if f.endswith('.json')]
        
        for json_file in json_files:
            file_path = os.path.join(json_directory, json_file)
            print(f"Processing: {json_file}")
            
            try:
                imported_count = import_questions_from_json_file(
                    file_path=file_path,
                    clear_existing=False  # Don't clear existing questions
                )
                print(f"  Imported {imported_count} questions")
            except Exception as e:
                print(f"  Error: {e}")
    else:
        print(f"Directory not found: {json_directory}")


if __name__ == "__main__":
    print("Django JSON Question Import Examples")
    print("=" * 40)
    
    # Run examples
    example_import_from_file()
    example_import_from_data()
    example_import_multiple_files()
    
    print("\nExamples completed!") 
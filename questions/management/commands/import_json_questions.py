import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from questions.models import Question, Option, QuestionType
from users.models import EnglishLevel


class Command(BaseCommand):
    help = 'Import questions from JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            'json_path',
            type=str,
            help='Path to the JSON file or directory containing JSON files'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing questions before importing'
        )
        parser.add_argument(
            '--level',
            type=str,
            choices=[choice[0] for choice in EnglishLevel.choices],
            help='Override the level from JSON files'
        )

    def handle(self, *args, **options):
        json_path = options['json_path']
        clear_existing = options['clear']
        override_level = options['level']

        if os.path.isfile(json_path):
            self.import_from_file(json_path, clear_existing, override_level)
        elif os.path.isdir(json_path):
            self.import_from_directory(json_path, clear_existing, override_level)
        else:
            self.stdout.write(
                self.style.ERROR(f'Path does not exist: {json_path}')
            )

    def import_from_directory(self, directory_path, clear_existing, override_level):
        """Import from all JSON files in a directory"""
        json_files = [f for f in os.listdir(directory_path) if f.endswith('.json')]
        
        if not json_files:
            self.stdout.write(
                self.style.WARNING(f'No JSON files found in {directory_path}')
            )
            return

        for json_file in json_files:
            file_path = os.path.join(directory_path, json_file)
            self.stdout.write(f'Processing: {json_file}')
            self.import_from_file(file_path, clear_existing, override_level)

    def import_from_file(self, file_path, clear_existing, override_level):
        """Import questions from a single JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)

            if not isinstance(data, list):
                self.stdout.write(
                    self.style.ERROR(f'Invalid JSON format: expected a list of questions')
                )
                return

            # Determine level from filename if not overridden
            if not override_level:
                filename = os.path.basename(file_path)
                if filename.startswith('a2'):
                    override_level = 'A2'
                elif filename.startswith('b1'):
                    override_level = 'B1'
                elif filename.startswith('b2'):
                    override_level = 'B2'
                elif filename.startswith('c1'):
                    override_level = 'C1'
                else:
                    override_level = 'A1'  # Default

            with transaction.atomic():
                if clear_existing:
                    Question.objects.filter(level=override_level).delete()
                    self.stdout.write(
                        self.style.WARNING(f'Cleared existing {override_level} questions')
                    )

                imported_count = 0
                for question_data in data:
                    if self.create_question(question_data, override_level):
                        imported_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully imported {imported_count} questions from {file_path}'
                    )
                )

        except json.JSONDecodeError as e:
            self.stdout.write(
                self.style.ERROR(f'Invalid JSON in {file_path}: {e}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error processing {file_path}: {e}')
            )

    def create_question(self, question_data, level):
        """Create a single question from JSON data"""
        try:
            # Extract question fields
            question_type = question_data.get('type', '').upper()
            prompt = question_data.get('prompt', '')
            paragraph = question_data.get('paragraph', '')
            options_data = question_data.get('options', [])

            # Validate required fields
            if not prompt:
                self.stdout.write(
                    self.style.WARNING('Skipping question without prompt')
                )
                return False

            if not options_data:
                self.stdout.write(
                    self.style.WARNING('Skipping question without options')
                )
                return False

            # Map question type
            type_mapping = {
                'GRAMMAR': QuestionType.GRAMMAR,
                'READING': QuestionType.READING,
                'VOCABULARY': QuestionType.VOCABULARY,
            }

            if question_type not in type_mapping:
                self.stdout.write(
                    self.style.WARNING(f'Unknown question type: {question_type}')
                )
                return False

            # Create the question
            question = Question.objects.create(
                type=type_mapping[question_type],
                level=level,
                prompt=prompt,
                paragraph=paragraph if paragraph else None
            )

            # Create options
            for option_data in options_data:
                label = option_data.get('label', '')
                text = option_data.get('text', '')
                is_correct = option_data.get('is_correct', False)

                if not text:
                    continue

                Option.objects.create(
                    question=question,
                    label=label.upper(),
                    text=text,
                    is_correct=is_correct
                )

            return True

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating question: {e}')
            )
            return False 
from django.core.management.base import BaseCommand
from questions.models import Question

class Command(BaseCommand):
    help = 'Delete questions that have no options or no correct options'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get all questions
        all_questions = Question.objects.all()
        total_questions = all_questions.count()
        
        # Find questions with no options
        questions_without_options = []
        questions_without_correct_options = []
        
        for question in all_questions:
            options = question.options.all()
            
            if not options.exists():
                questions_without_options.append(question)
            else:
                # Check if any option is marked as correct
                has_correct_option = options.filter(is_correct=True).exists()
                if not has_correct_option:
                    questions_without_correct_options.append(question)
        
        # Combine both lists (remove duplicates)
        invalid_questions = list(set(questions_without_options + questions_without_correct_options))
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN - Would delete {len(invalid_questions)} questions:')
            )
            
            if questions_without_options:
                self.stdout.write(f'\nQuestions with no options ({len(questions_without_options)}):')
                for q in questions_without_options:
                    self.stdout.write(f'  - ID {q.id}: {q.type} ({q.level}) - {q.prompt[:50]}...')
            
            if questions_without_correct_options:
                self.stdout.write(f'\nQuestions with no correct options ({len(questions_without_correct_options)}):')
                for q in questions_without_correct_options:
                    self.stdout.write(f'  - ID {q.id}: {q.type} ({q.level}) - {q.prompt[:50]}...')
            
            self.stdout.write(f'\nTotal questions in database: {total_questions}')
            self.stdout.write(f'Questions to be deleted: {len(invalid_questions)}')
            self.stdout.write(f'Questions that would remain: {total_questions - len(invalid_questions)}')
            
        else:
            # Actually delete the questions
            if invalid_questions:
                question_ids = [q.id for q in invalid_questions]
                deleted_count = Question.objects.filter(id__in=question_ids).delete()[0]
                
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully deleted {deleted_count} invalid questions!')
                )
                
                if questions_without_options:
                    self.stdout.write(f'  - {len(questions_without_options)} questions had no options')
                if questions_without_correct_options:
                    self.stdout.write(f'  - {len(questions_without_correct_options)} questions had no correct options')
            else:
                self.stdout.write(
                    self.style.SUCCESS('No invalid questions found. All questions are valid!')
                ) 
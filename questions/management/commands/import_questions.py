from django.core.management.base import BaseCommand
from questions.utils import import_questions_from_excel

class Command(BaseCommand):
    help = 'Импортирует вопросы из Excel файла'

    def add_arguments(self, parser):
        parser.add_argument('excel_path', type=str, help='Путь к Excel файлу')

    def handle(self, *args, **options):
        excel_path = options['excel_path']
        import_questions_from_excel(excel_path)
        self.stdout.write(self.style.SUCCESS(f'Вопросы успешно импортированы из {excel_path}')) 
from django.core.validators import RegexValidator

name_validator = RegexValidator(
    regex=r'^[a-zA-Zа-яА-ЯёЁ\s\-]+$',
    message='Name can only contain letters, spaces, and hyphens.',
    code='invalid_name'
)

iin_validator = RegexValidator(
    regex=r'^\d{12}$',
    message='IIN must be exactly 12 digits.',
    code='invalid_iin'
)
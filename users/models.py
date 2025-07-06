from django.db import models
from .validators import iin_validator, name_validator

class EnglishLevel(models.TextChoices):
    A0 = "A0", "Beginner"
    A1 = "A1", "Pre-Intermediate"
    B1 = "B1", "Intermediate"
    B2 = "B2", "Upper-Intermediate"
    C1 = "C1", "Advanced"

class Applicant(models.Model):
    iin = models.CharField(
        max_length=12, 
        unique=True, 
        primary_key=True,
        validators=[iin_validator],
        help_text="Enter exactly 12 digits (e.g., 001001001001)"
    )
    first_name = models.CharField(
        max_length=50,
        validators=[name_validator],
        help_text="Enter only letters, spaces, and hyphens"
    )
    last_name = models.CharField(
        max_length=50,
        validators=[name_validator],
        help_text="Enter only letters, spaces, and hyphens"
    )
    current_level = models.CharField(max_length=2, choices=EnglishLevel.choices, default=EnglishLevel.A0)
    is_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.iin} : {self.is_completed}"
    
    class Meta:
        verbose_name = "Applicant"
        verbose_name_plural = "Applicants"


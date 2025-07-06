from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator

class EnglishLevel(models.TextChoices):
    A0 = "A0", "Beginner"
    A1 = "A1", "Pre-Intermediate"
    B1 = "B1", "Intermediate"
    B2 = "B2", "Upper-Intermediate"
    C1 = "C1", "Advanced"

# Validators
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

class TestResult(models.Model):
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name="test_results")
    level = models.CharField(max_length=2, choices=EnglishLevel.choices)
    
    correct_answers = models.IntegerField()
    total_questions = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.applicant.iin} - {self.level} - {self.correct_answers}/{self.total_questions}"

    def save(self, *args, **kwargs):
        # Call the original save() to ensure the object has an ID
        super().save(*args, **kwargs)

        # Now update the applicant's level and is_completed
        level_order = ['A0', 'A1', 'B1', 'B2', 'C1']
        score = self.correct_answers / self.total_questions if self.total_questions else 0

        applicant = self.applicant
        try:
            current_idx = level_order.index(applicant.current_level)
            passed_idx = level_order.index(self.level)
            
            if score >= 0.7:
                # If passed the test level and it's the next level, promote
                if passed_idx == current_idx + 1 and current_idx < len(level_order) - 1:
                    applicant.current_level = level_order[current_idx + 1]
                # If passed the last level, mark as completed
                elif passed_idx == len(level_order) - 1:
                    applicant.is_completed = True
            else:
                # If failed, mark as completed
                applicant.is_completed = True
                
            applicant.save(update_fields=["current_level", "is_completed"])
        except ValueError:
            pass  # Level not found, do nothing

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Test Result"
        verbose_name_plural = "Test Results"
        unique_together = ['applicant', 'level']
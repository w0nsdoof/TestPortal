from django.db import models
from django.contrib.auth.models import User

class EnglishLevel(models.TextChoices):
    A0 = "A0", "Beginner"
    A1 = "A1", "Pre-Intermediate"
    B1 = "B1", "Intermediate"
    B2 = "B2", "Upper-Intermediate"
    C1 = "C1", "Advanced"


class Applicant(models.Model):
    iin = models.CharField(max_length=12, unique=True, primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    current_level = models.CharField(max_length=2, choices=EnglishLevel.choices, default=EnglishLevel.A0)
    is_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
    
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

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Test Result"
        verbose_name_plural = "Test Results"
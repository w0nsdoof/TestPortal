# questions/models.py
from django.db import models
from users.models import EnglishLevel

class QuestionType(models.TextChoices):
    GRAMMAR = "Grammar"
    READING = "Reading"
    VOCABULARY = "Vocabulary"

class Question(models.Model):
    type = models.CharField(max_length=20, choices=QuestionType.choices)
    level = models.CharField(max_length=2, choices=EnglishLevel.choices)
    prompt = models.TextField()  # Main question
    paragraph = models.TextField(blank=True, null=True)  # For Reading type
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} ({self.level}): {self.prompt[:30]}..."

class Option(models.Model):
    question = models.ForeignKey(Question, related_name='options', on_delete=models.CASCADE)
    label = models.CharField(max_length=1)  # A, B, C, D, etc.
    text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label}. {self.text}"

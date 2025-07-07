from django.db import models
from users.models import Applicant, EnglishLevel

class TestSession(models.Model):
    STAGE_CHOICES = [
        ("Grammar", "Grammar"),
        ("Vocabulary", "Vocabulary"),
        ("Reading", "Reading"),
    ]
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='test_sessions')
    level = models.CharField(max_length=2, choices=EnglishLevel.choices)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    # Время по этапам
    grammar_started_at = models.DateTimeField(null=True, blank=True)
    grammar_finished_at = models.DateTimeField(null=True, blank=True)
    vocabulary_started_at = models.DateTimeField(null=True, blank=True)
    vocabulary_finished_at = models.DateTimeField(null=True, blank=True)
    reading_started_at = models.DateTimeField(null=True, blank=True)
    reading_finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session for {self.applicant.iin} [{self.level}] ({self.started_at} - {self.finished_at})"

    class Meta:
        ordering = ['-started_at']
        verbose_name = "Test Session"
        verbose_name_plural = "Test Sessions"
        unique_together = ['applicant', 'level', 'started_at']

class UserAnswer(models.Model):
    """Модель для хранения ответов пользователя на конкретные вопросы"""
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='user_answers')
    test_session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='user_answers', null=True, blank=True)
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE, related_name='user_answers')
    selected_option = models.ForeignKey('questions.Option', on_delete=models.CASCADE, related_name='user_selections', null=True, blank=True)
    is_correct = models.BooleanField()
    answered_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.applicant.iin} - {self.question.type} - {'Correct' if self.is_correct else 'Incorrect'}"
    
    class Meta:
        ordering = ['-answered_at']
        verbose_name = "User Answer"
        verbose_name_plural = "User Answers"

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
        level_order = ['A1', 'A2', 'B1', 'B2', 'C1']
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

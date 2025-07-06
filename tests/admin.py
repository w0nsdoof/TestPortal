from django.contrib import admin
from .models import TestResult, TestAttempt, UserAnswer

@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'level', 'correct_answers', 'total_questions', 'created_at')
    list_filter = ('level', 'created_at')
    search_fields = ('applicant__iin', 'applicant__first_name', 'applicant__last_name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'level', 'started_at', 'completed')
    list_filter = ('level', 'completed', 'started_at')
    search_fields = ('applicant__iin', 'applicant__first_name', 'applicant__last_name')
    readonly_fields = ('started_at',)

@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'selected_option', 'answered_at')
    list_filter = ('answered_at',)
    search_fields = ('attempt__applicant__iin', 'question__prompt')
    readonly_fields = ('answered_at',)

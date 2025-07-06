from django.contrib import admin
from .models import TestResult, UserAnswer, TestSession

@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'started_at', 'finished_at', 'is_complete']
    list_filter = ['started_at', 'finished_at']
    search_fields = ['applicant__iin', 'applicant__first_name', 'applicant__last_name']
    readonly_fields = ['started_at', 'grammar_started_at', 'grammar_finished_at', 
                      'vocabulary_started_at', 'vocabulary_finished_at',
                      'reading_started_at', 'reading_finished_at']
    
    def is_complete(self, obj):
        return bool(obj.finished_at)
    is_complete.boolean = True
    is_complete.short_description = 'Complete'

@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'level', 'correct_answers', 'total_questions', 'score_percentage', 'created_at')
    list_filter = ('level', 'created_at')
    search_fields = ('applicant__iin', 'applicant__first_name', 'applicant__last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    def score_percentage(self, obj):
        if obj.total_questions > 0:
            return f"{(obj.correct_answers / obj.total_questions * 100):.1f}%"
        return "0%"
    score_percentage.short_description = 'Score %'

@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'question_type', 'is_correct', 'answered_at']
    list_filter = ['is_correct', 'answered_at', 'question__type']
    search_fields = ['applicant__iin', 'applicant__first_name', 'applicant__last_name', 'question__prompt']
    readonly_fields = ['answered_at']
    
    def question_type(self, obj):
        return obj.question.type
    question_type.short_description = 'Question Type'

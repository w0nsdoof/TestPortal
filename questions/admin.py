from django.contrib import admin
from .models import Question, Option

class OptionInline(admin.TabularInline):
    model = Option
    extra = 0

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'prompt', 'type', 'level')
    search_fields = ('prompt',)
    list_filter = ('type', 'level')
    inlines = [OptionInline]

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'label', 'text', 'is_correct')
    list_filter = ('is_correct',)
    search_fields = ('text',)
from django.urls import path
from .views import questions_list, personalized_questions

urlpatterns = [
    path('questions/', questions_list, name='questions-list'),
    path('personalized/', personalized_questions, name='personalized-questions'),
]
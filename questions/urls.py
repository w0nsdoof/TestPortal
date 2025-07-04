from django.urls import path
from .views import questions_list, personalized_questions, submit_answers

urlpatterns = [
    path('list/', questions_list, name='questions-list'),
    path('personalized/', personalized_questions, name='personalized-questions'),
    path('submit/', submit_answers, name='submit-answers'),
]
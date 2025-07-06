from django.urls import path
from .views import personalized_questions, submit_answers, test_results_by_iin, test_results_by_iin_batch, get_questions_by_stage, finish_stage, get_session_status, get_user_answers

urlpatterns = [
    path('personalized/', personalized_questions, name='personalized-questions'),
    path('questions-by-stage/', get_questions_by_stage, name='questions-by-stage'),
    path('finish-stage/', finish_stage, name='finish-stage'),
    path('session-status/', get_session_status, name='session-status'),
    path('user-answers/', get_user_answers, name='user-answers'),
    path('submit/', submit_answers, name='submit-answers'),
    path('results/', test_results_by_iin, name='test-results-by-iin'),
    path('results-batch/', test_results_by_iin_batch, name='test-results-by-iin-batch'),
] 
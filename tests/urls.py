from django.urls import path
from .views import personalized_questions, submit_answers, test_results_by_iin, test_results_by_iin_batch

urlpatterns = [
    path('personalized/', personalized_questions, name='personalized-questions'),
    path('submit-answers/', submit_answers, name='submit-answers'),
    path('results/', test_results_by_iin, name='test-results-by-iin'),
    path('results/batch/', test_results_by_iin_batch, name='test-results-by-iin-batch'),
] 
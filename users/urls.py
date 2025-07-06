from django.urls import path
from .views import applicant_register, test_results_by_iin, test_results_by_iin_batch, submit_answers

urlpatterns = [
    path('register/', applicant_register, name='applicant-register'),
    
    path('results/', test_results_by_iin, name='test-results-by-iin'),
    path('results/batch/', test_results_by_iin_batch, name='test-results-by-iin-batch'),
    
    path('submit-answers/', submit_answers, name='submit-answers'),
]

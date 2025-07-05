from django.urls import path
from .views import applicant_register, test_results_by_iin, test_results_by_iin_batch

urlpatterns = [
    path('register/', applicant_register, name='applicant-register'),
    path('results/', test_results_by_iin, name='test-results-by-iin'),
    path('results/batch/', test_results_by_iin_batch, name='test-results-by-iin-batch'),
]

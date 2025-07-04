from django.urls import path
from .views import applicant_register, test_results_by_iin

urlpatterns = [
    path('register/', applicant_register, name='applicant-register'),
    path('results/', test_results_by_iin, name='test-results-by-iin'),
]

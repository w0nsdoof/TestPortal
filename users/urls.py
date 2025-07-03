from django.urls import path
from .views import TestResultCreateView, ApplicantRegisterView

urlpatterns = [
    path('test-results/', TestResultCreateView.as_view(), name='testresult-create'),
    path('register/', ApplicantRegisterView.as_view(), name='applicant-register'),
] 
from django.urls import path
from .views import applicant_register

urlpatterns = [
    path('register/', applicant_register, name='applicant-register'),
]

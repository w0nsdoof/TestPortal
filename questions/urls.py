from django.urls import path
from .views import questions_list

urlpatterns = [
    path('list/', questions_list, name='questions-list'),
]
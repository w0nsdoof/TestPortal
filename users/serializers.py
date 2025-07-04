from rest_framework import serializers
from .models import TestResult, Applicant, EnglishLevel

class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestResult
        fields = "__all__"

class ApplicantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Applicant
        fields = ['iin', 'first_name', 'last_name', 'current_level', 'is_completed', 'created_at', 'updated_at']
        read_only_fields = ['current_level', 'is_completed', 'created_at', 'updated_at']
            
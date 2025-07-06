from rest_framework import serializers
from .models import TestResult

class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestResult
        fields = "__all__"

class AnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option = serializers.IntegerField()

class SubmitAnswersSerializer(serializers.Serializer):
    iin = serializers.CharField()
    level = serializers.CharField()
    answers = AnswerSerializer(many=True) 
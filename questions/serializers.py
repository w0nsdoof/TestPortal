from rest_framework import serializers
from .models import Question, Option

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'label', 'text']

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'paragraph', 'type', 'level', 'options']
        
        from rest_framework import serializers

class AnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option = serializers.IntegerField()

class SubmitAnswersSerializer(serializers.Serializer):
    iin = serializers.CharField()
    level = serializers.CharField()
    answers = AnswerSerializer(many=True)

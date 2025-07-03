from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Question
from .serializers import QuestionSerializer
import hashlib
import random
from drf_spectacular.utils import extend_schema, OpenApiParameter

# Create your views here.

@extend_schema(
    summary="List questions",
    description="Returns a list of all questions. Optionally filter by type using the 'type' query parameter.",
    parameters=[
        OpenApiParameter(name='type', description='Type of question to filter by', required=False, type=str)
    ]
)
@api_view(['GET'])
def questions_list(request):
    question_type = request.GET.get('type')
    questions = Question.objects.all()
    if question_type:
        questions = questions.filter(type=question_type)
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

@extend_schema(
    summary="Get personalized questions",
    description="Returns a personalized set of questions for a user based on their IIN and level. Requires 'iin' and 'level' query parameters.",
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
        OpenApiParameter(name='level', description='Level of the test', required=True, type=str)
    ]
)
@api_view(['GET'])
def personalized_questions(request):
    iin = request.GET.get('iin')
    level = request.GET.get('level')
    if not iin or not level:
        return Response({'error': 'iin and level are required'}, status=400)

    # Получаем вопросы по типам и уровню
    vocab_qs = list(Question.objects.filter(type='Vocabulary', level=level))
    gram_qs = list(Question.objects.filter(type='Grammar', level=level))
    read_qs = list(Question.objects.filter(type='Reading', level=level))

    # Детеминированный random seed по ИИН и уровню
    seed_str = f'{iin}-{level}'
    seed = int(hashlib.sha256(seed_str.encode()).hexdigest(), 16) % (10 ** 8)
    rnd = random.Random(seed)

    vocab_sample = rnd.sample(vocab_qs, min(10, len(vocab_qs)))
    gram_sample = rnd.sample(gram_qs, min(10, len(gram_qs)))
    read_sample = rnd.sample(read_qs, min(5, len(read_qs)))

    questions = vocab_sample + gram_sample + read_sample

    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

import hashlib, random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import TestResult
from .serializers import TestResultSerializer, SubmitAnswersSerializer
from users.models import Applicant
from questions.models import Question, Option
from questions.serializers import QuestionSerializer

@extend_schema(
    summary="Get personalized questions",
    description="Returns a personalized set of questions for a user based on their IIN and level. Requires 'iin' as a query parameter.",
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
    ],
    responses={200: QuestionSerializer(many=True)},
)
@api_view(['GET'])
def personalized_questions(request):
    iin = request.GET.get('iin')
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=404)
    if applicant.is_completed == True:
        return Response({'error': 'Test already completed for this applicant.'}, status=403)
    
    
    level_order = ['A0', 'A1', 'B1', 'B2', 'C1']
    try:
        current_idx = level_order.index(applicant.current_level)
        # Move to next level if possible, else stay at last
        next_idx = min(current_idx + 1, len(level_order) - 1)
        level = level_order[next_idx]
    except ValueError:
        # fallback if current_level is not in level_order
        level = applicant.current_level

    if not iin:
        return Response({'error': 'iin are required'}, status=400)
    
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

    questions = gram_sample + read_sample + vocab_sample

    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

@extend_schema(
    summary="Submit answers and get score",
    description="Accepts user's answers, checks correctness, and returns the score.",
    request=SubmitAnswersSerializer,
    responses={200: TestResultSerializer},
)
@api_view(['POST'])
def submit_answers(request):
    serializer = SubmitAnswersSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    data = serializer.validated_data
    iin = data['iin']
    level = data['level']
    answers = data['answers']
    if not iin or not level or not isinstance(answers, list):   
        return Response({'error': 'iin, level, and answers are required'}, status=400)

    # Find applicant
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=404)

    # Check if a TestResult already exists for this applicant and level
    existing_result = TestResult.objects.filter(applicant=applicant, level=level).first()
    if existing_result:
        return Response({'error': 'Test result already exists for this applicant and level'}, status=409)

    correct_count = 0
    total = len(answers)
    for ans in answers:
        qid = ans.get('question_id')
        selected_option = ans.get('selected_option')
        try:
            option = Option.objects.get(question_id=qid, id=selected_option)
            is_correct = option.is_correct
        except Option.DoesNotExist:
            is_correct = False
        if is_correct:
            correct_count += 1

    # Create TestResult
    test_result = TestResult.objects.create(
        applicant=applicant,
        level=level,
        correct_answers=correct_count,
        total_questions=total
    )
    result_serializer = TestResultSerializer(test_result)
    return Response(result_serializer.data)

@extend_schema(
    summary="Retrieve test results by IIN",
    description="Returns a list of test results for the applicant with the given IIN. Requires 'iin' as a query parameter.",
    responses={200: TestResultSerializer(many=True)},
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
    ],
)
@api_view(['GET'])
def test_results_by_iin(request):
    iin = request.GET.get('iin')
    if not iin:
        return Response({'error': 'iin query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=status.HTTP_404_NOT_FOUND)
    test_results = applicant.test_results.all()
    serializer = TestResultSerializer(test_results, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(
    summary="Retrieve test results by IIN batch",
    description="Returns test results for multiple applicants by their IINs. Accepts a list of IINs in the request body.",
    request={"application/json": {"type": "array", "items": {"type": "string"}}},
    responses={200: TestResultSerializer(many=True)},
)
@api_view(['POST'])
def test_results_by_iin_batch(request):
    iin_list = request.data
    if not isinstance(iin_list, list):
        return Response({'error': 'Request body must be a list of IINs'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not iin_list:
        return Response({'error': 'IIN list cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get all applicants with the provided IINs
    applicants = Applicant.objects.filter(iin__in=iin_list)
    
    # Get all test results for these applicants
    test_results = TestResult.objects.filter(applicant__in=applicants)
    
    serializer = TestResultSerializer(test_results, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

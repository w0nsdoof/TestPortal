from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import ApplicantSerializer, TestResultSerializer
from .models import Applicant, TestResult
from questions.serializers import SubmitAnswersSerializer
from questions.models import Option

@extend_schema(
    summary="Register applicant",
    description="Registers a new applicant or updates the name if the applicant already exists. Requires 'iin', 'first_name', and 'last_name' in the request body.",
    request=ApplicantSerializer,
    responses={201: ApplicantSerializer, 200: ApplicantSerializer},
)
@api_view(['POST'])
def applicant_register(request):
    iin = request.data.get('iin')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    if not (iin and first_name and last_name):
        return Response({'error': 'iin, first_name, and last_name are required.'}, status=status.HTTP_400_BAD_REQUEST)
    applicant, created = Applicant.objects.get_or_create(iin=iin, defaults={
        'first_name': first_name,
        'last_name': last_name
    })
    if not created:
        # Update the name if it changed
        updated = False
        if applicant.first_name != first_name:
            applicant.first_name = first_name
            updated = True
        if applicant.last_name != last_name:
            applicant.last_name = last_name
            updated = True
        if updated:
            applicant.save(update_fields=['first_name', 'last_name'])
    response_serializer = ApplicantSerializer(applicant)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

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
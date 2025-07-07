import hashlib, random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils import timezone

from .models import TestResult, TestSession, UserAnswer
from .serializers import TestResultSerializer, SubmitAnswersSerializer
from .services import TimeControlService
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
    
    
    level_order = ['A1', 'A2', 'B1', 'B2', 'C1']
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
    summary="Get questions by stage type",
    description="Returns personalized questions for a specific stage (Grammar, Vocabulary, Reading) based on user's IIN and level. Requires 'iin' and 'stage_type' as query parameters.",
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
        OpenApiParameter(name='stage_type', description='Stage type (Grammar, Vocabulary, Reading)', required=True, type=str),
    ],
    responses={200: QuestionSerializer(many=True)},
)
@api_view(['GET'])
def get_questions_by_stage(request):
    iin = request.GET.get('iin')
    stage_type = request.GET.get('stage_type')
    
    if not iin or not stage_type:
        return Response({'error': 'iin and stage_type are required'}, status=400)
    
    if stage_type not in ['Grammar', 'Vocabulary', 'Reading']:
        return Response({'error': 'stage_type must be Grammar, Vocabulary, or Reading'}, status=400)
    
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=404)
    
    if applicant.is_completed == True:
        return Response({'error': 'Test already completed for this applicant.'}, status=403)
    
    level_order = ['A1', 'A2', 'B1', 'B2', 'C1']
    try:
        current_idx = level_order.index(applicant.current_level)
        next_idx = min(current_idx + 1, len(level_order) - 1)
        level = level_order[next_idx]
    except ValueError:
        level = applicant.current_level
    
    # Get or create test session for this level
    test_session, created = TestSession.objects.get_or_create(
        applicant=applicant,
        level=level,
        finished_at__isnull=True,
        defaults={'started_at': timezone.now()}
    )
    
    # Check if stage can be started
    can_start, message = TimeControlService.can_start_stage(test_session, stage_type)
    if not can_start:
        return Response({'error': message}, status=400)
    
    # Start the specific stage
    if stage_type == 'Grammar' and not test_session.grammar_started_at:
        test_session.grammar_started_at = timezone.now()
        test_session.save(update_fields=['grammar_started_at'])
    elif stage_type == 'Vocabulary' and not test_session.vocabulary_started_at:
        test_session.vocabulary_started_at = timezone.now()
        test_session.save(update_fields=['vocabulary_started_at'])
    elif stage_type == 'Reading' and not test_session.reading_started_at:
        test_session.reading_started_at = timezone.now()
        test_session.save(update_fields=['reading_started_at'])
    
    # Get questions for the specific stage
    questions = list(Question.objects.filter(type=stage_type, level=level))
    
    # Deterministic random seed based on IIN and level
    seed_str = f'{iin}-{level}-{stage_type}'
    seed = int(hashlib.sha256(seed_str.encode()).hexdigest(), 16) % (10 ** 8)
    rnd = random.Random(seed)
    
    # Sample questions based on stage type
    if stage_type == 'Grammar':
        sample_size = min(10, len(questions))
    elif stage_type == 'Vocabulary':
        sample_size = min(10, len(questions))
    elif stage_type == 'Reading':
        sample_size = min(5, len(questions))
    
    sampled_questions = rnd.sample(questions, sample_size)
    
    # Add remaining time to response
    remaining_time = TimeControlService.get_remaining_time(test_session, stage_type)
    
    serializer = QuestionSerializer(sampled_questions, many=True)
    response_data = {
        'questions': serializer.data,
        'remaining_time_minutes': remaining_time,
        'stage_type': stage_type,
        'level': level
    }
    return Response(response_data)

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

    # Find active test session for this level
    try:
        test_session = TestSession.objects.get(applicant=applicant, level=level, finished_at__isnull=True)
    except TestSession.DoesNotExist:
        return Response({'error': 'No active test session found'}, status=404)

    # Check if a TestResult already exists for this applicant and level
    existing_result = TestResult.objects.filter(applicant=applicant, level=level).first()
    if existing_result:
        return Response({'error': 'Test result already exists for this applicant and level'}, status=409)

    correct_count = 0
    total = len(answers)
    saved_answers = []
    
    for ans in answers:
        qid = ans.get('question_id')
        selected_option_id = ans.get('selected_option')
        
        try:
            question = Question.objects.get(id=qid)
            selected_option = Option.objects.get(question_id=qid, id=selected_option_id)
            is_correct = selected_option.is_correct
            
            # Save user answer
            user_answer = UserAnswer.objects.create(
                applicant=applicant,
                test_session=test_session,
                question=question,
                selected_option=selected_option,
                is_correct=is_correct
            )
            saved_answers.append(user_answer)
            
            if is_correct:
                correct_count += 1
                
        except (Question.DoesNotExist, Option.DoesNotExist):
            # If question or option doesn't exist, mark as incorrect
            try:
                question = Question.objects.get(id=qid)
                user_answer = UserAnswer.objects.create(
                    applicant=applicant,
                    test_session=test_session,
                    question=question,
                    selected_option=None,  # Will need to handle this case
                    is_correct=False
                )
                saved_answers.append(user_answer)
            except Question.DoesNotExist:
                # Skip if question doesn't exist
                continue

    # Create TestResult
    test_result = TestResult.objects.create(
        applicant=applicant,
        level=level,
        correct_answers=correct_count,
        total_questions=total
    )
    
    result_serializer = TestResultSerializer(test_result)
    return Response({
        'test_result': result_serializer.data,
        'saved_answers_count': len(saved_answers),
        'correct_answers': correct_count,
        'total_questions': total
    })

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
    summary="Finish a specific stage",
    description="Marks the completion of a specific stage (Grammar, Vocabulary, Reading) for a user. Requires 'iin' and 'stage_type' as query parameters.",
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
        OpenApiParameter(name='stage_type', description='Stage type (Grammar, Vocabulary, Reading)', required=True, type=str),
        OpenApiParameter(name='level', description='Test level', required=True, type=str),
    ],
    responses={200: {"message": "Stage finished successfully"}},
)
@api_view(['POST'])
def finish_stage(request):
    iin = request.GET.get('iin')
    stage_type = request.GET.get('stage_type')
    level = request.GET.get('level')
    
    if not iin or not stage_type or not level:
        return Response({'error': 'iin, stage_type, and level are required'}, status=400)
    
    if stage_type not in ['Grammar', 'Vocabulary', 'Reading']:
        return Response({'error': 'stage_type must be Grammar, Vocabulary, or Reading'}, status=400)
    
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=404)
    
    try:
        test_session = TestSession.objects.get(applicant=applicant, level=level, finished_at__isnull=True)
    except TestSession.DoesNotExist:
        return Response({'error': 'No active test session found'}, status=404)
    
    # Validate stage completion
    can_finish, message = TimeControlService.validate_stage_completion(test_session, stage_type)
    if not can_finish:
        return Response({'error': message}, status=400)
    
    # Finish the specific stage
    if stage_type == 'Grammar':
        test_session.grammar_finished_at = timezone.now()
        test_session.save(update_fields=['grammar_finished_at'])
    elif stage_type == 'Vocabulary':
        test_session.vocabulary_finished_at = timezone.now()
        test_session.save(update_fields=['vocabulary_finished_at'])
    elif stage_type == 'Reading':
        test_session.reading_finished_at = timezone.now()
        test_session.save(update_fields=['reading_finished_at'])
    
    # Check if all stages are complete
    if TimeControlService.is_session_complete(test_session):
        test_session.finished_at = timezone.now()
        test_session.save(update_fields=['finished_at'])
        return Response({
            'message': f'{stage_type} stage finished successfully',
            'session_complete': True
        })
    
    return Response({
        'message': f'{stage_type} stage finished successfully',
        'session_complete': False
    })

@extend_schema(
    summary="Get session status",
    description="Returns the current status of a user's test session, including stage progress and remaining time. Requires 'iin' as a query parameter.",
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
    ],
    responses={200: {"session_status": "object"}},
)
@api_view(['GET'])
def get_session_status(request):
    iin = request.GET.get('iin')
    
    if not iin:
        return Response({'error': 'iin is required'}, status=400)
    
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=404)
    
    try:
        test_session = TestSession.objects.get(applicant=applicant, finished_at__isnull=True)
    except TestSession.DoesNotExist:
        return Response({'error': 'No active test session found'}, status=404)
    
    status_data = TimeControlService.get_session_status(test_session)
    return Response({'session_status': status_data})

@extend_schema(
    summary="Get user answers history",
    description="Returns the history of user's answers for analysis. Requires 'iin' as a query parameter.",
    parameters=[
        OpenApiParameter(name='iin', description='Individual Identification Number', required=True, type=str),
    ],
    responses={200: {"user_answers": "array"}},
)
@api_view(['GET'])
def get_user_answers(request):
    iin = request.GET.get('iin')
    
    if not iin:
        return Response({'error': 'iin is required'}, status=400)
    
    try:
        applicant = Applicant.objects.get(iin=iin)
    except Applicant.DoesNotExist:
        return Response({'error': 'Applicant not found'}, status=404)
    
    user_answers = UserAnswer.objects.filter(applicant=applicant).select_related(
        'question', 'selected_option', 'test_session'
    ).order_by('-answered_at')
    
    answers_data = []
    for answer in user_answers:
        answer_data = {
            'id': answer.id,
            'question_id': answer.question.id,
            'question_type': answer.question.type,
            'question_prompt': answer.question.prompt,
            'selected_option_id': answer.selected_option.id if answer.selected_option else None,
            'selected_option_text': answer.selected_option.text if answer.selected_option else None,
            'is_correct': answer.is_correct,
            'answered_at': answer.answered_at,
            'test_session_id': answer.test_session.id if answer.test_session else None,
        }
        answers_data.append(answer_data)
    
    return Response({
        'user_answers': answers_data,
        'total_answers': len(answers_data),
        'correct_answers': sum(1 for a in answers_data if a['is_correct']),
        'accuracy_percentage': (sum(1 for a in answers_data if a['is_correct']) / len(answers_data) * 100) if answers_data else 0
    })

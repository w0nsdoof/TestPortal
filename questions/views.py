from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Question, Option
from .serializers import QuestionSerializer

@extend_schema(
    summary="List questions",
    description="Returns a list of all questions. Optionally filter by type using the 'type' query parameter.",
    parameters=[
        OpenApiParameter(name='type', description='Type of question to filter by', required=False, type=str)
    ],
    responses={200: QuestionSerializer(many=True)},
)
@api_view(['GET'])
def questions_list(request):
    question_type = request.GET.get('type')
    questions = Question.objects.all()
    if question_type:
        questions = questions.filter(type=question_type)
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)



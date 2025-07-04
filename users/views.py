from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema
from .serializers import ApplicantSerializer, TestResultSerializer
from .models import Applicant

from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny



@extend_schema(
    summary="Register applicant",
    description="Registers a new applicant or updates the name if the applicant already exists. Requires 'iin', 'first_name', and 'last_name' in the request body.",
    request=ApplicantSerializer,
    responses={201: ApplicantSerializer, 200: ApplicantSerializer},
)
@api_view(['POST'])
def applicant_register(request):
    serializer = ApplicantSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    iin = serializer.validated_data['iin']
    first_name = serializer.validated_data['first_name']
    last_name = serializer.validated_data['last_name']
    applicant, created = Applicant.objects.get_or_create(iin=iin, defaults={
        'first_name': first_name,
        'last_name': last_name
    })

    response_serializer = ApplicantSerializer(applicant)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)



@extend_schema(
    summary="Retrieve test results by IIN",
    description="Returns a list of test results for the applicant with the given IIN. Requires 'iin' as a query parameter.",
    responses={200: TestResultSerializer(many=True)},
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


from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import ApplicantSerializer
from .models import Applicant

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
        # TODO: a lot of useless code here
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


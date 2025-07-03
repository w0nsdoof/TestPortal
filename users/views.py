from django.shortcuts import render
from rest_framework import generics
from .serializers import TestResultSerializer
from .models import TestResult, Applicant
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError

# Create your views here.

class TestResultCreateView(generics.CreateAPIView):
    queryset = TestResult.objects.all()
    serializer_class = TestResultSerializer

class ApplicantRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        iin = request.data.get('iin')
        full_name = request.data.get('full_name')
        if not iin or not full_name:
            raise ValidationError('iin and full_name are required')
        applicant, created = Applicant.objects.get_or_create(iin=iin, defaults={'full_name': full_name})
        # Если аппликант уже есть, обновим ФИО, если оно изменилось
        if not created and applicant.full_name != full_name:
            applicant.full_name = full_name
            applicant.save(update_fields=["full_name"])
        return Response(self._applicant_data(applicant), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def _applicant_data(self, applicant):
        return {
            'iin': applicant.iin,
            'full_name': applicant.full_name,
            'current_level': applicant.current_level,
            'is_completed': applicant.is_completed
        }

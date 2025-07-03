from rest_framework import serializers
from .models import TestResult, Applicant, EnglishLevel

class TestResultSerializer(serializers.ModelSerializer):
    applicant_iin = serializers.CharField(write_only=True)

    class Meta:
        model = TestResult
        fields = ['id', 'applicant_iin', 'level', 'score', 'date_taken']
        read_only_fields = ['date_taken']

    def create(self, validated_data):
        iin = validated_data.pop('applicant_iin')
        applicant = Applicant.objects.get(iin=iin)
        level = validated_data['level']
        score = validated_data['score']
        result = TestResult.objects.create(applicant=applicant, **validated_data)
        self._update_applicant_level(applicant, level, score)
        return result

    def _update_applicant_level(self, applicant, level, score):
        # Порядок уровней
        level_order = ['A0', 'A1', 'B1', 'B2', 'C1']
        if score >= 70:
            try:
                current_idx = level_order.index(applicant.current_level)
                passed_idx = level_order.index(level)
                # Если сданный уровень совпадает с текущим и это не последний уровень
                if passed_idx == current_idx and current_idx < len(level_order) - 1:
                    applicant.current_level = level_order[current_idx + 1]
                    applicant.save(update_fields=["current_level"])
                # Если это последний уровень и он сдан
                if passed_idx == len(level_order) - 1:
                    applicant.is_completed = True
                    applicant.save(update_fields=["is_completed"])
            except ValueError:
                pass 
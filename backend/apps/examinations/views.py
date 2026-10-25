from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.permissions import IsTenantMember, IsAdminOrReadOnly
from apps.examinations.models import ExamGradingScale, GradingScaleTier, ExamAssessment, ExamStudentScore
from apps.examinations.serializers import (
    ExamGradingScaleSerializer,
    GradingScaleTierSerializer,
    ExamAssessmentSerializer,
    ExamStudentScoreSerializer,
    BatchMarksEntrySerializer
)

class ExamGradingScaleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]
    serializer_class = ExamGradingScaleSerializer

    def get_queryset(self):
        return ExamGradingScale.objects.filter(
            institution_id=self.request.institution_id
        ).prefetch_related('tiers')

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

    @action(detail=True, methods=['post'], url_path='add-tier')
    def add_tier(self, request, pk=None):
        scale = self.get_object()
        serializer = GradingScaleTierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tier = serializer.save(grading_scale=scale)
        return Response({
            'success': True,
            'data': GradingScaleTierSerializer(tier).data
        }, status=status.HTTP_201_CREATED)

class ExamAssessmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember]
    serializer_class = ExamAssessmentSerializer

    def get_queryset(self):
        return ExamAssessment.objects.filter(
            institution_id=self.request.institution_id
        ).select_related(
            'academic_term',
            'school_section__school_class',
            'college_course',
            'grading_scale'
        )

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

    @action(detail=True, methods=['post'], url_path='enter-marks')
    def enter_marks(self, request, pk=None):
        assessment = self.get_object()

        if assessment.status in ('PUBLISHED', 'LOCKED'):
            raise ValidationError("Marks entry is closed because results are already published or locked.")

        serializer = BatchMarksEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scores_data = serializer.validated_data['scores']

        membership = request.user.memberships.filter(
            institution_id=request.institution_id,
            status='ACTIVE'
        ).first()

        if not membership:
            raise ValidationError("Active institution membership required for marks entry.")

        updated_count = 0
        with transaction.atomic():
            for item in scores_data:
                marks = item.get('marks_obtained')
                is_absent = item.get('is_absent', False)

                if not is_absent and marks is not None:
                    if marks < 0 or marks > assessment.max_marks:
                        raise ValidationError(f"Marks must be between 0 and max marks ({assessment.max_marks}). Got: {marks}")

                ExamStudentScore.objects.update_or_create(
                    institution_id=request.institution_id,
                    assessment=assessment,
                    student_id=item['student_id'],
                    defaults={
                        'marks_obtained': None if is_absent else marks,
                        'is_absent': is_absent,
                        'evaluator': membership
                    }
                )
                updated_count += 1

            if assessment.status == 'DRAFT':
                assessment.status = 'MARKS_ENTRY_OPEN'
                assessment.save(update_fields=['status', 'updated_at'])

        return Response({
            'success': True,
            'message': f"Marks recorded successfully for {updated_count} students.",
            'updated_count': updated_count
        })

    @action(detail=True, methods=['post'], url_path='publish')
    def publish_results(self, request, pk=None):
        """
        Calculates letter grades and grade points for all student scores,
        then publishes the assessment results, locking them against direct edit.
        """
        assessment = self.get_object()

        if assessment.status == 'PUBLISHED':
            return Response({
                'success': True,
                'message': "Results are already published.",
                'status': assessment.status
            })

        grading_scale = assessment.grading_scale
        tiers = list(grading_scale.tiers.all()) if grading_scale else []

        scores = assessment.scores.all()
        if not scores.exists():
            raise ValidationError("Cannot publish assessment with no recorded scores.")

        with transaction.atomic():
            for score in scores:
                if score.is_absent:
                    score.letter_grade_awarded = 'AB'
                    score.grade_point_awarded = Decimal('0.00')
                elif score.marks_obtained is not None and tiers:
                    percentage = (score.marks_obtained / assessment.max_marks) * Decimal('100.00')
                    awarded_tier = None
                    for tier in tiers:
                        if tier.min_percentage <= percentage <= tier.max_percentage:
                            awarded_tier = tier
                            break
                    if awarded_tier:
                        score.letter_grade_awarded = awarded_tier.letter_grade
                        score.grade_point_awarded = awarded_tier.grade_point
                    else:
                        score.letter_grade_awarded = 'F'
                        score.grade_point_awarded = Decimal('0.00')
                score.save(update_fields=['letter_grade_awarded', 'grade_point_awarded', 'updated_at'])

            assessment.status = 'PUBLISHED'
            assessment.save(update_fields=['status', 'updated_at'])

        return Response({
            'success': True,
            'message': "Assessment results published and locked successfully.",
            'status': assessment.status
        })

    @action(detail=True, methods=['get'], url_path='scores')
    def list_scores(self, request, pk=None):
        assessment = self.get_object()
        scores = assessment.scores.select_related('student__membership__user', 'evaluator__user').all()
        return Response({
            'success': True,
            'data': ExamStudentScoreSerializer(scores, many=True).data
        })

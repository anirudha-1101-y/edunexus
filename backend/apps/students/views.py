from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsTenantMember, IsAdminOrReadOnly
from apps.students.models import StudentProfile, SchoolEnrollment, CollegeCourseRegistration
from apps.students.serializers import (
    StudentProfileSerializer,
    SchoolEnrollmentSerializer,
    CollegeCourseRegistrationSerializer
)

class StudentProfileViewSet(viewsets.ModelViewSet):
    """
    Enforces strict Admin-Only access control: only authenticated administrators
    can add, modify, or delete student profiles.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]
    serializer_class = StudentProfileSerializer

    def get_queryset(self):
        return StudentProfile.objects.filter(
            institution_id=self.request.institution_id
        ).select_related('membership__user')

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

class SchoolEnrollmentViewSet(viewsets.ModelViewSet):
    """
    Enforces strict Admin-Only access control for school cohort enrollments.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]
    serializer_class = SchoolEnrollmentSerializer

    def get_queryset(self):
        return SchoolEnrollment.objects.filter(
            institution_id=self.request.institution_id
        ).select_related(
            'student__membership__user',
            'academic_year',
            'section__school_class'
        )

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

class CollegeCourseRegistrationViewSet(viewsets.ModelViewSet):
    """
    Enforces strict Admin-Only access control for college course registrations.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]
    serializer_class = CollegeCourseRegistrationSerializer

    def get_queryset(self):
        return CollegeCourseRegistration.objects.filter(
            institution_id=self.request.institution_id
        ).select_related(
            'student__membership__user',
            'academic_term',
            'course'
        )

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsTenantMember, IsAdminOrReadOnly
from apps.academics.models import (
    AcademicYear, AcademicTerm,
    SchoolClass, SchoolSection,
    CollegeDepartment, CollegeProgram, CollegeCourse
)
from apps.academics.serializers import (
    AcademicYearSerializer, AcademicTermSerializer,
    SchoolClassSerializer, SchoolSectionSerializer,
    CollegeDepartmentSerializer, CollegeProgramSerializer, CollegeCourseSerializer
)

class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet automatically scoping queries and creation to active tenant.
    Enforces strict Admin-Only write control: only administrators can create,
    update, or delete academic entities.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]

    def get_queryset(self):
        return self.queryset.filter(institution_id=self.request.institution_id)

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

class AcademicYearViewSet(BaseTenantViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer

class AcademicTermViewSet(BaseTenantViewSet):
    queryset = AcademicTerm.objects.select_related('academic_year').all()
    serializer_class = AcademicTermSerializer

class SchoolClassViewSet(BaseTenantViewSet):
    queryset = SchoolClass.objects.prefetch_related('sections').all()
    serializer_class = SchoolClassSerializer

class SchoolSectionViewSet(BaseTenantViewSet):
    queryset = SchoolSection.objects.select_related('school_class').all()
    serializer_class = SchoolSectionSerializer

class CollegeDepartmentViewSet(BaseTenantViewSet):
    queryset = CollegeDepartment.objects.all()
    serializer_class = CollegeDepartmentSerializer

class CollegeProgramViewSet(BaseTenantViewSet):
    queryset = CollegeProgram.objects.select_related('department').all()
    serializer_class = CollegeProgramSerializer

class CollegeCourseViewSet(BaseTenantViewSet):
    queryset = CollegeCourse.objects.select_related('department').all()
    serializer_class = CollegeCourseSerializer

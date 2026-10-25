from rest_framework.routers import DefaultRouter
from apps.academics.views import (
    AcademicYearViewSet, AcademicTermViewSet,
    SchoolClassViewSet, SchoolSectionViewSet,
    CollegeDepartmentViewSet, CollegeProgramViewSet, CollegeCourseViewSet
)

router = DefaultRouter()
router.register(r'years', AcademicYearViewSet, basename='academic-year')
router.register(r'terms', AcademicTermViewSet, basename='academic-term')
router.register(r'school/classes', SchoolClassViewSet, basename='school-class')
router.register(r'school/sections', SchoolSectionViewSet, basename='school-section')
router.register(r'college/departments', CollegeDepartmentViewSet, basename='college-department')
router.register(r'college/programs', CollegeProgramViewSet, basename='college-program')
router.register(r'college/courses', CollegeCourseViewSet, basename='college-course')

urlpatterns = router.urls

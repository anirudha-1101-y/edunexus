from rest_framework.routers import DefaultRouter
from apps.students.views import (
    StudentProfileViewSet,
    SchoolEnrollmentViewSet,
    CollegeCourseRegistrationViewSet
)

router = DefaultRouter()
router.register(r'profiles', StudentProfileViewSet, basename='student-profile')
router.register(r'school/enrollments', SchoolEnrollmentViewSet, basename='school-enrollment')
router.register(r'college/registrations', CollegeCourseRegistrationViewSet, basename='college-registration')

urlpatterns = router.urls

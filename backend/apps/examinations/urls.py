from rest_framework.routers import DefaultRouter
from apps.examinations.views import ExamGradingScaleViewSet, ExamAssessmentViewSet

router = DefaultRouter()
router.register(r'grading-scales', ExamGradingScaleViewSet, basename='grading-scale')
router.register(r'assessments', ExamAssessmentViewSet, basename='exam-assessment')

urlpatterns = router.urls

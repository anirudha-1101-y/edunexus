from rest_framework.routers import DefaultRouter
from apps.attendance.views import AttendanceSessionViewSet

router = DefaultRouter()
router.register(r'sessions', AttendanceSessionViewSet, basename='attendance-session')

urlpatterns = router.urls

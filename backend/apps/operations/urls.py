from rest_framework.routers import DefaultRouter
from apps.operations.views import (
    RoomViewSet, TimeSlotViewSet, TimetableSlotViewSet,
    BookViewSet, BookIssueViewSet,
    TransportRouteViewSet, StudentTransportAssignmentViewSet,
    AnnouncementViewSet
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'time-slots', TimeSlotViewSet, basename='time-slot')
router.register(r'timetable', TimetableSlotViewSet, basename='timetable')
router.register(r'library/books', BookViewSet, basename='library-book')
router.register(r'library/issues', BookIssueViewSet, basename='library-issue')
router.register(r'transport/routes', TransportRouteViewSet, basename='transport-route')
router.register(r'transport/assignments', StudentTransportAssignmentViewSet, basename='transport-assignment')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = router.urls

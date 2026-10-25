from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.permissions import IsTenantMember, IsAdminOrReadOnly
from apps.operations.models import (
    Room, TimeSlot, TimetableSlot,
    Book, BookIssue,
    TransportRoute, StudentTransportAssignment,
    Announcement
)
from apps.operations.serializers import (
    RoomSerializer, TimeSlotSerializer, TimetableSlotSerializer,
    BookSerializer, BookIssueSerializer,
    TransportRouteSerializer, StudentTransportAssignmentSerializer,
    AnnouncementSerializer
)

class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet automatically scoping queries and creation to active tenant.
    Enforces strict Admin-Only write access: only administrators can create,
    update, or delete operational data.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]

    def get_queryset(self):
        return self.queryset.filter(institution_id=self.request.institution_id)

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

class RoomViewSet(BaseTenantViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class TimeSlotViewSet(BaseTenantViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer

class TimetableSlotViewSet(BaseTenantViewSet):
    queryset = TimetableSlot.objects.select_related('time_slot', 'room', 'faculty__user').all()
    serializer_class = TimetableSlotSerializer

class BookViewSet(BaseTenantViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class BookIssueViewSet(BaseTenantViewSet):
    queryset = BookIssue.objects.select_related('book', 'student__membership__user').all()
    serializer_class = BookIssueSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            book = serializer.validated_data['book']
            if book.available_copies <= 0:
                raise ValidationError("No copies available for checkout.")
            book.available_copies -= 1
            book.save(update_fields=['available_copies', 'updated_at'])
            serializer.save(institution_id=self.request.institution_id)

    @action(detail=True, methods=['post'], url_path='return-book')
    def return_book(self, request, pk=None):
        issue = self.get_object()
        if issue.status == 'RETURNED':
            raise ValidationError("This book has already been returned.")

        with transaction.atomic():
            issue.status = 'RETURNED'
            issue.return_date = timezone.now().date()
            issue.save(update_fields=['status', 'return_date', 'updated_at'])

            book = issue.book
            book.available_copies += 1
            book.save(update_fields=['available_copies', 'updated_at'])

        return Response({
            'success': True,
            'data': BookIssueSerializer(issue).data
        }, status=status.HTTP_200_OK)

class TransportRouteViewSet(BaseTenantViewSet):
    queryset = TransportRoute.objects.all()
    serializer_class = TransportRouteSerializer

class StudentTransportAssignmentViewSet(BaseTenantViewSet):
    queryset = StudentTransportAssignment.objects.select_related('route', 'student__membership__user').all()
    serializer_class = StudentTransportAssignmentSerializer

class AnnouncementViewSet(BaseTenantViewSet):
    queryset = Announcement.objects.select_related('author__user').all()
    serializer_class = AnnouncementSerializer

    def perform_create(self, serializer):
        membership = self.request.user.memberships.filter(
            institution_id=self.request.institution_id,
            status='ACTIVE'
        ).first()
        serializer.save(
            institution_id=self.request.institution_id,
            author=membership
        )

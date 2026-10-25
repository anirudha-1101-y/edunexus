from rest_framework import serializers
from apps.operations.models import (
    Room, TimeSlot, TimetableSlot,
    Book, BookIssue,
    TransportRoute, StudentTransportAssignment,
    Announcement
)

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'institution', 'name', 'capacity', 'room_type', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class TimeSlotSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = TimeSlot
        fields = ['id', 'institution', 'name', 'day_of_week', 'day_name', 'start_time', 'end_time', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class TimetableSlotSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.user.full_name', read_only=True)
    time_slot_name = serializers.CharField(source='time_slot.name', read_only=True)

    class Meta:
        model = TimetableSlot
        fields = [
            'id', 'institution', 'time_slot', 'time_slot_name', 'room', 'room_name',
            'faculty', 'faculty_name', 'school_section', 'college_course', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            'id', 'institution', 'isbn', 'title', 'author', 'publisher',
            'total_copies', 'available_copies', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = BookIssue
        fields = [
            'id', 'institution', 'book', 'book_title', 'student', 'student_name',
            'admission_number', 'issue_date', 'due_date', 'return_date',
            'fine_amount', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class TransportRouteSerializer(serializers.ModelSerializer):
    passenger_count = serializers.IntegerField(source='passengers.count', read_only=True)

    class Meta:
        model = TransportRoute
        fields = [
            'id', 'institution', 'route_number', 'vehicle_number', 'driver_name',
            'driver_phone', 'capacity', 'passenger_count', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class StudentTransportAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    route_number = serializers.CharField(source='route.route_number', read_only=True)

    class Meta:
        model = StudentTransportAssignment
        fields = [
            'id', 'institution', 'route', 'route_number', 'student',
            'student_name', 'admission_number', 'pickup_stop', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.user.full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'institution', 'author', 'author_name', 'title', 'content',
            'target_audience', 'published_at', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'published_at', 'created_at']
        extra_kwargs = {
            'author': {'required': False}
        }

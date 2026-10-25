from django.db import models
from django.utils import timezone
from common.models import TenantModel

# ----------------------------------------------------
# 1. Timetable Models
# ----------------------------------------------------

class Room(TenantModel):
    """Classroom, laboratory, or hall resource."""
    ROOM_TYPES = (
        ('CLASSROOM', 'Classroom'),
        ('LABORATORY', 'Laboratory'),
        ('AUDITORIUM', 'Auditorium'),
    )

    name = models.CharField(max_length=50)
    capacity = models.PositiveSmallIntegerField(default=40)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='CLASSROOM')

    class Meta:
        db_table = 'rooms'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['institution', 'name'], name='uniq_institution_room_name')
        ]

    def __str__(self):
        return f"{self.name} ({self.room_type})"

class TimeSlot(TenantModel):
    """Daily schedule slot (e.g. Monday Period 1: 09:00 - 09:50)."""
    DAYS_OF_WEEK = (
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
        (7, 'Sunday'),
    )

    name = models.CharField(max_length=50)
    day_of_week = models.PositiveSmallIntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        db_table = 'time_slots'
        ordering = ['day_of_week', 'start_time']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_time__gt=models.F('start_time')),
                name='chk_time_slot_end_after_start'
            ),
            models.UniqueConstraint(
                fields=['institution', 'day_of_week', 'start_time'],
                name='uniq_institution_day_slot'
            )
        ]

    def __str__(self):
        return f"{self.get_day_of_week_display()} {self.name}: {self.start_time} - {self.end_time}"

class TimetableSlot(TenantModel):
    """
    Active schedule allocation with conflict prevention constraints.
    """
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='allocations')
    room = models.ForeignKey(Room, on_delete=models.RESTRICT, related_name='schedule_slots')
    faculty = models.ForeignKey('users.InstitutionMembership', on_delete=models.RESTRICT, related_name='schedule_slots')
    school_section = models.ForeignKey('academics.SchoolSection', on_delete=models.CASCADE, null=True, blank=True)
    college_course = models.ForeignKey('academics.CollegeCourse', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        db_table = 'timetable_slots'
        constraints = [
            models.UniqueConstraint(
                fields=['time_slot', 'room'],
                name='uniq_room_double_booking_prevention'
            ),
            models.UniqueConstraint(
                fields=['time_slot', 'faculty'],
                name='uniq_faculty_double_booking_prevention'
            )
        ]

    def __str__(self):
        return f"{self.time_slot} in {self.room.name}"

# ----------------------------------------------------
# 2. Library Models
# ----------------------------------------------------

class Book(TenantModel):
    """Library book catalog entry with accession inventory tracking."""
    isbn = models.CharField(max_length=20)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    publisher = models.CharField(max_length=150, blank=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'books'
        ordering = ['title']
        constraints = [
            models.UniqueConstraint(fields=['institution', 'isbn'], name='uniq_institution_book_isbn'),
            models.CheckConstraint(
                condition=models.Q(available_copies__lte=models.F('total_copies')),
                name='chk_available_lte_total_copies'
            )
        ]

    def __str__(self):
        return f"{self.title} by {self.author} (Avail: {self.available_copies}/{self.total_copies})"

class BookIssue(TenantModel):
    """Circulation issue and return ledger."""
    STATUS_CHOICES = (
        ('ISSUED', 'Issued'),
        ('RETURNED', 'Returned'),
        ('OVERDUE', 'Overdue'),
        ('LOST', 'Lost'),
    )

    book = models.ForeignKey(Book, on_delete=models.RESTRICT, related_name='issues')
    student = models.ForeignKey('students.StudentProfile', on_delete=models.RESTRICT, related_name='borrowed_books')
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    fine_amount = models.BigIntegerField(default=0, help_text="Fine in minor currency units.")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ISSUED')

    class Meta:
        db_table = 'book_issues'
        ordering = ['-issue_date']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(due_date__gte=models.F('issue_date')),
                name='chk_book_due_after_issue'
            )
        ]

    def __str__(self):
        return f"{self.book.title} -> {self.student.admission_number} ({self.status})"

# ----------------------------------------------------
# 3. Transport Models
# ----------------------------------------------------

class TransportRoute(TenantModel):
    """Bus/Van route with driver info and passenger capacity."""
    route_number = models.CharField(max_length=50)
    vehicle_number = models.CharField(max_length=50)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20)
    capacity = models.PositiveSmallIntegerField(default=50)

    class Meta:
        db_table = 'transport_routes'
        ordering = ['route_number']
        constraints = [
            models.UniqueConstraint(fields=['institution', 'route_number'], name='uniq_institution_route_number')
        ]

    def __str__(self):
        return f"{self.route_number} ({self.vehicle_number})"

class StudentTransportAssignment(TenantModel):
    """Maps a student to a transport route and pickup stop."""
    route = models.ForeignKey(TransportRoute, on_delete=models.RESTRICT, related_name='passengers')
    student = models.ForeignKey('students.StudentProfile', on_delete=models.RESTRICT, related_name='transport_assignments')
    pickup_stop = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'student_transport_assignments'
        constraints = [
            models.UniqueConstraint(fields=['institution', 'student'], name='uniq_institution_student_transport')
        ]

    def __str__(self):
        return f"{self.student.admission_number} -> {self.route.route_number} ({self.pickup_stop})"

# ----------------------------------------------------
# 4. Announcements / Communication
# ----------------------------------------------------

class Announcement(TenantModel):
    """Institutional broadcast announcements."""
    AUDIENCE_CHOICES = (
        ('ALL', 'All Users'),
        ('STUDENTS', 'Students Only'),
        ('FACULTY', 'Faculty Only'),
        ('PARENTS', 'Parents Only'),
    )

    author = models.ForeignKey('users.InstitutionMembership', on_delete=models.RESTRICT, related_name='announcements')
    title = models.CharField(max_length=255)
    content = models.TextField()
    target_audience = models.CharField(max_length=30, choices=AUDIENCE_CHOICES, default='ALL')
    published_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'announcements'
        ordering = ['-published_at']

    def __str__(self):
        return f"{self.title} ({self.target_audience})"

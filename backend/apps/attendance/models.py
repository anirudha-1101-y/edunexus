from django.db import models
from common.models import TenantModel, UUIDModel, TimeStampedModel

class AttendanceSession(TenantModel):
    """
    Represents an instance of roll call (daily homeroom or lecture/period-wise).
    """
    SESSION_TYPES = (
        ('DAILY_HOMEROOM', 'Daily Homeroom'),
        ('PERIOD_WISE', 'Period Wise'),
        ('LECTURE', 'Lecture'),
    )

    session_date = models.DateField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='DAILY_HOMEROOM')
    school_section = models.ForeignKey(
        'academics.SchoolSection',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='attendance_sessions'
    )
    college_course = models.ForeignKey(
        'academics.CollegeCourse',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='attendance_sessions'
    )
    period_slot = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Period index (e.g. 1, 2) or null for whole-day homeroom."
    )
    taken_by = models.ForeignKey(
        'users.InstitutionMembership',
        on_delete=models.RESTRICT,
        related_name='taken_attendance_sessions'
    )
    is_locked = models.BooleanField(
        default=False,
        help_text="When locked, records cannot be modified without an audit-logged correction."
    )

    class Meta:
        db_table = 'attendance_sessions'
        ordering = ['-session_date', 'period_slot']
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(school_section__isnull=False, college_course__isnull=True) |
                    models.Q(school_section__isnull=True, college_course__isnull=False)
                ),
                name='chk_attendance_target_exclusive'
            ),
            models.UniqueConstraint(
                fields=['institution', 'session_date', 'school_section', 'period_slot'],
                condition=models.Q(school_section__isnull=False),
                name='uniq_school_attendance_session'
            ),
            models.UniqueConstraint(
                fields=['institution', 'session_date', 'college_course', 'period_slot'],
                condition=models.Q(college_course__isnull=False),
                name='uniq_college_attendance_session'
            )
        ]

    def __str__(self):
        target = self.school_section.name if self.school_section else self.college_course.course_code
        return f"{self.session_date} ({target}) - Slot {self.period_slot or 'Daily'}"

class AttendanceRecord(TenantModel):
    """
    Individual student attendance status in an attendance session.
    """
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
        ('HALF_DAY', 'Half Day'),
    )

    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name='records'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.RESTRICT,
        related_name='attendance_records'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    remarks = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'attendance_records'
        ordering = ['student__admission_number']
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'student'],
                name='uniq_student_attendance_per_session'
            )
        ]

    def __str__(self):
        return f"{self.student.admission_number}: {self.status}"

class AttendanceAuditLog(UUIDModel, TimeStampedModel):
    """
    Immutable audit log recording adjustments made after an attendance session is locked.
    """
    attendance_record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    modified_by = models.ForeignKey(
        'users.InstitutionMembership',
        on_delete=models.RESTRICT,
        related_name='attendance_corrections'
    )
    reason = models.TextField()

    class Meta:
        db_table = 'attendance_audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Correction for {self.attendance_record.id}: {self.previous_status} -> {self.new_status}"

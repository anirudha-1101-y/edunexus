from django.db import models
from common.models import TenantModel

class StudentProfile(TenantModel):
    """
    Master student identity within an institution.
    Decoupled from annual classroom enrollment.
    """
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('NON_BINARY', 'Non-Binary'),
        ('OTHER', 'Other'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('ON_LEAVE', 'On Leave'),
        ('TRANSFERRED', 'Transferred'),
        ('GRADUATED', 'Graduated'),
        ('SUSPENDED', 'Suspended'),
    )

    membership = models.OneToOneField(
        'users.InstitutionMembership',
        on_delete=models.RESTRICT,
        related_name='student_profile'
    )
    admission_number = models.CharField(max_length=100)
    admission_date = models.DateField()
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5, blank=True)
    residential_address = models.TextField()
    emergency_contact_name = models.CharField(max_length=150)
    emergency_contact_phone = models.CharField(max_length=25)
    current_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ACTIVE')

    class Meta:
        db_table = 'student_profiles'
        ordering = ['admission_number']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'admission_number'],
                name='uniq_student_admission_number'
            )
        ]

    def __str__(self):
        return f"{self.membership.user.full_name} ({self.admission_number})"

class SchoolEnrollment(TenantModel):
    """
    Cohort-based section enrollment for schools in a given academic year.
    """
    ENROLLMENT_STATUS = (
        ('ENROLLED', 'Enrolled'),
        ('PROMOTED', 'Promoted'),
        ('RETAINED', 'Retained'),
        ('WITHDRAWN', 'Withdrawn'),
    )

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.RESTRICT,
        related_name='school_enrollments'
    )
    academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.RESTRICT,
        related_name='school_enrollments'
    )
    section = models.ForeignKey(
        'academics.SchoolSection',
        on_delete=models.RESTRICT,
        related_name='enrollments'
    )
    roll_number = models.PositiveSmallIntegerField(null=True, blank=True)
    enrollment_status = models.CharField(max_length=30, choices=ENROLLMENT_STATUS, default='ENROLLED')

    class Meta:
        db_table = 'school_enrollments'
        ordering = ['section', 'roll_number']
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'student'],
                name='uniq_student_per_academic_year'
            ),
            models.UniqueConstraint(
                fields=['academic_year', 'section', 'roll_number'],
                name='uniq_section_roll_number'
            )
        ]

    def __str__(self):
        return f"{self.student.admission_number} - {self.section} ({self.academic_year.name})"

class CollegeCourseRegistration(TenantModel):
    """
    Credit-based individual course registration for college students.
    """
    REGISTRATION_TYPES = (
        ('REGULAR', 'Regular'),
        ('ELECTIVE', 'Elective'),
        ('AUDIT', 'Audit'),
        ('BACKLOG_REPEAT', 'Backlog Repeat'),
    )

    REGISTRATION_STATUS = (
        ('REGISTERED', 'Registered'),
        ('DROPPED', 'Dropped'),
        ('WITHDRAWN', 'Withdrawn'),
    )

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.RESTRICT,
        related_name='course_registrations'
    )
    academic_term = models.ForeignKey(
        'academics.AcademicTerm',
        on_delete=models.RESTRICT,
        related_name='course_registrations'
    )
    course = models.ForeignKey(
        'academics.CollegeCourse',
        on_delete=models.RESTRICT,
        related_name='student_registrations'
    )
    registration_type = models.CharField(max_length=30, choices=REGISTRATION_TYPES, default='REGULAR')
    registration_status = models.CharField(max_length=30, choices=REGISTRATION_STATUS, default='REGISTERED')

    class Meta:
        db_table = 'college_course_registrations'
        ordering = ['academic_term', 'course__course_code']
        constraints = [
            models.UniqueConstraint(
                fields=['academic_term', 'student', 'course'],
                name='uniq_student_course_registration'
            )
        ]

    def __str__(self):
        return f"{self.student.admission_number} - {self.course.course_code} ({self.academic_term.name})"

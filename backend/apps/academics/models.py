from django.db import models
from common.models import TenantModel

class AcademicYear(TenantModel):
    """
    Defines an academic cycle (e.g. 2025-2026) for an institution.
    """
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = 'academic_years'
        ordering = ['-start_date']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_date__gt=models.F('start_date')),
                name='chk_academic_year_dates'
            ),
            models.UniqueConstraint(
                fields=['institution', 'name'],
                name='uniq_academic_year_name'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.institution.code})"

class AcademicTerm(TenantModel):
    """
    Academic subdivisions (Semesters, Terms, Trimesters) within an academic year.
    """
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='terms'
    )
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'academic_terms'
        ordering = ['start_date']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_date__gte=models.F('start_date')),
                name='chk_academic_term_dates'
            ),
            models.UniqueConstraint(
                fields=['academic_year', 'name'],
                name='uniq_academic_term_name'
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"

# ----------------------------------------------------
# School-Specific Academic Models
# ----------------------------------------------------

class SchoolClass(TenantModel):
    """
    Represents a school grade or standard (e.g. Grade 1, Grade 10).
    """
    name = models.CharField(max_length=50)
    sequence_order = models.PositiveSmallIntegerField(
        help_text="Progression order index (e.g., 1 for Grade 1, 10 for Grade 10)."
    )

    class Meta:
        db_table = 'school_classes'
        ordering = ['sequence_order']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'sequence_order'],
                name='uniq_school_class_order'
            ),
            models.UniqueConstraint(
                fields=['institution', 'name'],
                name='uniq_school_class_name'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.institution.code})"

class SchoolSection(TenantModel):
    """
    A classroom section or division within a grade (e.g. Grade 10-A).
    """
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.RESTRICT,
        related_name='sections'
    )
    name = models.CharField(max_length=20)
    room_number = models.CharField(max_length=50, blank=True)
    class_teacher = models.ForeignKey(
        'users.InstitutionMembership',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='class_teacher_sections'
    )

    class Meta:
        db_table = 'school_sections'
        ordering = ['school_class__sequence_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['school_class', 'name'],
                name='uniq_school_section_name'
            )
        ]

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"

# ----------------------------------------------------
# College-Specific Academic Models
# ----------------------------------------------------

class CollegeDepartment(TenantModel):
    """
    Academic department in a college or university (e.g. Computer Science).
    """
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20)
    head_of_department = models.ForeignKey(
        'users.InstitutionMembership',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )

    class Meta:
        db_table = 'college_departments'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'code'],
                name='uniq_college_dept_code'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

class CollegeProgram(TenantModel):
    """
    Degree program offered by a department (e.g. B.Tech Computer Science).
    """
    department = models.ForeignKey(
        CollegeDepartment,
        on_delete=models.RESTRICT,
        related_name='programs'
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=30)
    duration_semesters = models.PositiveSmallIntegerField(default=8)
    total_credits_required = models.DecimalField(max_digits=5, decimal_places=2, default=160.00)

    class Meta:
        db_table = 'college_programs'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'code'],
                name='uniq_college_program_code'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

class CollegeCourse(TenantModel):
    """
    Course catalog entry specifying credit breakdown (Lecture-Tutorial-Practical).
    """
    department = models.ForeignKey(
        CollegeDepartment,
        on_delete=models.RESTRICT,
        related_name='courses'
    )
    course_code = models.CharField(max_length=30)
    title = models.CharField(max_length=200)
    lecture_credits = models.PositiveSmallIntegerField(default=3)
    tutorial_credits = models.PositiveSmallIntegerField(default=0)
    practical_credits = models.PositiveSmallIntegerField(default=1)
    total_credits = models.DecimalField(max_digits=4, decimal_places=2, default=4.00)
    is_elective = models.BooleanField(default=False)

    class Meta:
        db_table = 'college_courses'
        ordering = ['course_code']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'course_code'],
                name='uniq_college_course_code'
            ),
            models.CheckConstraint(
                condition=models.Q(total_credits__gt=0),
                name='chk_positive_course_credits'
            )
        ]

    def __str__(self):
        return f"{self.course_code}: {self.title} ({self.total_credits} credits)"

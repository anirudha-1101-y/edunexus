from django.db import models
from django.utils import timezone
from common.models import TenantModel, UUIDModel, TimeStampedModel

class ExamGradingScale(TenantModel):
    """
    Grading framework definition (e.g. 10-Point GPA scale or percentage tiers).
    """
    SCALE_TYPES = (
        ('PERCENTAGE_BASED', 'Percentage Based'),
        ('LETTER_GRADE_POINTS', 'Letter Grade Points'),
    )

    name = models.CharField(max_length=100)
    scale_type = models.CharField(max_length=30, choices=SCALE_TYPES, default='LETTER_GRADE_POINTS')
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'exam_grading_scales'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'name'],
                name='uniq_institution_grading_scale_name'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.institution.code})"

class GradingScaleTier(UUIDModel, TimeStampedModel):
    """
    Individual tier within a grading scale (e.g. A+: 90-100%, Grade Point 10.0).
    """
    grading_scale = models.ForeignKey(
        ExamGradingScale,
        on_delete=models.CASCADE,
        related_name='tiers'
    )
    letter_grade = models.CharField(max_length=5)
    min_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    max_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    grade_point = models.DecimalField(max_digits=4, decimal_places=2)
    is_passing_grade = models.BooleanField(default=True)

    class Meta:
        db_table = 'grading_scale_tiers'
        ordering = ['-grade_point']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(max_percentage__gte=models.F('min_percentage')),
                name='chk_tier_percentage_range'
            )
        ]

    def __str__(self):
        return f"{self.letter_grade}: {self.min_percentage}% - {self.max_percentage}% (GP: {self.grade_point})"

class ExamAssessment(TenantModel):
    """
    Represents an examination or graded assessment component.
    """
    ASSESSMENT_TYPES = (
        ('INTERNAL', 'Internal Assessment'),
        ('THEORY_FINAL', 'Theory Final Examination'),
        ('PRACTICAL_LAB', 'Practical Lab Examination'),
        ('ASSIGNMENT', 'Assignment / Quiz'),
    )

    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('MARKS_ENTRY_OPEN', 'Marks Entry Open'),
        ('MODERATION', 'Under Moderation'),
        ('PUBLISHED', 'Published'),
        ('LOCKED', 'Locked'),
    )

    academic_term = models.ForeignKey(
        'academics.AcademicTerm',
        on_delete=models.RESTRICT,
        related_name='assessments'
    )
    name = models.CharField(max_length=150)
    assessment_type = models.CharField(max_length=30, choices=ASSESSMENT_TYPES, default='THEORY_FINAL')
    school_section = models.ForeignKey(
        'academics.SchoolSection',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assessments'
    )
    college_course = models.ForeignKey(
        'academics.CollegeCourse',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assessments'
    )
    grading_scale = models.ForeignKey(
        ExamGradingScale,
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='assessments'
    )
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100.00)
    pass_marks = models.DecimalField(max_digits=6, decimal_places=2, default=40.00)
    weightage_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')

    class Meta:
        db_table = 'exam_assessments'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(pass_marks__lte=models.F('max_marks')),
                name='chk_pass_marks_lte_max_marks'
            ),
            models.CheckConstraint(
                condition=models.Q(max_marks__gt=0),
                name='chk_positive_max_marks'
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(school_section__isnull=False, college_course__isnull=True) |
                    models.Q(school_section__isnull=True, college_course__isnull=False)
                ),
                name='chk_assessment_target_exclusive'
            )
        ]

    def __str__(self):
        return f"{self.name} - Max: {self.max_marks} ({self.status})"

class ExamStudentScore(TenantModel):
    """
    Recorded score awarded to an individual student for an assessment.
    """
    assessment = models.ForeignKey(
        ExamAssessment,
        on_delete=models.RESTRICT,
        related_name='scores'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.RESTRICT,
        related_name='exam_scores'
    )
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    is_absent = models.BooleanField(default=False)
    grade_point_awarded = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    letter_grade_awarded = models.CharField(max_length=5, null=True, blank=True)
    evaluator = models.ForeignKey(
        'users.InstitutionMembership',
        on_delete=models.RESTRICT,
        related_name='evaluated_scores'
    )
    evaluated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'exam_student_scores'
        ordering = ['student__admission_number']
        constraints = [
            models.UniqueConstraint(
                fields=['assessment', 'student'],
                name='uniq_student_assessment_score'
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(is_absent=True, marks_obtained__isnull=True) |
                    models.Q(is_absent=False, marks_obtained__isnull=False, marks_obtained__gte=0)
                ),
                name='chk_valid_marks_or_absent'
            )
        ]

    def __str__(self):
        score_str = "ABSENT" if self.is_absent else f"{self.marks_obtained}"
        return f"{self.student.admission_number}: {score_str}"

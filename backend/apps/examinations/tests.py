import pytest
from decimal import Decimal
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership
from apps.academics.models import AcademicYear, AcademicTerm, SchoolClass, SchoolSection, CollegeDepartment, CollegeCourse
from apps.students.models import StudentProfile
from apps.examinations.models import ExamGradingScale, GradingScaleTier, ExamAssessment, ExamStudentScore

@pytest.fixture
def exam_setup():
    org = Organization.objects.create(
        name="Beacon Education Foundation",
        slug="beacon-edu",
        billing_email="billing@beacon.edu"
    )

    school = Institution.objects.create(
        organization=org,
        name="Beacon Academy",
        code="BEACON-SCH",
        institution_type="SCHOOL"
    )

    college = Institution.objects.create(
        organization=org,
        name="Beacon College of Engineering",
        code="BEACON-COL",
        institution_type="COLLEGE"
    )

    # Faculty evaluator
    evaluator_user = User.objects.create_user(
        email="examiner@beacon.edu",
        password="ExaminerPassword123!",
        first_name="Marcus",
        last_name="Stone"
    )
    membership_school = InstitutionMembership.objects.create(
        institution=school,
        user=evaluator_user,
        membership_type="FACULTY",
        identification_number="EXAM-01",
        status="ACTIVE"
    )
    membership_college = InstitutionMembership.objects.create(
        institution=college,
        user=evaluator_user,
        membership_type="FACULTY",
        identification_number="EXAM-02",
        status="ACTIVE"
    )

    # Students
    stu1_user = User.objects.create_user(
        email="stu1@beacon.edu", password="Password123!",
        first_name="Leo", last_name="Taylor"
    )
    stu1_mem = InstitutionMembership.objects.create(
        institution=school, user=stu1_user,
        membership_type="STUDENT", identification_number="STU-001"
    )
    student1 = StudentProfile.objects.create(
        institution=school, membership=stu1_mem,
        admission_number="ADM-BEA-001", admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 1, 10), gender="MALE",
        residential_address="1 Beacon Way",
        emergency_contact_name="Sarah", emergency_contact_phone="+11223344"
    )

    stu2_user = User.objects.create_user(
        email="stu2@beacon.edu", password="Password123!",
        first_name="Zoe", last_name="Miller"
    )
    stu2_mem = InstitutionMembership.objects.create(
        institution=school, user=stu2_user,
        membership_type="STUDENT", identification_number="STU-002"
    )
    student2 = StudentProfile.objects.create(
        institution=school, membership=stu2_mem,
        admission_number="ADM-BEA-002", admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 4, 12), gender="FEMALE",
        residential_address="2 Beacon Way",
        emergency_contact_name="James", emergency_contact_phone="+11223355"
    )

    # Academic Term & School Section
    year = AcademicYear.objects.create(
        institution=school, name="2025-2026",
        start_date=date(2025, 6, 1), end_date=date(2026, 5, 31)
    )
    term = AcademicTerm.objects.create(
        institution=school, academic_year=year,
        name="Term 1", start_date=date(2025, 6, 1), end_date=date(2025, 11, 30)
    )
    s_class = SchoolClass.objects.create(
        institution=school, name="Grade 10", sequence_order=10
    )
    section = SchoolSection.objects.create(
        institution=school, school_class=s_class, name="A"
    )

    # Grading Scale with Tiers
    scale = ExamGradingScale.objects.create(
        institution=school,
        name="10-Point Letter Scale",
        scale_type="LETTER_GRADE_POINTS"
    )
    GradingScaleTier.objects.create(
        grading_scale=scale, letter_grade="O",
        min_percentage=Decimal("90.00"), max_percentage=Decimal("100.00"),
        grade_point=Decimal("10.00"), is_passing_grade=True
    )
    GradingScaleTier.objects.create(
        grading_scale=scale, letter_grade="A",
        min_percentage=Decimal("75.00"), max_percentage=Decimal("89.99"),
        grade_point=Decimal("8.00"), is_passing_grade=True
    )
    GradingScaleTier.objects.create(
        grading_scale=scale, letter_grade="B",
        min_percentage=Decimal("40.00"), max_percentage=Decimal("74.99"),
        grade_point=Decimal("6.00"), is_passing_grade=True
    )
    GradingScaleTier.objects.create(
        grading_scale=scale, letter_grade="F",
        min_percentage=Decimal("0.00"), max_percentage=Decimal("39.99"),
        grade_point=Decimal("0.00"), is_passing_grade=False
    )

    return {
        'org': org,
        'school': school,
        'college': college,
        'evaluator_user': evaluator_user,
        'membership_school': membership_school,
        'membership_college': membership_college,
        'student1': student1,
        'student2': student2,
        'term': term,
        'section': section,
        'scale': scale
    }

@pytest.mark.django_db
def test_create_assessment_and_enter_marks(exam_setup):
    client = APIClient()
    client.force_authenticate(user=exam_setup['evaluator_user'])
    school_id = str(exam_setup['school'].id)

    # 1. Create Assessment
    create_res = client.post(
        reverse('exam-assessment-list'),
        {
            'academic_term': str(exam_setup['term'].id),
            'name': 'Mid-Term Science Exam',
            'assessment_type': 'THEORY_FINAL',
            'school_section': str(exam_setup['section'].id),
            'grading_scale': str(exam_setup['scale'].id),
            'max_marks': '100.00',
            'pass_marks': '40.00'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert create_res.status_code == 201
    assessment_id = create_res.data['id']

    # 2. Enter batch marks (Student 1: 92, Student 2: Absent)
    marks_url = reverse('exam-assessment-enter-marks', kwargs={'pk': assessment_id})
    marks_res = client.post(
        marks_url,
        {
            'scores': [
                {
                    'student_id': str(exam_setup['student1'].id),
                    'marks_obtained': '92.50',
                    'is_absent': False
                },
                {
                    'student_id': str(exam_setup['student2'].id),
                    'is_absent': True
                }
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert marks_res.status_code == 200
    assert marks_res.data['updated_count'] == 2

    # Verify scores created
    score1 = ExamStudentScore.objects.get(assessment_id=assessment_id, student=exam_setup['student1'])
    assert score1.marks_obtained == Decimal('92.50')
    assert score1.is_absent is False

    score2 = ExamStudentScore.objects.get(assessment_id=assessment_id, student=exam_setup['student2'])
    assert score2.is_absent is True
    assert score2.marks_obtained is None

@pytest.mark.django_db
def test_publish_results_computes_grades_and_locks(exam_setup):
    client = APIClient()
    client.force_authenticate(user=exam_setup['evaluator_user'])
    school_id = str(exam_setup['school'].id)

    # 1. Create Assessment & Scores
    assessment = ExamAssessment.objects.create(
        institution=exam_setup['school'],
        academic_term=exam_setup['term'],
        name="Mathematics Final",
        school_section=exam_setup['section'],
        grading_scale=exam_setup['scale'],
        max_marks=Decimal("100.00"),
        pass_marks=Decimal("40.00"),
        status='MARKS_ENTRY_OPEN'
    )
    score1 = ExamStudentScore.objects.create(
        institution=exam_setup['school'],
        assessment=assessment,
        student=exam_setup['student1'],
        marks_obtained=Decimal("94.00"),
        evaluator=exam_setup['membership_school']
    )
    score2 = ExamStudentScore.objects.create(
        institution=exam_setup['school'],
        assessment=assessment,
        student=exam_setup['student2'],
        is_absent=True,
        evaluator=exam_setup['membership_school']
    )

    # 2. Publish results
    publish_url = reverse('exam-assessment-publish-results', kwargs={'pk': assessment.id})
    pub_res = client.post(publish_url, {}, HTTP_X_INSTITUTION_ID=school_id)
    assert pub_res.status_code == 200
    assert pub_res.data['status'] == 'PUBLISHED'

    # Verify letter grade and grade points computed
    score1.refresh_from_db()
    assert score1.letter_grade_awarded == 'O'
    assert score1.grade_point_awarded == Decimal('10.00')

    score2.refresh_from_db()
    assert score2.letter_grade_awarded == 'AB'
    assert score2.grade_point_awarded == Decimal('0.00')

    # 3. Attempting to enter marks after publication is rejected
    marks_url = reverse('exam-assessment-enter-marks', kwargs={'pk': assessment.id})
    fail_res = client.post(
        marks_url,
        {
            'scores': [{'student_id': str(exam_setup['student1'].id), 'marks_obtained': '50.00'}]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert fail_res.status_code == 400

@pytest.mark.django_db
def test_invalid_marks_exceeding_max_rejected(exam_setup):
    client = APIClient()
    client.force_authenticate(user=exam_setup['evaluator_user'])
    school_id = str(exam_setup['school'].id)

    assessment = ExamAssessment.objects.create(
        institution=exam_setup['school'],
        academic_term=exam_setup['term'],
        name="Physics Quiz",
        school_section=exam_setup['section'],
        grading_scale=exam_setup['scale'],
        max_marks=Decimal("50.00"),
        pass_marks=Decimal("20.00")
    )

    marks_url = reverse('exam-assessment-enter-marks', kwargs={'pk': assessment.id})
    # Attempt to enter 60 marks when max is 50
    res = client.post(
        marks_url,
        {
            'scores': [{'student_id': str(exam_setup['student1'].id), 'marks_obtained': '60.00'}]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert res.status_code == 400

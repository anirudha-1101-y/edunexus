import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership
from apps.academics.models import (
    AcademicYear, AcademicTerm, SchoolClass, SchoolSection,
    CollegeDepartment, CollegeProgram, CollegeCourse
)
from apps.students.models import StudentProfile, SchoolEnrollment, CollegeCourseRegistration
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.examinations.models import ExamGradingScale, GradingScaleTier, ExamAssessment, ExamStudentScore
from apps.finance.models import FeeStructure, Invoice, InvoiceItem, Payment, PaymentAllocation

@pytest.mark.django_db(transaction=True)
def test_school_end_to_end_journey():
    """
    Complete School Lifecycle:
    Admissions -> Section Cohort -> Attendance Roll Call -> Marks Publication -> Fee Settlement.
    """
    org = Organization.objects.create(name='Apex Educational Foundation')
    school = Institution.objects.create(
        organization=org,
        name='Apex Model High School',
        code='APEX-SCH',
        institution_type='SCHOOL'
    )
    admin_user = User.objects.create_user(email='principal@apex.edu', password='password123')
    membership = InstitutionMembership.objects.create(
        institution=school,
        user=admin_user,
        membership_type='STAFF',
        identification_number='STAFF-001'
    )

    # 1. Academic Configuration
    acad_year = AcademicYear.objects.create(
        institution=school,
        name='2025-2026',
        start_date=date(2025, 6, 1),
        end_date=date(2026, 5, 31)
    )
    term = AcademicTerm.objects.create(
        institution=school,
        academic_year=acad_year,
        name='Term 1',
        start_date=date(2025, 6, 1),
        end_date=date(2025, 10, 31)
    )
    school_class = SchoolClass.objects.create(
        institution=school,
        name='Grade 10',
        sequence_order=10
    )
    section = SchoolSection.objects.create(
        institution=school,
        school_class=school_class,
        name='Section A',
        room_number='101-A'
    )

    # 2. Student Admission & Cohort Enrollment
    student_user = User.objects.create_user(email='student1@apex.edu', password='password123')
    student_membership = InstitutionMembership.objects.create(
        institution=school,
        user=student_user,
        membership_type='STUDENT',
        identification_number='STU-001'
    )
    profile = StudentProfile.objects.create(
        institution=school,
        membership=student_membership,
        admission_number='SCH-2025-001',
        admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 8, 28)
    )
    enrollment = SchoolEnrollment.objects.create(
        institution=school,
        student=profile,
        academic_year=acad_year,
        section=section,
        roll_number='101'
    )
    assert enrollment.enrollment_status == 'ENROLLED'

    # 3. Attendance Session & Roll Call
    att_session = AttendanceSession.objects.create(
        institution=school,
        session_date=date(2025, 9, 1),
        session_type='DAILY_HOMEROOM',
        school_section=section,
        taken_by=membership
    )
    record = AttendanceRecord.objects.create(
        institution=school,
        session=att_session,
        student=profile,
        status='PRESENT'
    )
    att_session.is_locked = True
    att_session.save()
    assert att_session.is_locked is True

    # 4. Assessment & Result Publication
    scale = ExamGradingScale.objects.create(
        institution=school,
        name='Standard School Scale'
    )
    GradingScaleTier.objects.create(
        grading_scale=scale,
        letter_grade='A',
        min_percentage=80.0,
        max_percentage=100.0,
        grade_point=9.0
    )
    assessment = ExamAssessment.objects.create(
        institution=school,
        academic_term=term,
        school_section=section,
        grading_scale=scale,
        name='Midterm Mathematics',
        max_marks=100,
        pass_marks=40
    )
    score = ExamStudentScore.objects.create(
        institution=school,
        assessment=assessment,
        student=profile,
        marks_obtained=88,
        letter_grade_awarded='A',
        grade_point_awarded=9.0,
        evaluator=membership
    )
    assessment.status = 'PUBLISHED'
    assessment.is_locked = True
    assessment.save()
    assert assessment.status == 'PUBLISHED'

    # 5. Finance: Invoicing & Payment Settlement via API Client
    fee_struct = FeeStructure.objects.create(
        institution=school,
        academic_year=acad_year,
        name='Grade 10 Annual Composite Fee',
        target_type='SCHOOL_CLASS',
        school_class=school_class,
        total_amount=150000
    )
    invoice = Invoice.objects.create(
        institution=school,
        student=profile,
        invoice_number='INV-SCH-2025-001',
        issue_date=date(2025, 9, 1),
        due_date=date(2025, 10, 1),
        subtotal_amount=150000,
        discount_amount=0,
        tax_amount=0,
        total_amount=150000,
        paid_amount=0,
        status='UNPAID'
    )
    inv_item = InvoiceItem.objects.create(
        invoice=invoice,
        fee_category='TUITION',
        amount=150000,
        allocated_amount=0
    )

    client = APIClient()
    client.force_authenticate(user=admin_user)
    pay_url = reverse('payment-record-payment')
    pay_res = client.post(
        pay_url,
        {
            'student_id': str(profile.id),
            'receipt_number': 'RCP-SCH-2025-001',
            'payment_method': 'ONLINE_GATEWAY',
            'amount': 100000,
            'idempotency_key': 'IDEMP-SCH-001',
            'allocations': [
                {'invoice_item_id': str(inv_item.id), 'allocated_amount': 100000}
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=str(school.id)
    )

    assert pay_res.status_code == 201
    invoice.refresh_from_db()
    inv_item.refresh_from_db()

    assert invoice.paid_amount == 100000
    assert invoice.balance_due == 50000
    assert invoice.status == 'PARTIALLY_PAID'
    assert inv_item.allocated_amount == 100000

@pytest.mark.django_db(transaction=True)
def test_college_end_to_end_journey():
    """
    Complete College Higher Education Lifecycle:
    Department & Program -> Credit Course -> Registration -> Lecture Roll Call.
    """
    org = Organization.objects.create(name='Apex Higher Education Trust')
    college = Institution.objects.create(
        organization=org,
        name='Apex Institute of Technology',
        code='APEX-TECH',
        institution_type='COLLEGE'
    )
    admin_user = User.objects.create_user(email='dean@apextech.edu', password='password123')
    membership = InstitutionMembership.objects.create(
        institution=college,
        user=admin_user,
        membership_type='STAFF',
        identification_number='FAC-001'
    )

    acad_year = AcademicYear.objects.create(
        institution=college,
        name='2025-2026',
        start_date=date(2025, 7, 1),
        end_date=date(2026, 6, 30)
    )
    term = AcademicTerm.objects.create(
        institution=college,
        academic_year=acad_year,
        name='Semester 3 (Autumn 2025)',
        start_date=date(2025, 7, 15),
        end_date=date(2025, 12, 15)
    )

    dept = CollegeDepartment.objects.create(
        institution=college,
        name='Computer Science & Engineering',
        code='CSE'
    )
    program = CollegeProgram.objects.create(
        institution=college,
        department=dept,
        name='Bachelor of Technology in Computer Science',
        code='BTECH-CSE',
        duration_semesters=8,
        total_credits_required=160.00
    )
    course = CollegeCourse.objects.create(
        institution=college,
        department=dept,
        course_code='CS301',
        title='Data Structures & Algorithms',
        lecture_credits=3,
        tutorial_credits=0,
        practical_credits=1,
        total_credits=4
    )

    student_user = User.objects.create_user(email='collegestudent@apextech.edu', password='password123')
    student_membership = InstitutionMembership.objects.create(
        institution=college,
        user=student_user,
        membership_type='STUDENT',
        identification_number='STU-TECH-001'
    )
    profile = StudentProfile.objects.create(
        institution=college,
        membership=student_membership,
        admission_number='ENG-2025-042',
        admission_date=date(2025, 7, 1),
        date_of_birth=date(2004, 12, 10)
    )

    registration = CollegeCourseRegistration.objects.create(
        institution=college,
        student=profile,
        academic_term=term,
        course=course,
        registration_type='REGULAR'
    )
    assert registration.registration_status == 'REGISTERED'

    # Period/Lecture Roll Call
    session = AttendanceSession.objects.create(
        institution=college,
        session_date=date(2025, 8, 20),
        session_type='LECTURE',
        college_course=course,
        period_slot=2,
        taken_by=membership
    )
    rec = AttendanceRecord.objects.create(
        institution=college,
        session=session,
        student=profile,
        status='PRESENT'
    )
    assert rec.status == 'PRESENT'

import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership
from apps.academics.models import (
    AcademicYear, AcademicTerm,
    SchoolClass, SchoolSection,
    CollegeDepartment, CollegeProgram, CollegeCourse
)

@pytest.fixture
def academic_setup():
    org = Organization.objects.create(
        name="Horizon Educational Trust",
        slug="horizon-trust",
        billing_email="billing@horizon.edu"
    )

    school = Institution.objects.create(
        organization=org,
        name="Horizon School",
        code="HORIZON-SCH",
        institution_type="SCHOOL"
    )

    college = Institution.objects.create(
        organization=org,
        name="Horizon College",
        code="HORIZON-COL",
        institution_type="COLLEGE"
    )

    user = User.objects.create_user(
        email="admin@horizon.edu",
        password="AdminPassword123!",
        first_name="Alice",
        last_name="Smith"
    )

    membership_school = InstitutionMembership.objects.create(
        institution=school,
        user=user,
        membership_type="STAFF",
        identification_number="EMP-100",
        status="ACTIVE"
    )

    membership_college = InstitutionMembership.objects.create(
        institution=college,
        user=user,
        membership_type="STAFF",
        identification_number="EMP-200",
        status="ACTIVE"
    )

    return {
        'org': org,
        'school': school,
        'college': college,
        'user': user,
        'membership_school': membership_school,
        'membership_college': membership_college
    }

@pytest.mark.django_db
def test_create_academic_year_and_term(academic_setup):
    client = APIClient()
    client.force_authenticate(user=academic_setup['user'])
    school_id = str(academic_setup['school'].id)

    # 1. Create Academic Year
    year_res = client.post(
        reverse('academic-year-list'),
        {
            'name': '2025-2026',
            'start_date': '2025-06-01',
            'end_date': '2026-05-31',
            'is_current': True
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert year_res.status_code == 201
    year_id = year_res.data['id']

    # 2. Create Academic Term
    term_res = client.post(
        reverse('academic-term-list'),
        {
            'academic_year': year_id,
            'name': 'Term 1',
            'start_date': '2025-06-01',
            'end_date': '2025-10-31',
            'is_active': True
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert term_res.status_code == 201
    assert term_res.data['name'] == 'Term 1'

@pytest.mark.django_db
def test_academic_year_invalid_dates_rejected(academic_setup):
    client = APIClient()
    client.force_authenticate(user=academic_setup['user'])
    school_id = str(academic_setup['school'].id)

    # Attempt to create year with end_date earlier than start_date
    res = client.post(
        reverse('academic-year-list'),
        {
            'name': 'Invalid Year',
            'start_date': '2026-06-01',
            'end_date': '2025-05-31'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert res.status_code == 400
    assert res.data['success'] is False

@pytest.mark.django_db
def test_school_class_and_section_creation(academic_setup):
    client = APIClient()
    client.force_authenticate(user=academic_setup['user'])
    school_id = str(academic_setup['school'].id)

    # Create Class (Grade 10)
    class_res = client.post(
        reverse('school-class-list'),
        {
            'name': 'Grade 10',
            'sequence_order': 10
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert class_res.status_code == 201
    class_id = class_res.data['id']

    # Create Section 10-A
    sec_res = client.post(
        reverse('school-section-list'),
        {
            'school_class': class_id,
            'name': 'A',
            'room_number': 'Room 101'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert sec_res.status_code == 201
    assert sec_res.data['name'] == 'A'

@pytest.mark.django_db
def test_college_department_program_and_courses(academic_setup):
    client = APIClient()
    client.force_authenticate(user=academic_setup['user'])
    college_id = str(academic_setup['college'].id)

    # 1. Create Department
    dept_res = client.post(
        reverse('college-department-list'),
        {
            'name': 'Computer Science and Engineering',
            'code': 'CSE'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=college_id
    )
    assert dept_res.status_code == 201
    dept_id = dept_res.data['id']

    # 2. Create Program
    prog_res = client.post(
        reverse('college-program-list'),
        {
            'department': dept_id,
            'name': 'B.Tech in Computer Science',
            'code': 'BTECH-CSE',
            'duration_semesters': 8,
            'total_credits_required': '160.00'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=college_id
    )
    assert prog_res.status_code == 201
    assert prog_res.data['code'] == 'BTECH-CSE'

    # 3. Create Course with credits
    course_res = client.post(
        reverse('college-course-list'),
        {
            'department': dept_id,
            'course_code': 'CS301',
            'title': 'Database Management Systems',
            'lecture_credits': 3,
            'tutorial_credits': 0,
            'practical_credits': 1,
            'total_credits': '4.00',
            'is_elective': False
        },
        format='json',
        HTTP_X_INSTITUTION_ID=college_id
    )
    assert course_res.status_code == 201
    assert course_res.data['course_code'] == 'CS301'

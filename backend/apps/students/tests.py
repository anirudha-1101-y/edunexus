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
from apps.students.models import StudentProfile, SchoolEnrollment, CollegeCourseRegistration

@pytest.fixture
def student_setup():
    org = Organization.objects.create(
        name="Global Education Society",
        slug="global-edu",
        billing_email="admin@global.edu"
    )

    school = Institution.objects.create(
        organization=org,
        name="Global Valley High School",
        code="GLOBAL-SCH",
        institution_type="SCHOOL"
    )

    college = Institution.objects.create(
        organization=org,
        name="Global Engineering College",
        code="GLOBAL-COL",
        institution_type="COLLEGE"
    )

    # Admin user
    staff_user = User.objects.create_user(
        email="staff@global.edu",
        password="StaffPassword123!",
        first_name="Robert",
        last_name="Brown"
    )
    InstitutionMembership.objects.create(
        institution=school,
        user=staff_user,
        membership_type="STAFF",
        identification_number="STF-01",
        status="ACTIVE"
    )
    InstitutionMembership.objects.create(
        institution=college,
        user=staff_user,
        membership_type="STAFF",
        identification_number="STF-02",
        status="ACTIVE"
    )

    # Student user
    student_user = User.objects.create_user(
        email="student@global.edu",
        password="StudentPassword123!",
        first_name="Kevin",
        last_name="Vance"
    )
    student_membership_school = InstitutionMembership.objects.create(
        institution=school,
        user=student_user,
        membership_type="STUDENT",
        identification_number="STU-SCH-001",
        status="ACTIVE"
    )
    student_membership_college = InstitutionMembership.objects.create(
        institution=college,
        user=student_user,
        membership_type="STUDENT",
        identification_number="STU-COL-001",
        status="ACTIVE"
    )

    # Academic setup for school
    acad_year = AcademicYear.objects.create(
        institution=school,
        name="2025-2026",
        start_date=date(2025, 6, 1),
        end_date=date(2026, 5, 31),
        is_current=True
    )
    school_class = SchoolClass.objects.create(
        institution=school,
        name="Grade 9",
        sequence_order=9
    )
    section = SchoolSection.objects.create(
        institution=school,
        school_class=school_class,
        name="A"
    )

    # Academic setup for college
    college_term = AcademicTerm.objects.create(
        institution=college,
        academic_year=AcademicYear.objects.create(
            institution=college,
            name="2025-2026",
            start_date=date(2025, 8, 1),
            end_date=date(2026, 5, 31)
        ),
        name="Semester 1",
        start_date=date(2025, 8, 1),
        end_date=date(2025, 12, 15)
    )
    dept = CollegeDepartment.objects.create(
        institution=college,
        name="Information Technology",
        code="IT"
    )
    course = CollegeCourse.objects.create(
        institution=college,
        department=dept,
        course_code="IT101",
        title="Intro to Programming",
        lecture_credits=3,
        tutorial_credits=0,
        practical_credits=1,
        total_credits=4.00
    )

    return {
        'org': org,
        'school': school,
        'college': college,
        'staff_user': staff_user,
        'student_user': student_user,
        'student_membership_school': student_membership_school,
        'student_membership_college': student_membership_college,
        'acad_year': acad_year,
        'section': section,
        'college_term': college_term,
        'course': course
    }

@pytest.mark.django_db
def test_student_profile_creation_and_enrollment(student_setup):
    client = APIClient()
    client.force_authenticate(user=student_setup['staff_user'])
    school_id = str(student_setup['school'].id)

    # 1. Create StudentProfile
    profile_res = client.post(
        reverse('student-profile-list'),
        {
            'membership': str(student_setup['student_membership_school'].id),
            'admission_number': 'ADM-2025-001',
            'admission_date': '2025-06-01',
            'date_of_birth': '2010-04-15',
            'gender': 'MALE',
            'residential_address': '123 Pine St, City',
            'emergency_contact_name': 'Mary Vance',
            'emergency_contact_phone': '+1234567890'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert profile_res.status_code == 201
    profile_id = profile_res.data['id']

    # 2. Enroll student into Section 9-A
    enroll_res = client.post(
        reverse('school-enrollment-list'),
        {
            'student': profile_id,
            'academic_year': str(student_setup['acad_year'].id),
            'section': str(student_setup['section'].id),
            'roll_number': 1
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert enroll_res.status_code == 201
    assert enroll_res.data['roll_number'] == 1

@pytest.mark.django_db
def test_duplicate_school_enrollment_rejected(student_setup):
    client = APIClient()
    client.force_authenticate(user=student_setup['staff_user'])
    school_id = str(student_setup['school'].id)

    profile = StudentProfile.objects.create(
        institution=student_setup['school'],
        membership=student_setup['student_membership_school'],
        admission_number='ADM-2025-002',
        admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 5, 20),
        gender='FEMALE',
        residential_address='456 Elm St',
        emergency_contact_name='Sarah',
        emergency_contact_phone='+1987654321'
    )

    # First enrollment succeeds
    SchoolEnrollment.objects.create(
        institution=student_setup['school'],
        student=profile,
        academic_year=student_setup['acad_year'],
        section=student_setup['section'],
        roll_number=5
    )

    # Attempt second enrollment in the same academic year (must fail database constraint)
    res = client.post(
        reverse('school-enrollment-list'),
        {
            'student': str(profile.id),
            'academic_year': str(student_setup['acad_year'].id),
            'section': str(student_setup['section'].id),
            'roll_number': 6
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert res.status_code in (400, 500)

@pytest.mark.django_db
def test_college_course_registration(student_setup):
    client = APIClient()
    client.force_authenticate(user=student_setup['staff_user'])
    college_id = str(student_setup['college'].id)

    # 1. Create College StudentProfile
    profile = StudentProfile.objects.create(
        institution=student_setup['college'],
        membership=student_setup['student_membership_college'],
        admission_number='COL-2025-001',
        admission_date=date(2025, 8, 1),
        date_of_birth=date(2005, 3, 10),
        gender='MALE',
        residential_address='789 University Way',
        emergency_contact_name='Paul Vance',
        emergency_contact_phone='+1555444333'
    )

    # 2. Register for IT101 Course
    reg_res = client.post(
        reverse('college-registration-list'),
        {
            'student': str(profile.id),
            'academic_term': str(student_setup['college_term'].id),
            'course': str(student_setup['course'].id),
            'registration_type': 'REGULAR'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=college_id
    )
    assert reg_res.status_code == 201
    assert reg_res.data['course_code'] == 'IT101'
    assert reg_res.data['total_credits'] == '4.00'

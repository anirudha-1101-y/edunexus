import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership
from apps.academics.models import (
    AcademicYear, SchoolClass, SchoolSection,
    CollegeDepartment, CollegeCourse
)
from apps.students.models import StudentProfile
from apps.attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog

@pytest.fixture
def attendance_setup():
    org = Organization.objects.create(
        name="Oakridge Educational Group",
        slug="oakridge-group",
        billing_email="admin@oakridge.edu"
    )

    school = Institution.objects.create(
        organization=org,
        name="Oakridge International School",
        code="OAK-SCH",
        institution_type="SCHOOL"
    )

    college = Institution.objects.create(
        organization=org,
        name="Oakridge Engineering College",
        code="OAK-COL",
        institution_type="COLLEGE"
    )

    # Teacher user
    teacher = User.objects.create_user(
        email="teacher@oakridge.edu",
        password="TeacherPassword123!",
        first_name="David",
        last_name="Miller"
    )
    membership_school = InstitutionMembership.objects.create(
        institution=school,
        user=teacher,
        membership_type="FACULTY",
        identification_number="FAC-SCH-01",
        status="ACTIVE"
    )
    membership_college = InstitutionMembership.objects.create(
        institution=college,
        user=teacher,
        membership_type="FACULTY",
        identification_number="FAC-COL-01",
        status="ACTIVE"
    )

    # Student 1
    student1_user = User.objects.create_user(
        email="student1@oakridge.edu",
        password="Password123!",
        first_name="Sam",
        last_name="Wilson"
    )
    stu1_membership = InstitutionMembership.objects.create(
        institution=school,
        user=student1_user,
        membership_type="STUDENT",
        identification_number="STU-001",
        status="ACTIVE"
    )
    student1 = StudentProfile.objects.create(
        institution=school,
        membership=stu1_membership,
        admission_number="ADM-OAK-001",
        admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 8, 14),
        gender="MALE",
        residential_address="100 Oak Ave",
        emergency_contact_name="Sarah Wilson",
        emergency_contact_phone="+1234567890"
    )

    # Student 2
    student2_user = User.objects.create_user(
        email="student2@oakridge.edu",
        password="Password123!",
        first_name="Emma",
        last_name="Watson"
    )
    stu2_membership = InstitutionMembership.objects.create(
        institution=school,
        user=student2_user,
        membership_type="STUDENT",
        identification_number="STU-002",
        status="ACTIVE"
    )
    student2 = StudentProfile.objects.create(
        institution=school,
        membership=stu2_membership,
        admission_number="ADM-OAK-002",
        admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 3, 22),
        gender="FEMALE",
        residential_address="102 Oak Ave",
        emergency_contact_name="John Watson",
        emergency_contact_phone="+1234567891"
    )

    # Academic School structure
    school_class = SchoolClass.objects.create(
        institution=school,
        name="Grade 10",
        sequence_order=10
    )
    section = SchoolSection.objects.create(
        institution=school,
        school_class=school_class,
        name="A"
    )

    # College structure
    dept = CollegeDepartment.objects.create(
        institution=college,
        name="Electronics",
        code="ECE"
    )
    course = CollegeCourse.objects.create(
        institution=college,
        department=dept,
        course_code="EC201",
        title="Signals and Systems",
        total_credits=4.00
    )

    return {
        'org': org,
        'school': school,
        'college': college,
        'teacher': teacher,
        'membership_school': membership_school,
        'membership_college': membership_college,
        'student1': student1,
        'student2': student2,
        'section': section,
        'course': course
    }

@pytest.mark.django_db
def test_create_school_and_college_attendance_sessions(attendance_setup):
    client = APIClient()
    client.force_authenticate(user=attendance_setup['teacher'])
    school_id = str(attendance_setup['school'].id)
    college_id = str(attendance_setup['college'].id)

    # 1. Create School Session
    school_res = client.post(
        reverse('attendance-session-list'),
        {
            'session_date': '2025-10-15',
            'session_type': 'DAILY_HOMEROOM',
            'school_section': str(attendance_setup['section'].id)
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert school_res.status_code == 201
    assert school_res.data['session_type'] == 'DAILY_HOMEROOM'
    assert school_res.data['is_locked'] is False

    # 2. Create College Lecture Session
    college_res = client.post(
        reverse('attendance-session-list'),
        {
            'session_date': '2025-10-15',
            'session_type': 'LECTURE',
            'college_course': str(attendance_setup['course'].id),
            'period_slot': 2
        },
        format='json',
        HTTP_X_INSTITUTION_ID=college_id
    )
    assert college_res.status_code == 201
    assert college_res.data['session_type'] == 'LECTURE'
    assert college_res.data['period_slot'] == 2

@pytest.mark.django_db
def test_submit_roll_call_and_lock_workflow(attendance_setup):
    client = APIClient()
    client.force_authenticate(user=attendance_setup['teacher'])
    school_id = str(attendance_setup['school'].id)

    # 1. Create session
    session = AttendanceSession.objects.create(
        institution=attendance_setup['school'],
        session_date=date(2025, 10, 16),
        session_type='DAILY_HOMEROOM',
        school_section=attendance_setup['section'],
        taken_by=attendance_setup['membership_school']
    )

    # 2. Submit roll call marks
    submit_url = reverse('attendance-session-submit-roll-call', kwargs={'pk': session.id})
    res = client.post(
        submit_url,
        {
            'records': [
                {
                    'student_id': str(attendance_setup['student1'].id),
                    'status': 'PRESENT',
                    'remarks': 'On time'
                },
                {
                    'student_id': str(attendance_setup['student2'].id),
                    'status': 'ABSENT',
                    'remarks': 'Fever'
                }
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert res.status_code == 200
    assert res.data['records_count'] == 2
    assert AttendanceRecord.objects.filter(session=session).count() == 2

    # 3. Lock session
    lock_url = reverse('attendance-session-lock-session', kwargs={'pk': session.id})
    lock_res = client.post(lock_url, {}, HTTP_X_INSTITUTION_ID=school_id)
    assert lock_res.status_code == 200
    assert lock_res.data['is_locked'] is True

    session.refresh_from_db()
    assert session.is_locked is True

    # 4. Attempting to submit roll call again after lock must be rejected
    fail_res = client.post(
        submit_url,
        {
            'records': [
                {
                    'student_id': str(attendance_setup['student1'].id),
                    'status': 'ABSENT'
                }
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert fail_res.status_code == 400

@pytest.mark.django_db
def test_attendance_correction_with_audit_trail(attendance_setup):
    client = APIClient()
    client.force_authenticate(user=attendance_setup['teacher'])
    school_id = str(attendance_setup['school'].id)

    # Create locked session with record
    session = AttendanceSession.objects.create(
        institution=attendance_setup['school'],
        session_date=date(2025, 10, 17),
        session_type='DAILY_HOMEROOM',
        school_section=attendance_setup['section'],
        taken_by=attendance_setup['membership_school'],
        is_locked=True
    )
    record = AttendanceRecord.objects.create(
        institution=attendance_setup['school'],
        session=session,
        student=attendance_setup['student2'],
        status='ABSENT'
    )

    # Correct record to EXCUSED with required reason
    correct_url = reverse('attendance-session-correct-record', kwargs={'pk': session.id})
    res = client.post(
        correct_url,
        {
            'record_id': str(record.id),
            'new_status': 'EXCUSED',
            'reason': 'Medical certificate submitted by parent.'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )

    assert res.status_code == 200
    record.refresh_from_db()
    assert record.status == 'EXCUSED'

    # Verify audit log was created
    audit = AttendanceAuditLog.objects.filter(attendance_record=record).first()
    assert audit is not None
    assert audit.previous_status == 'ABSENT'
    assert audit.new_status == 'EXCUSED'
    assert 'Medical certificate' in audit.reason

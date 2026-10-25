import pytest
from datetime import date, time
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership
from apps.students.models import StudentProfile
from apps.operations.models import (
    Room, TimeSlot, TimetableSlot,
    Book, BookIssue,
    TransportRoute, StudentTransportAssignment,
    Announcement
)

@pytest.fixture
def operations_setup():
    org = Organization.objects.create(
        name="Summit Educational Trust",
        slug="summit-edu",
        billing_email="admin@summit.edu"
    )

    school = Institution.objects.create(
        organization=org,
        name="Summit Day School",
        code="SUMMIT-SCH",
        institution_type="SCHOOL"
    )

    faculty_user = User.objects.create_user(
        email="prof@summit.edu",
        password="ProfPassword123!",
        first_name="Arthur",
        last_name="Pendleton",
        is_staff=True
    )
    faculty_mem = InstitutionMembership.objects.create(
        institution=school,
        user=faculty_user,
        membership_type="STAFF",
        identification_number="FAC-SUM-01",
        status="ACTIVE"
    )

    faculty_user2 = User.objects.create_user(
        email="prof2@summit.edu",
        password="ProfPassword123!",
        first_name="Beatrice",
        last_name="Potter"
    )
    faculty_mem2 = InstitutionMembership.objects.create(
        institution=school,
        user=faculty_user2,
        membership_type="FACULTY",
        identification_number="FAC-SUM-02",
        status="ACTIVE"
    )

    student_user = User.objects.create_user(
        email="student.ops@summit.edu",
        password="Password123!",
        first_name="Peter",
        last_name="Parker"
    )
    student_mem = InstitutionMembership.objects.create(
        institution=school,
        user=student_user,
        membership_type="STUDENT",
        identification_number="STU-SUM-01",
        status="ACTIVE"
    )
    student = StudentProfile.objects.create(
        institution=school,
        membership=student_mem,
        admission_number="ADM-SUM-001",
        admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 8, 10),
        gender="MALE",
        residential_address="20 Queens Blvd",
        emergency_contact_name="Aunt May",
        emergency_contact_phone="+12125551234"
    )

    return {
        'org': org,
        'school': school,
        'faculty_user': faculty_user,
        'faculty_mem': faculty_mem,
        'faculty_mem2': faculty_mem2,
        'student': student
    }

@pytest.mark.django_db
def test_timetable_double_booking_prevention(operations_setup):
    client = APIClient()
    client.force_authenticate(user=operations_setup['faculty_user'])
    school_id = str(operations_setup['school'].id)

    # 1. Create Room and TimeSlot (Monday 09:00 - 10:00)
    room1 = Room.objects.create(
        institution=operations_setup['school'],
        name="Room 101",
        capacity=40,
        room_type="CLASSROOM"
    )
    room2 = Room.objects.create(
        institution=operations_setup['school'],
        name="Room 102",
        capacity=35,
        room_type="CLASSROOM"
    )
    time_slot = TimeSlot.objects.create(
        institution=operations_setup['school'],
        name="Period 1",
        day_of_week=1, # Monday
        start_time=time(9, 0),
        end_time=time(10, 0)
    )

    # 2. Book Room 101 with Faculty 1
    tt_res = client.post(
        reverse('timetable-list'),
        {
            'time_slot': str(time_slot.id),
            'room': str(room1.id),
            'faculty': str(operations_setup['faculty_mem'].id)
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert tt_res.status_code == 201

    # 3. Attempt to double-book Room 101 in the same time_slot with Faculty 2 (Must be rejected)
    conflict_room = client.post(
        reverse('timetable-list'),
        {
            'time_slot': str(time_slot.id),
            'room': str(room1.id),
            'faculty': str(operations_setup['faculty_mem2'].id)
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert conflict_room.status_code in (400, 500)

    # 4. Attempt to double-book Faculty 1 in Room 102 during the same time_slot (Must be rejected)
    conflict_faculty = client.post(
        reverse('timetable-list'),
        {
            'time_slot': str(time_slot.id),
            'room': str(room2.id),
            'faculty': str(operations_setup['faculty_mem'].id)
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert conflict_faculty.status_code in (400, 500)

@pytest.mark.django_db
def test_library_issue_and_return_lifecycle(operations_setup):
    client = APIClient()
    client.force_authenticate(user=operations_setup['faculty_user'])
    school_id = str(operations_setup['school'].id)

    # 1. Create a Book with 1 copy
    book = Book.objects.create(
        institution=operations_setup['school'],
        isbn="978-0132350884",
        title="Clean Code",
        author="Robert C. Martin",
        total_copies=1,
        available_copies=1
    )

    # 2. Issue book to student
    issue_res = client.post(
        reverse('library-issue-list'),
        {
            'book': str(book.id),
            'student': str(operations_setup['student'].id),
            'issue_date': '2025-10-01',
            'due_date': '2025-10-15'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert issue_res.status_code == 201
    issue_id = issue_res.data['id']

    # Available copies must now be 0
    book.refresh_from_db()
    assert book.available_copies == 0

    # 3. Attempting to issue when 0 copies available must fail
    fail_res = client.post(
        reverse('library-issue-list'),
        {
            'book': str(book.id),
            'student': str(operations_setup['student'].id),
            'due_date': '2025-10-15'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert fail_res.status_code == 400

    # 4. Return the book
    return_url = reverse('library-issue-return-book', kwargs={'pk': issue_id})
    return_res = client.post(return_url, {}, HTTP_X_INSTITUTION_ID=school_id)
    assert return_res.status_code == 200

    # Available copies restored to 1
    book.refresh_from_db()
    assert book.available_copies == 1

@pytest.mark.django_db
def test_transport_route_and_announcement(operations_setup):
    client = APIClient()
    client.force_authenticate(user=operations_setup['faculty_user'])
    school_id = str(operations_setup['school'].id)

    # 1. Create Transport Route
    route_res = client.post(
        reverse('transport-route-list'),
        {
            'route_number': 'Route 5 - Midtown',
            'vehicle_number': 'BUS-501',
            'driver_name': 'Thomas Shelby',
            'driver_phone': '+1987654321',
            'capacity': 45
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert route_res.status_code == 201
    route_id = route_res.data['id']

    # 2. Assign Student to Route
    assign_res = client.post(
        reverse('transport-assignment-list'),
        {
            'route': route_id,
            'student': str(operations_setup['student'].id),
            'pickup_stop': 'Midtown Central Station'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert assign_res.status_code == 201
    assert assign_res.data['pickup_stop'] == 'Midtown Central Station'

    # 3. Post Announcement
    announce_res = client.post(
        reverse('announcement-list'),
        {
            'title': 'School Sports Day Schedule Announced',
            'content': 'All events will start at 08:30 AM this Friday on the main grounds.',
            'target_audience': 'ALL'
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert announce_res.status_code == 201
    assert announce_res.data['title'] == 'School Sports Day Schedule Announced'

import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership, Role, Permission
from apps.academics.models import SchoolClass, AcademicYear
from apps.students.models import StudentProfile

@pytest.fixture
def access_control_setup():
    org = Organization.objects.create(
        name="Nexus Security Trust",
        slug="nexus-sec",
        billing_email="sec@nexus.edu"
    )

    institution = Institution.objects.create(
        organization=org,
        name="Nexus Security Academy",
        code="NEX-SEC",
        institution_type="SCHOOL"
    )

    # 1. Institutional Administrator User
    admin_user = User.objects.create_user(
        email="admin.sec@nexus.edu",
        password="AdminSecurePass123!",
        first_name="Victoria",
        last_name="Sterling",
        is_staff=True
    )
    admin_membership = InstitutionMembership.objects.create(
        institution=institution,
        user=admin_user,
        membership_type="STAFF",
        identification_number="EMP-ADMIN-01",
        status="ACTIVE"
    )

    # 2. Regular Non-Admin User (Student)
    student_user = User.objects.create_user(
        email="student.sec@nexus.edu",
        password="StudentSecurePass123!",
        first_name="Kevin",
        last_name="Vance",
        is_staff=False
    )
    student_membership = InstitutionMembership.objects.create(
        institution=institution,
        user=student_user,
        membership_type="STUDENT",
        identification_number="STU-SEC-01",
        status="ACTIVE"
    )

    # Pre-seeded test record
    school_class = SchoolClass.objects.create(
        institution=institution,
        name="Grade 11",
        sequence_order=11
    )

    return {
        'org': org,
        'institution': institution,
        'admin_user': admin_user,
        'admin_membership': admin_membership,
        'student_user': student_user,
        'student_membership': student_membership,
        'school_class': school_class
    }

@pytest.mark.django_db
def test_admin_authentication_and_crud_lifecycle(access_control_setup):
    """
    Scenario 1:
    Admin authenticates and successfully creates, updates, and deletes protected data.
    """
    client = APIClient()
    inst_id = str(access_control_setup['institution'].id)

    # 1. Login as Admin
    login_res = client.post(reverse('auth-login'), {
        'email': 'admin.sec@nexus.edu',
        'password': 'AdminSecurePass123!'
    }, format='json')
    assert login_res.status_code == 200
    assert login_res.data['data']['is_admin'] is True
    admin_token = login_res.data['data']['tokens']['access']

    client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

    # 2. Access Admin Dashboard
    dash_res = client.get(
        reverse('institution-admin-dashboard'),
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert dash_res.status_code == 200
    assert dash_res.data['data']['metrics']['rls_enforced'] is True

    # 3. Add Data (POST)
    create_res = client.post(
        reverse('school-class-list'),
        {'name': 'Grade 12', 'sequence_order': 12},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert create_res.status_code == 201
    class_id = create_res.data['id']
    assert SchoolClass.objects.filter(id=class_id).exists()

    # 4. Modify Data (PATCH)
    update_res = client.patch(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        {'name': 'Grade 12 Advanced'},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert update_res.status_code == 200
    assert update_res.data['name'] == 'Grade 12 Advanced'

    # 5. Delete Data (DELETE)
    delete_res = client.delete(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert delete_res.status_code == 204
    assert not SchoolClass.objects.filter(id=class_id).exists()

@pytest.mark.django_db
def test_unauthenticated_requests_strictly_blocked(access_control_setup):
    """
    Scenario 2:
    Unauthenticated requests cannot access protected data or admin routes (HTTP 401).
    """
    client = APIClient()
    inst_id = str(access_control_setup['institution'].id)
    class_id = str(access_control_setup['school_class'].id)

    # 1. Admin dashboard without credentials
    dash_res = client.get(reverse('institution-admin-dashboard'), HTTP_X_INSTITUTION_ID=inst_id)
    assert dash_res.status_code == 401

    # 2. Read protected data without credentials
    read_res = client.get(reverse('school-class-list'), HTTP_X_INSTITUTION_ID=inst_id)
    assert read_res.status_code == 401

    # 3. Create data without credentials
    create_res = client.post(
        reverse('school-class-list'),
        {'name': 'Hacker Grade', 'sequence_order': 99},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert create_res.status_code == 401

    # 4. Delete data without credentials
    delete_res = client.delete(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert delete_res.status_code == 401

@pytest.mark.django_db
def test_regular_user_denied_modify_and_admin_routes(access_control_setup):
    """
    Scenario 3 & 4:
    Regular users (Students) are denied access to admin dashboards (403)
    and strictly blocked from adding, editing, or deleting project data (403).
    Verifies that direct/manually constructed HTTP requests are rejected.
    """
    client = APIClient()
    inst_id = str(access_control_setup['institution'].id)
    target_class = access_control_setup['school_class']
    class_id = str(target_class.id)

    # Login as Regular Student User
    login_res = client.post(reverse('auth-login'), {
        'email': 'student.sec@nexus.edu',
        'password': 'StudentSecurePass123!'
    }, format='json')
    assert login_res.status_code == 200
    assert login_res.data['data']['is_admin'] is False
    student_token = login_res.data['data']['tokens']['access']

    client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')

    # 1. Direct request to Admin Dashboard -> 403 Forbidden
    dash_res = client.get(reverse('institution-admin-dashboard'), HTTP_X_INSTITUTION_ID=inst_id)
    assert dash_res.status_code == 403

    # 2. Attempt Add Data (POST) -> 403 Forbidden
    create_res = client.post(
        reverse('school-class-list'),
        {'name': 'Unauthorized Grade 1', 'sequence_order': 1},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert create_res.status_code == 403

    # 3. Attempt Modify Data (PATCH) -> 403 Forbidden
    update_res = client.patch(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        {'name': 'Tampered Name'},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert update_res.status_code == 403

    # 4. Attempt Delete Data (DELETE) -> 403 Forbidden
    delete_res = client.delete(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert delete_res.status_code == 403

@pytest.mark.django_db
def test_unauthorized_requests_do_not_change_database(access_control_setup):
    """
    Scenario 5:
    Confirms that unauthorized requests fail without altering any database records.
    """
    client = APIClient()
    inst_id = str(access_control_setup['institution'].id)
    target_class = access_control_setup['school_class']
    class_id = str(target_class.id)

    client.force_authenticate(user=access_control_setup['student_user'])

    initial_count = SchoolClass.objects.count()
    original_name = target_class.name

    # 1. Failed Create attempt
    client.post(
        reverse('school-class-list'),
        {'name': 'Ghost Class', 'sequence_order': 99},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert SchoolClass.objects.count() == initial_count

    # 2. Failed Update attempt
    client.patch(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        {'name': 'Hacked Class Name'},
        format='json',
        HTTP_X_INSTITUTION_ID=inst_id
    )
    target_class.refresh_from_db()
    assert target_class.name == original_name

    # 3. Failed Delete attempt
    client.delete(
        reverse('school-class-detail', kwargs={'pk': class_id}),
        HTTP_X_INSTITUTION_ID=inst_id
    )
    assert SchoolClass.objects.filter(id=class_id).exists()

@pytest.mark.django_db
def test_secure_logout_workflow(access_control_setup):
    """
    Scenario 6:
    Verifies secure logout endpoint properly terminates user session.
    """
    client = APIClient()
    client.force_authenticate(user=access_control_setup['admin_user'])

    logout_res = client.post(reverse('auth-logout'), {}, format='json')
    assert logout_res.status_code == 200
    assert logout_res.data['success'] is True

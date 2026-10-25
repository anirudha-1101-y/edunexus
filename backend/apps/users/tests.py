import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership, Role, Permission

@pytest.fixture
def test_setup():
    # 1. Create Organization
    org = Organization.objects.create(
        name="Apex Educational Trust",
        slug="apex-trust",
        billing_email="billing@apex.edu"
    )

    # 2. Create Two Distinct Institutions (School and College)
    school = Institution.objects.create(
        organization=org,
        name="Apex Model High School",
        code="APEX-SCH",
        institution_type="SCHOOL",
        currency_code="USD"
    )

    college = Institution.objects.create(
        organization=org,
        name="Apex Institute of Technology",
        code="APEX-TECH",
        institution_type="COLLEGE",
        currency_code="USD"
    )

    # 3. Create a User
    user = User.objects.create_user(
        email="teacher@apex.edu",
        password="SecurePassword123!",
        first_name="Jane",
        last_name="Doe"
    )

    # 4. Create Role and Permissions
    perm = Permission.objects.create(
        id="students:view",
        category="STUDENTS",
        description="View student directory"
    )
    role = Role.objects.create(
        institution=school,
        name="Teacher",
        code="TEACHER"
    )
    role.permissions.add(perm)

    # 5. Add Membership ONLY to School
    membership = InstitutionMembership.objects.create(
        institution=school,
        user=user,
        membership_type="FACULTY",
        identification_number="EMP-001",
        status="ACTIVE"
    )
    membership.roles.add(role)

    return {
        'org': org,
        'school': school,
        'college': college,
        'user': user,
        'membership': membership
    }

@pytest.mark.django_db
def test_login_success(test_setup):
    client = APIClient()
    url = reverse('auth-login')

    response = client.post(url, {
        'email': 'teacher@apex.edu',
        'password': 'SecurePassword123!'
    }, format='json')

    assert response.status_code == 200
    assert response.data['success'] is True
    assert 'tokens' in response.data['data']
    assert 'access' in response.data['data']['tokens']
    assert len(response.data['data']['memberships']) == 1
    assert response.data['data']['memberships'][0]['institution']['code'] == 'APEX-SCH'

@pytest.mark.django_db
def test_login_invalid_password(test_setup):
    client = APIClient()
    url = reverse('auth-login')

    response = client.post(url, {
        'email': 'teacher@apex.edu',
        'password': 'WrongPassword!'
    }, format='json')

    assert response.status_code == 400
    assert response.data['success'] is False
    assert response.data['error']['code'] == 'VALIDATION_ERROR'

@pytest.mark.django_db
def test_tenant_access_and_isolation(test_setup):
    client = APIClient()

    # 1. Login to get token
    login_res = client.post(reverse('auth-login'), {
        'email': 'teacher@apex.edu',
        'password': 'SecurePassword123!'
    }, format='json')
    token = login_res.data['data']['tokens']['access']

    # 2. Access authorized institution endpoint
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    school_id = str(test_setup['school'].id)
    college_id = str(test_setup['college'].id)

    # Access school endpoint with X-Institution-ID
    res_school = client.get(reverse('institution-current'), HTTP_X_INSTITUTION_ID=school_id)
    assert res_school.status_code == 200
    assert res_school.data['data']['code'] == 'APEX-SCH'

    # 3. Attempt to access unauthorized college endpoint (Data Isolation Test)
    res_college = client.get(reverse('institution-current'), HTTP_X_INSTITUTION_ID=college_id)
    assert res_college.status_code == 403
    assert res_college.data['success'] is False

@pytest.mark.django_db
def test_switch_institution_rejected_for_unauthorized_tenant(test_setup):
    client = APIClient()
    login_res = client.post(reverse('auth-login'), {
        'email': 'teacher@apex.edu',
        'password': 'SecurePassword123!'
    }, format='json')
    token = login_res.data['data']['tokens']['access']

    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    college_id = str(test_setup['college'].id)

    # Attempt switch to college where user has no membership
    switch_res = client.post(reverse('auth-switch-institution'), {
        'institution_id': college_id
    }, format='json')

    assert switch_res.status_code == 400
    assert switch_res.data['success'] is False

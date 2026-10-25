import json
import urllib.request
import urllib.error

BASE_URL = 'http://localhost:8000/api/v1'

def api_request(path, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    req_body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=req_body, method=method)
    req.add_header('Content-Type', 'application/json')
    for k, v in headers.items():
        req.add_header(k, v)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body_raw = resp.read().decode('utf-8')
            parsed = json.loads(body_raw) if body_raw else None
            return status, parsed
    except urllib.error.HTTPError as e:
        body_raw = e.read().decode('utf-8')
        try:
            parsed = json.loads(body_raw)
        except Exception:
            parsed = body_raw
        return e.code, parsed

print('=== 1. TEST ADMIN AUTHENTICATION ===')
status, res = api_request('/auth/login/', method='POST', data={
    'email': 'admin@edunexus.org',
    'password': 'AdminPass123!'
})
assert status == 200, f"Admin login failed: {res}"
admin_data = res['data']
admin_token = admin_data['tokens']['access']
admin_refresh = admin_data['tokens']['refresh']
active_inst = admin_data['active_institution_id']
print(f"Admin login HTTP {status}. is_admin: {admin_data.get('is_admin')}, active_institution: {active_inst}")

admin_headers = {
    'Authorization': f'Bearer {admin_token}',
    'X-Institution-ID': active_inst,
}

print('\n=== 2. TEST ADMIN CRUD PERMISSIONS (CREATING GRADE 11) ===')
status, created_class = api_request('/academics/school/classes/', method='POST', data={
    'name': 'Grade 11',
    'sequence_order': 11
}, headers=admin_headers)
print(f"Create Class HTTP {status}")
assert status == 201, f"Admin failed to create: {created_class}"
class_id = created_class['id']
print(f"Created Class ID: {class_id}, Name: {created_class['name']}")

# Admin Update
status, updated_class = api_request(f'/academics/school/classes/{class_id}/', method='PATCH', data={
    'name': 'Grade 11 - Honors'
}, headers=admin_headers)
print(f"Update Class HTTP {status}")
assert status == 200, f"Admin failed to update: {updated_class}"
assert updated_class['name'] == 'Grade 11 - Honors'
print(f"Updated Class name confirmed: {updated_class['name']}")

print('\n=== 3. TEST UNAUTHENTICATED REQUEST BLOCKING (HTTP 401) ===')
status, unauth_res = api_request('/academics/school/classes/', method='POST', data={
    'name': 'Hacker Class',
    'sequence_order': 99
})
print(f"Unauthenticated POST HTTP {status}")
assert status == 401, f"Expected 401, got {status}"
print(f"Confirmed: Unauthenticated request strictly blocked with HTTP 401: {unauth_res.get('detail')}")

print('\n=== 4. TEST NON-ADMIN REGULAR USER DENIAL (HTTP 403) ===')
status, res_student = api_request('/auth/login/', method='POST', data={
    'email': 'student@apex.edu',
    'password': 'StudentPass123!'
})
assert status == 200, f"Student login failed: {res_student}"
student_data = res_student['data']
student_token = student_data['tokens']['access']
print(f"Student login HTTP {status}. is_admin: {student_data.get('is_admin')}")

student_headers = {
    'Authorization': f'Bearer {student_token}',
    'X-Institution-ID': active_inst,
}

# Student Read-only check (Allowed)
status, read_res = api_request('/academics/school/classes/', method='GET', headers=student_headers)
print(f"Student GET classes HTTP {status}")
assert status == 200, f"Student read failed: {read_res}"
print(f"Student read-only access confirmed: retrieved {len(read_res)} classes.")

# Student Write check (Blocked with 403)
status, student_post_res = api_request('/academics/school/classes/', method='POST', data={
    'name': 'Illegal Class',
    'sequence_order': 99
}, headers=student_headers)
print(f"Student POST HTTP {status}")
assert status == 403, f"Expected 403, got {status}"
print(f"Student POST denied with detail: {student_post_res.get('detail')}")

# Student Delete check on Grade 11 (Blocked with 403)
status, student_del_res = api_request(f'/academics/school/classes/{class_id}/', method='DELETE', headers=student_headers)
print(f"Student DELETE HTTP {status}")
assert status == 403, f"Expected 403, got {status}"
print(f"Student DELETE denied with HTTP 403: {student_del_res.get('detail')}")

# Verify record in DB is intact
status, verify_res = api_request(f'/academics/school/classes/{class_id}/', method='GET', headers=admin_headers)
assert status == 200
assert verify_res['name'] == 'Grade 11 - Honors'
print('Confirmed: Grade 11 record in DB remains completely unchanged after unauthorized attack.')

print('\n=== 5. TEST ADMIN DELETE (CLEANUP) ===')
status, del_res = api_request(f'/academics/school/classes/{class_id}/', method='DELETE', headers=admin_headers)
print(f"Admin DELETE HTTP {status}")
assert status == 204, f"Admin delete failed with {status}"
print('Admin successfully deleted record (204 No Content).')

# Verify record is gone
status, verify_deleted = api_request(f'/academics/school/classes/{class_id}/', method='GET', headers=admin_headers)
assert status == 404
print('Confirmed: Record successfully removed from database after Admin DELETE.')

print('\n=== 6. TEST SECURE LOGOUT ===')
status, logout_res = api_request('/auth/logout/', method='POST', data={'refresh': admin_refresh}, headers=admin_headers)
print(f"Logout HTTP {status}: {logout_res.get('message')}")
assert status == 200

print('\n=== ALL LIVE END-TO-END SECURITY AND CRUD SCENARIOS PASSED WITH 100% SUCCESS! ===')

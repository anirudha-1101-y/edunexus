from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

def is_admin_user(user, institution_id=None):
    """
    Determines if the user possesses administrative privileges.
    Checks:
    1. Global platform admin, staff, or superuser status.
    2. Institutional Admin status via active membership type ('STAFF', 'ADMIN')
       or assigned administrative roles ('ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL', 'DEAN', etc.).
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or user.is_staff or getattr(user, 'is_platform_admin', False):
        return True

    # If an institution context is present, check tenant-specific membership
    if institution_id:
        membership = user.memberships.filter(
            institution_id=institution_id,
            status='ACTIVE'
        ).prefetch_related('roles__permissions').first()

        if not membership:
            return False

        if membership.membership_type in ('STAFF', 'ADMIN'):
            return True

        admin_identifiers = {'ADMIN', 'INSTITUTION_ADMIN', 'ADMINISTRATOR', 'PRINCIPAL', 'DEAN', 'DIRECTOR'}
        for role in membership.roles.all():
            role_code = (role.code or '').upper()
            role_name = (role.name or '').upper()
            if role_code in admin_identifiers or role_name in admin_identifiers:
                return True
            if role.permissions.filter(id__in=['admin:access', 'all:manage', 'data:manage', 'data:modify']).exists():
                return True

        return False

    # If no institution_id is in request, check if user is staff/admin in any active membership
    return user.memberships.filter(
        status='ACTIVE',
        membership_type__in=('STAFF', 'ADMIN')
    ).exists()

class IsTenantMember(permissions.BasePermission):
    """
    Ensures that the authenticated user has an active membership
    in the institution specified in the request context.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_platform_admin or request.user.is_superuser:
            return True

        institution_id = getattr(request, 'institution_id', None)
        if not institution_id:
            return False

        return request.user.memberships.filter(
            institution_id=institution_id,
            status='ACTIVE'
        ).exists()

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Strict Admin-Only Access Control:
    - SAFE_METHODS (GET, HEAD, OPTIONS) are allowed for authenticated tenant members.
    - Write methods (POST, PUT, PATCH, DELETE) strictly require Administrator privileges.
    Non-admin users attempting to add, modify, or delete data receive HTTP 403 Forbidden.
    """
    message = "Administrator privileges are required to create, update, or delete data."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read requests are allowed for active tenant members
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write requests strictly require Admin privileges
        institution_id = getattr(request, 'institution_id', None)
        if is_admin_user(request.user, institution_id):
            return True

        raise PermissionDenied(self.message)

class IsInstitutionAdmin(permissions.BasePermission):
    """
    Strict Admin-Only Resource Access:
    Restricts all operations (both read and write) exclusively to authorized administrators.
    Non-admin users attempting to access these resources receive HTTP 403 Forbidden.
    Unauthenticated users receive HTTP 401 Unauthorized.
    """
    message = "Administrator privileges are required to access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        institution_id = getattr(request, 'institution_id', None)
        if is_admin_user(request.user, institution_id):
            return True

        raise PermissionDenied(self.message)

class HasInstitutionPermission(permissions.BasePermission):
    """
    Checks if the user has the required permission code within their active institution.
    """
    required_permission = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_platform_admin or request.user.is_superuser:
            return True

        institution_id = getattr(request, 'institution_id', None)
        if not institution_id:
            return False

        required_perm = getattr(view, 'required_permission', self.required_permission)
        if not required_perm:
            return True

        membership = request.user.memberships.filter(
            institution_id=institution_id,
            status='ACTIVE'
        ).first()

        if not membership:
            return False

        return membership.roles.filter(
            permissions__id=required_perm
        ).exists()

import uuid
from django.db import connection
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

class TenantSecurityMiddleware(MiddlewareMixin):
    """
    Extracts institution context from request and configures
    PostgreSQL session-local setting for Row-Level Security (RLS).
    """

    def process_request(self, request):
        request.institution_id = None

        # 1. Check direct header
        header_tenant = request.META.get('HTTP_X_INSTITUTION_ID')
        if header_tenant:
            try:
                request.institution_id = str(uuid.UUID(header_tenant))
            except (ValueError, TypeError):
                pass

        # 2. Check JWT Authorization header if not found in X-Institution-ID
        if not request.institution_id:
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                try:
                    jwt_authenticator = JWTAuthentication()
                    raw_token = auth_header.split(' ')[1]
                    validated_token = jwt_authenticator.get_validated_token(raw_token)
                    token_institution = validated_token.get('institution_id')
                    if token_institution:
                        request.institution_id = str(uuid.UUID(str(token_institution)))
                except Exception:
                    pass

        # 3. If institution_id is present, set PostgreSQL session variable for RLS
        if request.institution_id:
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SET LOCAL app.current_institution_id = %s;",
                        [request.institution_id]
                    )
            except Exception:
                # If database connection is not active or tables not migrated yet, continue
                pass

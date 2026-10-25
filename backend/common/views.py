from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint verifying database connectivity and system status.
    """
    db_ok = True
    db_message = "Connected"
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
    except Exception as e:
        db_ok = False
        db_message = str(e)

    status_code = 200 if db_ok else 503
    return Response({
        'status': 'healthy' if db_ok else 'unhealthy',
        'database': {
            'status': 'ok' if db_ok else 'error',
            'detail': db_message
        },
        'timestamp': timezone.now().isoformat()
    }, status=status_code)

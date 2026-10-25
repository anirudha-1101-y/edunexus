import logging
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404
from django.utils import timezone
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Centralized DRF exception handler providing consistent response envelope.
    """
    # Call DRF's default exception handler first to get standard response
    response = exception_handler(exc, context)

    # Handle standard Django exceptions that DRF doesn't catch by default
    if response is None:
        if isinstance(exc, Http404):
            exc = exceptions.NotFound()
            response = Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        elif isinstance(exc, PermissionDenied):
            exc = exceptions.PermissionDenied()
            response = Response({'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        elif isinstance(exc, DjangoValidationError):
            detail = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
            exc = exceptions.ValidationError(detail=detail)
            response = Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        else:
            logger.exception("Unhandled server exception: %s", exc)
            return Response({
                'success': False,
                'data': None,
                'error': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'message': 'An unexpected error occurred. Please contact system support.',
                    'field_errors': {}
                },
                'meta': {
                    'timestamp': timezone.now().isoformat()
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Build standardized error payload
    field_errors = {}
    error_code = 'CLIENT_ERROR'
    message = 'An error occurred processing your request.'

    if isinstance(exc, exceptions.ValidationError):
        error_code = 'VALIDATION_ERROR'
        message = 'Validation failed for one or more fields.'
        if isinstance(response.data, dict):
            field_errors = response.data
        elif isinstance(response.data, list):
            field_errors = {'non_field_errors': response.data}
    elif isinstance(exc, exceptions.AuthenticationFailed):
        error_code = 'AUTHENTICATION_FAILED'
        message = str(response.data.get('detail', 'Authentication credentials were not provided or invalid.'))
    elif isinstance(exc, exceptions.NotAuthenticated):
        error_code = 'NOT_AUTHENTICATED'
        message = 'Authentication credentials were not provided.'
    elif isinstance(exc, exceptions.PermissionDenied):
        error_code = 'PERMISSION_DENIED'
        message = 'You do not have permission to perform this action.'
    elif isinstance(exc, exceptions.NotFound):
        error_code = 'NOT_FOUND'
        message = str(response.data.get('detail', 'The requested resource was not found.'))
    elif isinstance(exc, exceptions.MethodNotAllowed):
        error_code = 'METHOD_NOT_ALLOWED'
        message = str(response.data.get('detail', f'Method "{context["request"].method}" not allowed.'))
    elif 'detail' in response.data:
        message = str(response.data['detail'])

    return Response({
        'success': False,
        'data': None,
        'error': {
            'code': error_code,
            'message': message,
            'field_errors': field_errors
        },
        'meta': {
            'timestamp': timezone.now().isoformat()
        }
    }, status=response.status_code)

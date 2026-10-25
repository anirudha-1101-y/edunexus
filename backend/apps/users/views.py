from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from common.permissions import is_admin_user
from apps.users.serializers import (
    LoginSerializer,
    SwitchInstitutionSerializer,
    UserSerializer,
    InstitutionMembershipSerializer
)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticates user and returns JWT access/refresh tokens with membership contexts."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    validated_data = serializer.validated_data

    user = validated_data['user']
    memberships = validated_data['memberships']
    active_inst_id = validated_data['active_institution_id']

    return Response({
        'success': True,
        'data': {
            'user': UserSerializer(user).data,
            'tokens': {
                'access': validated_data['access'],
                'refresh': validated_data['refresh']
            },
            'active_institution_id': active_inst_id,
            'is_admin': is_admin_user(user, active_inst_id),
            'memberships': InstitutionMembershipSerializer(memberships, many=True).data
        },
        'error': None
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Terminates session securely.
    Optionally blacklists refresh token if provided.
    """
    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass

    return Response({
        'success': True,
        'message': 'Logged out successfully.'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def switch_institution_view(request):
    """Switches the active institution context and reissues an institution-scoped JWT."""
    serializer = SwitchInstitutionSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    validated_data = serializer.validated_data

    inst_id = validated_data['institution_id']

    return Response({
        'success': True,
        'data': {
            'tokens': {
                'access': validated_data['access'],
                'refresh': validated_data['refresh']
            },
            'institution_id': inst_id,
            'membership_type': validated_data['membership_type'],
            'is_admin': is_admin_user(request.user, inst_id),
            'permissions': validated_data['permissions']
        },
        'error': None
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """Returns currently authenticated user profile, active memberships, and admin privilege status."""
    memberships = request.user.memberships.filter(status='ACTIVE').select_related('institution')
    active_inst_id = getattr(request, 'institution_id', None)
    return Response({
        'success': True,
        'data': {
            'user': UserSerializer(request.user).data,
            'active_institution_id': active_inst_id,
            'is_admin': is_admin_user(request.user, active_inst_id),
            'memberships': InstitutionMembershipSerializer(memberships, many=True).data
        },
        'error': None
    })

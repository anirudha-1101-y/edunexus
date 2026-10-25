from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User, InstitutionMembership, Role, Permission
from apps.institutions.serializers import InstitutionSerializer

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone_number', 'is_platform_admin', 'is_staff', 'is_superuser']

class MembershipRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'code']

class InstitutionMembershipSerializer(serializers.ModelSerializer):
    institution = InstitutionSerializer(read_only=True)
    roles = MembershipRoleSerializer(many=True, read_only=True)

    class Meta:
        model = InstitutionMembership
        fields = ['id', 'institution', 'membership_type', 'identification_number', 'status', 'roles']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email').lower().strip()
        password = attrs.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('Account is suspended or inactive.')

        # Retrieve user's memberships
        memberships = user.memberships.filter(status='ACTIVE').select_related('institution')
        active_membership = memberships.first()
        active_institution_id = str(active_membership.institution_id) if active_membership else None

        # Generate JWT tokens with claims
        refresh = RefreshToken.for_user(user)
        if active_institution_id:
            refresh['institution_id'] = active_institution_id

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'active_institution_id': active_institution_id,
            'memberships': memberships
        }

class SwitchInstitutionSerializer(serializers.Serializer):
    institution_id = serializers.UUIDField()

    def validate(self, attrs):
        user = self.context['request'].user
        institution_id = attrs.get('institution_id')

        membership = user.memberships.filter(
            institution_id=institution_id,
            status='ACTIVE'
        ).select_related('institution').prefetch_related('roles__permissions').first()

        if not membership and not user.is_platform_admin:
            raise serializers.ValidationError('You do not have an active membership in this institution.')

        # Issue new token scoped to the selected institution
        refresh = RefreshToken.for_user(user)
        refresh['institution_id'] = str(institution_id)

        # Collect permissions
        permissions = set()
        if membership:
            for role in membership.roles.all():
                for perm in role.permissions.all():
                    permissions.add(perm.id)

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'institution_id': str(institution_id),
            'membership_type': membership.membership_type if membership else 'PLATFORM_ADMIN',
            'permissions': list(permissions)
        }

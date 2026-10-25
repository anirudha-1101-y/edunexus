from rest_framework import serializers
from apps.institutions.models import Organization, Institution

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'billing_email', 'created_at']

class InstitutionSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Institution
        fields = [
            'id', 'organization', 'organization_name', 'name', 'code',
            'institution_type', 'timezone', 'currency_code', 'is_active',
            'settings', 'created_at'
        ]

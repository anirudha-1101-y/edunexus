from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.institutions.models import Institution
from apps.institutions.serializers import InstitutionSerializer
from apps.students.models import StudentProfile
from apps.users.models import InstitutionMembership
from apps.academics.models import SchoolClass, CollegeDepartment
from apps.finance.models import Invoice
from common.permissions import IsTenantMember, IsInstitutionAdmin

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantMember])
def current_institution_view(request):
    """Returns the details and configuration of the active institution tenant."""
    institution = Institution.objects.select_related('organization').get(id=request.institution_id)
    return Response({
        'success': True,
        'data': InstitutionSerializer(institution).data,
        'error': None
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantMember, IsInstitutionAdmin])
def admin_dashboard_view(request):
    """
    Protected Admin Dashboard Endpoint:
    Strictly restricted to authorized administrators via IsInstitutionAdmin permission.
    Returns confidential institutional metrics, enrolled counts, staff directory size, and fiscal balance.
    """
    institution_id = request.institution_id
    institution = Institution.objects.select_related('organization').get(id=institution_id)

    total_students = StudentProfile.objects.filter(institution_id=institution_id).count()
    total_staff = InstitutionMembership.objects.filter(
        institution_id=institution_id,
        membership_type='STAFF',
        status='ACTIVE'
    ).count()

    total_classes = SchoolClass.objects.filter(institution_id=institution_id).count()
    total_depts = CollegeDepartment.objects.filter(institution_id=institution_id).count()

    invoices = Invoice.objects.filter(institution_id=institution_id)
    total_invoiced = sum(inv.total_amount for inv in invoices)
    total_collected = sum(inv.paid_amount for inv in invoices)
    collection_rate = (total_collected / total_invoiced * 100) if total_invoiced > 0 else 0.0

    return Response({
        'success': True,
        'data': {
            'institution_name': institution.name,
            'institution_type': institution.institution_type,
            'metrics': {
                'total_students': total_students,
                'total_staff': total_staff,
                'academic_units': total_classes + total_depts,
                'total_invoiced_cents': total_invoiced,
                'total_collected_cents': total_collected,
                'collection_rate_percent': round(collection_rate, 2),
                'rls_enforced': True
            }
        },
        'error': None
    })

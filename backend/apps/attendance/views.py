from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.permissions import IsTenantMember
from apps.attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from apps.attendance.serializers import (
    AttendanceSessionSerializer,
    AttendanceRecordSerializer,
    BatchAttendanceSubmissionSerializer,
    AttendanceCorrectionSerializer
)

class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """
    Manages roll call sessions, bulk submission, locking, and audit-trailed corrections.
    """
    permission_classes = [IsAuthenticated, IsTenantMember]
    serializer_class = AttendanceSessionSerializer

    def get_queryset(self):
        return AttendanceSession.objects.filter(
            institution_id=self.request.institution_id
        ).select_related(
            'school_section__school_class',
            'college_course',
            'taken_by__user'
        )

    def perform_create(self, serializer):
        institution_id = self.request.institution_id
        taken_by = serializer.validated_data.get('taken_by')
        if not taken_by:
            # Default to the requesting user's active membership in this institution
            membership = self.request.user.memberships.filter(
                institution_id=institution_id,
                status='ACTIVE'
            ).first()
            if not membership:
                raise ValidationError("No active membership found for the user in this institution.")
            serializer.save(institution_id=institution_id, taken_by=membership)
        else:
            serializer.save(institution_id=institution_id)

    @action(detail=True, methods=['post'], url_path='submit-roll-call')
    def submit_roll_call(self, request, pk=None):
        """
        Atomically records attendance marks for students in this session.
        """
        session = self.get_object()

        if session.is_locked:
            raise ValidationError("This attendance session is locked. Use the correction endpoint with a reason.")

        serializer = BatchAttendanceSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        records_data = serializer.validated_data['records']

        created_or_updated = 0
        with transaction.atomic():
            for item in records_data:
                record, created = AttendanceRecord.objects.update_or_create(
                    institution_id=request.institution_id,
                    session=session,
                    student_id=item['student_id'],
                    defaults={
                        'status': item['status'],
                        'remarks': item.get('remarks', '')
                    }
                )
                created_or_updated += 1

        return Response({
            'success': True,
            'message': f"Successfully recorded attendance for {created_or_updated} students.",
            'records_count': created_or_updated
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='lock')
    def lock_session(self, request, pk=None):
        """
        Locks the attendance session to prevent further un-audited modifications.
        """
        session = self.get_object()
        session.is_locked = True
        session.save(update_fields=['is_locked', 'updated_at'])

        return Response({
            'success': True,
            'message': "Attendance session locked successfully.",
            'is_locked': True
        })

    @action(detail=True, methods=['post'], url_path='correct')
    def correct_record(self, request, pk=None):
        """
        Corrects an attendance record post-locking, appending an immutable audit trail.
        """
        session = self.get_object()
        record_id = request.data.get('record_id')

        if not record_id:
            raise ValidationError({'record_id': 'Record ID is required.'})

        try:
            record = AttendanceRecord.objects.get(
                id=record_id,
                session=session,
                institution_id=request.institution_id
            )
        except AttendanceRecord.DoesNotExist:
            raise ValidationError({'record_id': 'Attendance record not found in this session.'})

        serializer = AttendanceCorrectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['new_status']
        reason = serializer.validated_data['reason']

        # Determine user's membership for audit logging
        membership = request.user.memberships.filter(
            institution_id=request.institution_id,
            status='ACTIVE'
        ).first()

        if not membership:
            raise ValidationError("Active institution membership required to correct attendance.")

        with transaction.atomic():
            prev_status = record.status
            record.status = new_status
            record.save(update_fields=['status', 'updated_at'])

            # Create immutable audit log
            AttendanceAuditLog.objects.create(
                attendance_record=record,
                previous_status=prev_status,
                new_status=new_status,
                modified_by=membership,
                reason=reason
            )

        return Response({
            'success': True,
            'message': f"Record updated from {prev_status} to {new_status}.",
            'record': AttendanceRecordSerializer(record).data
        })

    @action(detail=True, methods=['get'], url_path='records')
    def list_records(self, request, pk=None):
        """
        Returns all student attendance records for this session.
        """
        session = self.get_object()
        records = session.records.select_related('student__membership__user').all()
        return Response({
            'success': True,
            'data': AttendanceRecordSerializer(records, many=True).data
        })

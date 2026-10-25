from rest_framework import serializers
from apps.attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog

class AttendanceAuditLogSerializer(serializers.ModelSerializer):
    modified_by_name = serializers.CharField(source='modified_by.user.full_name', read_only=True)

    class Meta:
        model = AttendanceAuditLog
        fields = [
            'id', 'attendance_record', 'previous_status', 'new_status',
            'modified_by', 'modified_by_name', 'reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    audit_logs = AttendanceAuditLogSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'institution', 'session', 'student', 'student_name',
            'admission_number', 'status', 'remarks', 'audit_logs', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class AttendanceSessionSerializer(serializers.ModelSerializer):
    taken_by_name = serializers.CharField(source='taken_by.user.full_name', read_only=True)
    target_name = serializers.SerializerMethodField()
    records_count = serializers.IntegerField(source='records.count', read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'institution', 'session_date', 'session_type',
            'school_section', 'college_course', 'target_name',
            'period_slot', 'taken_by', 'taken_by_name',
            'is_locked', 'records_count', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']
        extra_kwargs = {
            'taken_by': {'required': False}
        }

    def get_target_name(self, obj):
        if obj.school_section:
            return f"{obj.school_section.school_class.name} - {obj.school_section.name}"
        if obj.college_course:
            return f"{obj.college_course.course_code} ({obj.college_course.title})"
        return None

class StudentStatusItemSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES, default='PRESENT')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')

class BatchAttendanceSubmissionSerializer(serializers.Serializer):
    records = StudentStatusItemSerializer(many=True)

class AttendanceCorrectionSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES)
    reason = serializers.CharField(min_length=5)

from rest_framework import serializers
from apps.academics.models import (
    AcademicYear, AcademicTerm,
    SchoolClass, SchoolSection,
    CollegeDepartment, CollegeProgram, CollegeCourse
)

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'institution', 'name', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

    def validate(self, attrs):
        start_date = attrs.get('start_date') or (self.instance.start_date if self.instance else None)
        end_date = attrs.get('end_date') or (self.instance.end_date if self.instance else None)
        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
        return attrs

class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ['id', 'institution', 'academic_year', 'name', 'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class SchoolSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolSection
        fields = ['id', 'institution', 'school_class', 'name', 'room_number', 'class_teacher', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class SchoolClassSerializer(serializers.ModelSerializer):
    sections = SchoolSectionSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolClass
        fields = ['id', 'institution', 'name', 'sequence_order', 'sections', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class CollegeDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollegeDepartment
        fields = ['id', 'institution', 'name', 'code', 'head_of_department', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class CollegeProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = CollegeProgram
        fields = [
            'id', 'institution', 'department', 'department_name', 'name', 'code',
            'duration_semesters', 'total_credits_required', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class CollegeCourseSerializer(serializers.ModelSerializer):
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = CollegeCourse
        fields = [
            'id', 'institution', 'department', 'department_code', 'course_code',
            'title', 'lecture_credits', 'tutorial_credits', 'practical_credits',
            'total_credits', 'is_elective', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

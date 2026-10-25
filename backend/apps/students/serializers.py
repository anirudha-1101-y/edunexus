from rest_framework import serializers
from apps.students.models import StudentProfile, SchoolEnrollment, CollegeCourseRegistration
from apps.users.serializers import UserSerializer

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(source='membership.user', read_only=True)
    identification_number = serializers.CharField(source='membership.identification_number', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'institution', 'membership', 'user', 'identification_number',
            'admission_number', 'admission_date', 'date_of_birth', 'gender',
            'blood_group', 'residential_address', 'emergency_contact_name',
            'emergency_contact_phone', 'current_status', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class SchoolEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    class_name = serializers.CharField(source='section.school_class.name', read_only=True)

    class Meta:
        model = SchoolEnrollment
        fields = [
            'id', 'institution', 'student', 'student_name', 'admission_number',
            'academic_year', 'section', 'class_name', 'section_name', 'roll_number',
            'enrollment_status', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class CollegeCourseRegistrationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    total_credits = serializers.DecimalField(source='course.total_credits', max_digits=4, decimal_places=2, read_only=True)

    class Meta:
        model = CollegeCourseRegistration
        fields = [
            'id', 'institution', 'student', 'student_name', 'admission_number',
            'academic_term', 'course', 'course_code', 'course_title', 'total_credits',
            'registration_type', 'registration_status', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

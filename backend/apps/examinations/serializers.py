from rest_framework import serializers
from apps.examinations.models import ExamGradingScale, GradingScaleTier, ExamAssessment, ExamStudentScore

class GradingScaleTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScaleTier
        fields = [
            'id', 'grading_scale', 'letter_grade', 'min_percentage',
            'max_percentage', 'grade_point', 'is_passing_grade'
        ]
        read_only_fields = ['id']

class ExamGradingScaleSerializer(serializers.ModelSerializer):
    tiers = GradingScaleTierSerializer(many=True, read_only=True)

    class Meta:
        model = ExamGradingScale
        fields = [
            'id', 'institution', 'name', 'scale_type', 'is_default', 'tiers', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class ExamStudentScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    evaluator_name = serializers.CharField(source='evaluator.user.full_name', read_only=True)

    class Meta:
        model = ExamStudentScore
        fields = [
            'id', 'institution', 'assessment', 'student', 'student_name',
            'admission_number', 'marks_obtained', 'is_absent',
            'grade_point_awarded', 'letter_grade_awarded',
            'evaluator', 'evaluator_name', 'evaluated_at'
        ]
        read_only_fields = ['id', 'institution', 'evaluated_at']
        extra_kwargs = {
            'evaluator': {'required': False}
        }

class ExamAssessmentSerializer(serializers.ModelSerializer):
    target_name = serializers.SerializerMethodField()
    scores_count = serializers.IntegerField(source='scores.count', read_only=True)

    class Meta:
        model = ExamAssessment
        fields = [
            'id', 'institution', 'academic_term', 'name', 'assessment_type',
            'school_section', 'college_course', 'target_name',
            'grading_scale', 'max_marks', 'pass_marks', 'weightage_percentage',
            'status', 'scores_count', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

    def get_target_name(self, obj):
        if obj.school_section:
            return f"{obj.school_section.school_class.name} - {obj.school_section.name}"
        if obj.college_course:
            return f"{obj.college_course.course_code} ({obj.college_course.title})"
        return None

class StudentMarkItemSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    marks_obtained = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)
    is_absent = serializers.BooleanField(default=False)

class BatchMarksEntrySerializer(serializers.Serializer):
    scores = StudentMarkItemSerializer(many=True)

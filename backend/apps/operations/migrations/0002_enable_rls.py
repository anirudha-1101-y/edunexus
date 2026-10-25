from django.db import migrations

TENANT_TABLES = [
    'roles',
    'institution_memberships',
    'academic_years',
    'academic_terms',
    'school_classes',
    'school_sections',
    'college_departments',
    'college_programs',
    'college_courses',
    'student_profiles',
    'school_enrollments',
    'college_course_registrations',
    'attendance_sessions',
    'attendance_records',
    'exam_grading_scales',
    'exam_assessments',
    'exam_student_scores',
    'fee_structures',
    'invoices',
    'payments',
    'rooms',
    'time_slots',
    'timetable_slots',
    'books',
    'book_issues',
    'transport_routes',
    'student_transport_assignments',
    'announcements',
]

def generate_forward_sql():
    sql_statements = []
    for table in TENANT_TABLES:
        sql_statements.append(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        sql_statements.append(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {table};")
        sql_statements.append(f"""
            CREATE POLICY tenant_isolation_policy ON {table}
            FOR ALL
            USING (
                CASE
                    WHEN current_setting('app.current_institution_id', true) IS NULL
                         OR current_setting('app.current_institution_id', true) = '' THEN TRUE
                    ELSE institution_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
                END
            )
            WITH CHECK (
                CASE
                    WHEN current_setting('app.current_institution_id', true) IS NULL
                         OR current_setting('app.current_institution_id', true) = '' THEN TRUE
                    ELSE institution_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
                END
            );
        """)
    return "\n".join(sql_statements)

def generate_backward_sql():
    sql_statements = []
    for table in TENANT_TABLES:
        sql_statements.append(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {table};")
        sql_statements.append(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
    return "\n".join(sql_statements)

class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0001_initial'),
        ('users', '0001_initial'),
        ('academics', '0001_initial'),
        ('students', '0001_initial'),
        ('attendance', '0001_initial'),
        ('examinations', '0001_initial'),
        ('finance', '0001_initial'),
        ('operations', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=generate_forward_sql(),
            reverse_sql=generate_backward_sql(),
        ),
    ]

import pytest
from django.db import connection, transaction
from apps.institutions.models import Organization, Institution
from apps.academics.models import AcademicYear

@pytest.mark.django_db(transaction=True)
def test_postgresql_row_level_security_gate_two_isolation():
    """
    Penetration Test:
    Verifies that PostgreSQL Row-Level Security (RLS) restricts
    queries for application roles when 'app.current_institution_id' is set.
    """
    org = Organization.objects.create(name='Global Edu Trust')
    inst_a = Institution.objects.create(organization=org, name='Tenant A Alpha High School', code='ALPHA')
    inst_b = Institution.objects.create(organization=org, name='Tenant B Beta College', code='BETA')

    # Seed an academic year for Tenant A and Tenant B
    year_a = AcademicYear.objects.create(
        institution=inst_a,
        name='Alpha 2025-2026',
        start_date='2025-06-01',
        end_date='2026-05-31',
    )
    year_b = AcademicYear.objects.create(
        institution=inst_b,
        name='Beta 2025-2026',
        start_date='2025-06-01',
        end_date='2026-05-31',
    )

    with connection.cursor() as cursor:
        try:
            # Create a non-superuser test application role
            cursor.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'edunexus_test_app') THEN
                        CREATE ROLE edunexus_test_app NOSUPERUSER;
                    END IF;
                END
                $$;
                GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO edunexus_test_app;
            """)

            # Switch to non-superuser application role
            cursor.execute("SET ROLE edunexus_test_app;")

            with transaction.atomic():
                # 1. Tenant A Session
                cursor.execute("SET LOCAL app.current_institution_id = %s;", [str(inst_a.id)])
                cursor.execute("SELECT id, name FROM academic_years;")
                rows = cursor.fetchall()
                row_names = [r[1] for r in rows]

                # Tenant A sees own data
                assert 'Alpha 2025-2026' in row_names
                # Gate 2: RLS blocks Tenant B data
                assert 'Beta 2025-2026' not in row_names

                # Direct lookup by ID must return 0 rows for other tenant
                cursor.execute("SELECT COUNT(*) FROM academic_years WHERE id = %s;", [str(year_b.id)])
                count = cursor.fetchone()[0]
                assert count == 0, "PostgreSQL RLS Gate 2 must block cross-tenant read by ID"

            with transaction.atomic():
                # 2. Switch to Tenant B Session
                cursor.execute("SET LOCAL app.current_institution_id = %s;", [str(inst_b.id)])
                cursor.execute("SELECT id, name FROM academic_years;")
                rows = cursor.fetchall()
                row_names = [r[1] for r in rows]

                assert 'Beta 2025-2026' in row_names
                assert 'Alpha 2025-2026' not in row_names

        finally:
            cursor.execute("RESET ROLE;")

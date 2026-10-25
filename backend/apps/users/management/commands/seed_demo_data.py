import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership, Role, Permission
from apps.academics.models import (
    AcademicYear, AcademicTerm, SchoolClass, SchoolSection,
    CollegeDepartment, CollegeProgram, CollegeCourse
)
from apps.students.models import StudentProfile, SchoolEnrollment
from apps.finance.models import FeeStructure, Invoice, InvoiceItem
from apps.operations.models import Book, Room, TimeSlot

class Command(BaseCommand):
    help = "Seeds initial demo data for EduNexus ERP (Admin, Teacher, Student accounts and academic records)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting EduNexus demonstration data seed...")

        # 1. Organization
        org, _ = Organization.objects.get_or_create(
            slug="apex-trust",
            defaults={
                "name": "Apex Educational Trust",
                "billing_email": "finance@apex.edu",
            }
        )

        # 2. Institution (School)
        institution, _ = Institution.objects.get_or_create(
            organization=org,
            code="APEX-SCH",
            defaults={
                "name": "Apex Model High School",
                "institution_type": "SCHOOL",
                "timezone": "UTC",
                "currency_code": "USD",
                "is_active": True,
            }
        )

        # 3. Permissions & Roles
        admin_perm_ids = [
            ("users:manage", "USERS", "Manage users and permissions"),
            ("students:manage", "STUDENTS", "Manage student profiles and admissions"),
            ("academics:manage", "ACADEMICS", "Manage classes, curricula, and courses"),
            ("finance:manage", "FINANCE", "Manage fee structures and invoices"),
            ("admin:access", "ADMIN", "Full administrative control"),
        ]
        perms = []
        for pid, cat, desc in admin_perm_ids:
            perm, _ = Permission.objects.get_or_create(id=pid, defaults={"category": cat, "description": desc})
            perms.append(perm)

        admin_role, _ = Role.objects.get_or_create(
            institution=institution,
            code="ADMIN",
            defaults={
                "name": "Institutional Administrator",
                "description": "Full administrative control over institutional data",
            }
        )
        admin_role.permissions.set(perms)

        faculty_role, _ = Role.objects.get_or_create(
            institution=institution,
            code="FACULTY",
            defaults={
                "name": "Academic Faculty",
                "description": "Instructor with roll call and grade entry permissions",
            }
        )

        # 4. Users
        # Admin User
        admin_user, admin_created = User.objects.get_or_create(
            email="admin@edunexus.org",
            defaults={
                "first_name": "Eleanor",
                "last_name": "Vance",
                "is_staff": True,
                "is_superuser": True,
                "is_platform_admin": True,
            }
        )
        if admin_created:
            admin_user.set_password("AdminPass123!")
            admin_user.save()

        admin_membership, _ = InstitutionMembership.objects.get_or_create(
            institution=institution,
            user=admin_user,
            defaults={
                "membership_type": "STAFF",
                "identification_number": "ADM-001",
                "status": "ACTIVE",
            }
        )
        admin_membership.roles.add(admin_role)

        # Faculty User
        faculty_user, faculty_created = User.objects.get_or_create(
            email="teacher@apex.edu",
            defaults={
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "is_staff": False,
            }
        )
        if faculty_created:
            faculty_user.set_password("TeacherPass123!")
            faculty_user.save()

        faculty_membership, _ = InstitutionMembership.objects.get_or_create(
            institution=institution,
            user=faculty_user,
            defaults={
                "membership_type": "FACULTY",
                "identification_number": "FAC-001",
                "status": "ACTIVE",
            }
        )
        faculty_membership.roles.add(faculty_role)

        # Student User
        student_user, student_created = User.objects.get_or_create(
            email="student@apex.edu",
            defaults={
                "first_name": "John",
                "last_name": "Doe",
                "is_staff": False,
            }
        )
        if student_created:
            student_user.set_password("StudentPass123!")
            student_user.save()

        student_membership, _ = InstitutionMembership.objects.get_or_create(
            institution=institution,
            user=student_user,
            defaults={
                "membership_type": "STUDENT",
                "identification_number": "STU-001",
                "status": "ACTIVE",
            }
        )

        # 5. Academics (School)
        acad_year, _ = AcademicYear.objects.get_or_create(
            institution=institution,
            name="2025-2026",
            defaults={
                "start_date": datetime.date(2025, 6, 1),
                "end_date": datetime.date(2026, 5, 31),
                "is_current": True,
            }
        )

        acad_term, _ = AcademicTerm.objects.get_or_create(
            institution=institution,
            academic_year=acad_year,
            name="Term 1",
            defaults={
                "start_date": datetime.date(2025, 6, 1),
                "end_date": datetime.date(2025, 10, 31),
                "is_active": True,
            }
        )

        school_class, _ = SchoolClass.objects.get_or_create(
            institution=institution,
            name="Grade 10",
            defaults={"sequence_order": 10}
        )

        section_a, _ = SchoolSection.objects.get_or_create(
            institution=institution,
            school_class=school_class,
            name="Section A",
            defaults={
                "room_number": "Room 101",
                "class_teacher": faculty_membership,
            }
        )

        # 6. Student Profile & Enrollment
        student_profile, _ = StudentProfile.objects.get_or_create(
            institution=institution,
            admission_number="ADM-2025-001",
            defaults={
                "membership": student_membership,
                "admission_date": datetime.date(2025, 6, 1),
                "date_of_birth": datetime.date(2009, 4, 15),
                "gender": "MALE",
                "blood_group": "O+",
                "residential_address": "123 Academic Way, Apex City",
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_phone": "+1-555-0199",
                "current_status": "ACTIVE",
            }
        )

        SchoolEnrollment.objects.get_or_create(
            institution=institution,
            student=student_profile,
            academic_year=acad_year,
            defaults={
                "section": section_a,
                "roll_number": 101,
                "enrollment_status": "ENROLLED",
            }
        )

        # 7. College Entities
        dept, _ = CollegeDepartment.objects.get_or_create(
            institution=institution,
            code="CSE",
            defaults={
                "name": "Computer Science & Engineering",
                "head_of_department": faculty_membership,
            }
        )

        program, _ = CollegeProgram.objects.get_or_create(
            institution=institution,
            code="BTECH-CSE",
            defaults={
                "department": dept,
                "name": "B.Tech Computer Science & Engineering",
                "duration_semesters": 8,
                "total_credits_required": 160.0,
            }
        )

        CollegeCourse.objects.get_or_create(
            institution=institution,
            department=dept,
            course_code="CS301",
            defaults={
                "title": "Database Systems Architecture",
                "lecture_credits": 3,
                "tutorial_credits": 0,
                "practical_credits": 1,
                "total_credits": 4.0,
            }
        )

        # 8. Finance (Fee Structure & Invoice)
        fee_struct, _ = FeeStructure.objects.get_or_create(
            institution=institution,
            academic_year=acad_year,
            name="Grade 10 Annual Tuition Schedule",
            defaults={
                "target_type": "SCHOOL_CLASS",
                "school_class": school_class,
                "total_amount": 150000,
            }
        )

        inv, inv_created = Invoice.objects.get_or_create(
            institution=institution,
            invoice_number="INV-2025-001",
            defaults={
                "student": student_profile,
                "issue_date": datetime.date(2025, 6, 1),
                "due_date": datetime.date(2025, 11, 15),
                "subtotal_amount": 150000,
                "total_amount": 150000,
                "paid_amount": 100000,
                "status": "PARTIALLY_PAID",
            }
        )
        if inv_created:
            InvoiceItem.objects.create(
                invoice=inv,
                fee_category="Annual Tuition Fee",
                amount=120000,
                allocated_amount=100000,
            )
            InvoiceItem.objects.create(
                invoice=inv,
                fee_category="Science Laboratory Fee",
                amount=30000,
                allocated_amount=0,
            )

        # 9. Operations (Books, Rooms)
        Book.objects.get_or_create(
            institution=institution,
            isbn="978-0133591620",
            defaults={
                "title": "Modern Operating Systems",
                "author": "Andrew S. Tanenbaum",
                "publisher": "Pearson",
                "total_copies": 5,
                "available_copies": 5,
            }
        )

        Room.objects.get_or_create(
            institution=institution,
            name="Lab 101",
            defaults={
                "room_type": "LABORATORY",
                "capacity": 45,
            }
        )

        self.stdout.write(self.style.SUCCESS("EduNexus demonstration data seeded successfully."))
        self.stdout.write(self.style.SUCCESS(f"Institution: {institution.name} ({institution.code})"))
        self.stdout.write(self.style.SUCCESS("Demo Accounts Created:"))
        self.stdout.write("  - Administrator: admin@edunexus.org / AdminPass123!")
        self.stdout.write("  - Faculty:       teacher@apex.edu   / TeacherPass123!")
        self.stdout.write("  - Student:       student@apex.edu   / StudentPass123!")

import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.institutions.models import Organization, Institution
from apps.users.models import User, InstitutionMembership
from apps.academics.models import AcademicYear, SchoolClass, SchoolSection
from apps.students.models import StudentProfile
from apps.finance.models import FeeStructure, Invoice, InvoiceItem, Payment, PaymentAllocation

@pytest.fixture
def finance_setup():
    org = Organization.objects.create(
        name="Crestview Educational Society",
        slug="crestview-edu",
        billing_email="billing@crestview.edu"
    )

    school = Institution.objects.create(
        organization=org,
        name="Crestview High School",
        code="CREST-SCH",
        institution_type="SCHOOL",
        currency_code="USD"
    )

    accountant_user = User.objects.create_user(
        email="bursar@crestview.edu",
        password="BursarPassword123!",
        first_name="Charles",
        last_name="Dickens"
    )
    membership = InstitutionMembership.objects.create(
        institution=school,
        user=accountant_user,
        membership_type="STAFF",
        identification_number="ACC-001",
        status="ACTIVE"
    )

    student_user = User.objects.create_user(
        email="student.fin@crestview.edu",
        password="Password123!",
        first_name="Oliver",
        last_name="Twist"
    )
    student_membership = InstitutionMembership.objects.create(
        institution=school,
        user=student_user,
        membership_type="STUDENT",
        identification_number="STU-FIN-01",
        status="ACTIVE"
    )
    student = StudentProfile.objects.create(
        institution=school,
        membership=student_membership,
        admission_number="ADM-CREST-001",
        admission_date=date(2025, 6, 1),
        date_of_birth=date(2010, 5, 12),
        gender="MALE",
        residential_address="10 Downing St",
        emergency_contact_name="Mr. Brownlow",
        emergency_contact_phone="+144223344"
    )

    year = AcademicYear.objects.create(
        institution=school,
        name="2025-2026",
        start_date=date(2025, 6, 1),
        end_date=date(2026, 5, 31)
    )
    s_class = SchoolClass.objects.create(
        institution=school,
        name="Grade 8",
        sequence_order=8
    )

    return {
        'org': org,
        'school': school,
        'accountant_user': accountant_user,
        'membership': membership,
        'student': student,
        'year': year,
        'class': s_class
    }

@pytest.mark.django_db
def test_create_fee_structure_and_invoice(finance_setup):
    client = APIClient()
    client.force_authenticate(user=finance_setup['accountant_user'])
    school_id = str(finance_setup['school'].id)

    # 1. Create Fee Structure ($1,200.00 = 120000 minor units)
    fee_res = client.post(
        reverse('fee-structure-list'),
        {
            'academic_year': str(finance_setup['year'].id),
            'name': 'Grade 8 Annual Fee 2025',
            'target_type': 'SCHOOL_CLASS',
            'school_class': str(finance_setup['class'].id),
            'total_amount': 120000
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert fee_res.status_code == 201
    assert fee_res.data['total_amount'] == 120000

    # 2. Create Invoice for Student (Tuition 100000, Lab 20000, Discount 5000 => Total 115000)
    inv_res = client.post(
        reverse('invoice-list'),
        {
            'student': str(finance_setup['student'].id),
            'invoice_number': 'INV-2025-001',
            'issue_date': '2025-06-01',
            'due_date': '2025-07-01',
            'discount_amount': 5000,
            'tax_amount': 0,
            'items': [
                {'fee_category': 'TUITION', 'amount': 100000},
                {'fee_category': 'LABORATORY', 'amount': 20000}
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert inv_res.status_code == 201
    assert inv_res.data['invoice_number'] == 'INV-2025-001'
    assert inv_res.data['total_amount'] == 115000
    assert inv_res.data['paid_amount'] == 0
    assert inv_res.data['status'] == 'UNPAID'
    assert len(inv_res.data['items']) == 2

@pytest.mark.django_db
def test_payment_recording_with_multi_item_allocations(finance_setup):
    client = APIClient()
    client.force_authenticate(user=finance_setup['accountant_user'])
    school_id = str(finance_setup['school'].id)

    # Setup Invoice directly
    invoice = Invoice.objects.create(
        institution=finance_setup['school'],
        student=finance_setup['student'],
        invoice_number='INV-2025-002',
        issue_date=date(2025, 6, 1),
        due_date=date(2025, 7, 1),
        subtotal_amount=120000,
        discount_amount=0,
        tax_amount=0,
        total_amount=120000,
        paid_amount=0,
        status='UNPAID'
    )
    tuition_item = InvoiceItem.objects.create(
        invoice=invoice,
        fee_category='TUITION',
        amount=100000,
        allocated_amount=0
    )
    lab_item = InvoiceItem.objects.create(
        invoice=invoice,
        fee_category='LABORATORY',
        amount=20000,
        allocated_amount=0
    )

    # 1. Partial Payment of $800.00 = 80000 (Allocating 60000 to Tuition, 20000 to Lab)
    pay_url = reverse('payment-record-payment')
    pay_res = client.post(
        pay_url,
        {
            'student_id': str(finance_setup['student'].id),
            'receipt_number': 'RCP-2025-001',
            'payment_method': 'ONLINE_GATEWAY',
            'amount': 80000,
            'idempotency_key': 'idem_key_pay_001',
            'allocations': [
                {'invoice_item_id': str(tuition_item.id), 'allocated_amount': 60000},
                {'invoice_item_id': str(lab_item.id), 'allocated_amount': 20000}
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert pay_res.status_code == 201
    assert pay_res.data['amount'] == 80000
    assert len(pay_res.data['allocations']) == 2

    # Verify line items and invoice balance
    invoice.refresh_from_db()
    tuition_item.refresh_from_db()
    lab_item.refresh_from_db()

    assert tuition_item.allocated_amount == 60000
    assert lab_item.allocated_amount == 20000
    assert invoice.paid_amount == 80000
    assert invoice.balance_due == 40000
    assert invoice.status == 'PARTIALLY_PAID'

    # 2. Idempotency Test: Sending identical payment request with same idempotency_key
    # Must return existing payment without creating duplicates
    idem_res = client.post(
        pay_url,
        {
            'student_id': str(finance_setup['student'].id),
            'receipt_number': 'RCP-2025-001',
            'payment_method': 'ONLINE_GATEWAY',
            'amount': 80000,
            'idempotency_key': 'idem_key_pay_001',
            'allocations': [
                {'invoice_item_id': str(tuition_item.id), 'allocated_amount': 60000},
                {'invoice_item_id': str(lab_item.id), 'allocated_amount': 20000}
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert idem_res.status_code == 200
    assert Payment.objects.filter(idempotency_key='idem_key_pay_001').count() == 1

    # 3. Final Settlement: Settle remaining balance of 40000 on Tuition
    final_res = client.post(
        pay_url,
        {
            'student_id': str(finance_setup['student'].id),
            'receipt_number': 'RCP-2025-002',
            'payment_method': 'CASH',
            'amount': 40000,
            'idempotency_key': 'idem_key_pay_002',
            'allocations': [
                {'invoice_item_id': str(tuition_item.id), 'allocated_amount': 40000}
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert final_res.status_code == 201

    invoice.refresh_from_db()
    assert invoice.paid_amount == 120000
    assert invoice.balance_due == 0
    assert invoice.status == 'PAID'

@pytest.mark.django_db
def test_over_allocation_attempt_rejected(finance_setup):
    client = APIClient()
    client.force_authenticate(user=finance_setup['accountant_user'])
    school_id = str(finance_setup['school'].id)

    invoice = Invoice.objects.create(
        institution=finance_setup['school'],
        student=finance_setup['student'],
        invoice_number='INV-2025-003',
        issue_date=date(2025, 6, 1),
        due_date=date(2025, 7, 1),
        subtotal_amount=50000,
        total_amount=50000
    )
    item = InvoiceItem.objects.create(
        invoice=invoice,
        fee_category='LIBRARY',
        amount=50000,
        allocated_amount=0
    )

    # Attempt to allocate 60000 to an item worth only 50000
    pay_url = reverse('payment-record-payment')
    res = client.post(
        pay_url,
        {
            'student_id': str(finance_setup['student'].id),
            'receipt_number': 'RCP-2025-FAIL',
            'amount': 60000,
            'idempotency_key': 'idem_key_fail',
            'allocations': [
                {'invoice_item_id': str(item.id), 'allocated_amount': 60000}
            ]
        },
        format='json',
        HTTP_X_INSTITUTION_ID=school_id
    )
    assert res.status_code == 400

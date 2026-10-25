from django.db import models
from django.utils import timezone
from common.models import TenantModel, UUIDModel, TimeStampedModel

class FeeStructure(TenantModel):
    """
    Template fee schedule for a school grade or college degree program.
    Amounts stored in integer minor currency units (cents/paise).
    """
    TARGET_TYPES = (
        ('SCHOOL_CLASS', 'School Class'),
        ('COLLEGE_PROGRAM', 'College Program'),
    )

    academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.RESTRICT,
        related_name='fee_structures'
    )
    name = models.CharField(max_length=150)
    target_type = models.CharField(max_length=30, choices=TARGET_TYPES)
    school_class = models.ForeignKey(
        'academics.SchoolClass',
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='fee_structures'
    )
    college_program = models.ForeignKey(
        'academics.CollegeProgram',
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='fee_structures'
    )
    total_amount = models.BigIntegerField(
        help_text="Fee total stored in minor currency units (e.g. $100.50 = 10050)."
    )

    class Meta:
        db_table = 'fee_structures'
        ordering = ['name']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=0),
                name='chk_fee_structure_positive_amount'
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(school_class__isnull=False, college_program__isnull=True) |
                    models.Q(school_class__isnull=True, college_program__isnull=False)
                ),
                name='chk_fee_target_exclusive'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.total_amount})"

class Invoice(TenantModel):
    """
    Accounts receivable invoice billed to a student.
    Monetary values stored in minor currency units.
    """
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('UNPAID', 'Unpaid'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
    )

    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.RESTRICT,
        related_name='invoices'
    )
    invoice_number = models.CharField(max_length=50)
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    subtotal_amount = models.BigIntegerField(default=0)
    discount_amount = models.BigIntegerField(default=0)
    tax_amount = models.BigIntegerField(default=0)
    total_amount = models.BigIntegerField(default=0)
    paid_amount = models.BigIntegerField(default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='UNPAID')

    class Meta:
        db_table = 'invoices'
        ordering = ['-issue_date', 'invoice_number']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'invoice_number'],
                name='uniq_institution_invoice_number'
            ),
            models.CheckConstraint(
                condition=models.Q(due_date__gte=models.F('issue_date')),
                name='chk_invoice_due_date_after_issue'
            ),
            models.CheckConstraint(
                condition=models.Q(paid_amount__lte=models.F('total_amount')),
                name='chk_invoice_paid_lte_total'
            ),
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=0),
                name='chk_invoice_total_positive'
            )
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.student.admission_number} ({self.status})"

    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount

class InvoiceItem(UUIDModel, TimeStampedModel):
    """
    Detailed line item belonging to an invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    fee_category = models.CharField(max_length=50)
    amount = models.BigIntegerField()
    allocated_amount = models.BigIntegerField(default=0)

    class Meta:
        db_table = 'invoice_items'
        ordering = ['created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(allocated_amount__lte=models.F('amount')),
                name='chk_item_allocated_lte_amount'
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gte=0),
                name='chk_item_amount_positive'
            )
        ]

    def __str__(self):
        return f"{self.fee_category}: {self.amount} (Paid: {self.allocated_amount})"

    @property
    def remaining_amount(self):
        return self.amount - self.allocated_amount

class Payment(TenantModel):
    """
    Payment transaction received from a student or parent.
    Includes idempotency safeguards against duplicate gateway webhooks.
    """
    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CREDIT_CARD', 'Credit Card'),
        ('ONLINE_GATEWAY', 'Online Gateway'),
        ('CHEQUE', 'Cheque'),
    )

    STATUS_CHOICES = (
        ('INITIATED', 'Initiated'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.RESTRICT,
        related_name='payments'
    )
    receipt_number = models.CharField(max_length=50)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHODS, default='CASH')
    amount = models.BigIntegerField()
    currency = models.CharField(max_length=3, default='USD')
    idempotency_key = models.CharField(max_length=255, unique=True)
    gateway_transaction_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='COMPLETED')
    received_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments'
        ordering = ['-received_at']
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'receipt_number'],
                name='uniq_institution_receipt_number'
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name='chk_payment_positive_amount'
            )
        ]

    def __str__(self):
        return f"{self.receipt_number} - {self.amount} ({self.status})"

class PaymentAllocation(UUIDModel, TimeStampedModel):
    """
    Splits a payment across specific invoice line items.
    """
    payment = models.ForeignKey(
        Payment,
        on_delete=models.RESTRICT,
        related_name='allocations'
    )
    invoice_item = models.ForeignKey(
        InvoiceItem,
        on_delete=models.RESTRICT,
        related_name='allocations'
    )
    allocated_amount = models.BigIntegerField()

    class Meta:
        db_table = 'payment_allocations'
        ordering = ['created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(allocated_amount__gt=0),
                name='chk_allocation_positive_amount'
            )
        ]

    def __str__(self):
        return f"Alloc {self.payment.receipt_number} -> {self.invoice_item.fee_category}: {self.allocated_amount}"

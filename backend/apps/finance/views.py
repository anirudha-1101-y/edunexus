from django.db import transaction
from django.db.models import F
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.permissions import IsTenantMember, IsAdminOrReadOnly
from apps.finance.models import FeeStructure, Invoice, InvoiceItem, Payment, PaymentAllocation
from apps.finance.serializers import (
    FeeStructureSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PaymentSerializer,
    RecordPaymentSerializer
)

class FeeStructureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]
    serializer_class = FeeStructureSerializer

    def get_queryset(self):
        return FeeStructure.objects.filter(
            institution_id=self.request.institution_id
        ).select_related('academic_year', 'school_class', 'college_program')

    def perform_create(self, serializer):
        serializer.save(institution_id=self.request.institution_id)

class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember, IsAdminOrReadOnly]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(
            institution_id=self.request.institution_id
        ).select_related('student__membership__user').prefetch_related('items')

    def create(self, request, *args, **kwargs):
        serializer = InvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        subtotal = sum(item['amount'] for item in data['items'])
        total = subtotal - data['discount_amount'] + data['tax_amount']

        with transaction.atomic():
            invoice = Invoice.objects.create(
                institution_id=request.institution_id,
                student_id=data['student'],
                invoice_number=data['invoice_number'],
                issue_date=data['issue_date'],
                due_date=data['due_date'],
                subtotal_amount=subtotal,
                discount_amount=data['discount_amount'],
                tax_amount=data['tax_amount'],
                total_amount=total,
                paid_amount=0,
                status='UNPAID'
            )

            for item in data['items']:
                InvoiceItem.objects.create(
                    invoice=invoice,
                    fee_category=item['fee_category'],
                    amount=item['amount'],
                    allocated_amount=0
                )

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_201_CREATED
        )

class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(
            institution_id=self.request.institution_id
        ).select_related('student__membership__user').prefetch_related('allocations__invoice_item')

    @action(detail=False, methods=['post'], url_path='record-payment')
    def record_payment(self, request):
        """
        Records a payment and atomically allocates funds to invoice line items
        using row-level locking (select_for_update) to prevent race conditions.
        """
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Idempotency Check: Return existing payment if already processed
        idempotency_key = data['idempotency_key']
        existing_payment = Payment.objects.filter(
            institution_id=request.institution_id,
            idempotency_key=idempotency_key
        ).first()

        if existing_payment:
            return Response(
                PaymentSerializer(existing_payment).data,
                status=status.HTTP_200_OK
            )

        with transaction.atomic():
            # 2. Create the master Payment record
            payment = Payment.objects.create(
                institution_id=request.institution_id,
                student_id=data['student_id'],
                receipt_number=data['receipt_number'],
                payment_method=data['payment_method'],
                amount=data['amount'],
                currency=data['currency'],
                idempotency_key=idempotency_key,
                gateway_transaction_id=data.get('gateway_transaction_id', ''),
                status='COMPLETED'
            )

            invoices_to_update = set()

            # 3. Process each allocation with row locking
            for alloc_item in data['allocations']:
                item_id = alloc_item['invoice_item_id']
                chunk = alloc_item['allocated_amount']

                try:
                    invoice_item = InvoiceItem.objects.select_for_update().select_related('invoice').get(
                        id=item_id,
                        invoice__institution_id=request.institution_id
                    )
                except InvoiceItem.DoesNotExist:
                    raise ValidationError(f"Invoice item {item_id} not found in this institution.")

                # Ensure line item cannot be over-allocated
                remaining = invoice_item.amount - invoice_item.allocated_amount
                if chunk > remaining:
                    raise ValidationError(
                        f"Allocation of {chunk} exceeds remaining balance of {remaining} on item {invoice_item.fee_category}."
                    )

                # Create allocation record
                PaymentAllocation.objects.create(
                    payment=payment,
                    invoice_item=invoice_item,
                    allocated_amount=chunk
                )

                # Update line item allocated amount
                invoice_item.allocated_amount += chunk
                invoice_item.save(update_fields=['allocated_amount', 'updated_at'])

                # Track invoice for updating paid total and status
                invoices_to_update.add(invoice_item.invoice.id)

            # 4. Update total paid and status on all impacted invoices with lock
            for inv_id in invoices_to_update:
                invoice = Invoice.objects.select_for_update().get(id=inv_id)
                total_paid_for_inv = sum(it.allocated_amount for it in invoice.items.all())
                invoice.paid_amount = total_paid_for_inv

                if invoice.paid_amount >= invoice.total_amount:
                    invoice.status = 'PAID'
                elif invoice.paid_amount > 0:
                    invoice.status = 'PARTIALLY_PAID'
                else:
                    invoice.status = 'UNPAID'

                invoice.save(update_fields=['paid_amount', 'status', 'updated_at'])

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )

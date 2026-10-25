from rest_framework import serializers
from apps.finance.models import FeeStructure, Invoice, InvoiceItem, Payment, PaymentAllocation

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'institution', 'academic_year', 'name', 'target_type',
            'school_class', 'college_program', 'total_amount', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at']

class InvoiceItemSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.IntegerField(read_only=True)

    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'invoice', 'fee_category', 'amount',
            'allocated_amount', 'remaining_amount', 'created_at'
        ]
        read_only_fields = ['id', 'invoice', 'allocated_amount', 'remaining_amount', 'created_at']

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    balance_due = serializers.IntegerField(read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'institution', 'student', 'student_name', 'admission_number',
            'invoice_number', 'issue_date', 'due_date', 'subtotal_amount',
            'discount_amount', 'tax_amount', 'total_amount', 'paid_amount',
            'balance_due', 'status', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'institution', 'paid_amount', 'balance_due', 'created_at']

class InvoiceItemCreateInputSerializer(serializers.Serializer):
    fee_category = serializers.CharField(max_length=50)
    amount = serializers.IntegerField(min_value=1)

class InvoiceCreateSerializer(serializers.Serializer):
    student = serializers.UUIDField()
    invoice_number = serializers.CharField(max_length=50)
    issue_date = serializers.DateField()
    due_date = serializers.DateField()
    discount_amount = serializers.IntegerField(default=0, min_value=0)
    tax_amount = serializers.IntegerField(default=0, min_value=0)
    items = InvoiceItemCreateInputSerializer(many=True)

    def validate(self, attrs):
        if attrs['due_date'] < attrs['issue_date']:
            raise serializers.ValidationError({"due_date": "Due date must be on or after issue date."})
        if not attrs.get('items'):
            raise serializers.ValidationError({"items": "At least one invoice item is required."})
        return attrs

class PaymentAllocationSerializer(serializers.ModelSerializer):
    fee_category = serializers.CharField(source='invoice_item.fee_category', read_only=True)

    class Meta:
        model = PaymentAllocation
        fields = ['id', 'payment', 'invoice_item', 'fee_category', 'allocated_amount', 'created_at']
        read_only_fields = ['id', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.membership.user.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'institution', 'student', 'student_name', 'admission_number',
            'receipt_number', 'payment_method', 'amount', 'currency',
            'idempotency_key', 'gateway_transaction_id', 'status',
            'allocations', 'received_at'
        ]
        read_only_fields = ['id', 'institution', 'received_at']

class PaymentAllocationItemSerializer(serializers.Serializer):
    invoice_item_id = serializers.UUIDField()
    allocated_amount = serializers.IntegerField(min_value=1)

class RecordPaymentSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    receipt_number = serializers.CharField(max_length=50)
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHODS, default='CASH')
    amount = serializers.IntegerField(min_value=1)
    currency = serializers.CharField(max_length=3, default='USD')
    idempotency_key = serializers.CharField(max_length=255)
    gateway_transaction_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    allocations = PaymentAllocationItemSerializer(many=True)

    def validate(self, attrs):
        total_allocated = sum(item['allocated_amount'] for item in attrs['allocations'])
        if total_allocated != attrs['amount']:
            raise serializers.ValidationError({
                "allocations": f"Sum of allocated amounts ({total_allocated}) must exactly match total payment amount ({attrs['amount']})."
            })
        return attrs

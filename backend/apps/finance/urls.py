from rest_framework.routers import DefaultRouter
from apps.finance.views import FeeStructureViewSet, InvoiceViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = router.urls

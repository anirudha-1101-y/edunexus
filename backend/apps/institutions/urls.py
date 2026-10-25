from django.urls import path
from apps.institutions.views import current_institution_view, admin_dashboard_view

urlpatterns = [
    path('current/', current_institution_view, name='institution-current'),
    path('admin-dashboard/', admin_dashboard_view, name='institution-admin-dashboard'),
]

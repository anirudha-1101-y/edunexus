from django.contrib import admin
from django.urls import path, include
from common.views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/institutions/', include('apps.institutions.urls')),
    path('api/v1/academics/', include('apps.academics.urls')),
    path('api/v1/students/', include('apps.students.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/examinations/', include('apps.examinations.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/operations/', include('apps.operations.urls')),
]

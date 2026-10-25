from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import login_view, logout_view, switch_institution_view, user_profile_view

urlpatterns = [
    path('login/', login_view, name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('switch-institution/', switch_institution_view, name='auth-switch-institution'),
    path('me/', user_profile_view, name='auth-me'),
]

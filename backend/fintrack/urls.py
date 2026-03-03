"""URL configuration for FinTrack project."""
from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

from .auth_views import logout, register
from .views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth
    path("api/auth/login/", obtain_auth_token, name="auth-login"),
    path("api/auth/register/", register, name="auth-register"),
    path("api/auth/logout/", logout, name="auth-logout"),
    # Health check (exempt from auth)
    path("api/health/", health_check, name="health-check"),
    # App endpoints
    path("api/", include("portfolio.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/", include("watchlist.urls")),
]

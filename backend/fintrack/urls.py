"""URL configuration for FinTrack project."""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", lambda r: JsonResponse({"status": "ok"})),
    path("api/", include("portfolio.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/", include("watchlist.urls")),
]

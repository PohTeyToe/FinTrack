"""URL routing for analytics API endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SpendingAnalyticsViewSet, SpendingCategoryViewSet, SpendingEntryViewSet

router = DefaultRouter()
router.register(r"categories", SpendingCategoryViewSet, basename="spending-category")
router.register(r"entries", SpendingEntryViewSet, basename="spending-entry")
router.register(r"spending", SpendingAnalyticsViewSet, basename="spending-analytics")

urlpatterns = [
    path("", include(router.urls)),
]

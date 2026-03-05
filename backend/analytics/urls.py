"""URL routing for analytics API endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .export_views import export_spending_csv
from .views import (
    SpendingAnalyticsViewSet,
    SpendingCategoryViewSet,
    SpendingEntryViewSet,
    budget_summary,
)

router = DefaultRouter()
router.register(r"categories", SpendingCategoryViewSet, basename="spending-category")
router.register(r"entries", SpendingEntryViewSet, basename="spending-entry")
router.register(r"spending", SpendingAnalyticsViewSet, basename="spending-analytics")

urlpatterns = [
    path("spending/export/", export_spending_csv, name="spending-export"),
    path("spending/budget-summary/", budget_summary, name="budget-summary"),
    path("", include(router.urls)),
]

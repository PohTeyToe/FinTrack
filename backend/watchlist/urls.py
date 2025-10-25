"""URL routing for watchlist API endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PriceAlertViewSet, WatchlistItemViewSet

router = DefaultRouter()
router.register(r"watchlist", WatchlistItemViewSet, basename="watchlist")
router.register(r"alerts", PriceAlertViewSet, basename="alert")

urlpatterns = [
    path("", include(router.urls)),
]

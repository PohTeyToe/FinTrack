# Watchlist API views
"""API views for watchlist management."""
from rest_framework import viewsets

from .models import PriceAlert, WatchlistItem
from .serializers import PriceAlertSerializer, WatchlistItemSerializer


class WatchlistItemViewSet(viewsets.ModelViewSet):
    """ViewSet for watchlist CRUD operations.

    Supports listing, creating, updating, and removing watched stocks.
    Each user has their own isolated watchlist.
    """

    serializer_class = WatchlistItemSerializer

    def get_queryset(self):
        return WatchlistItem.objects.filter(
            user=self.request.user
        ).prefetch_related("alerts")

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)


class PriceAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for price alert history."""

    serializer_class = PriceAlertSerializer

    def get_queryset(self):
        return PriceAlert.objects.filter(
            watchlist_item__user=self.request.user
        ).select_related("watchlist_item")

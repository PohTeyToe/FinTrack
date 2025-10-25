"""DRF serializers for watchlist resources."""
from rest_framework import serializers

from .models import PriceAlert, WatchlistItem


class PriceAlertSerializer(serializers.ModelSerializer):
    """Serializer for triggered price alerts."""

    class Meta:
        model = PriceAlert
        fields = ["id", "watchlist_item", "triggered_at", "price_at_trigger"]
        read_only_fields = ["id", "triggered_at"]


class WatchlistItemSerializer(serializers.ModelSerializer):
    """Serializer for watchlist items with alert history."""

    alerts = PriceAlertSerializer(many=True, read_only=True)
    alert_count = serializers.SerializerMethodField()

    class Meta:
        model = WatchlistItem
        fields = [
            "id",
            "symbol",
            "name",
            "target_price",
            "alert_type",
            "notes",
            "alerts",
            "alert_count",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def get_alert_count(self, obj: WatchlistItem) -> int:
        return obj.alerts.count()

    def validate_symbol(self, value: str) -> str:
        return value.upper().strip()

    def validate_target_price(self, value: float | None) -> float | None:
        if value is not None and value <= 0:
            raise serializers.ValidationError("Target price must be positive.")
        return value

"""DRF serializers for portfolio resources."""
from rest_framework import serializers

from .models import Holding, Portfolio, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for buy/sell/dividend transactions."""

    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "holding",
            "type",
            "shares",
            "price",
            "fees",
            "date",
            "notes",
            "total_amount",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_shares(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("Shares must be greater than zero.")
        return value

    def validate_price(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value


class HoldingSerializer(serializers.ModelSerializer):
    """Serializer for stock holdings with computed fields."""

    market_value = serializers.ReadOnlyField()
    total_cost = serializers.ReadOnlyField()
    gain_loss = serializers.ReadOnlyField()
    gain_loss_percent = serializers.ReadOnlyField()
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Holding
        fields = [
            "id",
            "portfolio",
            "symbol",
            "name",
            "shares",
            "avg_cost",
            "current_price",
            "sector",
            "market_value",
            "total_cost",
            "gain_loss",
            "gain_loss_percent",
            "transactions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_symbol(self, value: str) -> str:
        return value.upper().strip()

    def validate_shares(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("Shares must be greater than zero.")
        return value


class HoldingCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating holdings."""

    class Meta:
        model = Holding
        fields = ["symbol", "name", "shares", "avg_cost", "sector"]

    def validate_symbol(self, value: str) -> str:
        return value.upper().strip()


class PortfolioSerializer(serializers.ModelSerializer):
    """Serializer for portfolios with nested holdings."""

    holdings = HoldingSerializer(many=True, read_only=True)
    total_value = serializers.SerializerMethodField()
    total_gain = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            "id",
            "name",
            "description",
            "holdings",
            "total_value",
            "total_gain",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_total_value(self, obj: Portfolio) -> float:
        """Sum of all holding market values."""
        return sum(h.market_value for h in obj.holdings.all())

    def get_total_gain(self, obj: Portfolio) -> float:
        """Sum of all holding gains/losses."""
        return sum(h.gain_loss for h in obj.holdings.all())


class PortfolioListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for portfolio list view."""

    holdings_count = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            "id",
            "name",
            "description",
            "holdings_count",
            "total_value",
            "created_at",
        ]

    def get_holdings_count(self, obj: Portfolio) -> int:
        return obj.holdings.count()

    def get_total_value(self, obj: Portfolio) -> float:
        return sum(h.market_value for h in obj.holdings.all())

"""DRF serializers for spending analytics."""
from django.db.models import Sum

from rest_framework import serializers

from .models import SpendingCategory, SpendingEntry


class SpendingEntrySerializer(serializers.ModelSerializer):
    """Serializer for individual spending entries."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)

    class Meta:
        model = SpendingEntry
        fields = [
            "id",
            "category",
            "category_name",
            "category_color",
            "amount",
            "description",
            "date",
            "recurring",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_amount(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class SpendingCategorySerializer(serializers.ModelSerializer):
    """Serializer for spending categories with entry count."""

    entry_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = SpendingCategory
        fields = [
            "id",
            "name",
            "budget_limit",
            "color",
            "icon",
            "entry_count",
            "total_spent",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def get_entry_count(self, obj: SpendingCategory) -> int:
        return obj.entries.count()

    def get_total_spent(self, obj: SpendingCategory) -> float:
        total = obj.entries.aggregate(total=Sum("amount"))
        return float(total["total"] or 0)

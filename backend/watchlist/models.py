"""Watchlist models for tracking stocks of interest."""
from django.conf import settings
from django.db import models


class WatchlistItem(models.Model):
    """A stock being watched for potential investment."""

    ALERT_CHOICES = [
        ("ABOVE", "Price Above"),
        ("BELOW", "Price Below"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watchlist_items",
    )
    symbol = models.CharField(max_length=10)
    name = models.CharField(max_length=200, blank=True, default="")
    target_price = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    alert_type = models.CharField(
        max_length=5,
        choices=ALERT_CHOICES,
        default="ABOVE",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "watchlist item"
        verbose_name_plural = "watchlist items"
        unique_together = [("user", "symbol")]

    def __str__(self) -> str:
        return f"{self.symbol} (target: {self.target_price})"


class PriceAlert(models.Model):
    """Record of a triggered price alert."""

    watchlist_item = models.ForeignKey(
        WatchlistItem,
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    triggered_at = models.DateTimeField(auto_now_add=True)
    price_at_trigger = models.DecimalField(max_digits=12, decimal_places=4)

    class Meta:
        ordering = ["-triggered_at"]
        verbose_name = "price alert"
        verbose_name_plural = "price alerts"

    def __str__(self) -> str:
        return f"Alert for {self.watchlist_item.symbol} at ${self.price_at_trigger}"

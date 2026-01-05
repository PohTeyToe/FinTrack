"""Portfolio models for investment tracking."""
from django.conf import settings
from django.db import models


class Portfolio(models.Model):
    """A named collection of investment holdings."""

    name = models.CharField(max_length=200)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolios",
    )
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "portfolio"
        verbose_name_plural = "portfolios"

    def __str__(self) -> str:
        return f"{self.name} ({self.user.username})"


class Holding(models.Model):
    """A stock position within a portfolio."""

    SECTOR_CHOICES = [
        ("technology", "Technology"),
        ("healthcare", "Healthcare"),
        ("financial", "Financial"),
        ("consumer", "Consumer"),
        ("energy", "Energy"),
        ("industrial", "Industrial"),
        ("utilities", "Utilities"),
        ("real_estate", "Real Estate"),
        ("materials", "Materials"),
        ("communication", "Communication"),
        ("other", "Other"),
    ]

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="holdings",
    )
    symbol = models.CharField(max_length=10)
    name = models.CharField(max_length=200, blank=True, default="")
    shares = models.DecimalField(max_digits=12, decimal_places=4)
    avg_cost = models.DecimalField(max_digits=12, decimal_places=4)
    current_price = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    # TODO: support multiple currencies
    sector = models.CharField(
        max_length=20,
        choices=SECTOR_CHOICES,
        default="other",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "holding"
        verbose_name_plural = "holdings"
        unique_together = [("portfolio", "symbol")]

    def __str__(self) -> str:
        return f"{self.symbol} ({self.shares} shares)"

    @property
    def market_value(self) -> float:
        """Current market value of the holding."""
        return float(self.shares * self.current_price)

    @property
    def total_cost(self) -> float:
        """Total cost basis of the holding."""
        return float(self.shares * self.avg_cost)

    @property
    def gain_loss(self) -> float:
        """Unrealized gain or loss."""
        return self.market_value - self.total_cost

    @property
    def gain_loss_percent(self) -> float:
        """Unrealized gain or loss as a percentage."""
        if self.total_cost == 0:
            return 0.0
        return (self.gain_loss / self.total_cost) * 100


class Transaction(models.Model):
    """A buy, sell, or dividend event for a holding."""

    TYPE_CHOICES = [
        ("BUY", "Buy"),
        ("SELL", "Sell"),
        ("DIVIDEND", "Dividend"),
    ]

    holding = models.ForeignKey(
        Holding,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    shares = models.DecimalField(max_digits=12, decimal_places=4)
    price = models.DecimalField(max_digits=12, decimal_places=4)
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date = models.DateField()
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "transaction"
        verbose_name_plural = "transactions"

    def __str__(self) -> str:
        return f"{self.type} {self.shares} {self.holding.symbol} @ {self.price}"

    @property
    def total_amount(self) -> float:
        """Total transaction amount including fees."""
        return float(self.shares * self.price) + float(self.fees)

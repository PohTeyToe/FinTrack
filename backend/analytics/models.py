"""Spending and budget tracking models."""
from django.conf import settings
from django.db import models


class SpendingCategory(models.Model):
    """A user-defined spending category with optional budget limit."""

    name = models.CharField(max_length=100)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="spending_categories",
    )
    budget_limit = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    color = models.CharField(max_length=7, default="#6b7280")
    icon = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "spending category"
        verbose_name_plural = "spending categories"
        unique_together = [("user", "name")]

    def __str__(self) -> str:
        return self.name


class SpendingEntry(models.Model):
    """An individual spending transaction."""

    category = models.ForeignKey(
        SpendingCategory,
        on_delete=models.CASCADE,
        related_name="entries",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, default="")
    date = models.DateField()
    recurring = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "spending entry"
        verbose_name_plural = "spending entries"

    def __str__(self) -> str:
        return f"{self.category.name}: ${self.amount} on {self.date}"

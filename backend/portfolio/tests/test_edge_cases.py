"""Edge-case tests for portfolio analytics pipelines.

Covers scenarios like zero-share holdings, invalid period strings,
and spending reports with no entries in the requested date range.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import User

from analytics.models import SpendingCategory, SpendingEntry
from analytics.processors import generate_spending_report
from portfolio.models import Holding, Portfolio
from portfolio.services import calculate_portfolio_returns


@pytest.mark.django_db
class TestZeroShareHoldings:
    """Portfolio that exists but every holding has 0 shares."""

    def setup_method(self):
        self.user = User.objects.create_user("edge_user", password="testpass")
        self.portfolio = Portfolio.objects.create(name="Empty-ish", user=self.user)

    def test_zero_shares_returns_empty_metrics(self):
        Holding.objects.create(
            portfolio=self.portfolio,
            symbol="AAPL",
            shares=Decimal("0"),
            avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        result = calculate_portfolio_returns(self.portfolio.id)
        assert result["total_value"] == 0
        assert result["total_gain"] == 0
        assert result["time_series"] == []

    def test_invalid_period_raises_value_error(self):
        Holding.objects.create(
            portfolio=self.portfolio,
            symbol="AAPL",
            shares=Decimal("10"),
            avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        with pytest.raises(ValueError, match="Invalid period"):
            calculate_portfolio_returns(self.portfolio.id, period="5Y")


@pytest.mark.django_db
class TestSpendingReportNoEntriesInRange:
    """Spending entries exist but none fall inside the requested window."""

    def setup_method(self):
        self.user = User.objects.create_user("spend_user", password="testpass")
        self.food = SpendingCategory.objects.create(
            name="Food", user=self.user, color="#f97316"
        )

    def test_entries_outside_range_return_zero(self):
        # Entry is 60 days ago; query window is last 7 days.
        SpendingEntry.objects.create(
            category=self.food,
            amount=Decimal("42.00"),
            date=date.today() - timedelta(days=60),
        )
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = generate_spending_report(self.user.id, start, end)
        assert result["total"] == 0
        assert result["categories"] == []
        assert result["daily_totals"] == []

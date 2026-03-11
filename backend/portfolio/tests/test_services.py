"""Tests for portfolio pandas data processing pipelines."""
from decimal import Decimal

import pytest
from django.contrib.auth.models import User

from portfolio.models import Holding, Portfolio
from portfolio.services import calculate_portfolio_returns, portfolio_allocation_analysis


@pytest.mark.django_db
class TestCalculatePortfolioReturns:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.portfolio = Portfolio.objects.create(name="Test", user=self.user)

    def test_empty_portfolio(self):
        result = calculate_portfolio_returns(self.portfolio.id)
        assert result["total_value"] == 0

    def test_single_holding(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        result = calculate_portfolio_returns(self.portfolio.id)
        assert result["total_value"] == 1750.0
        assert result["total_cost"] == 1500.0

    def test_multiple_holdings(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        Holding.objects.create(
            portfolio=self.portfolio, symbol="MSFT",
            shares=Decimal("5"), avg_cost=Decimal("300"),
            current_price=Decimal("380"),
        )
        result = calculate_portfolio_returns(self.portfolio.id)
        assert result["total_value"] == 3650.0

    def test_time_series_generated(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        result = calculate_portfolio_returns(self.portfolio.id, period="1M")
        assert len(result["time_series"]) > 0

    def test_period_1y(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        result = calculate_portfolio_returns(self.portfolio.id, period="1Y")
        assert len(result["time_series"]) > 200


@pytest.mark.django_db
class TestPortfolioAllocationAnalysis:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.portfolio = Portfolio.objects.create(name="Test", user=self.user)

    def test_empty_portfolio(self):
        result = portfolio_allocation_analysis(self.portfolio.id)
        assert result["sectors"] == []

    def test_single_sector(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"), sector="technology",
        )
        result = portfolio_allocation_analysis(self.portfolio.id)
        assert len(result["sectors"]) == 1
        assert result["sectors"][0]["percentage"] == 100.0

    def test_diversification_score(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("100"), sector="technology",
        )
        Holding.objects.create(
            portfolio=self.portfolio, symbol="JPM",
            shares=Decimal("10"), avg_cost=Decimal("130"),
            current_price=Decimal("100"), sector="financial",
        )
        Holding.objects.create(
            portfolio=self.portfolio, symbol="XOM",
            shares=Decimal("10"), avg_cost=Decimal("80"),
            current_price=Decimal("100"), sector="energy",
        )
        result = portfolio_allocation_analysis(self.portfolio.id)
        assert result["diversification_score"] > 50

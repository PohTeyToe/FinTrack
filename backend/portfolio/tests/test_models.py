"""Tests for portfolio models."""
from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth.models import User

from portfolio.models import Holding, Portfolio, Transaction


@pytest.mark.django_db
class TestPortfolioModel:
    def test_create_portfolio(self):
        user = User.objects.create_user("testuser", password="testpass")
        portfolio = Portfolio.objects.create(name="My Portfolio", user=user)
        assert portfolio.name == "My Portfolio"
        assert str(portfolio) == "My Portfolio (testuser)"

    def test_portfolio_ordering(self):
        user = User.objects.create_user("testuser", password="testpass")
        Portfolio.objects.create(name="First", user=user)
        p2 = Portfolio.objects.create(name="Second", user=user)
        assert list(Portfolio.objects.filter(user=user))[0] == p2

    def test_portfolio_description_default(self):
        user = User.objects.create_user("testuser", password="testpass")
        portfolio = Portfolio.objects.create(name="Test", user=user)
        assert portfolio.description == ""


@pytest.mark.django_db
class TestHoldingModel:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.portfolio = Portfolio.objects.create(name="Test", user=self.user)

    def test_create_holding(self):
        h = Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL", name="Apple Inc.",
            shares=Decimal("10"), avg_cost=Decimal("150.00"),
            current_price=Decimal("175.00"),
        )
        assert str(h) == "AAPL (10 shares)"

    def test_market_value(self):
        h = Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        assert h.market_value == 1750.0

    def test_gain_loss(self):
        h = Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        assert h.gain_loss == 250.0

    def test_gain_loss_percent(self):
        h = Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        assert round(h.gain_loss_percent, 2) == 16.67

    def test_gain_loss_percent_zero_cost(self):
        h = Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("0"),
            current_price=Decimal("175"),
        )
        assert h.gain_loss_percent == 0.0

    def test_unique_symbol_per_portfolio(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
        )
        with pytest.raises(Exception):
            Holding.objects.create(
                portfolio=self.portfolio, symbol="AAPL",
                shares=Decimal("5"), avg_cost=Decimal("160"),
            )


@pytest.mark.django_db
class TestTransactionModel:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.portfolio = Portfolio.objects.create(name="Test", user=self.user)
        self.holding = Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
        )

    def test_create_transaction(self):
        txn = Transaction.objects.create(
            holding=self.holding, type="BUY",
            shares=Decimal("10"), price=Decimal("150"),
            date=date(2025, 12, 15),
        )
        assert str(txn) == "BUY 10 AAPL @ 150"

    def test_total_amount(self):
        txn = Transaction.objects.create(
            holding=self.holding, type="BUY",
            shares=Decimal("10"), price=Decimal("150"),
            fees=Decimal("9.99"), date=date(2025, 12, 15),
        )
        assert txn.total_amount == 1509.99

"""Tests for portfolio API views."""
from decimal import Decimal

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from portfolio.models import Holding, Portfolio


@pytest.mark.django_db
class TestPortfolioViewSet:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_portfolios(self):
        Portfolio.objects.create(name="P1", user=self.user)
        Portfolio.objects.create(name="P2", user=self.user)
        response = self.client.get("/api/portfolios/")
        assert response.status_code == 200
        assert len(response.data["results"]) == 2

    def test_create_portfolio(self):
        response = self.client.post(
            "/api/portfolios/", {"name": "New"}, format="json",
        )
        assert response.status_code == 201

    def test_retrieve_portfolio(self):
        p = Portfolio.objects.create(name="Test", user=self.user)
        response = self.client.get(f"/api/portfolios/{p.id}/")
        assert response.status_code == 200

    def test_delete_portfolio(self):
        p = Portfolio.objects.create(name="Del", user=self.user)
        response = self.client.delete(f"/api/portfolios/{p.id}/")
        assert response.status_code == 204

    def test_portfolio_isolation(self):
        other = User.objects.create_user("other", password="pass")
        Portfolio.objects.create(name="Other", user=other)
        response = self.client.get("/api/portfolios/")
        assert len(response.data["results"]) == 0


@pytest.mark.django_db
class TestHoldingsEndpoint:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.portfolio = Portfolio.objects.create(name="Test", user=self.user)

    def test_list_holdings(self):
        Holding.objects.create(
            portfolio=self.portfolio, symbol="AAPL",
            shares=Decimal("10"), avg_cost=Decimal("150"),
            current_price=Decimal("175"),
        )
        response = self.client.get(f"/api/portfolios/{self.portfolio.id}/holdings/")
        assert response.status_code == 200

    def test_create_holding(self):
        response = self.client.post(
            f"/api/portfolios/{self.portfolio.id}/holdings/",
            {"symbol": "MSFT", "shares": 5, "avg_cost": 300},
            format="json",
        )
        assert response.status_code == 201

    def test_symbol_uppercased(self):
        self.client.post(
            f"/api/portfolios/{self.portfolio.id}/holdings/",
            {"symbol": "aapl", "shares": 5, "avg_cost": 150},
            format="json",
        )
        assert Holding.objects.filter(symbol="AAPL").exists()


@pytest.mark.django_db
class TestMarketDataEndpoint:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_quote(self):
        response = self.client.get("/api/market/AAPL/")
        assert response.status_code == 200

    def test_get_quote_unknown(self):
        response = self.client.get("/api/market/ZZZZZ/")
        assert response.status_code == 404

    def test_get_history(self):
        response = self.client.get("/api/market/AAPL/history/")
        assert response.status_code == 200

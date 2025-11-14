"""Tests for watchlist API views."""
from decimal import Decimal

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from watchlist.models import PriceAlert, WatchlistItem


@pytest.mark.django_db
class TestWatchlistItemViewSet:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_watchlist(self):
        WatchlistItem.objects.create(user=self.user, symbol="AAPL")
        response = self.client.get("/api/watchlist/")
        assert response.status_code == 200

    def test_create_watchlist_item(self):
        response = self.client.post(
            "/api/watchlist/",
            {"symbol": "TSLA", "name": "Tesla", "target_price": 200, "alert_type": "BELOW"},
            format="json",
        )
        assert response.status_code == 201

    def test_symbol_uppercased(self):
        self.client.post("/api/watchlist/", {"symbol": "msft"}, format="json")
        assert WatchlistItem.objects.filter(symbol="MSFT").exists()

    def test_delete_item(self):
        item = WatchlistItem.objects.create(user=self.user, symbol="AAPL")
        response = self.client.delete(f"/api/watchlist/{item.id}/")
        assert response.status_code == 204

    def test_negative_target_rejected(self):
        response = self.client.post("/api/watchlist/", {"symbol": "AAPL", "target_price": -10}, format="json")
        assert response.status_code == 400

    def test_watchlist_isolation(self):
        other = User.objects.create_user("other", password="pass")
        WatchlistItem.objects.create(user=other, symbol="SECRET")
        response = self.client.get("/api/watchlist/")
        symbols = [i["symbol"] for i in response.data["results"]]
        assert "SECRET" not in symbols


@pytest.mark.django_db
class TestPriceAlertViewSet:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_alerts(self):
        item = WatchlistItem.objects.create(user=self.user, symbol="AAPL")
        PriceAlert.objects.create(watchlist_item=item, price_at_trigger=Decimal("180"))
        response = self.client.get("/api/alerts/")
        assert response.status_code == 200

    def test_alert_isolation(self):
        other = User.objects.create_user("other", password="pass")
        item = WatchlistItem.objects.create(user=other, symbol="AAPL")
        PriceAlert.objects.create(watchlist_item=item, price_at_trigger=Decimal("180"))
        response = self.client.get("/api/alerts/")
        assert len(response.data["results"]) == 0

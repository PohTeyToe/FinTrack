"""Tests for analytics API views."""
from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from analytics.models import SpendingCategory, SpendingEntry


@pytest.mark.django_db
class TestSpendingCategoryViewSet:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_category(self):
        response = self.client.post("/api/analytics/categories/", {"name": "Food", "color": "#f97316"}, format="json")
        assert response.status_code == 201

    def test_category_isolation(self):
        other = User.objects.create_user("other", password="pass")
        SpendingCategory.objects.create(name="Secret", user=other)
        response = self.client.get("/api/analytics/categories/")
        names = [c["name"] for c in response.data["results"]]
        assert "Secret" not in names


@pytest.mark.django_db
class TestSpendingAnalyticsViewSet:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.food = SpendingCategory.objects.create(name="Food", user=self.user, color="#f97316")

    def test_spending_breakdown(self):
        SpendingEntry.objects.create(category=self.food, amount=Decimal("50"), date=date.today())
        response = self.client.get("/api/analytics/spending/breakdown/")
        assert response.status_code == 200
        assert response.data["total"] == 50.0

    def test_spending_trends(self):
        response = self.client.get("/api/analytics/spending/trends/")
        assert response.status_code == 200

    def test_report_invalid_date(self):
        response = self.client.get("/api/analytics/spending/report/?start=bad-date")
        assert response.status_code == 400

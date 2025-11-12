"""Tests for spending analytics pandas processors."""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import User

from analytics.models import SpendingCategory, SpendingEntry
from analytics.processors import analyze_spending_patterns, detect_trends, generate_spending_report


@pytest.mark.django_db
class TestAnalyzeSpendingPatterns:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.food = SpendingCategory.objects.create(name="Food", user=self.user, color="#f97316")
        self.transport = SpendingCategory.objects.create(name="Transport", user=self.user, color="#3b82f6")

    def test_no_entries(self):
        result = analyze_spending_patterns(self.user.id)
        assert result["total"] == 0

    def test_single_category(self):
        SpendingEntry.objects.create(category=self.food, amount=Decimal("25.50"), date=date.today())
        result = analyze_spending_patterns(self.user.id)
        assert result["total"] == 25.50
        assert result["categories"][0]["percentage"] == 100.0

    def test_multiple_categories(self):
        SpendingEntry.objects.create(category=self.food, amount=Decimal("75"), date=date.today())
        SpendingEntry.objects.create(category=self.transport, amount=Decimal("25"), date=date.today())
        result = analyze_spending_patterns(self.user.id)
        assert result["total"] == 100.0

    def test_period_filter(self):
        SpendingEntry.objects.create(category=self.food, amount=Decimal("50"), date=date.today())
        SpendingEntry.objects.create(category=self.food, amount=Decimal("100"), date=date.today() - timedelta(days=200))
        result = analyze_spending_patterns(self.user.id, period="3M")
        assert result["total"] == 50.0


@pytest.mark.django_db
class TestDetectTrends:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.food = SpendingCategory.objects.create(name="Food", user=self.user, color="#f97316")

    def test_no_data(self):
        result = detect_trends(self.user.id)
        assert result["direction"] == "stable"

    def test_with_data(self):
        for i in range(30):
            SpendingEntry.objects.create(category=self.food, amount=Decimal("20"), date=date.today() - timedelta(days=i))
        result = detect_trends(self.user.id)
        assert "direction" in result
        assert len(result["rolling_7d"]) > 0


@pytest.mark.django_db
class TestGenerateSpendingReport:
    def setup_method(self):
        self.user = User.objects.create_user("testuser", password="testpass")
        self.food = SpendingCategory.objects.create(name="Food", user=self.user, color="#f97316")

    def test_empty_report(self):
        result = generate_spending_report(self.user.id, date.today(), date.today())
        assert result["total"] == 0

    def test_report_with_data(self):
        today = date.today()
        SpendingEntry.objects.create(category=self.food, amount=Decimal("30"), date=today)
        SpendingEntry.objects.create(category=self.food, amount=Decimal("20"), date=today)
        result = generate_spending_report(self.user.id, today, today)
        assert result["total"] == 50.0

    def test_prior_period_comparison(self):
        today = date.today()
        start = today - timedelta(days=6)
        prior_start = start - timedelta(days=7)
        SpendingEntry.objects.create(category=self.food, amount=Decimal("100"), date=today)
        SpendingEntry.objects.create(category=self.food, amount=Decimal("80"), date=prior_start + timedelta(days=1))
        result = generate_spending_report(self.user.id, start, today)
        assert result["prior_period_total"] == 80.0

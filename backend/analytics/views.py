# Analytics API views -- spending breakdown and trend endpoints
"""API views for spending analytics."""
from datetime import date, timedelta

from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.request import Request
from rest_framework.response import Response

from .models import SpendingCategory, SpendingEntry
from .processors import analyze_spending_patterns, detect_trends, generate_spending_report
from .serializers import SpendingCategorySerializer, SpendingEntrySerializer


class SpendingCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for spending category CRUD."""

    serializer_class = SpendingCategorySerializer

    def get_queryset(self):
        return SpendingCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)


class SpendingEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for spending entry CRUD."""

    serializer_class = SpendingEntrySerializer

    def get_queryset(self):
        return SpendingEntry.objects.filter(
            category__user=self.request.user
        ).select_related("category")


class SpendingAnalyticsViewSet(viewsets.ViewSet):
    """Analytics endpoints powered by pandas data processing."""

    @action(detail=False, methods=["get"], url_path="breakdown")
    def spending_breakdown(self, request: Request) -> Response:
        """Get spending breakdown by category.

        Returns category totals, percentages, monthly trends,
        and anomaly detection results.
        """
        period = request.query_params.get("period", "3M")
        result = analyze_spending_patterns(request.user.id, period)
        return Response(result)

    @action(detail=False, methods=["get"], url_path="trends")
    def spending_trends(self, request: Request) -> Response:
        """Get spending trend analysis.

        Returns rolling averages, trend direction, and slope
        computed via linear regression on daily spending.
        """
        result = detect_trends(request.user.id)
        return Response(result)

    @action(detail=False, methods=["get"], url_path="report")
    def spending_report(self, request: Request) -> Response:
        """Generate a spending report.

        Query params: start (YYYY-MM-DD), end (YYYY-MM-DD).
        Defaults to the current month.
        """
        today = date.today()
        start_str = request.query_params.get("start")
        end_str = request.query_params.get("end")

        try:
            start = date.fromisoformat(start_str) if start_str else today.replace(day=1)
            end = date.fromisoformat(end_str) if end_str else today
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = generate_spending_report(request.user.id, start, end)
        return Response(result)


@api_view(["GET"])
def budget_summary(request: Request) -> Response:
    """Return categories with budget limits vs actual spending this month.

    Each category includes its budget_limit, total spent this month,
    remaining budget, and whether the budget has been exceeded.
    """
    today = date.today()
    month_start = today.replace(day=1)

    categories = SpendingCategory.objects.filter(user=request.user)
    results = []

    for cat in categories:
        spent = (
            cat.entries.filter(date__gte=month_start, date__lte=today)
            .aggregate(total=Sum("amount"))["total"]
        ) or 0
        spent = float(spent)
        budget = float(cat.budget_limit) if cat.budget_limit else None

        entry = {
            "id": cat.id,
            "name": cat.name,
            "color": cat.color,
            "budget_limit": budget,
            "spent": round(spent, 2),
        }

        if budget is not None and budget > 0:
            entry["remaining"] = round(budget - spent, 2)
            entry["percentage_used"] = round((spent / budget) * 100, 2)
            entry["over_budget"] = spent > budget
        else:
            entry["remaining"] = None
            entry["percentage_used"] = None
            entry["over_budget"] = False

        results.append(entry)

    return Response({
        "month": today.strftime("%Y-%m"),
        "categories": results,
    })

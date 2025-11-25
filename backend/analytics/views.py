# Analytics API views -- spending breakdown and trend endpoints
"""API views for spending analytics."""
from datetime import date, timedelta

from rest_framework import status, viewsets
from rest_framework.decorators import action
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
        """Generate a comprehensive spending report.

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

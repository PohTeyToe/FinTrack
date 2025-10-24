"""API views for portfolio management."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .api_clients import get_historical, get_quote
from .models import Holding, Portfolio, Transaction
from .serializers import (
    HoldingCreateSerializer,
    HoldingSerializer,
    PortfolioListSerializer,
    PortfolioSerializer,
    TransactionSerializer,
)
from .services import calculate_portfolio_returns, portfolio_allocation_analysis


class PortfolioViewSet(viewsets.ModelViewSet):
    """ViewSet for CRUD operations on portfolios.

    Supports list, create, retrieve, update, and delete.
    Nested actions for holdings and transactions.
    """

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user).prefetch_related(
            "holdings", "holdings__transactions"
        )

    def get_serializer_class(self):
        if self.action == "list":
            return PortfolioListSerializer
        return PortfolioSerializer

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get", "post"], url_path="holdings")
    def holdings(self, request: Request, pk=None) -> Response:
        """List or create holdings for a specific portfolio."""
        portfolio = self.get_object()

        if request.method == "GET":
            holdings = portfolio.holdings.all()
            serializer = HoldingSerializer(holdings, many=True)
            return Response(serializer.data)

        serializer = HoldingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(portfolio=portfolio)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="transactions")
    def transactions(self, request: Request, pk=None) -> Response:
        """Record a transaction for a portfolio holding."""
        portfolio = self.get_object()
        holding_id = request.data.get("holding")

        try:
            holding = portfolio.holdings.get(id=holding_id)
        except Holding.DoesNotExist:
            return Response(
                {"error": "Holding not found in this portfolio."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(holding=holding)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="returns")
    def returns(self, request: Request, pk=None) -> Response:
        """Calculate portfolio return metrics using pandas."""
        portfolio = self.get_object()
        period = request.query_params.get("period", "1M")
        result = calculate_portfolio_returns(portfolio.id, period)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="allocation")
    def allocation(self, request: Request, pk=None) -> Response:
        """Sector allocation breakdown using pandas."""
        portfolio = self.get_object()
        result = portfolio_allocation_analysis(portfolio.id)
        return Response(result)


class HoldingViewSet(viewsets.ModelViewSet):
    """ViewSet for individual holding operations."""

    serializer_class = HoldingSerializer

    def get_queryset(self):
        return Holding.objects.filter(
            portfolio__user=self.request.user
        ).select_related("portfolio")


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for transaction history."""

    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(
            holding__portfolio__user=self.request.user
        ).select_related("holding")


class MarketDataViewSet(viewsets.ViewSet):
    """Proxy endpoints for real-time financial data."""

    def retrieve(self, request: Request, pk=None) -> Response:
        """Get a real-time stock quote.

        Returns current price, daily change, volume, and OHLC data
        for the given ticker symbol.
        """
        symbol = pk.upper() if pk else ""
        if not symbol:
            return Response(
                {"error": "Symbol is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = get_quote(symbol)
        if data is None:
            return Response(
                {"error": f"No data available for {symbol}."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(data)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request: Request, pk=None) -> Response:
        """Get historical price data for a symbol.

        Supports period parameter: 1W, 1M, 3M, 1Y, ALL.
        Returns OHLCV data suitable for charting.
        """
        symbol = pk.upper() if pk else ""
        period = request.query_params.get("period", "1M")

        data = get_historical(symbol, period)
        if data is None:
            return Response(
                {"error": f"No historical data for {symbol}."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(data)

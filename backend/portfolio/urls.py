"""URL routing for portfolio API endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .export_views import export_portfolio_csv
from .views import HoldingViewSet, MarketDataViewSet, PortfolioViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r"portfolios", PortfolioViewSet, basename="portfolio")
router.register(r"holdings", HoldingViewSet, basename="holding")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"market", MarketDataViewSet, basename="market")

urlpatterns = [
    path("portfolio/export/", export_portfolio_csv, name="portfolio-export"),
    path("", include(router.urls)),
]

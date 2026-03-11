"""Tests for financial API client with mocked responses."""
from unittest.mock import MagicMock, patch

import pytest

from portfolio.api_clients import _cache, get_historical, get_quote


class TestGetQuote:
    def setup_method(self):
        _cache.clear()

    def test_returns_none_on_import_error(self):
        with patch.dict("sys.modules", {"yfinance": None}):
            _cache.clear()
            result = get_quote("AAPL")
        # When yfinance can't be imported, function catches the exception
        # and returns None
        assert result is None

    def test_cache_hit(self):
        _cache["quote:AAPL"] = (
            __import__("time").time(),
            {"symbol": "AAPL", "price": 175.0},
        )
        result = get_quote("AAPL")
        assert result is not None
        assert result["symbol"] == "AAPL"

    def test_symbol_uppercased(self):
        _cache["quote:AAPL"] = (
            __import__("time").time(),
            {"symbol": "AAPL", "price": 175.0},
        )
        result = get_quote("aapl")
        assert result is not None
        assert result["symbol"] == "AAPL"

    def test_yfinance_success(self):
        import pandas as pd

        mock_yf = MagicMock()
        mock_ticker = MagicMock()
        mock_yf.Ticker.return_value = mock_ticker
        mock_ticker.fast_info = MagicMock()
        mock_ticker.fast_info.long_name = "Apple Inc."
        mock_hist = pd.DataFrame({
            "Close": [170.0, 175.0],
            "High": [176.0, 177.0],
            "Low": [169.0, 173.0],
            "Open": [170.5, 174.0],
            "Volume": [50000000, 52000000],
        })
        mock_ticker.history.return_value = mock_hist

        _cache.clear()
        with patch.dict("sys.modules", {"yfinance": mock_yf}):
            result = get_quote("AAPL")
        assert result is not None
        assert result["price"] == 175.0


class TestGetHistorical:
    def setup_method(self):
        _cache.clear()

    def test_returns_none_on_import_error(self):
        with patch.dict("sys.modules", {"yfinance": None}):
            _cache.clear()
            result = get_historical("AAPL", "1M")
        assert result is None

    def test_cache_reuse(self):
        _cache["history:AAPL:1M"] = (
            __import__("time").time(),
            [{"date": "2025-01-01", "close": 175.0}],
        )
        result = get_historical("AAPL", "1M")
        assert result is not None
        assert len(result) == 1

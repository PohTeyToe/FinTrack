"""Tests for financial API client with mocked responses."""
from unittest.mock import MagicMock, patch

import pytest

from portfolio.api_clients import _cache, get_historical, get_quote


class TestGetQuote:
    def setup_method(self):
        _cache.clear()

    def test_mock_fallback_aapl(self):
        with patch("portfolio.api_clients.yf", side_effect=ImportError):
            result = get_quote("AAPL")
        assert result is not None
        assert result["symbol"] == "AAPL"

    def test_mock_fallback_unknown(self):
        with patch("portfolio.api_clients.yf", side_effect=ImportError):
            result = get_quote("ZZZZZ")
        assert result is None

    def test_cache_hit(self):
        _cache.clear()
        get_quote("AAPL")
        assert any("quote:AAPL" in k for k in _cache)

    def test_symbol_uppercased(self):
        result = get_quote("aapl")
        assert result is not None
        assert result["symbol"] == "AAPL"

    @patch("portfolio.api_clients.yf")
    def test_yfinance_success(self, mock_yf):
        import pandas as pd

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
        result = get_quote("AAPL")
        assert result is not None
        assert result["price"] == 175.0


class TestGetHistorical:
    def setup_method(self):
        _cache.clear()

    def test_mock_fallback(self):
        with patch("portfolio.api_clients.yf", side_effect=ImportError):
            result = get_historical("AAPL", "1M")
        assert result is not None
        assert len(result) > 0

    def test_unknown_symbol(self):
        with patch("portfolio.api_clients.yf", side_effect=ImportError):
            result = get_historical("ZZZZZ", "1M")
        assert result is None

    def test_cache_reuse(self):
        _cache.clear()
        get_historical("AAPL", "1M")
        assert any("history:AAPL:1M" in k for k in _cache)

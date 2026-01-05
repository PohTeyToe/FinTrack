"""Financial API client with caching and mock fallback.

Integrates with yfinance for real-time stock data and historical
prices. Caches responses to respect rate limits and falls back
to mock data when the API is unavailable.
"""
import os
import time
from typing import Any


# --- In-Memory Cache with TTL ---
_cache: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = int(os.getenv("MARKET_DATA_CACHE_TTL", "300"))

# Mock quotes used when yfinance is unavailable or during testing.
_MOCK_QUOTES: dict[str, dict[str, Any]] = {
    "AAPL": {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "price": 178.72,
        "change": 2.34,
        "change_percent": 1.33,
        "high": 180.12,
        "low": 176.55,
        "open": 177.25,
        "previous_close": 176.38,
        "volume": 52436789,
    },
    "GOOGL": {
        "symbol": "GOOGL",
        "name": "Alphabet Inc.",
        "price": 141.80,
        "change": -1.25,
        "change_percent": -0.87,
        "high": 143.50,
        "low": 140.20,
        "open": 142.80,
        "previous_close": 143.05,
        "volume": 21543678,
    },
    "MSFT": {
        "symbol": "MSFT",
        "name": "Microsoft Corp.",
        "price": 378.91,
        "change": 4.56,
        "change_percent": 1.22,
        "high": 380.25,
        "low": 374.10,
        "open": 375.50,
        "previous_close": 374.35,
        "volume": 18765432,
    },
    "TSLA": {
        "symbol": "TSLA",
        "name": "Tesla Inc.",
        "price": 251.28,
        "change": -8.42,
        "change_percent": -3.24,
        "high": 260.50,
        "low": 248.90,
        "open": 259.70,
        "previous_close": 259.70,
        "volume": 98765432,
    },
    "NVDA": {
        "symbol": "NVDA",
        "name": "NVIDIA Corp.",
        "price": 495.22,
        "change": 12.85,
        "change_percent": 2.66,
        "high": 498.50,
        "low": 480.25,
        "open": 482.37,
        "previous_close": 482.37,
        "volume": 45678901,
    },
}


def _get_from_cache(key: str) -> Any | None:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _set_cache(key: str, data: Any) -> None:
    _cache[key] = (time.time(), data)


def get_quote(symbol: str) -> dict[str, Any] | None:
    """Fetch a real-time stock quote.

    Tries yfinance first, falls back to mock data. Results are
    cached for MARKET_DATA_CACHE_TTL seconds.

    Args:
        symbol: Ticker symbol (e.g. AAPL).

    Returns:
        Quote dictionary or None if symbol is unknown.
    """
    symbol = symbol.upper()
    cache_key = f"quote:{symbol}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    try:
        import yfinance as yf

        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        hist = ticker.history(period="2d")

        if hist.empty:
            raise ValueError("No data returned")

        last_close = float(hist["Close"].iloc[-1])
        prev_close = (
            float(hist["Close"].iloc[-2]) if len(hist) > 1 else last_close
        )
        change = last_close - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0

        result = {
            "symbol": symbol,
            "name": getattr(info, "long_name", symbol),
            "price": round(last_close, 2),
            "change": round(change, 2),
            "change_percent": round(change_pct, 2),
            "high": round(float(hist["High"].iloc[-1]), 2),
            "low": round(float(hist["Low"].iloc[-1]), 2),
            "open": round(float(hist["Open"].iloc[-1]), 2),
            "previous_close": round(prev_close, 2),
            "volume": int(hist["Volume"].iloc[-1]),
        }
        _set_cache(cache_key, result)
        return result

    except Exception:
        # FIXME: yfinance rate limiting not handled gracefully
        # Fall back to mock data
        mock = _MOCK_QUOTES.get(symbol)
        if mock:
            _set_cache(cache_key, mock)
        return mock


def get_historical(
    symbol: str, period: str = "1M"
) -> list[dict[str, Any]] | None:
    """Fetch historical OHLCV data for charting.

    Tries yfinance first, falls back to generated mock data.
    Results are cached for MARKET_DATA_CACHE_TTL seconds.

    Args:
        symbol: Ticker symbol.
        period: One of 1W, 1M, 3M, 1Y, ALL.

    Returns:
        List of OHLCV dictionaries or None.
    """
    symbol = symbol.upper()
    cache_key = f"history:{symbol}:{period}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    period_map = {
        "1W": "5d",
        "1M": "1mo",
        "3M": "3mo",
        "1Y": "1y",
        "ALL": "5y",
    }
    yf_period = period_map.get(period, "1mo")

    try:
        import yfinance as yf

        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=yf_period)

        if hist.empty:
            raise ValueError("No data returned")

        records = []
        for date_idx, row in hist.iterrows():
            records.append(
                {
                    "date": date_idx.strftime("%Y-%m-%d"),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                }
            )

        _set_cache(cache_key, records)
        return records

    except Exception:
        # Generate mock historical data
        import numpy as np

        days_map = {"1W": 7, "1M": 30, "3M": 90, "1Y": 365, "ALL": 1825}
        num_days = days_map.get(period, 30)

        mock = _MOCK_QUOTES.get(symbol)
        if not mock:
            return None

        base_price = mock["price"]
        np.random.seed(hash(symbol) % 2**31)
        prices = [base_price]
        for _ in range(num_days - 1):
            change = base_price * np.random.normal(0, 0.015)
            prices.append(max(1, prices[-1] + change))

        from datetime import datetime, timedelta

        end = datetime.now().date()
        records = []
        for i, p in enumerate(prices):
            d = end - timedelta(days=num_days - 1 - i)
            records.append(
                {
                    "date": d.strftime("%Y-%m-%d"),
                    "open": round(p * 0.998, 2),
                    "high": round(p * 1.01, 2),
                    "low": round(p * 0.99, 2),
                    "close": round(p, 2),
                    "volume": int(np.random.randint(10_000_000, 80_000_000)),
                }
            )

        _set_cache(cache_key, records)
        return records

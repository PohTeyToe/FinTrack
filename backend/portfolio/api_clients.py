"""Financial API client with caching.

Integrates with yfinance for real-time stock data and historical
prices. Caches responses to respect rate limits and returns a clear
"data unavailable" response when the API is unreachable.
"""
import os
import time
from typing import Any


# --- In-Memory Cache with TTL ---
_cache: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = int(os.getenv("MARKET_DATA_CACHE_TTL", "300"))


def _get_from_cache(key: str) -> Any | None:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _set_cache(key: str, data: Any) -> None:
    _cache[key] = (time.time(), data)


def get_quote(symbol: str) -> dict[str, Any] | None:
    """Fetch a real-time stock quote via yfinance.

    Results are cached for MARKET_DATA_CACHE_TTL seconds.
    Returns None if yfinance is unavailable or the symbol is unknown.

    Args:
        symbol: Ticker symbol (e.g. AAPL).

    Returns:
        Quote dictionary or None if data is unavailable.
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
            return None

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
        return None


def get_historical(
    symbol: str, period: str = "1M"
) -> list[dict[str, Any]] | None:
    """Fetch historical OHLCV data for charting via yfinance.

    Results are cached for MARKET_DATA_CACHE_TTL seconds.
    Returns None when historical data is unavailable.

    Args:
        symbol: Ticker symbol.
        period: One of 1W, 1M, 3M, 1Y, ALL.

    Returns:
        List of OHLCV dictionaries, or None if data is unavailable.
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
            return None

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
        return None

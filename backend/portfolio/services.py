"""Pandas data processing pipelines for portfolio analytics.

Each function loads data from the database into DataFrames,
applies transformations, and returns structured results for the API.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

import numpy as np
import pandas as pd

from .models import Holding, Transaction

logger = logging.getLogger(__name__)

_YF_PERIOD_MAP = {"1W": "5d", "1M": "1mo", "3M": "3mo", "1Y": "1y", "ALL": "5y"}

_EMPTY_RETURNS = {
    "total_value": 0,
    "total_cost": 0,
    "total_gain": 0,
    "total_gain_percent": 0,
    "daily_change": 0,
    "period_return": 0,
    "time_series": [],
}

_VALID_PERIODS = {"1W", "1M", "3M", "1Y", "ALL"}


def _fetch_historical_prices(
    symbols: list[str], period: str
) -> pd.DataFrame | None:
    """Fetch historical closing prices from yfinance.

    Returns a DataFrame indexed by date with one column per symbol,
    or None if the download fails.
    """
    yf_period = _YF_PERIOD_MAP.get(period, "1mo")
    try:
        import yfinance as yf

        data = yf.download(
            tickers=symbols,
            period=yf_period,
            progress=False,
            threads=True,
        )
        if data.empty:
            return None

        # yf.download returns MultiIndex columns for multiple tickers
        if isinstance(data.columns, pd.MultiIndex):
            closes = data["Close"]
        else:
            # Single ticker -- column is just 'Close'
            closes = data[["Close"]].rename(columns={"Close": symbols[0]})

        closes = closes.dropna(how="all")
        if closes.empty:
            return None
        return closes
    except Exception:
        logger.warning("yfinance download failed for %s", symbols, exc_info=True)
        return None


def calculate_portfolio_returns(
    portfolio_id: int, period: str = "1M"
) -> dict[str, Any]:
    """Calculate portfolio return metrics over a given period.

    Fetches real historical closing prices from yfinance for each
    holding, computes a weighted portfolio value per day, and derives
    return metrics from the actual price history.

    Args:
        portfolio_id: Primary key of the portfolio.
        period: Time window -- one of 1W, 1M, 3M, 1Y, ALL.

    Returns:
        Dictionary with return metrics and a time-series of values.

    Raises:
        ValueError: If period is not a recognised time window.
    """
    if period not in _VALID_PERIODS:
        raise ValueError(
            f"Invalid period '{period}'. Must be one of {sorted(_VALID_PERIODS)}."
        )

    holdings = Holding.objects.filter(portfolio_id=portfolio_id)
    if not holdings.exists():
        return {**_EMPTY_RETURNS}

    df = pd.DataFrame(
        list(
            holdings.values(
                "symbol", "shares", "avg_cost", "current_price", "sector"
            )
        )
    )

    df["shares"] = df["shares"].astype(float)
    df["avg_cost"] = df["avg_cost"].astype(float)
    df["current_price"] = df["current_price"].astype(float)

    # Handle edge case where all holdings have zero shares
    if (df["shares"] == 0).all():
        return {**_EMPTY_RETURNS}

    df["market_value"] = df["shares"] * df["current_price"]
    df["cost_basis"] = df["shares"] * df["avg_cost"]
    df["gain_loss"] = df["market_value"] - df["cost_basis"]
    df["gain_loss_pct"] = np.where(
        df["cost_basis"] > 0,
        (df["gain_loss"] / df["cost_basis"]) * 100,
        0,
    )

    total_value = float(df["market_value"].sum())
    total_cost = float(df["cost_basis"].sum())
    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0

    # Build time series from real historical prices
    symbols = df["symbol"].tolist()
    shares_map = dict(zip(df["symbol"], df["shares"]))
    closes = _fetch_historical_prices(symbols, period)

    if closes is None or closes.empty:
        # No historical data available -- return metrics without time series
        return {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_percent": round(total_gain_pct, 2),
            "daily_change": 0,
            "period_return": 0,
            "holdings": df[
                ["symbol", "market_value", "gain_loss", "gain_loss_pct"]
            ].to_dict(orient="records"),
            "time_series": [],
            "data_source": "unavailable",
        }

    # Compute weighted portfolio value per day
    portfolio_values = pd.Series(0.0, index=closes.index)
    for sym in symbols:
        if sym in closes.columns:
            col = closes[sym].fillna(method="ffill")
            portfolio_values += col * shares_map[sym]

    # Drop any leading zeros from symbols missing early data
    portfolio_values = portfolio_values[portfolio_values > 0]

    if portfolio_values.empty:
        return {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_percent": round(total_gain_pct, 2),
            "daily_change": 0,
            "period_return": 0,
            "holdings": df[
                ["symbol", "market_value", "gain_loss", "gain_loss_pct"]
            ].to_dict(orient="records"),
            "time_series": [],
            "data_source": "unavailable",
        }

    time_series = [
        {"date": d.strftime("%Y-%m-%d"), "value": round(float(v), 2)}
        for d, v in zip(portfolio_values.index, portfolio_values.values)
    ]

    values = portfolio_values.values
    daily_change = float(values[-1] - values[-2]) if len(values) > 1 else 0
    period_return = (
        ((values[-1] - values[0]) / values[0]) * 100 if values[0] > 0 else 0
    )

    return {
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain": round(total_gain, 2),
        "total_gain_percent": round(total_gain_pct, 2),
        "daily_change": round(float(daily_change), 2),
        "period_return": round(float(period_return), 2),
        "holdings": df[
            ["symbol", "market_value", "gain_loss", "gain_loss_pct"]
        ].to_dict(orient="records"),
        "time_series": time_series,
        "data_source": "yfinance",
    }



# --- Sector Allocation Pipeline ---
def portfolio_allocation_analysis(portfolio_id: int) -> dict[str, Any]:
    """Analyse sector allocation and diversification metrics.

    Groups holdings by sector, computes percentage weights, and
    calculates a Herfindahl-Hirschman Index for concentration.

    Args:
        portfolio_id: Primary key of the portfolio.

    Returns:
        Dictionary with sector breakdown and diversification score.
    """
    holdings = Holding.objects.filter(portfolio_id=portfolio_id)
    if not holdings.exists():
        return {"sectors": [], "hhi": 0, "diversification_score": 0}

    df = pd.DataFrame(
        list(holdings.values("symbol", "shares", "current_price", "sector"))
    )

    df["shares"] = df["shares"].astype(float)
    df["current_price"] = df["current_price"].astype(float)
    df["market_value"] = df["shares"] * df["current_price"]

    total = df["market_value"].sum()
    if total == 0:
        return {"sectors": [], "hhi": 0, "diversification_score": 0}

    sector_df = (
        df.groupby("sector")
        .agg(
            value=("market_value", "sum"),
            count=("symbol", "count"),
            symbols=("symbol", list),
        )
        .reset_index()
    )
    sector_df["percentage"] = (sector_df["value"] / total) * 100

    # Herfindahl-Hirschman Index (lower = more diversified)
    hhi = float((sector_df["percentage"] ** 2).sum())
    max_hhi = 10000  # single sector
    diversification = max(0, (1 - hhi / max_hhi)) * 100

    sectors = sector_df.sort_values("value", ascending=False).to_dict(
        orient="records"
    )
    for s in sectors:
        s["value"] = round(s["value"], 2)
        s["percentage"] = round(s["percentage"], 2)

    return {
        "sectors": sectors,
        "hhi": round(hhi, 2),
        "diversification_score": round(diversification, 2),
    }

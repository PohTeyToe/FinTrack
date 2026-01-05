"""Pandas analytics pipelines for spending pattern analysis.

Provides functions for aggregating spending data, detecting trends,
identifying anomalies, and generating summary reports.
"""
from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd

from .models import SpendingEntry


def analyze_spending_patterns(
    user_id: int, period: str = "3M"
) -> dict[str, Any]:
    """Analyse spending patterns over a given period.

    Loads spending entries into a DataFrame, groups by category,
    computes monthly trends, and identifies anomalies where
    spending exceeds two standard deviations from the mean.

    Args:
        user_id: Primary key of the user.
        period: Time window -- 1M, 3M, 6M, 1Y.

    Returns:
        Dictionary with category breakdown, trends, and anomalies.
    """
    days_map = {"1M": 30, "3M": 90, "6M": 180, "1Y": 365}
    lookback = days_map.get(period, 90)
    cutoff = date.today() - timedelta(days=lookback)

    entries = SpendingEntry.objects.filter(
        category__user_id=user_id,
        date__gte=cutoff,
    ).select_related("category")

    if not entries.exists():
        return {
            "total": 0,
            "categories": [],
            "monthly_trend": [],
            "anomalies": [],
        }

    data = [
        {
            "amount": float(e.amount),
            "category": e.category.name,
            "color": e.category.color,
            "date": e.date,
        }
        for e in entries
    ]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])

    total = float(df["amount"].sum())

    # Category breakdown
    cat_df = (
        df.groupby(["category", "color"])
        .agg(amount=("amount", "sum"), count=("amount", "count"))
        .reset_index()
        .sort_values("amount", ascending=False)
    )
    cat_df["percentage"] = (cat_df["amount"] / total) * 100
    categories = cat_df.to_dict(orient="records")
    for c in categories:
        c["amount"] = round(c["amount"], 2)
        c["percentage"] = round(c["percentage"], 2)

    # Monthly trend
    df["month"] = df["date"].dt.to_period("M")
    monthly = (
        df.groupby("month")
        .agg(amount=("amount", "sum"), count=("amount", "count"))
        .reset_index()
    )
    monthly["month_str"] = monthly["month"].astype(str)
    monthly_trend = [
        {
            "month": row["month_str"],
            "amount": round(float(row["amount"]), 2),
            "count": int(row["count"]),
        }
        for _, row in monthly.iterrows()
    ]

    # Anomaly detection: spending > 2 std devs in any category/month
    anomalies = []
    for cat in df["category"].unique():
        cat_data = df[df["category"] == cat].copy()
        cat_monthly = cat_data.groupby("month")["amount"].sum()
        if len(cat_monthly) > 1:
            mean_val = float(cat_monthly.mean())
            std_val = float(cat_monthly.std())
            if std_val > 0:
                for month, amount in cat_monthly.items():
                    if float(amount) > mean_val + 2 * std_val:
                        anomalies.append(
                            {
                                "category": cat,
                                "month": str(month),
                                "amount": round(float(amount), 2),
                                "expected": round(mean_val, 2),
                                "deviation": round(
                                    (float(amount) - mean_val) / std_val, 2
                                ),
                            }
                        )

    return {
        "total": round(total, 2),
        "categories": categories,
        "monthly_trend": monthly_trend,
        "anomalies": anomalies,
    }



# --- Trend Detection Pipeline ---
def detect_trends(user_id: int) -> dict[str, Any]:
    """Detect spending trends using rolling averages and linear regression.

    Computes 7-day and 30-day rolling averages, fits a linear trend
    line, and estimates whether spending is increasing or decreasing.

    Args:
        user_id: Primary key of the user.

    Returns:
        Dictionary with trend direction, slope, and rolling averages.
    """
    cutoff = date.today() - timedelta(days=180)
    entries = SpendingEntry.objects.filter(
        category__user_id=user_id,
        date__gte=cutoff,
    )

    if not entries.exists():
        return {
            "direction": "stable",
            "slope": 0,
            "rolling_7d": [],
            "rolling_30d": [],
        }

    data = [
        {"amount": float(e.amount), "date": e.date}
        for e in entries
    ]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])

    # Aggregate by day
    daily = df.groupby("date")["amount"].sum().reset_index()
    daily = daily.set_index("date").resample("D").sum().fillna(0).reset_index()

    # Rolling averages
    daily["rolling_7d"] = daily["amount"].rolling(window=7, min_periods=1).mean()
    daily["rolling_30d"] = daily["amount"].rolling(window=30, min_periods=1).mean()

    # Linear regression for trend
    daily["day_num"] = np.arange(len(daily))
    if len(daily) > 1:
        coeffs = np.polyfit(daily["day_num"], daily["amount"], 1)
        slope = float(coeffs[0])
    else:
        slope = 0

    direction = "increasing" if slope > 0.5 else "decreasing" if slope < -0.5 else "stable"

    rolling_7d = [
        {"date": row["date"].strftime("%Y-%m-%d"), "value": round(float(row["rolling_7d"]), 2)}
        for _, row in daily.iterrows()
    ]
    rolling_30d = [
        {"date": row["date"].strftime("%Y-%m-%d"), "value": round(float(row["rolling_30d"]), 2)}
        for _, row in daily.iterrows()
    ]

    return {
        "direction": direction,
        "slope": round(slope, 4),
        "rolling_7d": rolling_7d,
        "rolling_30d": rolling_30d,
    }


def generate_spending_report(
    user_id: int, start_date: date, end_date: date
) -> dict[str, Any]:
    """Generate a spending report for a date range.

    Full pandas pipeline producing summary statistics, category
    breakdowns, daily aggregates, and comparison with prior period.

    Args:
        user_id: Primary key of the user.
        start_date: Start of the reporting period.
        end_date: End of the reporting period.

    Returns:
        Dictionary with detailed spending analytics.
    """
    entries = SpendingEntry.objects.filter(
        category__user_id=user_id,
        date__gte=start_date,
        date__lte=end_date,
    ).select_related("category")

    period_days = (end_date - start_date).days + 1
    prior_start = start_date - timedelta(days=period_days)
    prior_end = start_date - timedelta(days=1)

    prior_entries = SpendingEntry.objects.filter(
        category__user_id=user_id,
        date__gte=prior_start,
        date__lte=prior_end,
    )

    if not entries.exists():
        return {
            "period": {"start": str(start_date), "end": str(end_date)},
            "total": 0,
            "daily_average": 0,
            "categories": [],
            "daily_totals": [],
            "prior_period_total": 0,
            "change_percent": 0,
        }

    data = [
        {
            "amount": float(e.amount),
            "category": e.category.name,
            "date": e.date,
        }
        for e in entries
    ]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])

    total = float(df["amount"].sum())
    daily_avg = total / period_days if period_days > 0 else 0

    # Category breakdown
    cat_summary = (
        df.groupby("category")
        .agg(
            total=("amount", "sum"),
            count=("amount", "count"),
            avg=("amount", "mean"),
            max_single=("amount", "max"),
        )
        .reset_index()
        .sort_values("total", ascending=False)
    )
    cat_summary["percentage"] = (cat_summary["total"] / total) * 100

    categories = []
    for _, row in cat_summary.iterrows():
        categories.append(
            {
                "category": row["category"],
                "total": round(float(row["total"]), 2),
                "count": int(row["count"]),
                "average": round(float(row["avg"]), 2),
                "max_single": round(float(row["max_single"]), 2),
                "percentage": round(float(row["percentage"]), 2),
            }
        )

    # Daily totals
    daily = df.groupby("date")["amount"].sum().reset_index()
    daily_totals = [
        {"date": row["date"].strftime("%Y-%m-%d"), "amount": round(float(row["amount"]), 2)}
        for _, row in daily.iterrows()
    ]

    # Prior period comparison
    prior_total = float(
        sum(float(e.amount) for e in prior_entries)
    )
    change_pct = (
        ((total - prior_total) / prior_total * 100) if prior_total > 0 else 0
    )

    return {
        "period": {"start": str(start_date), "end": str(end_date)},
        "total": round(total, 2),
        "daily_average": round(daily_avg, 2),
        "categories": categories,
        "daily_totals": daily_totals,
        "prior_period_total": round(prior_total, 2),
        "change_percent": round(change_pct, 2),
    }

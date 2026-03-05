"""CSV export views for portfolio data."""
import csv

from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request

from .models import Holding, Transaction


@api_view(["GET"])
def export_portfolio_csv(request: Request) -> HttpResponse:
    """Export the authenticated user's holdings and transactions as CSV."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="portfolio_export.csv"'

    writer = csv.writer(response)

    # Holdings section
    writer.writerow(["--- Holdings ---"])
    writer.writerow([
        "Symbol", "Name", "Shares", "Avg Cost", "Current Price",
        "Market Value", "Gain/Loss", "Gain/Loss %", "Sector",
    ])
    holdings = Holding.objects.filter(
        portfolio__user=request.user
    ).select_related("portfolio")
    for h in holdings:
        writer.writerow([
            h.symbol,
            h.name,
            float(h.shares),
            float(h.avg_cost),
            float(h.current_price),
            round(h.market_value, 2),
            round(h.gain_loss, 2),
            round(h.gain_loss_percent, 2),
            h.sector,
        ])

    writer.writerow([])

    # Transactions section
    writer.writerow(["--- Transactions ---"])
    writer.writerow([
        "Symbol", "Type", "Shares", "Price", "Fees", "Date", "Notes",
    ])
    transactions = Transaction.objects.filter(
        holding__portfolio__user=request.user
    ).select_related("holding")
    for t in transactions:
        writer.writerow([
            t.holding.symbol,
            t.type,
            float(t.shares),
            float(t.price),
            float(t.fees),
            t.date.isoformat(),
            t.notes,
        ])

    return response

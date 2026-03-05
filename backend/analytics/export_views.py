"""CSV export views for spending data."""
import csv

from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request

from .models import SpendingEntry


@api_view(["GET"])
def export_spending_csv(request: Request) -> HttpResponse:
    """Export the authenticated user's spending entries as CSV."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="spending_export.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "Category", "Amount", "Description", "Date", "Recurring",
    ])

    entries = SpendingEntry.objects.filter(
        category__user=request.user
    ).select_related("category").order_by("-date")

    for entry in entries:
        writer.writerow([
            entry.category.name,
            float(entry.amount),
            entry.description,
            entry.date.isoformat(),
            entry.recurring,
        ])

    return response

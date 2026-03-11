import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WatchlistItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("symbol", models.CharField(max_length=10)),
                ("name", models.CharField(blank=True, default="", max_length=200)),
                ("target_price", models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True)),
                ("alert_type", models.CharField(choices=[("ABOVE", "Price Above"), ("BELOW", "Price Below")], default="ABOVE", max_length=5)),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="watchlist_items", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "watchlist item",
                "verbose_name_plural": "watchlist items",
                "ordering": ["-created_at"],
                "unique_together": {("user", "symbol")},
            },
        ),
        migrations.CreateModel(
            name="PriceAlert",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("triggered_at", models.DateTimeField(auto_now_add=True)),
                ("price_at_trigger", models.DecimalField(decimal_places=4, max_digits=12)),
                ("watchlist_item", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="alerts", to="watchlist.watchlistitem")),
            ],
            options={
                "verbose_name": "price alert",
                "verbose_name_plural": "price alerts",
                "ordering": ["-triggered_at"],
            },
        ),
    ]

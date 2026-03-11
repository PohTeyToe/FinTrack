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
            name="Portfolio",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="portfolios", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "portfolio",
                "verbose_name_plural": "portfolios",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Holding",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("symbol", models.CharField(max_length=10)),
                ("name", models.CharField(blank=True, default="", max_length=200)),
                ("shares", models.DecimalField(decimal_places=4, max_digits=12)),
                ("avg_cost", models.DecimalField(decimal_places=4, max_digits=12)),
                ("current_price", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("sector", models.CharField(choices=[("technology", "Technology"), ("healthcare", "Healthcare"), ("financial", "Financial"), ("consumer", "Consumer"), ("energy", "Energy"), ("industrial", "Industrial"), ("utilities", "Utilities"), ("real_estate", "Real Estate"), ("materials", "Materials"), ("communication", "Communication"), ("other", "Other")], default="other", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("portfolio", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="holdings", to="portfolio.portfolio")),
            ],
            options={
                "verbose_name": "holding",
                "verbose_name_plural": "holdings",
                "ordering": ["-created_at"],
                "unique_together": {("portfolio", "symbol")},
            },
        ),
        migrations.CreateModel(
            name="Transaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(choices=[("BUY", "Buy"), ("SELL", "Sell"), ("DIVIDEND", "Dividend")], max_length=10)),
                ("shares", models.DecimalField(decimal_places=4, max_digits=12)),
                ("price", models.DecimalField(decimal_places=4, max_digits=12)),
                ("fees", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("date", models.DateField()),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("holding", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transactions", to="portfolio.holding")),
            ],
            options={
                "verbose_name": "transaction",
                "verbose_name_plural": "transactions",
                "ordering": ["-date", "-created_at"],
            },
        ),
    ]

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
            name="SpendingCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("budget_limit", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("color", models.CharField(default="#6b7280", max_length=7)),
                ("icon", models.CharField(blank=True, default="", max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="spending_categories", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "spending category",
                "verbose_name_plural": "spending categories",
                "ordering": ["name"],
                "unique_together": {("user", "name")},
            },
        ),
        migrations.CreateModel(
            name="SpendingEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("description", models.CharField(blank=True, default="", max_length=255)),
                ("date", models.DateField()),
                ("recurring", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="entries", to="analytics.spendingcategory")),
            ],
            options={
                "verbose_name": "spending entry",
                "verbose_name_plural": "spending entries",
                "ordering": ["-date", "-created_at"],
            },
        ),
    ]

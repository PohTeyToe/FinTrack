from django.contrib import admin

from .models import SpendingCategory, SpendingEntry

admin.site.register(SpendingCategory)
admin.site.register(SpendingEntry)

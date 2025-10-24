from django.contrib import admin

from .models import PriceAlert, WatchlistItem

admin.site.register(WatchlistItem)
admin.site.register(PriceAlert)

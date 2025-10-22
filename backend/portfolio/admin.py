from django.contrib import admin

from .models import Holding, Portfolio, Transaction

admin.site.register(Portfolio)
admin.site.register(Holding)
admin.site.register(Transaction)

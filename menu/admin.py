from django.contrib import admin
from .models import Category, Item, CallWaiter , Table

admin.site.register(Category)
admin.site.register(Item)
admin.site.register(CallWaiter)  
admin.site.register(Table)
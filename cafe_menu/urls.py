from django.contrib import admin
from django.urls import path
from menu import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('items/<int:category_id>/', views.get_items, name='get_items'),
    path('call_waiter/', views.call_waiter, name='call_waiter'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('notifications/', views.get_notifications, name='get_notifications'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Category, Item, CallWaiter, Table
from django.utils import timezone
from datetime import timedelta
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from .forms import AdminLoginForm
from jdatetime import datetime as jdatetime
import asyncio
from asgiref.sync import sync_to_async
from django.utils.timezone import localtime

def index(request):
    categories = Category.objects.all()
    tables = Table.objects.all().order_by('number')
    return render(request, 'index.html', {'categories': categories, 'tables': tables})

def get_items(request, category_id):
    items = Item.objects.filter(category_id=category_id)
    data = [
        {
            'name': item.name,
            'description': item.description,
            'image': item.image.url if item.image else None,
            'available': item.available,
            'price': str(item.price),
        } for item in items
    ]
    return JsonResponse(data, safe=False)

@csrf_exempt
def call_waiter(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            table = data.get('table')
            if table:
                table_num = int(table)
                CallWaiter.objects.create(table_number=table_num)
                return JsonResponse({'status': 'success'})
            return JsonResponse({'status': 'error', 'message': 'No table selected'}, status=400)
        except ValueError:
            return JsonResponse({'status': 'error', 'message': 'Invalid table number'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error'}, status=405)

def dashboard(request):
    if request.method == 'POST':
        form = AdminLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user and user.is_superuser:
                login(request, user)
                return redirect('dashboard')
            else:
                form.add_error(None, 'Invalid credentials or not superuser')
    else:
        form = AdminLoginForm()

    if request.user.is_authenticated and request.user.is_superuser:
        return render(request, 'dashboard.html', {'form': None})
    else:
        return render(request, 'dashboard.html', {'form': form})

async def get_notifications(request):
    now = timezone.now()
    two_min_ago = now - timedelta(minutes=2)
    last_time = request.GET.get('last_time')
    if last_time:
        try:
            last_dt = timezone.datetime.fromisoformat(last_time)
        except ValueError:
            last_dt = two_min_ago
    else:
        last_dt = two_min_ago

    start_time = now
    while (now - start_time) < timedelta(seconds=30):
        now = timezone.now()  # Update now inside loop
        notifications_qs = CallWaiter.objects.filter(timestamp__gt=last_dt, timestamp__lte=now).order_by('-timestamp')
        exists = await sync_to_async(notifications_qs.exists)()
        if exists:
            notifications = await sync_to_async(list)(notifications_qs)
            latest_time = notifications[0].timestamp.isoformat()
            data = [
                {
                    'table': n.table_number,
                    'time': jdatetime.fromgregorian(datetime=localtime(n.timestamp)).strftime('%Y/%m/%d %H:%M:%S'),
                } for n in notifications
            ]
            return JsonResponse({'notifications': data, 'last_time': latest_time})
        await asyncio.sleep(1)

    # Timeout
    return JsonResponse({'notifications': [], 'last_time': now.isoformat()})
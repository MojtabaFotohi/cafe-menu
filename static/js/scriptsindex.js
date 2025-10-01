// Preloader
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('preloader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none';
        }, 500);
    }, 1500);
});

// AJAX for categories
const tabs = document.querySelectorAll('.category-tab');
const itemsContainer = document.getElementById('items-container');

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const categoryId = e.target.dataset.categoryId;
        
        // Add loading state
        itemsContainer.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>';
        
        fetch(`/items/${categoryId}/`)
            .then(response => response.json())
            .then(data => {
                itemsContainer.innerHTML = '';
                if (data.length === 0) {
                    itemsContainer.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><p class="text-lg">موردی یافت نشد</p></div>';
                    return;
                }
                data.forEach(item => {
                    const card = document.createElement('div');
                    card.classList.add('item-card', 'p-6', 'flex', 'flex-col');
                    card.innerHTML = `
                        ${item.image ? `<div class="w-full h-56 mb-4 rounded-xl overflow-hidden"><img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"></div>` : '<div class="w-full h-56 mb-4 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-20 h-20 text-amber-300"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>'}
                        <h3 class="text-xl font-bold mb-3 text-gray-800">${item.name}</h3>
                        <p class="text-sm text-gray-600 mb-4 flex-grow leading-relaxed">${item.description}</p>
                        <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                            <span class="price-badge">
                            ${Math.floor(item.price).toLocaleString('fa-IR')} تومان
                            </span>
                            <span class="available-badge ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                <span class="w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-red-500'}"></span>
                                ${item.available ? 'موجود' : 'ناموجود'}
                            </span>
                        </div>
                    `;
                    itemsContainer.appendChild(card);
                });
            })
            .catch(error => {
                itemsContainer.innerHTML = '<div class="col-span-full text-center py-12 text-red-500"><p class="text-lg">خطا در بارگذاری اطلاعات</p></div>';
                console.error('Error:', error);
            });
    });
});

// Load first category on page load
if (tabs.length > 0) {
    tabs[0].click();
}

// Function to get CSRF token from cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Call Waiter with CSRF and per-table rate limit
const lastCallTimes = {};
document.getElementById('call-waiter-btn').addEventListener('click', () => {
    const table = document.getElementById('table-select').value;
    if (!table) {
        showToast('لطفاً شماره میز را انتخاب کنید.', 'error');
        return;
    }
    const now = new Date();
    const lastCall = lastCallTimes[table];
    if (lastCall && (now - lastCall) < 60000) {
        showToast('گارسون در حال آمدن است!', 'info');
        return;
    }
    const csrfToken = getCookie('csrftoken');
    fetch('/call_waiter/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ table: table })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            lastCallTimes[table] = new Date();
            showToast('گارسون احضار شد!', 'success');
        } else {
            showToast(data.message || 'خطایی رخ داد.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('خطایی رخ داد. لطفاً دوباره امتحان کنید.', 'error');
    });
});

// Function to show toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastText = toast.querySelector('span');
    const toastIcon = toast.querySelector('svg');
    
    toastText.textContent = message;
    
    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500');
    
    if (type === 'success') {
        toast.classList.add('bg-green-500');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />';
    } else if (type === 'error') {
        toast.classList.add('bg-red-500');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';
    } else if (type === 'info') {
        toast.classList.add('bg-blue-500');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />';
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}
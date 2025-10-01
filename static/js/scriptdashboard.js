let lastTime = '';
let notificationCount = 0;
const AUTO_DISMISS_TIME = 60000; // 60 seconds in milliseconds

// Load dismissed notifications from localStorage
const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');

async function fetchNotifications() {
    let url = '/notifications/';
    if (lastTime) {
        url += `?last_time=${encodeURIComponent(lastTime)}`;
    }
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.notifications && data.notifications.length > 0) {
            updateNotifications(data.notifications);
            lastTime = data.last_time;
            notificationCount += data.notifications.length;
        } else {
            lastTime = data.last_time || new Date().toISOString();
        }
        
        updateEmptyState();
    } catch (error) {
        console.error('Error fetching notifications:', error);
    } finally {
        setTimeout(fetchNotifications, 2000);
    }
}

function updateEmptyState() {
    const container = document.getElementById('notifications-container');
    const emptyState = document.getElementById('empty-state');
    if (container.children.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

function dismissNotification(element) {
    const notifId = element.dataset.notifId;
    // Add to dismissed notifications
    dismissedNotifications.push(notifId);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications));
    
    element.classList.add('removing');
    setTimeout(() => {
        element.remove();
        updateEmptyState();
    }, 500);
}

function updateNotifications(newNotifs) {
    const container = document.getElementById('notifications-container');
    newNotifs.forEach(notif => {
        const notifId = `${notif.table}-${notif.time}`;
        
        // Check if notification was dismissed
        if (dismissedNotifications.includes(notifId)) {
            return; // Skip if already dismissed
        }
        
        // Check for duplicates
        const existing = Array.from(container.children).find(el => 
            el.dataset.notifId === notifId
        );
        
        if (!existing) {
            const div = document.createElement('div');
            div.classList.add('notification-card');
            div.dataset.notifId = notifId;
            div.dataset.createdAt = Date.now();
            
            div.innerHTML = `
                <div class="flex items-start gap-5">
                    <div class="notification-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="notification-table mb-2">میز ${notif.table} صدات کرده! 👋</p>
                        <p class="notification-time">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${notif.time}
                        </p>
                    </div>
                    <div class="stats-badge">
                        جدید
                    </div>
                </div>
            `;
            container.appendChild(div);
            
            // Set auto-dismiss timer
            setTimeout(() => {
                if (document.body.contains(div)) {
                    dismissNotification(div);
                }
            }, AUTO_DISMISS_TIME);
        }
    });
    
    // Sort cards by time (oldest first)
    const cards = Array.from(container.children);
    cards.sort((a, b) => {
        const timeA = parseInt(a.dataset.createdAt);
        const timeB = parseInt(b.dataset.createdAt);
        return timeA - timeB;
    });
    container.innerHTML = '';
    cards.forEach(card => container.appendChild(card));
}

// Start fetching
fetchNotifications();
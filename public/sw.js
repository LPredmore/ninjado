// Service Worker for NinjaDo PWA
const CACHE_NAME = 'ninjado-v1';
const STATIC_CACHE = 'ninjado-static-v1';

// Files to cache
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Network First strategy with fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache and it's navigation, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Push notification handler (for future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View Task'
        },
        {
          action: 'complete',
          title: 'Mark Complete'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'complete') {
    // Handle task completion logic
    event.waitUntil(
      clients.openWindow('/') 
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
// Service Worker for NinjaDo PWA with Auto-Update Support
const BUILD_TIME = Date.now();
const CACHE_NAME = `ninjado-v${BUILD_TIME}`;
const STATIC_CACHE = `ninjado-static-v${BUILD_TIME}`;

console.log('[SW] Service Worker Version:', BUILD_TIME);

// Files to cache
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/ninjado-logo-180.png',
  '/ninjado-logo-192.png',
  '/ninjado-logo-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker, version:', BUILD_TIME);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_RESOURCES))
      .then(() => {
        console.log('[SW] Static resources cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker, version:', BUILD_TIME);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete ALL caches that don't match current version
              const isOldCache = cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE;
              if (isOldCache) {
                console.log('[SW] Deleting old cache:', cacheName);
              }
              return isOldCache;
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        return self.clients.claim();
      })
      .then(() => {
        console.log('[SW] Service worker now controls all clients');
      })
  );
});

// Fetch event - Network First strategy with fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for Supabase API calls
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache successful responses (but not HTML navigation requests)
        if (response.status === 200 && event.request.method === 'GET') {
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

// Listen for SKIP_WAITING message from client
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting and taking control immediately');
    self.skipWaiting();
  }
});

// Push notification handler (for future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/ninjado-logo-192.png',
      badge: '/ninjado-logo-192.png',
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

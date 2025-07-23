const CACHE_NAME = 'talktime-v2';
const STATIC_CACHE = 'talktime-static-v2';
const DYNAMIC_CACHE = 'talktime-dynamic-v2';

// Core assets to cache immediately
const staticAssets = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(staticAssets);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategies
const isApiRequest = (url) => url.includes('/api/');
const isStaticAsset = (url) => /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2|woff|ttf)$/.test(url);

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-HTTP(S) requests
  if (!url.startsWith('http')) {
    return;
  }

  // Apply different strategies based on request type
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url) || request.destination === 'document') {
    event.respondWith(cacheFirst(request));
  } else {
    // Default to network-first for other requests
    event.respondWith(networkFirst(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Get pending messages from IndexedDB
  const pendingMessages = await getPendingMessages();
  
  for (const message of pendingMessages) {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      // Remove from pending after successful sync
      await removePendingMessage(message.id);
    } catch (error) {
      console.error('[Service Worker] Failed to sync message:', error);
    }
  }
}

// IndexedDB helpers (simplified)
async function getPendingMessages() {
  // Implementation would use IndexedDB to get pending messages
  return [];
}

async function removePendingMessage(id) {
  // Implementation would remove message from IndexedDB
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
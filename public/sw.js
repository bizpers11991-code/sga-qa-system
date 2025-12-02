/**
 * SGA QA System - Enhanced Service Worker
 *
 * Provides comprehensive offline capabilities:
 * - Static asset caching (app shell)
 * - API response caching with stale-while-revalidate
 * - Offline form submission queue
 * - Background sync for pending submissions
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `sga-qa-static-${CACHE_VERSION}`;
const API_CACHE = `sga-qa-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `sga-qa-images-${CACHE_VERSION}`;

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// API endpoints that can be cached
const CACHEABLE_API_PATTERNS = [
  '/api/get-foremen',
  '/api/get-resources',
  '/api/get-itp-templates',
  '/api/get-dashboard-stats',
];

// API endpoints for write operations (queue for sync)
const SYNC_API_PATTERNS = [
  '/api/save-',
  '/api/create-',
  '/api/update-',
  '/api/submit-',
];

// IndexedDB for offline queue
const DB_NAME = 'sga-qa-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'submission-queue';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Add to offline queue
async function addToQueue(request, body) {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);

    await store.add({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
    });

    console.log('[SW] Added to offline queue:', request.url);
  } catch (error) {
    console.error('[SW] Failed to add to queue:', error);
  }
}

// Process offline queue
async function processQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const items = await store.getAll();

    console.log('[SW] Processing offline queue:', items.length, 'items');

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        if (response.ok) {
          // Remove from queue on success
          await store.delete(item.id);
          console.log('[SW] Synced:', item.url);

          // Notify clients
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              url: item.url,
              timestamp: item.timestamp,
            });
          });
        }
      } catch (error) {
        console.error('[SW] Sync failed for:', item.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Queue processing failed:', error);
  }
}

// Check if request matches patterns
function matchesPatterns(url, patterns) {
  return patterns.some(pattern => url.includes(pattern));
}

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('sga-qa-') &&
                     name !== STATIC_CACHE &&
                     name !== API_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET/POST requests and external URLs
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle navigation and static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = request.url;

  // For write operations, try network first
  if (matchesPatterns(url, SYNC_API_PATTERNS) && request.method === 'POST') {
    try {
      const response = await fetch(request.clone());
      return response;
    } catch (error) {
      // Network failed - queue for later sync
      const body = await request.text();
      await addToQueue(request, body);

      // Return a fake success response
      return new Response(
        JSON.stringify({
          success: true,
          queued: true,
          message: 'Saved offline. Will sync when back online.',
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // For cacheable GET requests, use stale-while-revalidate
  if (matchesPatterns(url, CACHEABLE_API_PATTERNS) && request.method === 'GET') {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => cachedResponse);

    // Return cached version immediately if available, otherwise wait for network
    return cachedResponse || fetchPromise;
  }

  // Default: network only
  return fetch(request);
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder image if offline
    return new Response('', { status: 404 });
  }
}

// Handle static requests with cache-first, network fallback
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Try network
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // For navigation requests, return cached index.html
    if (request.mode === 'navigate') {
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }

    // Return offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - SGA QA System</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; background: #f5f5f5; }
            h1 { color: #d97706; }
            p { color: #666; }
            button { background: #d97706; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>You're Offline</h1>
          <p>The SGA QA System requires an internet connection.</p>
          <p>Your pending submissions will sync automatically when you're back online.</p>
          <button onclick="location.reload()">Try Again</button>
        </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-submissions') {
    event.waitUntil(processQueue());
  }
});

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.url,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Message event for manual sync trigger
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data === 'SYNC_NOW') {
    processQueue();
  }
});

console.log('[SW] Service worker loaded');

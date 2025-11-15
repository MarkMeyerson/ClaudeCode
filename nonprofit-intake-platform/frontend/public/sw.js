/**
 * Service Worker for Non-Profit Intake Platform
 * Provides offline functionality, background sync, and push notifications
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `nonprofit-platform-${CACHE_VERSION}`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Runtime cache configurations
const RUNTIME_CACHE_CONFIG = {
  images: {
    cacheName: 'images-cache',
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  api: {
    cacheName: 'api-cache',
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  documents: {
    cacheName: 'documents-cache',
    maxEntries: 50,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
  },
};

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      console.log('[ServiceWorker] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('nonprofit-platform-')) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE_CONFIG.api));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE_CONFIG.images));
    return;
  }

  // Handle document requests
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE_CONFIG.documents));
    return;
  }

  // Handle all other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/offline');
        }
      });
    })
  );
});

// Network-first strategy with cache fallback
async function networkFirstStrategy(request, cacheConfig) {
  const cache = await caches.open(cacheConfig.cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Cache-first strategy with network fallback
async function cacheFirstStrategy(request, cacheConfig) {
  const cache = await caches.open(cacheConfig.cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });

    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse && networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncAssessments());
  } else if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  }
});

async function syncAssessments() {
  console.log('[ServiceWorker] Syncing assessments...');

  try {
    const db = await openDatabase();
    const pendingAssessments = await getPendingAssessments(db);

    for (const assessment of pendingAssessments) {
      try {
        await fetch('/api/assessments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessment),
        });

        await markAssessmentSynced(db, assessment.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync assessment:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync assessments failed:', error);
    throw error;
  }
}

async function syncDocuments() {
  console.log('[ServiceWorker] Syncing documents...');
  // Implementation similar to syncAssessments
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Non-Profit Platform';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'notification',
    data: data.url || '/',
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there's already a window open
          for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Periodic background sync for compliance alerts
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic sync:', event.tag);

  if (event.tag === 'check-compliance') {
    event.waitUntil(checkComplianceDeadlines());
  }
});

async function checkComplianceDeadlines() {
  try {
    const response = await fetch('/api/compliance/upcoming');
    const deadlines = await response.json();

    // Show notification for upcoming deadlines
    for (const deadline of deadlines.filter(d => d.daysUntil <= 7)) {
      self.registration.showNotification('Compliance Deadline Approaching', {
        body: `${deadline.requirementName} is due in ${deadline.daysUntil} days`,
        icon: '/icons/icon-192x192.png',
        tag: `compliance-${deadline.id}`,
        data: `/compliance/${deadline.id}`,
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to check compliance:', error);
  }
}

// IndexedDB helpers for offline storage
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nonprofit-platform', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('assessments')) {
        db.createObjectStore('assessments', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingAssessments(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['assessments'], 'readonly');
    const store = transaction.objectStore('assessments');
    const request = store.getAll();

    request.onsuccess = () => {
      const assessments = request.result.filter(a => !a.synced);
      resolve(assessments);
    };
    request.onerror = () => reject(request.error);
  });
}

function markAssessmentSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['assessments'], 'readwrite');
    const store = transaction.objectStore('assessments');
    const request = store.get(id);

    request.onsuccess = () => {
      const assessment = request.result;
      assessment.synced = true;

      const updateRequest = store.put(assessment);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

console.log('[ServiceWorker] Loaded successfully');

// Service Worker Manager
// This utility helps manage service worker registration and scope issues

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator
}

// Register service worker with proper scope
export async function registerServiceWorker(
  scriptPath = "/sw.js",
  scope = "/",
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn("Service workers are not supported in this browser")
    return null
  }

  try {
    // Register the service worker with explicit scope
    const registration = await navigator.serviceWorker.register(scriptPath, { scope })
    console.log("Service Worker registered successfully with scope:", registration.scope)
    return registration
  } catch (error) {
    console.error("Service Worker registration failed:", error)
    return null
  }
}

// Unregister all service workers
export async function unregisterAllServiceWorkers(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      await registration.unregister()
      console.log("Service Worker unregistered:", registration.scope)
    }

    return true
  } catch (error) {
    console.error("Error unregistering Service Workers:", error)
    return false
  }
}

// Check if a service worker is active
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    return !!registration.active
  } catch (error) {
    return false
  }
}

// Create a minimal service worker script
export function generateMinimalServiceWorker(): string {
  return `
// Minimal Service Worker that claims clients and handles fetch events
self.addEventListener('install', (event) => {
  // Skip the 'waiting' phase and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients so the service worker starts controlling current pages
  event.waitUntil(self.clients.claim());
  console.log('Service Worker activated and claiming clients');
});

// Handle fetch events
self.addEventListener('fetch', (event) => {
  // Just pass through all fetch events to the network
  event.respondWith(fetch(event.request));
});

console.log('Minimal Service Worker loaded');
`
}

// Create a service worker that handles offline mode
export function generateOfflineServiceWorker(cacheName = "slot-king-cache-v1"): string {
  return `
// Offline-capable Service Worker
const CACHE_NAME = '${cacheName}';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const CACHE_FILES = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Cache core files
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker caching app shell');
        return cache.addAll(CACHE_FILES);
      })
      .catch((error) => {
        console.error('Service Worker cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  // Claim clients so the service worker starts controlling current pages
  event.waitUntil(self.clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Network first, falling back to cache, then offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response for future use
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Try to get from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If the request is for a page, show the offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Otherwise, return a simple error response
            return new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Offline-capable Service Worker loaded');
`
}

// Alternative approach: Create a service worker proxy
export function generateServiceWorkerProxy(): string {
  return `
// Service Worker Proxy
// This script helps fix service worker scope issues by proxying requests

// The actual service worker script URL
const ACTUAL_SW_URL = '/actual-sw.js';

// Fetch the actual service worker script
self.addEventListener('install', (event) => {
  console.log('Service Worker Proxy installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker Proxy activating');
  event.waitUntil(self.clients.claim());
});

// Proxy all events to the actual service worker
self.addEventListener('fetch', (event) => {
  // Forward the fetch event to the actual service worker
  // For now, just handle it normally
  event.respondWith(fetch(event.request));
});

// Load the actual service worker script
fetch(ACTUAL_SW_URL)
  .then(response => response.text())
  .then(script => {
    // Execute the actual service worker script
    // Note: This is a workaround and may not work in all browsers
    try {
      // Use Function constructor to evaluate the script in the service worker context
      new Function(script)();
      console.log('Actual service worker script loaded and executed');
    } catch (error) {
      console.error('Failed to execute actual service worker script:', error);
    }
  })
  .catch(error => {
    console.error('Failed to load actual service worker script:', error);
  });

console.log('Service Worker Proxy loaded');
`
}


const CACHE_NAME = 'load-approval-pwa-v3';
const STATIC_CACHE_NAME = 'load-approval-static-v3';

// Static assets that can be cached aggressively
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/goliatskraal-banner.jpg'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force activation of new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - implement network-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.destination === 'document') {
    // HTML pages: Network First (always try network first)
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'script' || 
             request.destination === 'style' || 
             request.destination === 'image') {
    // Static assets: Stale While Revalidate (serve from cache, update in background)
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Everything else: Network First
    event.respondWith(networkFirstStrategy(request));
  }
});

// Network First Strategy - tries network first, falls back to cache
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, update cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If both network and cache fail, return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy - serves from cache immediately, updates in background
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Always try to fetch from network in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, that's okay for background update
    console.log('Background update failed for:', request.url);
  });
  
  // Return cached version immediately, or wait for network if no cache
  return cachedResponse || fetchPromise;
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle service worker updates
self.addEventListener('controllerchange', () => {
  console.log('Service Worker controller changed - new version available');
});
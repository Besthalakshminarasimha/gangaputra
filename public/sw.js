// Service Worker for Push Notifications and Offline Support
const CACHE_NAME = 'gangaputra-v2';
const STATIC_CACHE = 'gangaputra-static-v2';
const DYNAMIC_CACHE = 'gangaputra-dynamic-v2';
const BOOKMARKS_CACHE = 'gangaputra-bookmarks-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache for offline access
const CACHEABLE_API_PATTERNS = [
  '/rest/v1/diseases',
  '/rest/v1/magazines',
  '/rest/v1/crop_manuals',
  '/rest/v1/user_bookmarks',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.log('Some static assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name.startsWith('gangaputra-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== BOOKMARKS_CACHE;
          })
          .map(name => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let data = {
    title: 'GANGAPUTRA Update',
    body: 'New update available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'gangaputra-notification',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'gangaputra-notification',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (CACHEABLE_API_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline fallback for API requests
            return new Response(JSON.stringify({ 
              error: 'offline', 
              message: 'You are currently offline. Please check your connection.' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        }).catch(() => {
          // Return placeholder for failed images
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response but also update cache in background
          event.waitUntil(
            fetch(request).then(response => {
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, response);
              });
            }).catch(() => {})
          );
          return cachedResponse;
        }
        return fetch(request).then(response => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        }).catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle cache update for bookmarks
  if (event.data && event.data.type === 'CACHE_BOOKMARK') {
    const { contentType, contentId, data } = event.data;
    caches.open(BOOKMARKS_CACHE).then(cache => {
      const cacheKey = `bookmark-${contentType}-${contentId}`;
      cache.put(cacheKey, new Response(JSON.stringify(data)));
    });
  }
  
  // Handle cache removal for bookmarks
  if (event.data && event.data.type === 'REMOVE_BOOKMARK_CACHE') {
    const { contentType, contentId } = event.data;
    caches.open(BOOKMARKS_CACHE).then(cache => {
      const cacheKey = `bookmark-${contentType}-${contentId}`;
      cache.delete(cacheKey);
    });
  }
});

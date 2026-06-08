/**
 * Service Worker for Offline Support
 * Caches assets and enables offline functionality
 */

const CACHE_NAME = 'survey-platform-v1';
const CACHE_URLS = [
    '/frontend/index.html',
    '/frontend/survey.html',
    '/frontend/admin/index.html',
    '/frontend/css/main.css',
    '/frontend/css/survey.css',
    '/frontend/css/admin.css',
    '/frontend/js/api-client.js',
    '/frontend/js/survey-engine.js',
    '/frontend/js/offline-manager.js',
    '/frontend/js/home.js',
    '/frontend/js/admin.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip chrome extensions and non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // API requests - network first, then fail gracefully
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone the response for caching
                    if (response.ok && request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch((error) => {
                    console.log('[Service Worker] Network request failed, checking cache:', url.pathname);

                    // Try cache for GET requests
                    if (request.method === 'GET') {
                        return caches.match(request)
                            .then((cachedResponse) => {
                                if (cachedResponse) {
                                    console.log('[Service Worker] Serving from cache:', url.pathname);
                                    return cachedResponse;
                                }

                                // Return offline response
                                return new Response(
                                    JSON.stringify({
                                        success: false,
                                        message: 'Vous êtes hors ligne. Les données seront synchronisées une fois la connexion rétablie.',
                                        offline: true
                                    }),
                                    {
                                        status: 503,
                                        statusText: 'Service Unavailable',
                                        headers: { 'Content-Type': 'application/json' }
                                    }
                                );
                            });
                    }

                    // For POST/PATCH/DELETE - return offline message
                    return new Response(
                        JSON.stringify({
                            success: false,
                            message: 'Impossible de se connecter au serveur. Votre réponse sera sauvegardée localement.',
                            offline: true,
                            savedLocally: true
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // Static assets - cache first, network fallback
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);

                        // Return offline page for HTML requests
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/frontend/index.html');
                        }

                        throw error;
                    });
            })
    );
});

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync triggered:', event.tag);

    if (event.tag === 'sync-responses') {
        event.waitUntil(
            // Notify all clients to sync
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_RESPONSES',
                        timestamp: Date.now()
                    });
                });
            })
        );
    }
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('[Service Worker] Cache cleared');
            })
        );
    }
});

console.log('[Service Worker] Service Worker script loaded');

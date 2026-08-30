// ============================================
// KASHOMBA ELECTRICAL SYSTEM - SERVICE WORKER v2
// Fixed: POST requests not cached + CORS handling
// ============================================

const CACHE_NAME = 'kashomba-v2';

const urlsToCache = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/css/style.css',
    '/css/login.css',
    '/css/dashboard.css',
    '/js/config.js',
    '/js/auth.js',
    '/js/utils.js',
    '/js/dashboard.js',
    '/js/customers.js',
    '/js/invoices.js',
    '/js/payments.js',
    '/js/expenses.js',
    '/js/reports.js',
    '/assets/logo.png',
    '/manifest.json'
];

// ============================================
// INSTALL - Cache all static files
// ============================================
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Service Worker: Caching files...');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// ============================================
// ACTIVATE - Clean old caches
// ============================================
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache -', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            return self.clients.claim();
        })
    );
});

// ============================================
// FETCH - Handle GET na POST tofauti
// ============================================
self.addEventListener('fetch', function(event) {
    // ============================================
    // POST REQUESTS - Usi-cache, fetch moja kwa moja
    // ============================================
    if (event.request.method === 'POST') {
        event.respondWith(
            fetch(event.request)
                .catch(function(error) {
                    console.error('POST fetch error:', error);
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Network error. Please try again.' 
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }
    
    // ============================================
    // GET REQUESTS - Cache first, then network
    // ============================================
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Kama ipo kwenye cache, rudisha kutoka cache
                if (response) {
                    return response;
                }
                
                // Kama haipo kwenye cache, fetch kutoka network
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // Cache tu GET requests za Google Apps Script
                        if (event.request.method === 'GET' && 
                            event.request.url.includes('script.google.com') &&
                            networkResponse.ok) {
                            
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(function(cache) {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(function() {
                        // Kama offline na si HTML, rudisha cached index
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return error response
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Offline. Please check your internet connection.' 
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
            })
    );
});
// Service Worker for ဝင်းသီရိ
var CACHE_NAME = 'ဝင်းသီရိ-v1';
var urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://unpkg.com/html5-qrcode',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// ============================================================
// 🔥 FIREBASE PUSH NOTIFICATION
// ============================================================
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyCW8IP1YnDDlfL5iKPuFnVAIgLuO2EpJW4",
  authDomain: "winthiri-eddf7.firebaseapp.com",
  projectId: "winthiri-eddf7",
  storageBucket: "winthiri-eddf7.firebasestorage.app",
  messagingSenderId: "472856050149",
  appId: "1:472856050149:web:a52bd275c846120f75570c"
});

const messaging = firebase.messaging();

// Background Message (Push Notification)
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background Message:', payload);
  
  const notificationTitle = payload.data?.title || payload.notification?.title || '📢 Stock Alert';
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.click_url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================================
// 📦 ORIGINAL SERVICE WORKER CODE (မူရင်းအတိုင်း)
// ============================================================

// Install - Cache basic files
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch - Serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request).then(function(fetchResponse) {
                return caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(function() {
            // Offline fallback
            return caches.match('./index.html');
        })
    );
});

// Activate - Clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    return name !== CACHE_NAME;
                }).map(function(name) {
                    return caches.delete(name);
                })
            );
        })
    );
});

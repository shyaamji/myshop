// service-worker.js
var CACHE_NAME = 'winsithiri-v3';

// Cache လုပ်မယ့်ဖိုင်တွေ (အင်တာနက်မရှိရင်ပြဖို့ အခြေခံဖိုင်တွေပဲ)
var urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Service Worker Install
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker Activate - cache အဟောင်းတွေဖျက်
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ★★★ Network First Strategy ★★★
self.addEventListener('fetch', function(event) {
  // Supabase API တွေကို cache မလုပ်ဘူး (အမြဲ network ကပဲဆွဲ)
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // တခြားဖိုင်တွေအတွက် Network First
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // အင်တာနက်ရရင် response ကို cache မှာလည်း update လုပ်
        var responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(function() {
        // အင်တာနက်မရှိရင် cache ကနေပြ
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          // HTML request တွေအတွက် index.html ကိုပြ
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

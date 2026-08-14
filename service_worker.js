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
// =====================================================================
// ဒီ code အပိုင်းကို သင့်ရဲ့ ရှိပြီးသား service-worker.js ဖိုင်ရဲ့
// အောက်ဆုံးမှာ ထပ်ထည့်ပါ (ရှိပြီးသား cache/offline logic ကို မဖျက်ပါနဲ့)
// =====================================================================

// Push notification ရောက်လာချိန် ပြသဖို့
self.addEventListener('push', function (event) {
    var data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) {
        data = { title: 'ဝင်းသီရိ POS', body: event.data ? event.data.text() : '' };
    }
    var title = data.title || 'ဝင်းသီရိ POS';
    var options = {
        body: data.body || '',
        icon: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
        tag: 'low-stock-alert',
        vibrate: [200, 100, 200],
        data: { url: '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification ကို နှိပ်လိုက်ရင် app ကို ပွင့်ခေါ်ဖို့
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});

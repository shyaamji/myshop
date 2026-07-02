const CACHE_NAME = 'km-pos-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://unpkg.com/html5-qrcode',
  'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav'
];

// Service Worker Install လုပ်ပြီး Asset များကို Cache ထဲသိမ်းခြင်း
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Cache အဟောင်းများကို ရှင်းလင်းခြင်း
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Offline အလုပ်လုပ်နိုင်ရန်အတွက် Network သို့မဟုတ် Cache ထံမှ ဆွဲယူခြင်း
self.addEventListener('fetch', (e) => {
  // Google Sheet ဆီ သွားမည့် Request များကို Cache မလုပ်ဘဲ တိုက်ရိုက်သွားခွင့်ပြုရန်
  if (e.request.url.includes('script.google.com')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // အင်တာနက်မရှိဘဲ ဖွင့်လျှင် index.html ကို ပြန်ပြရန်
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

const CACHE_NAME = 'jahnavi-birthday-v16';
const FILES = ['./', './index.html', './style.css?v=11', './script.js?v=14', './manifest.webmanifest', './icon.svg', './images/cube/img1.jpg', './images/cube/img2.jpg', './images/cube/img3.jpg', './images/cube/img4.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((saved) => saved || fetch(event.request)));
});
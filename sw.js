const CACHE_NAME = 'shooter-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './icon.png',
  './manifest.json'
];

// インストール時にファイルをキャッシュする
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// キャッシュがあればそれを返す（オフライン対応）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
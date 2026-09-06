// 「また素麺？」って、言わせない！ - Service Worker
// 読み込みや実行に失敗してもメインアプリの動作に影響を与えないよう、
// すべての処理を try-catch で保護しています。

const CACHE_NAME = 'mata-somen-cache-v1';
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  try {
    self.skipWaiting();
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
        .catch(() => {})
    );
  } catch (e) {
    // インストールに失敗してもアプリ本体には影響させない
  }
});

self.addEventListener('activate', (event) => {
  try {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }).catch(() => {}).then(() => self.clients.claim()).catch(() => {})
    );
  } catch (e) {
    // 有効化に失敗してもアプリ本体には影響させない
  }
});

self.addEventListener('fetch', (event) => {
  try {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          try {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try { cache.put(event.request, clone); } catch (e) {}
            }).catch(() => {});
          } catch (e) {}
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || new Response('', { status: 503, statusText: 'offline' });
          }).catch(() => new Response('', { status: 503, statusText: 'offline' }));
        })
    );
  } catch (e) {
    // fetchハンドラの失敗はネットワーク処理をブラウザ標準へフォールバック
  }
});

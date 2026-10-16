// Gist Mobile service worker: offline app + last copy of API responses.
const VERSION = 'gist-mobile-v1.1.0';
const SHELL_CACHE = VERSION + '-shell';
const API_CACHE = 'gist-mobile-api';

const SHELL = [
  './',
  'index.html',
  'config.js',
  'manifest.webmanifest',
  'css/app.css',
  'vendor/codemirror.css',
  'vendor/codemirror.min.js',
  'js/app.js',
  'js/state.js',
  'js/api.js',
  'js/auth.js',
  'js/ui.js',
  'js/code.js',
  'js/views/gists.js',
  'js/views/viewer.js',
  'js/views/editor.js',
  'js/views/reader.js',
  'js/views/explore.js',
  'js/views/profile.js',
  'js/views/login.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.endsWith('-shell') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'clear-api') event.waitUntil(caches.delete(API_CACHE));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App files: cache first (refreshed in the background)
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/config.js')) { event.respondWith(networkFirst(req, SHELL_CACHE)); return; }
    event.respondWith(
      caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res.ok) caches.open(SHELL_CACHE).then((c) => c.put(req, res.clone()));
          return res;
        }).catch(() => hit || caches.match('index.html'));
        return hit || net;
      })
    );
    return;
  }

  // GitHub API and raw gist files: network first, then the last saved copy
  if (url.hostname === 'api.github.com' || url.hostname === 'gist.githubusercontent.com') {
    if (url.pathname.endsWith('/star')) return;
    event.respondWith(networkFirst(req, API_CACHE));
  }
});

async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res.ok && res.status === 200) {
      const c = await caches.open(cacheName);
      c.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const hit = await caches.match(req);
    if (hit) return hit;
    throw err;
  }
}

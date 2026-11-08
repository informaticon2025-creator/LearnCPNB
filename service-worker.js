const CACHE_NAME = 'learncpnb-v103';
const APP_SHELL = [
  'index.html?v=103',
  'page/news.html?v=103',
  'page/404.html',
  'page/offline.html',
  'page/promo.html',
  'page/art.html',
  'page/actas.html',
  'page/minuta.html',
  'file/terminos-app.html',
  'assets/document.svg',
  'assets/app-preview-news.png',
  'assets/app-preview-laws.png',
  'assets/app-preview-function.png',
  'assets/cpnb-emblem.png',
  'style/css.css?v=91',
  'style/desktop-notice.css?v=2',
  'interaction/inter.js?v=1',
  'interaction/desktop-notice.js?v=2',
  'interaction/news-media.js?v=3',
  'interaction/news-detail.js?v=1',
  'interaction/promo.js',
  'interaction/art.js',
  'interaction/actas.js',
  'interaction/register-sw.js',
  'icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('learncpnb-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedPage = await caches.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;

        const appRoot = self.registration.scope;
        if (requestUrl.pathname === new URL(appRoot).pathname) {
          const homePage = await caches.match(new URL('index.html', appRoot).href);
          if (homePage) return homePage;
        }

        return caches.match(new URL('page/offline.html', appRoot).href);
      })
    );
    return;
  }

  if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        new Response('El contenido requiere conexión a internet.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request);
    })
  );
});

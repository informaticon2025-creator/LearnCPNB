const CACHE_NAME = 'learncpnb-v160';
const APP_SHELL = [
  'index.html?v=133',
  'page/news.html?v=103',
  'page/404.html',
  'page/offline.html',
  'page/promo.html?v=133',
  'page/ilust.html',
  'page/art.html',
  'page/actas.html',
  'page/minuta.html',
  'file/terminos-app.html',
  'file/gacetas/ley_index.json',
  'file/funcion/fuc_index.json',
  'file/guias/guia_index.json',
  'file/news/new_index.json',
  'assets/document.svg',
  'assets/cpnb-emblem.png',
  'style/css.css?v=116',
  'style/desktop-notice.css?v=2',
  'interaction/inter.js?v=22',
  'interaction/desktop-notice.js?v=2',
  'interaction/news-media.js?v=3',
  'interaction/news-detail.js?v=1',
  'interaction/promo.js?v=12',
  'interaction/art.js',
  'interaction/actas.js',
  'interaction/register-sw.js',
  'interaction/ad-popup.js?v=1',
  'icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.all(APP_SHELL.map(async resource => {
          try {
            const response = await fetch(resource, { cache: 'no-store' });
            if (response.ok) {
              await cache.put(resource, response);
            }
          } catch (error) {
            console.warn(`No se pudo guardar en caché ${resource}.`, error);
          }
        }));
      })
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
      fetch(request).catch(() =>
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

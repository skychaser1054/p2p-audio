'use strict';
// Only refresh this app's HTML. Audio, uploads, and authentication requests
// keep their normal browser behavior and never enter a service-worker cache.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  const url = new URL(request.url);
  const root = new URL('./', self.location.href);
  if (url.origin !== root.origin || ![root.pathname, root.pathname + 'index.html'].includes(url.pathname)) return;
  event.respondWith((async () => {
    try {
      // A unique URL bypasses the old bare-address document in Safari's cache
      // as well as host/CDN entries. Preserve OAuth parameters and all app state.
      url.searchParams.set('_fresh', Date.now().toString());
      const response = await fetch(url.href, {
        credentials:'same-origin', headers:request.headers, cache:'no-store', redirect:'follow'
      });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return fetch(request);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store, max-age=0');
      return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
    } catch (error) {
      return fetch(request);
    }
  })());
});

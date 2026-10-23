'use strict';
const SHELL_CACHE='p2p-shell-v3';
const root=new URL('./',self.location.href);
const entry=new URL('index.html',root).href;
const assetURLs=['index.html','player-tools.js','library-upgrade.js','library-upgrade.css','file-pickers.js'].map(p=>new URL(p,root).href);
const isApp=url=>url.origin===root.origin&&[root.pathname,root.pathname+'index.html'].includes(url.pathname);
const isAsset=url=>url.origin===root.origin&&assetURLs.some(a=>new URL(a).pathname===url.pathname);
const isDependency=url=>['cdn.jsdelivr.net','unpkg.com'].includes(url.hostname)&&/\.(js|css)(?:$|\?)/.test(url.pathname+url.search);
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('p2p-shell-')&&name!==SHELL_CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(!(isAsset(url)||isDependency(url)||request.mode==='navigate'&&isApp(url)))return;
 event.respondWith((async()=>{
  const cache=await caches.open(SHELL_CACHE),navigation=request.mode==='navigate'&&isApp(url),cacheKey=navigation?entry:request.url;
  try{
   const network=new URL(url);if(navigation)network.searchParams.set('_fresh',Date.now().toString());
   const response=await fetch(navigation?new Request(network.href,{headers:request.headers,credentials:'same-origin',cache:'no-store'}):request);
   if(!response.ok&&response.type!=='opaque')throw Error('Network response unavailable');
   if(navigation&&!response.headers.get('content-type')?.includes('text/html'))return response;
   await cache.put(cacheKey,response.clone());
   if(navigation){const headers=new Headers(response.headers);headers.set('Cache-Control','no-store, max-age=0');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
   return response;
  }catch(error){const cached=await cache.match(cacheKey);if(cached)return cached;throw error;}
 })());
});
// A controlled page asks us to seed exact versioned assets, including its public
// script dependencies. Audio, signed URLs, auth, and database responses are excluded.
self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_SHELL')return;
 const urls=Array.isArray(event.data.urls)?event.data.urls.slice(0,30):[];
 event.waitUntil((async()=>{const cache=await caches.open(SHELL_CACHE);for(const raw of urls){try{const url=new URL(raw,root);if(!isAsset(url)&&!isDependency(url))continue;const network=new URL(url);if(isApp(url))network.searchParams.set('_fresh',Date.now().toString());const response=await fetch(network.href,{cache:'reload'});if(response.ok)await cache.put(isApp(url)?entry:url.href,response);}catch{}}})());
});

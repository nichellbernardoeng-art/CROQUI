/* Croqui de Campo: abre direto do aparelho (funciona sem internet ou com sinal fraco)
   e busca a versão nova em segundo plano quando há conexão. */
const V = 'croqui-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => Promise.all(FILES.map((f) => fetch(f, { cache: 'reload' }).then((r) => { if (r.ok) return c.put(f, r); }).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const nav = r.mode === 'navigate';
  e.respondWith(caches.open(V).then(async (c) => {
    const hit = await c.match(nav ? './index.html' : r, { ignoreSearch: true }) || (nav ? await c.match('./', { ignoreSearch: true }) : null);
    const net = fetch(r, { cache: 'no-cache' }).then((res) => { if (res && res.ok) c.put(nav ? './index.html' : r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; } // usa a cópia do aparelho na hora; atualiza por trás
    const res = await net; return res || new Response('Sem internet e ainda sem cópia neste aparelho. Abra o app uma vez com internet.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }));
});

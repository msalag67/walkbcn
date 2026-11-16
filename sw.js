// WalkBCN service worker: lets a saved walk work without a connection.
// - The page itself and its data: network first (so updates arrive), the saved copy when offline.
// - Audio, translations, photos, map tiles and the walking-route answers: kept once fetched,
//   so a walk saved with "Save for offline use" (or simply opened before) keeps working.
// Map tiles are only those already seen on screen: OpenStreetMap's rules don't allow
// downloading areas in bulk, so the page says the map may be incomplete offline.
// Nothing here is sent anywhere; it only stores copies in this browser.
const SHELL = 'walkbcn-shell-v2';
const MEDIA = 'walkbcn-media-v1';
const TILES = 'walkbcn-tiles-v1';
const MAX_TILES = 600;

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [SHELL, MEDIA, TILES];
    for (const k of await caches.keys()) if (k.startsWith('walkbcn-') && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isTile = u => /tile\.openstreetmap\.org$/.test(u.hostname);
const isMedia = u => u.origin === location.origin
  ? /\/(audio|content\/i18n|assets)\//.test(u.pathname)
  : /(wikimedia\.org|unpkg\.com|routing\.openstreetmap\.de|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (isTile(url)) { e.respondWith(cacheFirst(req, TILES, true)); return; }
  if (/\/audio\//.test(url.pathname) && url.origin === location.origin) { e.respondWith(audio(req)); return; }
  if (/routing\.openstreetmap\.de$/.test(url.hostname)) { e.respondWith(networkFirst(req, MEDIA)); return; }
  if (isMedia(url)) { e.respondWith(cacheFirst(req, MEDIA)); return; }
  if (url.origin === location.origin) { e.respondWith(networkFirst(req, SHELL)); return; }
});

async function networkFirst(req, name) {
  const cache = await caches.open(name);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: req.mode === 'navigate' })) || Response.error();
  }
}
async function cacheFirst(req, name, trim = false) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') {
      await cache.put(req, res.clone());
      if (trim) { const keys = await cache.keys(); for (const k of keys.slice(0, Math.max(0, keys.length - MAX_TILES))) cache.delete(k); }
    }
    return res;
  } catch (err) {
    return Response.error();
  }
}
// Audio files: browsers ask for byte ranges. Keep the whole file and answer ranges from it,
// so recordings also play offline (Safari needs a proper 206 answer).
async function audio(req) {
  const cache = await caches.open(MEDIA);
  const key = new Request(new URL(req.url).href);
  let full = await cache.match(key);
  if (!full) {
    try {
      const res = await fetch(key);
      if (!res.ok) return res;
      await cache.put(key, res.clone());
      full = res;
    } catch (err) {
      return Response.error();
    }
  }
  const range = req.headers.get('range');
  if (!range) return full;
  const buf = await full.clone().arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const start = m[1] ? +m[1] : 0;
  const end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

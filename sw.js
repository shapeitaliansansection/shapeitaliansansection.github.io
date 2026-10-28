// Funzionamento offline della guida SHAPE Healthcare Italian Section.
// Le pagine si scaricano sempre aggiornate dalla rete; se la rete manca si usa la copia salvata.
const VERSIONE = 'shi-2026-10-28b';
const BASE = [
  './', 'index.html', 'scheda.html', 'tessera.html', 'jsbarcode.min.js', 'manifest.webmanifest',
  'emergenza.vcf', 'kennedy.vcf', 'sezione.vcf',
  'logo_sezione_sanitaria.jpg', 'edificio_401_SHF.jpg', 'favicon.png',
  'icon-192.png', 'icon-512.png',
  'archivo.woff2', 'atkinson-400.woff2', 'atkinson-400i.woff2', 'atkinson-700.woff2',
  'montserrat-400.woff2', 'montserrat-700.woff2', 'montserrat-800.woff2'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (new URL(r.url).pathname.endsWith('allerte.json')) {
    e.respondWith(fetch(r).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || new Response('{"m":[]}', { headers: { 'Content-Type': 'application/json' } }))));
    return;
  }
  const pagina = r.mode === 'navigate' || r.destination === 'document';
  if (pagina) {
    e.respondWith(fetch(r).then(res => {
      const copia = res.clone(); caches.open(VERSIONE).then(c => c.put(r, copia)); return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => {
    const rete = fetch(r).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSIONE).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => m);
    return m || rete;
  }));
});

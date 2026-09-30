// Service worker: precache shell, network-first untuk data, cache-first untuk aset statis.
// Naikkan VERSION setiap kali file shell berubah agar cache lama dibersihkan.
const VERSION = 'v10';
const CACHE = `sehat-ibu-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/icons.js',
  'js/illustrations.js',
  'js/app.js',
  'data/topics.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'img/illus/anc.jpg',
  'img/illus/plate.jpg',
  'img/illus/latch.jpg',
  'img/illus/cord.jpg',
  'img/illus/sleep.jpg',
  'img/illus/p4k.jpg',
  'img/illus/danger_mom.jpg',
  'img/illus/danger_baby.jpg',
  'img/illus/nifas_rest.jpg',
  'img/illus/kb_spacing.jpg',
  'img/illus/imun_shield.jpg',
  'assets/leaflets/pemeriksaan-kehamilan.webp',
  'assets/leaflets/tanda-bahaya-kehamilan.webp',
  'assets/leaflets/gizi-ibu-hamil.webp',
  'assets/leaflets/persiapan-persalinan.webp',
  'assets/leaflets/masa-nifas.webp',
  'assets/leaflets/kb-pasca-persalinan.webp',
  'assets/leaflets/asi-eksklusif.webp',
  'assets/leaflets/perawatan-bayi-baru-lahir.webp',
  'assets/leaflets/tanda-bahaya-bayi.webp',
  'assets/leaflets/imunisasi.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sehat-ibu-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request)) || (request.mode === 'navigate' ? cache.match('index.html') : Response.error());
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') (await caches.open(CACHE)).put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  // Halaman dan data konten selalu coba ambil yang terbaru, jatuh ke cache saat offline.
  if (request.mode === 'navigate' || request.url.includes('/data/')) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

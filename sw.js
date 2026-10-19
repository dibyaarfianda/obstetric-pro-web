// Service worker: precache shell, network-first untuk data, cache-first untuk aset statis.
// Naikkan VERSION serta query versi CSS/JS di SHELL dan index.html saat shell berubah.
const VERSION = 'v17';
const CACHE = `sehat-ibu-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'css/app.css?v=17',
  'js/pwa.js?v=17',
  'js/icons.js?v=17',
  'js/illustrations.js?v=17',
  'js/artwork.js?v=17',
  'js/app.js?v=17',
  'data/topics.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/brands/gambiran.png',
  'assets/brands/sisiwanita-transparent.webp',
  'assets/brands/dokter-dibya-transparent.webp',
  'assets/brands/dokter-ike-transparent.webp',
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
  'assets/posters/pemeriksaan-kehamilan.webp',
  'assets/posters/tanda-bahaya-kehamilan.webp',
  'assets/posters/gizi-ibu-hamil.webp',
  'assets/posters/persiapan-persalinan.webp',
  'assets/posters/masa-nifas.webp',
  'assets/posters/kb-pasca-persalinan.webp',
  'assets/posters/asi-eksklusif.webp',
  'assets/posters/perawatan-bayi-baru-lahir.webp',
  'assets/posters/tanda-bahaya-bayi.webp',
  'assets/posters/imunisasi.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
    const res = await fetch(request, { cache: 'no-cache' });
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

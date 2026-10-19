// Muat versi baru sekali saat worker berganti, termasuk dari halaman yang masih memakai cache lama.
(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  const worker = navigator.serviceWorker;
  let hadController = Boolean(worker.controller);
  let reloading = false;
  let registration;

  worker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return; // Kunjungan pertama sudah memakai aset terbaru.
    }
    if (reloading) return;
    reloading = true;
    try {
      sessionStorage.setItem('promkes:update-scroll', JSON.stringify({ url: location.href, y: window.scrollY }));
    } catch { /* Mode privat dapat menonaktifkan penyimpanan sesi. */ }
    location.reload();
  });

  async function checkUpdate() {
    try {
      if (registration) await registration.update();
      else registration = await worker.register('sw.js', { updateViaCache: 'none' });
    } catch { /* Saat offline, pertahankan worker dan materi yang sudah tersimpan. */ }
  }

  if (document.readyState === 'complete') checkUpdate();
  else window.addEventListener('load', checkUpdate, { once: true });
  window.addEventListener('online', checkUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkUpdate();
  });
})();

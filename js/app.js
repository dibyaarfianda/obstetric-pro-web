// Shell aplikasi: router hash sederhana, render menu topik, registrasi service worker.
(() => {
  'use strict';

  const view = document.getElementById('view');
  const backBtn = document.querySelector('.app-bar__back');
  const installBtn = document.querySelector('.app-bar__install');
  const offlineBanner = document.querySelector('.offline-banner');
  const APP_TITLE = 'Sehat Ibu & Bayi';

  let topicsPromise;
  function loadTopics() {
    topicsPromise ??= fetch('data/topics.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => d.topics)
      .catch((err) => { topicsPromise = undefined; throw err; });
    return topicsPromise;
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  function renderHome(topics) {
    document.title = APP_TITLE;
    backBtn.hidden = true;
    view.innerHTML = `
      <section class="hero">
        <h1>Promosi Kesehatan Ibu &amp; Bayi</h1>
        <p>Pilih topik yang ingin Anda baca.</p>
      </section>
      <ul class="topic-grid">
        ${topics.map((t) => `
          <li>
            <a class="topic-card" href="#/topik/${esc(t.slug)}" style="--card-accent:${esc(t.color || '#f8bbd0')}">
              <span class="topic-card__icon" aria-hidden="true">${esc(t.icon || '📄')}</span>
              <span class="topic-card__text">
                <span class="topic-card__title">${esc(t.title)}</span>
                <span class="topic-card__summary">${esc(t.summary || '')}</span>
              </span>
            </a>
          </li>`).join('')}
      </ul>`;
  }

  function renderTopic(topic) {
    document.title = `${topic.title} · ${APP_TITLE}`;
    backBtn.hidden = false;
    view.innerHTML = `
      <article class="topic">
        <p class="topic__category">${esc(topic.category || '')}</p>
        <h1>${esc(topic.title)}</h1>
        <div class="topic__body">
          ${topic.body || '<p class="placeholder">Materi untuk topik ini sedang disiapkan.</p>'}
        </div>
        <a class="button" href="#/">Kembali ke daftar topik</a>
      </article>`;
  }

  function renderMessage(title, text) {
    document.title = `${title} · ${APP_TITLE}`;
    backBtn.hidden = false;
    view.innerHTML = `
      <section class="message">
        <h1>${esc(title)}</h1>
        <p>${esc(text)}</p>
        <a class="button" href="#/">Ke daftar topik</a>
      </section>`;
  }

  async function route() {
    const path = location.hash.replace(/^#/, '') || '/';
    try {
      const topics = await loadTopics();
      const m = path.match(/^\/topik\/([\w-]+)$/);
      if (path === '/') renderHome(topics);
      else if (m) {
        const topic = topics.find((t) => t.slug === m[1]);
        topic ? renderTopic(topic) : renderMessage('Topik tidak ditemukan', 'Topik yang Anda cari tidak tersedia.');
      } else renderMessage('Halaman tidak ditemukan', 'Alamat yang Anda buka tidak tersedia.');
    } catch {
      renderMessage('Gagal memuat', 'Periksa koneksi internet Anda lalu coba lagi.');
    }
    window.scrollTo(0, 0);
    if (path !== '/') view.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', route);
  route();

  // Status koneksi
  const syncOnline = () => { offlineBanner.hidden = navigator.onLine; };
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);
  syncOnline();

  // Tombol "Pasang" (Android/desktop Chromium)
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();

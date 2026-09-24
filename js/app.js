// Shell aplikasi: router hash, render beranda & halaman topik, transisi antar halaman, registrasi service worker.
(() => {
  'use strict';

  const view = document.getElementById('view');
  const backBtn = document.querySelector('.app-bar__back');
  const installBtn = document.querySelector('.app-bar__install');
  const offlineBanner = document.querySelector('.offline-banner');
  const footerFacility = document.querySelector('.app-footer__facility');
  const ICONS = window.ICONS || {};
  let appTitle = document.title;

  let dataPromise;
  function loadData() {
    dataPromise ??= fetch('data/topics.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(prepare)
      .catch((err) => { dataPromise = undefined; throw err; });
    return dataPromise;
  }

  // Lengkapi data: urutkan topik mengikuti urutan kategori agar "sebelumnya/berikutnya" konsisten.
  function prepare(d) {
    const categories = d.categories || [];
    const order = new Map(categories.map((c, i) => [c.id, i]));
    const topics = [...d.topics].sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99));
    const site = d.site || {};
    if (site.name) appTitle = site.name;
    if (site.facility) {
      footerFacility.textContent = site.facility;
      footerFacility.hidden = false;
    }
    return { site, categories, topics };
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.book}</svg>`;

  // ---------- Tampilan ----------

  function topicCard(t) {
    return `
      <li>
        <a class="tile" href="#/topik/${esc(t.slug)}" data-cat="${esc(t.category)}" data-slug="${esc(t.slug)}">
          <span class="tile__icon">${icon(t.icon)}</span>
          <span class="tile__title">${esc(t.title)}</span>
          <span class="tile__summary">${esc(t.summary)}</span>
        </a>
      </li>`;
  }

  function renderHome({ categories, topics }) {
    document.title = appTitle;
    const urgent = topics.filter((t) => t.urgent);
    const groups = categories
      .map((c) => ({ ...c, topics: topics.filter((t) => t.category === c.id) }))
      .filter((g) => g.topics.length);
    const known = new Set(categories.map((c) => c.id));
    const others = topics.filter((t) => !known.has(t.category));
    if (others.length) groups.push({ id: 'lainnya', title: 'Lainnya', topics: others });

    view.innerHTML = `
      <section class="hero">
        <h1>Informasi sehat untuk Ibu &amp; Bayi</h1>
        <p>Materi edukasi seputar kehamilan, persalinan, nifas, dan bayi baru lahir. Pilih topik untuk membaca.</p>
      </section>

      ${urgent.length ? `
      <aside class="alert-strip" aria-label="Tanda bahaya">
        <span class="alert-strip__icon">${icon('alert')}</span>
        <div class="alert-strip__text">
          <strong>Kenali tanda bahaya</strong>
          <span>Bila muncul, segera ke fasilitas kesehatan terdekat.</span>
        </div>
        <div class="alert-strip__links">
          ${urgent.map((t) => `<a href="#/topik/${esc(t.slug)}">${esc(t.title.replace(/^Tanda Bahaya\s*/i, '') || t.title)}</a>`).join('')}
        </div>
      </aside>` : ''}

      <nav class="chips" aria-label="Kategori">
        ${groups.map((g) => `<button type="button" class="chip" data-cat="${esc(g.id)}" data-target="kat-${esc(g.id)}">${esc(g.title)}</button>`).join('')}
      </nav>

      ${groups.map((g) => `
        <section class="group" id="kat-${esc(g.id)}" data-cat="${esc(g.id)}" aria-labelledby="h-${esc(g.id)}">
          <header class="group__head">
            <h2 id="h-${esc(g.id)}">${esc(g.title)}</h2>
            ${g.summary ? `<p>${esc(g.summary)}</p>` : ''}
          </header>
          <ul class="tile-grid">${g.topics.map(topicCard).join('')}</ul>
        </section>`).join('')}`;
  }

  function renderTopic(topic, { categories, topics }) {
    document.title = `${topic.title} · ${appTitle}`;
    const cat = categories.find((c) => c.id === topic.category);
    const i = topics.indexOf(topic);
    const prev = topics[i - 1];
    const next = topics[i + 1];
    const related = topics.filter((t) => t.category === topic.category && t !== topic);

    view.innerHTML = `
      <article class="topic" data-cat="${esc(topic.category)}">
        <header class="topic__hero">
          <span class="topic__icon" data-slug="${esc(topic.slug)}">${icon(topic.icon)}</span>
          <div>
            ${cat ? `<p class="topic__category">${esc(cat.title)}</p>` : ''}
            <h1>${esc(topic.title)}</h1>
            ${topic.summary ? `<p class="topic__summary">${esc(topic.summary)}</p>` : ''}
          </div>
        </header>

        <div class="topic__body">
          ${topic.body || '<p class="placeholder">Materi untuk topik ini sedang disiapkan.</p>'}
        </div>

        ${related.length ? `
        <section class="related" aria-labelledby="h-related">
          <h2 id="h-related">Topik lain: ${esc(cat ? cat.title : 'terkait')}</h2>
          <ul class="related__list">
            ${related.map((t) => `
              <li><a class="related__item" href="#/topik/${esc(t.slug)}" data-cat="${esc(t.category)}">
                <span class="related__icon">${icon(t.icon)}</span>
                <span>${esc(t.title)}</span>
                ${icon('arrowRight', 'related__chev')}
              </a></li>`).join('')}
          </ul>
        </section>` : ''}

        <nav class="pager" aria-label="Topik sebelumnya dan berikutnya">
          ${prev ? `<a class="pager__link" href="#/topik/${esc(prev.slug)}" data-dir="back">
            <span class="pager__label">${icon('arrowLeft')} Sebelumnya</span>
            <span class="pager__title">${esc(prev.title)}</span></a>` : '<span></span>'}
          ${next ? `<a class="pager__link pager__link--next" href="#/topik/${esc(next.slug)}">
            <span class="pager__label">Berikutnya ${icon('arrowRight')}</span>
            <span class="pager__title">${esc(next.title)}</span></a>` : '<span></span>'}
        </nav>

        <a class="button button--ghost" href="#/" data-home>${icon('arrowLeft')} Semua topik</a>
      </article>`;
    hydrate(view.querySelector('.topic__body'));
  }

  // Pasang gambar materi: piktogram untuk elemen [data-ico], ilustrasi untuk <figure data-illus>.
  function hydrate(root) {
    const picto = window.PICTO || {};
    const illus = window.ILLUS || {};
    root.querySelectorAll('[data-ico]').forEach((el) => {
      const svg = picto[el.dataset.ico];
      if (svg) el.insertAdjacentHTML('afterbegin', `<span class="pict" aria-hidden="true"><svg viewBox="0 0 24 24">${svg}</svg></span>`);
    });
    root.querySelectorAll('figure[data-illus]').forEach((el) => {
      const svg = illus[el.dataset.illus];
      if (svg) el.insertAdjacentHTML('afterbegin', svg);
      else el.remove();
    });
  }

  function renderMessage(title, text) {
    document.title = `${title} · ${appTitle}`;
    view.innerHTML = `
      <section class="message">
        <h1>${esc(title)}</h1>
        <p>${esc(text)}</p>
        <a class="button" href="#/" data-home>Ke daftar topik</a>
      </section>`;
  }

  // ---------- Router & transisi ----------

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const homeScroll = { y: 0 };
  let currentPath = null;
  let enteredFromHome = false; // true bila halaman topik dibuka dari beranda di sesi ini
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const parse = (hash) => hash.replace(/^#/, '') || '/';
  const slugOf = (path) => (path.match(/^\/topik\/([\w-]+)$/) || [])[1];

  async function render(path, data) {
    const slug = slugOf(path);
    backBtn.hidden = path === '/';
    if (path === '/') return renderHome(data);
    const topic = slug && data.topics.find((t) => t.slug === slug);
    if (topic) return renderTopic(topic, data);
    if (slug) return renderMessage('Topik tidak ditemukan', 'Topik yang Anda cari tidak tersedia.');
    return renderMessage('Halaman tidak ditemukan', 'Alamat yang Anda buka tidak tersedia.');
  }

  // Beri nama transisi ke ikon topik agar ikon kartu "berpindah" ke judul halaman detail.
  function tagIcon(slug) {
    document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => el.style.removeProperty('view-transition-name'));
    if (!slug) return;
    const el = document.querySelector(`.tile[data-slug="${CSS.escape(slug)}"] .tile__icon, .topic__icon[data-slug="${CSS.escape(slug)}"]`);
    if (el) el.style.viewTransitionName = 'topic-icon';
  }

  async function route() {
    const path = parse(location.hash);
    const from = currentPath;
    if (from === path) return;
    if (from === '/') homeScroll.y = window.scrollY;

    let data;
    try {
      data = await loadData();
    } catch {
      backBtn.hidden = false;
      renderMessage('Gagal memuat', 'Periksa koneksi internet Anda lalu coba lagi.');
      currentPath = null;
      return;
    }

    const goingHome = path === '/';
    if (from === '/' && !goingHome) enteredFromHome = true;
    else if (goingHome) enteredFromHome = false;
    const direction = from === null ? 'none' : (goingHome || pendingDir === 'back') ? 'back' : 'forward';
    pendingDir = null;
    // Ikon yang dibagi: kartu beranda <-> halaman detail topik yang sama.
    const sharedSlug = slugOf(goingHome ? from || '' : path);

    const update = () => {
      render(path, data);
      currentPath = path;
      window.scrollTo(0, goingHome ? homeScroll.y : 0);
      if (sharedSlug && (from === '/' || goingHome)) tagIcon(sharedSlug);
    };

    const root = document.documentElement;
    if (direction !== 'none' && document.startViewTransition && !reduceMotion.matches) {
      root.dataset.nav = direction;
      if (sharedSlug && (from === '/' || goingHome)) tagIcon(sharedSlug);
      const t = document.startViewTransition(update);
      t.finished.finally(() => { delete root.dataset.nav; tagIcon(null); });
    } else {
      update();
      if (direction !== 'none' && !reduceMotion.matches) {
        view.classList.remove('view--enter-forward', 'view--enter-back');
        void view.offsetWidth;
        view.classList.add(`view--enter-${direction}`);
      }
    }
    if (!goingHome) view.focus({ preventScroll: true });
  }

  let pendingDir = null;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (a && a.dataset.dir === 'back') pendingDir = 'back';
    const chip = e.target.closest('.chip');
    if (chip) {
      const target = document.getElementById(chip.dataset.target);
      target?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  });

  // Tombol kembali: bila topik dibuka dari beranda, mundur di riwayat (posisi gulir beranda kembali).
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    pendingDir = 'back';
    if (enteredFromHome && history.length > 1) history.back();
    else location.replace('#/');
  });

  window.addEventListener('hashchange', route);
  route();

  // ---------- Status koneksi ----------
  const syncOnline = () => { offlineBanner.hidden = navigator.onLine; };
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);
  syncOnline();

  // ---------- Tombol "Pasang" (Android/desktop Chromium) ----------
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

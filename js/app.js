// Shell aplikasi: router hash, render beranda & halaman topik, transisi antar halaman, registrasi service worker.
(() => {
  'use strict';

  const view = document.getElementById('view');
  const backBtn = document.querySelector('.app-bar__back');
  const installBtn = document.querySelector('.app-bar__install');
  const offlineBanner = document.querySelector('.offline-banner');
  const footerFacility = document.querySelector('.app-footer__facility');
  const ICONS = window.ICONS || {};
  const ARTWORK = window.TOPIC_ARTWORK || {};
  const CATEGORY_META = {
    kehamilan: { icon: 'fetus', label: 'Untuk ibu hamil' },
    persalinan: { icon: 'hospital', label: 'Siap menyambut bayi' },
    nifas: { icon: 'heart', label: 'Pulih & rencanakan' },
    bayi: { icon: 'baby', label: 'Awal tumbuh sehat' },
  };
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
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || (window.PICTO || {})[name] || ICONS.book}</svg>`;
  const poster = (t, cls, eager = false) => {
    const art = ARTWORK[t.slug];
    return art ? `<img class="${cls}" src="${esc(art.src)}" alt="${esc(art.alt)}" width="960" height="640" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>` : '';
  };

  // ---------- Tampilan ----------

  function topicCard(t) {
    return `
      <li>
        <a class="tile" href="#/topik/${esc(t.slug)}" data-cat="${esc(t.category)}" data-slug="${esc(t.slug)}">
          <span class="tile__art">${poster(t, 'tile__image')}<span class="tile__icon">${icon(t.icon)}</span>${t.urgent ? `<span class="tile__urgent">${icon('alert')} Waspada</span>` : ''}</span>
          <span class="tile__content">
            <span class="tile__title">${esc(t.title)}</span>
            <span class="tile__footer"><span class="tile__pictos">${(ARTWORK[t.slug]?.icons || [t.icon]).map(n => icon(n)).join('')}</span><span class="tile__arrow">${icon('arrowRight')}</span></span>
          </span>
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
        <div class="hero__copy">
          <p class="eyebrow">${icon('heart')} TEMAN BELAJAR KELUARGA</p>
          <h1>Ibu sehat.<br><span>Bayi hebat.</span></h1>
          <p class="hero__lead">Kenali, pahami, dan rawat bersama.<br>Panduan bergambar untuk ibu dan si kecil.</p>
          <a class="button hero__button" href="#materi" data-explore>${icon('book')} Jelajahi materi ${icon('arrowRight')}</a>
        </div>
        <div class="hero__art" aria-hidden="true">
          <img src="${esc(ARTWORK['pemeriksaan-kehamilan']?.src || 'assets/leaflets/pemeriksaan-kehamilan.webp')}" alt="" width="960" height="640" fetchpriority="high">
          <span class="hero__sticker hero__sticker--heart">${icon('heart')}</span>
          <span class="hero__sticker hero__sticker--baby">${icon('baby')}</span>
          <span class="hero__caption">${icon('shield')} Langkah kecil, keluarga sehat</span>
        </div>
      </section>

      ${urgent.length ? `
      <aside class="alert-strip" aria-label="Tanda bahaya">
        <span class="alert-strip__icon">${icon('alert')}</span>
        <div class="alert-strip__text">
          <strong>Kenali tanda bahaya</strong>
          <span>Bila muncul, segera ke fasilitas kesehatan terdekat.</span>
        </div>
        <div class="alert-strip__links">
          ${urgent.map((t) => `<a href="#/topik/${esc(t.slug)}">${icon(CATEGORY_META[t.category]?.icon || 'alert')}${esc(t.title.replace(/^Tanda Bahaya\s*/i, '') || t.title)}${icon('arrowRight')}</a>`).join('')}
        </div>
      </aside>` : ''}

      <nav class="chips" aria-label="Kategori">
        ${groups.map((g) => `<button type="button" class="chip" data-cat="${esc(g.id)}" data-target="kat-${esc(g.id)}"><span class="chip__icon">${icon(CATEGORY_META[g.id]?.icon || 'book')}</span><span class="chip__label">${esc(g.title)}<small>${esc(CATEGORY_META[g.id]?.label || 'Materi kesehatan')}</small></span></button>`).join('')}
      </nav>

      <div class="library-heading" id="materi"><p class="eyebrow">${icon('book')} PILIH &amp; PELAJARI</p><h2>Bekal sehat untuk keluarga</h2><span>${topics.length} materi bergambar</span></div>

      ${groups.map((g) => `
        <section class="group" id="kat-${esc(g.id)}" data-cat="${esc(g.id)}" aria-labelledby="h-${esc(g.id)}">
          <header class="group__head">
            <span class="group__icon">${icon(CATEGORY_META[g.id]?.icon || 'book')}</span>
            <h2 id="h-${esc(g.id)}">${esc(g.title)}</h2><span class="group__count">${g.topics.length} materi</span>
          </header>
          <ul class="tile-grid">${g.topics.map(topicCard).join('')}</ul>
        </section>`).join('')}
      <section class="doctor-note" aria-labelledby="doctor-heading">
        <div class="doctor-note__photo"><img src="assets/brands/dokter-dibya.webp" alt="Foto dokter untuk pendamping edukasi kesehatan ibu dan anak" width="360" height="600" loading="lazy"></div>
        <div class="doctor-note__copy"><p class="eyebrow">${icon('stethoscope')} BELAJAR BERSAMA DOKTER</p><h2 id="doctor-heading">Lebih paham,<br>lebih siap merawat.</h2><p>Setiap keluarga punya pertanyaan. Kenali panduannya, catat yang ingin ditanyakan, lalu diskusikan bersama bidan atau dokter saat periksa.</p><div class="doctor-note__brand"><span>Didukung oleh</span><a href="https://sisiwanita.id"><img src="assets/brands/sisiwanita.webp" alt="SisiWanita — sisiwanita.id" width="180" height="64"></a></div></div>
      </section>`;
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

        ${ARTWORK[topic.slug] ? `
        <figure class="topic__leaflet">
          ${poster(topic, 'topic__poster', true)}
          <figcaption>${(ARTWORK[topic.slug].icons || []).map(n => icon(n)).join('')}<span>Pahami dengan gambar, praktikkan bersama.</span></figcaption>
        </figure>` : ''}

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

  // Pasang gambar materi: piktogram untuk elemen [data-ico], ilustrasi (foto AI) untuk <figure data-illus>.
  function hydrate(root) {
    const picto = window.PICTO || {};
    // Keep the source copy intact; group existing content into visual sections.
    const sections = [];
    let section;
    [...root.children].forEach((el) => {
      if (el.tagName === 'H2') {
        section = document.createElement('section');
        section.className = 'info-section';
        root.insertBefore(section, el);
        sections.push(section);
        const badge = document.createElement('span');
        badge.className = 'section-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = String(sections.length).padStart(2, '0');
        el.prepend(badge);
      }
      if (el.matches('.source')) section = null;
      if (section) section.appendChild(el);
    });
    const defaultIcons = ['check', 'heart', 'book'];
    root.querySelectorAll('ul:not(.signs):not(.pict-list):not(.pict-grid)').forEach((list) => {
      list.classList.add('pict-list', 'pict-list--plain');
      [...list.children].forEach((el, i) => {
        el.dataset.ico = defaultIcons[i % defaultIcons.length];
        const text = document.createElement('span');
        while (el.firstChild) text.appendChild(el.firstChild);
        el.appendChild(text);
      });
    });
    root.querySelectorAll('[data-ico]').forEach((el) => {
      const svg = picto[el.dataset.ico] || ICONS[el.dataset.ico];
      if (svg) el.insertAdjacentHTML('afterbegin', `<span class="pict" aria-hidden="true"><svg viewBox="0 0 24 24">${svg}</svg></span>`);
    });
    root.querySelectorAll('figure[data-illus]').forEach((el) => {
      const key = el.dataset.illus;
      const caption = el.querySelector('figcaption');
      const alt = caption ? caption.textContent : '';
      el.insertAdjacentHTML('afterbegin', `<img class="illus__img" src="img/illus/${key}.jpg" alt="${esc(alt)}" loading="lazy" width="600" height="448" onerror="this.closest('figure').remove()">`);
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
    const explore = e.target.closest('[data-explore]');
    if (explore) {
      e.preventDefault();
      document.getElementById('materi')?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
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

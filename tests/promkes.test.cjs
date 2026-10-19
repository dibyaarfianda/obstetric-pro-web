const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/topics.json'), 'utf8'));

async function render(hash = '#/', options = {}) {
  const events = {};
  const body = { children: [], querySelectorAll: () => [] };
  const view = { innerHTML: '', focus() {}, querySelector: () => body, classList: { remove() {}, add() {} } };
  const control = () => ({ hidden: true, addEventListener() {} });
  const context = {
    document: { title: 'Sehat Ibu & Bayi', getElementById: () => view, querySelector: control,
      querySelectorAll: () => [], addEventListener() {}, documentElement: { dataset: {} } },
    location: { hash, href: `https://promkes.test/${hash}`, reload: options.reload || (() => {}) }, history: { length: 1 },
    navigator: { onLine: true, ...options.navigator }, sessionStorage: options.sessionStorage,
    matchMedia: () => ({ matches: true }), fetch: async () => ({ ok: true, json: async () => structuredClone(data) }),
    CSS: { escape: s => s }, console,
  };
  context.window = { scrollY: options.scrollY || 0, scrollTo: options.scrollTo || (() => {}), addEventListener: (name, fn) => { events[name] = fn; } };
  vm.createContext(context);
  for (const file of ['js/icons.js', 'js/illustrations.js', 'js/artwork.js', 'js/app.js', 'js/pwa.js']) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) vm.runInContext(fs.readFileSync(fullPath, 'utf8'), context, { filename: file });
  }
  await new Promise(setImmediate);
  return { html: view.innerHTML, context, events };
}

test('home gives every existing topic a distinct poster cover and keeps urgent links', async () => {
  const { html } = await render();
  assert.equal((html.match(/class="tile__image"/g) || []).length, 10, 'all ten topics need visible covers');
  for (const topic of data.topics) {
    assert.ok(html.includes(`assets/posters/${topic.slug}.webp`), `poster missing for ${topic.slug}`);
    assert.ok(html.includes(`href="#/topik/${topic.slug}"`));
  }
  assert.equal((html.match(/class="chip__icon"/g) || []).length, 4);
  for (const topic of data.topics.filter(t => t.urgent)) assert.ok(html.includes(`href="#/topik/${topic.slug}"`));
});

test('each topic preserves the complete source body, title and route while adding its poster', async () => {
  for (const topic of data.topics) {
    const { html, context } = await render(`#/topik/${topic.slug}`);
    assert.ok(html.includes(topic.body), `medical source body changed for ${topic.slug}`);
    assert.ok(html.includes(`assets/posters/${topic.slug}.webp`), `detail poster missing for ${topic.slug}`);
    assert.ok(context.document.title.includes(topic.title));
    assert.ok(html.includes('data-home'));
  }
});

test('artwork metadata has meaningful alt text, source-sized files and no external dependencies', async () => {
  const { context } = await render();
  const artwork = context.window.TOPIC_ARTWORK || {};
  assert.equal(Object.keys(artwork).length, 10);
  for (const topic of data.topics) {
    assert.ok(artwork[topic.slug]?.alt?.length > 20, `missing image description for ${topic.slug}`);
    const src = artwork[topic.slug].src;
    assert.ok(!/^https?:/.test(src));
    assert.ok(fs.statSync(path.join(root, src)).size > 1000);
  }
});

test('the offline shell precaches every poster and its metadata', () => {
  let shell;
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  vm.runInNewContext(`${source}\n;globalThis.shell = SHELL;`, { self: { addEventListener() {} }, get shell() { return shell; }, set shell(v) { shell = v; } });
  assert.ok(shell.some(url => url.split('?')[0] === 'js/artwork.js'));
  for (const topic of data.topics) assert.ok(shell.includes(`assets/posters/${topic.slug}.webp`));
});

test('unknown topics provide a working way back home', async () => {
  const { html } = await render('#/topik/tidak-ada');
  assert.ok(html.includes('Topik tidak ditemukan'));
  assert.ok(html.includes('href="#/"'));
});

test('a worker update reloads an existing reader once and preserves its route and scroll', async () => {
  const listeners = {};
  const stored = new Map();
  const sessionStorage = { getItem: k => stored.get(k) || null, setItem: (k,v) => stored.set(k,v), removeItem: k => stored.delete(k) };
  const registrations = [];
  let reloads = 0;
  const { events } = await render('#/topik/gizi-ibu-hamil', {
    navigator: { serviceWorker: { controller: {}, addEventListener: (event,fn) => { listeners[event] = fn; }, register: async (...args) => { registrations.push(args); return { update: async () => {} }; } } },
    reload: () => reloads++, scrollY: 710, sessionStorage,
  });
  await events.load();
  assert.equal(registrations[0][1]?.updateViaCache, 'none', 'worker checks must bypass the HTTP cache');
  assert.equal(typeof listeners.controllerchange, 'function', 'an active worker change must refresh the rendered page');
  listeners.controllerchange(); listeners.controllerchange();
  assert.equal(reloads, 1, 'duplicate controller events must not cause a reload loop');
  let restored;
  await render('#/topik/gizi-ibu-hamil', { sessionStorage, scrollTo: (x,y) => { restored = y; } });
  assert.equal(restored, 710, 'the update must restore the same reading position');
  assert.equal(stored.size, 0, 'the saved update position must be consumed once');
});

test('the first worker installation does not reload a new visitor', async () => {
  const listeners = {};
  let reloads = 0;
  await render('#/', { navigator: { serviceWorker: { controller: null, addEventListener: (event,fn) => { listeners[event] = fn; }, register: async () => ({ update: async () => {} }) } }, reload: () => reloads++ });
  assert.equal(typeof listeners.controllerchange, 'function');
  listeners.controllerchange();
  assert.equal(reloads, 0);
});

test('HTML shell assets bypass old worker URLs and remain fully precached offline', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="((?:js\/[^"?]+\.js|css\/[^"?]+\.css)(?:\?[^\"]+)?)"/g)].map(m => m[1]);
  assert.ok(assets.length >= 5);
  let shell;
  vm.runInNewContext(`${fs.readFileSync(path.join(root, 'sw.js'), 'utf8')}\n;globalThis.shell=SHELL;`, { self: { addEventListener() {} }, set shell(v) { shell = v; } });
  for (const asset of assets) {
    assert.ok(asset.includes('?v='), `${asset} can still collide with a previous worker cache`);
    assert.ok(shell.includes(asset), `offline shell does not include ${asset}`);
  }
});

test('installing a release fetches fresh shell bytes instead of a stale HTTP cache', async () => {
  const listeners = {};
  let precached;
  const context = { self: { addEventListener: (event,fn) => { listeners[event] = fn; }, skipWaiting() {} },
    Request: class { constructor(url, options) { this.url = url; this.cache = options?.cache; } },
    caches: { open: async () => ({ addAll: async requests => { precached = requests; } }) } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  let done;
  listeners.install({ waitUntil: p => { done = p; } });
  await done;
  assert.ok(precached.length > 10);
  assert.ok(precached.every(r => r.cache === 'reload'), 'precache must bypass the HTTP cache for every release asset');
});

test('online navigation revalidates HTML rather than trusting an old HTTP cache', async () => {
  const listeners = {};
  const response = text => ({ ok: true, text, clone() { return this; } });
  const context = { self: { addEventListener: (event,fn) => { listeners[event] = fn; } }, URL, location: { origin: 'https://promkes.test' },
    caches: { open: async () => ({ put() {}, match: async () => response('offline') }) },
    fetch: async (request, options) => response(options?.cache === 'no-cache' ? 'latest HTML' : 'stale HTTP HTML') };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  let done;
  listeners.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://promkes.test/' }, respondWith: p => { done = p; } });
  assert.equal((await done).text, 'latest HTML');
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/topics.json'), 'utf8'));

async function render(hash = '#/') {
  const events = {};
  const body = { children: [], querySelectorAll: () => [] };
  const view = { innerHTML: '', focus() {}, querySelector: () => body, classList: { remove() {}, add() {} } };
  const control = () => ({ hidden: true, addEventListener() {} });
  const context = {
    document: { title: 'Sehat Ibu & Bayi', getElementById: () => view, querySelector: control,
      querySelectorAll: () => [], addEventListener() {}, documentElement: { dataset: {} } },
    location: { hash }, history: { length: 1 }, navigator: { onLine: true },
    matchMedia: () => ({ matches: true }), fetch: async () => ({ ok: true, json: async () => structuredClone(data) }),
    CSS: { escape: s => s }, console,
  };
  context.window = { scrollY: 0, scrollTo() {}, addEventListener: (name, fn) => { events[name] = fn; } };
  vm.createContext(context);
  for (const file of ['js/icons.js', 'js/illustrations.js', 'js/artwork.js', 'js/app.js']) {
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
  assert.ok(shell.includes('js/artwork.js'));
  for (const topic of data.topics) assert.ok(shell.includes(`assets/posters/${topic.slug}.webp`));
});

test('unknown topics provide a working way back home', async () => {
  const { html } = await render('#/topik/tidak-ada');
  assert.ok(html.includes('Topik tidak ditemukan'));
  assert.ok(html.includes('href="#/"'));
});

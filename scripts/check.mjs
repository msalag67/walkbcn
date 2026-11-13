// Quick checks that protect the data the web relies on. Run: node scripts/check.mjs
// - every interface text exists in all 7 languages
// - stops: unique ids, inside central Barcelona, known interests, photo set
// - notices: valid dates, a source, a check date and text in every language
// - every recorded audio file the stories point to exists
// - themes only use stops that exist
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data/ui.js', 'data/stops.js', 'data/activities.js', 'content/stories.js']) {
  vm.runInContext(fs.readFileSync(root + f, 'utf8'), ctx, { filename: f });
}
for (const l of ['ca', 'es', 'en', 'fr', 'de', 'it', 'zh']) {
  if (fs.existsSync(`${root}content/i18n/${l}.js`)) vm.runInContext(fs.readFileSync(`${root}content/i18n/${l}.js`, 'utf8'), ctx);
}
const W = ctx.window;
const errors = [];
const fail = msg => errors.push(msg);

// Interface texts
const UI = W.WALKBCN_UI, langs = W.WALKBCN_LANGS.map(l => l.code);
for (const l of langs) for (const k of Object.keys(UI.en)) if (!(k in UI[l])) fail(`ui: "${k}" missing in ${l}`);
// Keys the page asks for must exist in English
const html = fs.readFileSync(root + 'index.html', 'utf8');
const used = new Set([...html.matchAll(/\bt\('([a-zA-Z0-9_]+)'/g)].map(m => m[1]).concat([...html.matchAll(/data-i18n="([a-zA-Z0-9_]+)"/g)].map(m => m[1])));
for (const k of used) if (!(k in UI.en)) fail(`ui: page uses "${k}" but data/ui.js has no English text for it`);

// Stops
const STOPS = W.WALKBCN_STOPS, ids = new Set();
const INTERESTS = ['architecture', 'history', 'food', 'art', 'local', 'outdoors', 'sports', 'culture'];
for (const s of STOPS) {
  if (ids.has(s.id)) fail(`stop: duplicate id ${s.id}`);
  ids.add(s.id);
  if (!(s.lat > 41.33 && s.lat < 41.46 && s.lng > 2.09 && s.lng < 2.23)) fail(`stop ${s.id}: coordinates outside Barcelona`);
  if (!s.img) fail(`stop ${s.id}: no photo`);
  if (!s.tags?.length || s.tags.some(t => !INTERESTS.includes(t))) fail(`stop ${s.id}: unknown interest in ${s.tags}`);
}

// Notices
const iso = /^\d{4}-\d{2}-\d{2}$/;
for (const [id, list] of Object.entries(W.WALKBCN_NOTICES || {})) {
  if (!ids.has(id)) fail(`notice: unknown stop ${id}`);
  for (const n of list) {
    for (const k of ['from', 'until']) if (n[k] && !iso.test(n[k])) fail(`notice ${id}: bad ${k} date ${n[k]}`);
    if (!iso.test(n.checked || '')) fail(`notice ${id}: needs a "checked" date`);
    if (!/^https:\/\//.test(n.source || '')) fail(`notice ${id}: needs a source link`);
    for (const l of langs) if (!n.text?.[l]) fail(`notice ${id}: no text in ${l}`);
  }
}

// Audio files referenced by stories
let audioRefs = 0;
const exists = f => fs.existsSync(root + f);
for (const [id, g] of Object.entries(W.WALKBCN_STORIES || {})) {
  for (const v of [g.base, ...Object.values(g.variants || {})]) if (v?.audio) { audioRefs++; if (!exists(v.audio)) fail(`audio missing: ${v.audio} (${id})`); }
}
for (const [l, d] of Object.entries(W.WALKBCN_I18N || {})) {
  for (const [id, s] of Object.entries(d.stops || {})) for (const a of Object.values(s.audio || {})) { audioRefs++; if (!exists(a.file)) fail(`audio missing: ${a.file} (${l}/${id})`); }
}

// Themes in index.html
const themeBlock = html.match(/const THEMES = \{([\s\S]*?)\n\};/)?.[1] || '';
for (const m of themeBlock.matchAll(/'([a-z0-9-]+)'/g)) {
  const v = m[1];
  if (INTERESTS.includes(v) || ['time', 'stops', 'distance', 'sports'].includes(v)) continue;
  if (!ids.has(v)) fail(`theme uses unknown stop "${v}"`);
}

console.log(`${STOPS.length} stops · ${Object.keys(UI.en).length} interface texts × ${langs.length} languages · ${audioRefs} audio files`);
if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); process.exit(1); }
console.log('✓ all checks passed');

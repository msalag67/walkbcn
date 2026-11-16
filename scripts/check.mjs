// Quick checks that protect the data the web relies on. Run: node scripts/check.mjs
// - every interface text exists in all 7 languages
// - stops: unique ids, inside central Barcelona, known interests, photo set
// - notices: valid dates, a source, a check date and text in every language
// - every recorded audio file the stories point to exists
// - themes only use stops that exist
// - practical cards and photo credits (author + licence) for every photo shown
// - Activities: retired places are gone everywhere, new places carry why + sources + date
// - every stop has a story and tip in every language (short, normal, long)
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data/ui.js', 'data/stops.js', 'data/cards.js', 'data/activities.js', 'data/tips.js', 'content/stories.js']) {
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
    if (n.review && !iso.test(n.review)) fail(`notice ${id}: bad review date ${n.review}`);
    if (!n.review && n.until) fail(`notice ${id}: a temporary notice needs a "review" date`);
    if (n.at && !(n.at.lat > 41.33 && n.at.lat < 41.46 && n.at.label)) fail(`notice ${id}: "at" needs lat, lng and label`);
  }
}

// Practical cards and photo credits
const CARDS = W.WALKBCN_CARDS || {}, PHOTOS = W.WALKBCN_PHOTOS || {};
const SENS = ['worship', 'study', 'residential', 'limited', 'works'];
for (const [id, c] of Object.entries(CARDS)) {
  if (!ids.has(id)) fail(`card: unknown stop ${id}`);
  if (c.outside && !['yes', 'partly', 'no'].includes(c.outside)) fail(`card ${id}: outside must be yes, partly or no`);
  for (const k of c.sensitive || []) if (!SENS.includes(k)) fail(`card ${id}: unknown sensitivity "${k}"`);
  for (const f of ['look', 'listen', 'access', 'cap2']) if (c[f]) for (const l of langs) if (!c[f][l]) fail(`card ${id}: ${f} missing in ${l}`);
  if (c.img2 && !c.cap2) fail(`card ${id}: second photo needs a caption`);
  for (const src of c.sources || []) if (!/^https:\/\//.test(src.url) || !iso.test(src.checked || '')) fail(`card ${id}: source needs https url and checked date`);
}
for (const f of [...STOPS.map(s => s.img), ...Object.values(CARDS).map(c => c.img2).filter(Boolean)]) {
  if (!PHOTOS[f]?.licence || !PHOTOS[f]?.author) fail(`photo "${f}": author and licence not recorded (node scripts/import-manual.mjs --photos)`);
}

// Every stop speaks every language: story (3 lengths) and tip
const I18N = W.WALKBCN_I18N || {};
for (const s of STOPS) for (const l of langs) {
  const d = I18N[l]?.stops?.[s.id];
  if (l !== 'en' && !d?.tip) fail(`stop ${s.id}: tip missing in ${l}`);
  for (const len of ['short', 'normal', 'long']) if (l !== 'en' || len !== 'normal') if (!d?.stories?.base?.[len]) fail(`stop ${s.id}: ${len} story missing in ${l}`);
  if (l !== 'en' && !d?.audio?.base?.file) fail(`stop ${s.id}: no recorded audio in ${l}`);
}
for (const s of STOPS) if (!W.WALKBCN_STORIES?.[s.id]?.base?.audio) fail(`stop ${s.id}: no recorded English audio`);

// Activities
const ACT = W.WALKBCN_ACTIVITIES;
const RETIRED = ['Teresa Carles', 'Flax & Kale'];
const actText = JSON.stringify(ACT) + JSON.stringify(Object.values(I18N).map(d => d.activities)) + fs.readFileSync(root + 'data/tips.js', 'utf8');
for (const r of RETIRED) if (actText.includes(r)) fail(`activities: retired place "${r}" still appears`);
for (const [cat, c] of Object.entries(ACT)) {
  for (const p of c.places) {
    for (const f of c.filters) for (const v of [].concat(p[f.id] || [])) if (!f.options.some(o => o.id === v)) fail(`activities ${cat}/${p.name}: unknown ${f.id} "${v}"`);
    if (p.lat == null || !(p.lat > 41.3 && p.lat < 41.5)) fail(`activities ${cat}/${p.name}: bad position`);
    if (p.sources && (!p.why || p.sources.some(x => !iso.test(x.checked || '')))) fail(`activities ${cat}/${p.name}: needs why + dated sources`);
    if (p.note && !c.notes?.[p.note]) fail(`activities ${cat}/${p.name}: unknown note ${p.note}`);
    for (const l of langs) if (l !== 'en' && I18N[l]?.activities && !I18N[l].activities[cat]?.places?.[p.name]) fail(`activities ${cat}/${p.name}: no ${l} description`);
  }
  for (const f of c.filters) for (const l of langs) if (l !== 'en' && I18N[l]?.activities) for (const o of f.options) if (!I18N[l].activities[cat]?.filters?.[f.id]?.options?.[o.id]) fail(`activities ${cat}: option ${f.id}/${o.id} not translated in ${l}`);
}
if (!ACT.restaurants.priceNote) fail('activities: restaurants need a priceNote explaining €, €€, €€€');

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
  if (INTERESTS.includes(v) || ['time', 'stops', 'distance', 'sports', 'poblenou'].includes(v)) continue;
  if (!ids.has(v)) fail(`theme uses unknown stop "${v}"`);
}

console.log(`${STOPS.length} stops · ${Object.keys(UI.en).length} interface texts × ${langs.length} languages · ${audioRefs} audio files`);
if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); process.exit(1); }
console.log('✓ all checks passed');

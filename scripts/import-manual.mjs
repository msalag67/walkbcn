// Brings hand-written content (no AI call, no cost) into the app's data files.
//
//   content/manual/<stop-id>.json   a stop written by the team: tip + story in 3 lengths
//                                   and 7 languages, plus its practical card
//   content/manual/_cards.json      practical cards for existing stops (listening point,
//                                   what to look at, access, sensitivity)
//   content/manual/_tips.json       corrected tips for existing stops, in 7 languages
//   content/manual/_photos.json     author and licence of every photo (Wikimedia Commons,
//                                   checked on each file page; refresh with --photos)
//
// Writes:
//   content/i18n/<lang>.json + .js  the stop texts (English short/long too), keeping any audio
//   data/cards.js                   window.WALKBCN_CARDS and window.WALKBCN_PHOTOS
//
// Then record the audio (free macOS voices, normal length only):
//   node scripts/generate.mjs --audio --only=<id>      English
//   node scripts/translate.mjs --audio --only=<id>     the other 6 languages
//
// Usage: node scripts/import-manual.mjs [--photos]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANUAL = path.join(ROOT, "content/manual");
const I18N = path.join(ROOT, "content/i18n");
const LANGS = ["en", "ca", "es", "fr", "de", "it", "zh"];
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const hash = (t) => crypto.createHash("sha1").update(t).digest("hex").slice(0, 10);

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data/stops.js"), "utf8"), ctx);
const STOPS = ctx.window.WALKBCN_STOPS;
const stopIds = new Set(STOPS.map((s) => s.id));

const stopFiles = fs.readdirSync(MANUAL).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
const manual = stopFiles.map((f) => read(path.join(MANUAL, f)));
const problems = [];
for (const m of manual) {
  if (!stopIds.has(m.id)) problems.push(`${m.id}: not in data/stops.js`);
  for (const l of LANGS) {
    if (!m.tip?.[l]) problems.push(`${m.id}: tip missing in ${l}`);
    for (const len of ["short", "normal", "long"]) if (!m.stories?.[l]?.[len]) problems.push(`${m.id}: ${len} story missing in ${l}`);
  }
  const stop = STOPS.find((s) => s.id === m.id);
  if (stop && stop.story !== m.stories.en.normal) problems.push(`${m.id}: data/stops.js story differs from the English normal text`);
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

// ---- Activities (content/manual/_activities.json) ----
// Removes retired places, adds the approved ones (with why they were chosen, price evidence and
// sources), updates filters and descriptions, in data/activities.js and in every translation.
// Idempotent: running it again gives the same files.
const actFile = path.join(ROOT, "data/activities.js");
const actSrc = fs.readFileSync(actFile, "utf8");
const actCtx = { window: {} };
vm.runInNewContext(actSrc, actCtx);
const A = actCtx.window.WALKBCN_ACTIVITIES;
const AM = read(path.join(MANUAL, "_activities.json"));
const en = (o) => (o && typeof o === "object" ? o.en : o);
for (const [cat, names] of Object.entries(AM.remove || {})) A[cat].places = A[cat].places.filter((p) => !names.includes(p.name));
for (const [cat, c] of Object.entries(AM.categoryLabels || {})) { A[cat].label = c.label.en; A[cat].intro = c.intro.en; }
for (const [cat, fs_] of Object.entries(AM.filters || {})) {
  for (const [fid, def] of Object.entries(fs_)) {
    const opts = Array.isArray(def) ? def : def.options;
    const options = opts.map((o) => ({ id: o.id, label: en(o.label) }));
    const existing = A[cat].filters.find((f) => f.id === fid);
    if (existing) existing.options = options;
    else A[cat].filters.splice(Math.max(0, A[cat].filters.findIndex((f) => f.id === "area")), 0, { id: fid, label: en(def.label), options });
  }
}
for (const [cat, note] of Object.entries(AM.priceNote || {})) A[cat].priceNote = note;
A.restaurants.notes = AM.notes || {};
for (const [cat, byName] of Object.entries(AM.retag || {})) {
  for (const p of A[cat].places) {
    Object.assign(p, byName["*"] || {}, byName[p.name] || {});
  }
}
for (const [cat, list] of Object.entries(AM.add || {})) {
  for (const add of list) {
    const { desc, ...rest } = add;
    const place = { ...rest, desc: desc.en };
    const i = A[cat].places.findIndex((p) => p.name === add.name);
    if (i >= 0) A[cat].places[i] = place; else A[cat].places.push(place);
  }
}
for (const [cat, byName] of Object.entries(AM.edit || {})) for (const [name, d] of Object.entries(byName)) {
  const p = A[cat].places.find((x) => x.name === name);
  if (!p) problems.push(`edit: ${cat}/${name} not found`); else p.desc = d.en;
}
const header = actSrc.slice(0, actSrc.indexOf("window.WALKBCN_ACTIVITIES"));
fs.writeFileSync(actFile, `${header}window.WALKBCN_ACTIVITIES = ${JSON.stringify(A, null, 2)};\n`);
// Same source text translate.mjs hashes, so a later translation run sees these as up to date.
const activitiesSource = () => Object.fromEntries(Object.entries(A).map(([id, cat]) => [id, {
  label: cat.label, intro: cat.intro,
  filters: Object.fromEntries(cat.filters.map((f) => [f.id, { label: f.label, options: Object.fromEntries(f.options.map((o) => [o.id, o.label])) }])),
  places: Object.fromEntries(cat.places.map((p) => [p.name, p.desc])),
}]));
function translateActivities(lang, data) {
  const T = data.activities;
  if (!T) return;
  for (const [cat, names] of Object.entries(AM.remove || {})) for (const n of names) delete T[cat]?.places?.[n];
  for (const [cat, c] of Object.entries(AM.categoryLabels || {})) { T[cat].label = c.label[lang]; T[cat].intro = c.intro[lang]; }
  for (const [cat, fs_] of Object.entries(AM.filters || {})) for (const [fid, def] of Object.entries(fs_)) {
    const opts = Array.isArray(def) ? def : def.options;
    T[cat].filters[fid] ||= { label: en(def.label), options: {} };
    if (!Array.isArray(def)) T[cat].filters[fid].label = def.label[lang];
    T[cat].filters[fid].options = Object.fromEntries(opts.map((o) => [o.id, o.label[lang]]));
  }
  for (const [cat, list] of Object.entries(AM.add || {})) for (const add of list) T[cat].places[add.name] = add.desc[lang];
  for (const [cat, byName] of Object.entries(AM.edit || {})) for (const [name, d] of Object.entries(byName)) T[cat].places[name] = d[lang];
  data.activitiesHash = hash(JSON.stringify(activitiesSource()));
}

// ---- stop texts into content/i18n ----
const tips = read(path.join(MANUAL, "_tips.json"));
for (const lang of LANGS) {
  const file = path.join(I18N, `${lang}.json`);
  const data = read(file);
  for (const m of manual) {
    const prev = data.stops[m.id] || {};
    const entry = { tip: m.tip[lang], stories: { base: { ...m.stories[lang] } } };
    if (lang !== "en") { entry.srcHash = `manual-${hash(JSON.stringify([m.stories.en, m.tip.en]))}`; entry.audio = prev.audio ?? {}; }
    data.stops[m.id] = entry;
  }
  for (const [id, t] of Object.entries(tips)) if (data.stops[id] && t[lang]) data.stops[id].tip = t[lang];
  if (lang !== "en") translateActivities(lang, data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  fs.writeFileSync(path.join(I18N, `${lang}.js`),
    `// Generated by scripts/translate.mjs and scripts/import-manual.mjs — do not edit by hand.\nwindow.WALKBCN_I18N = window.WALKBCN_I18N || {};\nwindow.WALKBCN_I18N[${JSON.stringify(lang)}] = ${JSON.stringify(data)};\n`);
}

// ---- photo credits ----
const photosFile = path.join(MANUAL, "_photos.json");
let photos = read(photosFile);
if (process.argv.includes("--photos")) {
  const files = new Set([...STOPS.map((s) => s.img), ...manual.map((m) => m.card?.img2).filter(Boolean)]);
  const UA = { "User-Agent": "WalkBCN/1.0 (student project; static site)" };
  const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const list = [...files];
  for (let i = 0; i < list.length; i += 40) {
    const titles = list.slice(i, i + 40).map((f) => `File:${f}`).join("|");
    let res;
    for (let a = 0; a < 6; a++) {
      res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(titles)}`, { headers: UA });
      if (res.status !== 429) break;
      await new Promise((r) => setTimeout(r, 25000));
    }
    const d = await res.json();
    const norm = Object.fromEntries((d.query.normalized || []).map((n) => [n.to, n.from]));
    for (const p of Object.values(d.query.pages)) {
      const m = p.imageinfo?.[0]?.extmetadata;
      const name = (norm[p.title] || p.title).replace(/^File:/, "");
      if (m) photos[name] = { author: strip(m.Artist?.value).slice(0, 90) || "Unknown", licence: m.LicenseShortName?.value || null, licenceUrl: m.LicenseUrl?.value || null };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  photos = Object.fromEntries(Object.entries(photos).sort());
  fs.writeFileSync(photosFile, JSON.stringify(photos, null, 1) + "\n");
}

// ---- data/cards.js ----
const cards = read(path.join(MANUAL, "_cards.json"));
for (const m of manual) cards[m.id] = m.card;
for (const id of Object.keys(cards)) if (!stopIds.has(id)) problems.push(`card for unknown stop ${id}`);
const usedPhotos = new Set([...STOPS.map((s) => s.img), ...Object.values(cards).map((c) => c.img2).filter(Boolean)]);
for (const f of usedPhotos) if (!photos[f]?.licence) problems.push(`no licence recorded for photo "${f}" (run with --photos)`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
const keptPhotos = Object.fromEntries([...usedPhotos].sort().map((f) => [f, photos[f]]));
fs.writeFileSync(path.join(ROOT, "data/cards.js"),
  `// Generated by scripts/import-manual.mjs from content/manual/ — edit those files, not this one.\n` +
  `// WALKBCN_CARDS: practical card per stop (what to look at, where to listen, access, sensitivity,\n` +
  `// second photo, sources with the date checked). WALKBCN_PHOTOS: author and licence of every photo.\n` +
  `window.WALKBCN_CARDS = ${JSON.stringify(cards, null, 1)};\nwindow.WALKBCN_PHOTOS = ${JSON.stringify(keptPhotos, null, 1)};\n`);
console.log(`Imported ${manual.length} stops, ${Object.keys(cards).length} cards, ${Object.keys(keptPhotos).length} photo credits.`);

// Regression tests for the Phase 1 audit fixes (audit of 18 Nov 2026, findings F2–F10).
//
// Runs a headless, isolated Chromium (playwright-core) against a local copy of the site.
// Every test has a hard time limit, and the whole run stops after RUN_LIMIT, so a page that
// hangs (as F2 did) fails the test instead of blocking the run.
//
// Usage:  python3 -m http.server 8642        (in the project folder, in another terminal)
//         node evals/phase1-tests.mjs         [--only=F2,F3] [--base=http://localhost:8642]
// Needs:  playwright-core (set PLAYWRIGHT_CORE to its folder if it isn't found on its own).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const BASE = arg("base") || "http://localhost:8642";
const ONLY = arg("only")?.split(",");
const TEST_LIMIT = 30000, RUN_LIMIT = 300000;

function findPlaywright() {
  if (process.env.PLAYWRIGHT_CORE) return process.env.PLAYWRIGHT_CORE;
  const npx = path.join(os.homedir(), ".npm/_npx");
  for (const d of fs.existsSync(npx) ? fs.readdirSync(npx) : []) {
    const p = path.join(npx, d, "node_modules/playwright-core");
    if (fs.existsSync(p)) return p;
  }
  return "playwright-core";
}
const { chromium } = await import(path.isAbsolute(findPlaywright()) ? path.join(findPlaywright(), "index.mjs") : "playwright-core");

const watchdog = setTimeout(() => { console.error(`Run stopped after ${RUN_LIMIT / 1000} s`); process.exit(2); }, RUN_LIMIT);
// The bundled browser if it matches this playwright-core, else any downloaded headless shell,
// else the installed Google Chrome (headless, with its own temporary profile).
async function launch() {
  try { return await chromium.launch({ headless: true }); } catch (e) {}
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  for (const d of fs.existsSync(cache) ? fs.readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell")).reverse() : []) {
    const exe = path.join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
    if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
  }
  return chromium.launch({ headless: true, channel: "chrome" });
}
const browser = await launch();
const results = [];
const withLimit = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`no answer in ${ms / 1000} s (${what})`)), ms))]);

// A fresh browser profile per test: no saved language, route or caches from another test.
async function test(id, name, fn, limit = TEST_LIMIT) {
  if (ONLY && !ONLY.some((o) => id.startsWith(o))) return;
  const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let ok = false, detail = "";
  try {
    const r = await withLimit(fn(page, ctx), limit, id);
    ok = r === true || r?.ok === true;
    detail = r === true ? "" : JSON.stringify(r?.detail ?? r);
    if (errors.length) { ok = false; detail += ` page errors: ${errors.join(" | ")}`; }
  } catch (e) { detail = e.message + (errors.length ? ` | page errors: ${errors.join(' | ')}` : ''); }
  results.push({ id, name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  ${name}${detail ? `\n      ${detail.slice(0, +process.env.DETAIL_MAX || 400)}` : ""}`);
  await withLimit(ctx.close(), 5000, "close").catch(() => {});
}
async function open(page, hash = "", langCode = "en") {
  await page.addInitScript((l) => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", l); } catch (e) {} }, langCode);
  await page.goto(`${BASE}/?src=test${hash}`);
  await page.waitForFunction(() => typeof showRoute === "function" && window.WALKBCN_STOPS?.length > 0);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- F2
await test("F2a", "Audio guide in English with en.js failing: no hang, standard text + retry", async (page, ctx) => {
  await ctx.route("**/content/i18n/en.js*", (r) => r.abort());
  await open(page);
  const t0 = Date.now();
  await page.evaluate(() => { showTab("guide"); openGuideStop(STOPS.find((s) => s.id === "casa-vicens")); });
  await page.waitForSelector("#guideCard .lang-error [data-retry-lang='en']", { timeout: 8000 });
  const d = await page.evaluate(() => ({ story: document.querySelector("#guideCard .story")?.textContent.length || 0, msg: document.querySelector("#guideCard .lang-error")?.textContent }));
  return { ok: d.story > 100 && Date.now() - t0 < 8000, detail: d };
});
await test("F2b", "Retry after the network comes back loads the long English text", async (page, ctx) => {
  let block = true;
  await ctx.route("**/content/i18n/en.js*", (r) => (block ? r.abort() : r.continue()));
  await open(page);
  await page.evaluate(() => { showTab("guide"); openGuideStop(STOPS.find((s) => s.id === "casa-vicens")); });
  await page.waitForSelector("#guideCard [data-retry-lang='en']", { timeout: 8000 });
  const before = await page.evaluate(() => document.querySelector("#guideCard .story").textContent.length);
  block = false;
  await page.click("#guideCard [data-retry-lang='en']");
  await page.waitForFunction(() => !!window.WALKBCN_I18N.en && !document.querySelector("#guideCard .lang-error"), null, { timeout: 8000 });
  const after = await page.evaluate(() => document.querySelector("#guideCard .story").textContent.length);
  return { ok: after > before, detail: { before, after } };
});
await test("F2c", "German texts failing: the route card says so, shows English, retry works", async (page, ctx) => {
  let block = true;
  await ctx.route("**/content/i18n/de.js*", (r) => (block ? r.abort() : r.continue()));
  await open(page);
  await page.evaluate(async () => { selected = new Set(["history"]); stopsCount = 3; showRoute(); await setLang("de"); });
  await page.waitForSelector("#stopCard .lang-error [data-retry-lang='de']", { timeout: 8000 });
  const msg = await page.evaluate(() => document.querySelector("#stopCard .lang-error").textContent);
  block = false;
  await page.click("#stopCard [data-retry-lang='de']");
  await page.waitForFunction(() => !!window.WALKBCN_I18N.de && !document.querySelector("#stopCard .lang-error"), null, { timeout: 8000 });
  const lang = await page.evaluate(() => document.querySelector("#stopCard .story").getAttribute("lang"));
  return { ok: /Deutsch/.test(msg) && lang === "de", detail: { msg, lang } };
});
await test("F2d", "A language file that never answers counts as failed after the time limit", async (page, ctx) => {
  await ctx.route("**/content/i18n/it.js*", () => {}); // never answers
  await open(page);
  const r = await page.evaluate(async () => { const t0 = Date.now(); const ok = await loadLangData("it"); return { ok, s: Math.round((Date.now() - t0) / 1000), failed: !!langFailed.it, stillLoading: !!loadingLang.it }; });
  return { ok: r.ok === false && r.failed && !r.stillLoading && r.s <= 16, detail: r };
});

// ---------------------------------------------------------------- F3
const buildIn = (page, p) => page.evaluate((p) => {
  Object.assign(plan, { mode: "stops", theme: null, zone: "any", must: [] }, p); selected = new Set(["history"]); stopsCount = 4;
  syncPlanControls(); showRoute(); return { link: shareLink(), ids: route.map((s) => s.id) };
}, p);
const openLink = async (ctx, link) => {
  const page = await ctx.newPage();
  await page.goto(link.replace(/^https?:\/\/[^/]+\/[^#]*/, `${BASE}/?src=test`));
  await page.waitForFunction(() => typeof lastRoute !== "undefined" && !!lastRoute);
  return page.evaluate(() => ({ ids: route.map((s) => s.id), start: plan.start, end: plan.end, s: lastRoute.start, e: lastRoute.end }));
};
await test("F3a", "Shared link keeps a start and a finish chosen on the map", async (page, ctx) => {
  await open(page);
  const a = await buildIn(page, { start: "map", startPt: { lat: 41.38094, lng: 2.17351 }, end: "map", endPt: { lat: 41.39041, lng: 2.18893 } });
  const b = await openLink(ctx, a.link);
  const ok = /&s=41\.3809,2\.1735/.test(a.link) && /&e=41\.3904,2\.1889/.test(a.link) && b.start === "map" && b.end === "map" &&
    b.ids.join() === a.ids.join() && Math.abs(b.s.lat - 41.3809) < 1e-6 && Math.abs(b.e.lng - 2.1889) < 1e-6;
  return { ok, detail: { link: a.link.split("#")[1], b } };
});
await test("F3b", "Shared link keeps 'back where I started'", async (page, ctx) => {
  await open(page);
  const a = await buildIn(page, { start: "map", startPt: { lat: 41.3838, lng: 2.1766 }, end: "loop" });
  const b = await openLink(ctx, a.link);
  return { ok: /&e=loop/.test(a.link) && b.end === "loop" && b.e && Math.abs(b.e.lat - b.s.lat) < 1e-9, detail: { link: a.link.split("#")[1], b } };
});
await test("F3c", "'Where I am now' is shared rounded to about 100 m", async (page) => {
  await open(page);
  const a = await buildIn(page, { start: "here", startPt: { lat: 41.381234, lng: 2.173456 } });
  return { ok: /&s=41\.381,2\.173(&|$)/.test(a.link), detail: a.link.split("#")[1] };
});
await test("F3d", "Old links still open; unreadable or far-away points are ignored", async (page, ctx) => {
  await open(page);
  const old = await openLink(ctx, `${BASE}/#walk=placa-del-rei,not-a-stop,sant-pau-del-camp&i=history&l=normal`);
  const bad = await openLink(ctx, `${BASE}/#walk=placa-del-rei,sant-pau-del-camp&i=history&l=normal&s=48.8566,2.3522&e=abc`);
  const ok = old.ids.join() === "placa-del-rei,sant-pau-del-camp" && old.start === "best" && old.end === "any" && bad.start === "best" && bad.end === "any" && !bad.s;
  return { ok, detail: { old, bad } };
});

// ---------------------------------------------------------------- F4
await test("F4a", "Barça theme, Gimnàs Solé visited, Canaletes removed: no 'only n stops match' note", async (page) => {
  await open(page);
  const r = await page.evaluate(async () => {
    Object.assign(plan, { mode: "stops", start: "best", end: "any", zone: "any", must: [] });
    applyTheme("barca"); showRoute();
    const before = route.map((s) => s.id);
    walk.visited["gimnas-sole"] = true;
    const target = route.find((s) => /canaletes/.test(s.id) && !walk.visited[s.id]) || route.find((s) => !walk.visited[s.id]);
    editing = true; renderStopList();
    const k = route.indexOf(target);
    document.querySelectorAll("#stopList [data-a='remove']")[k].click();
    await new Promise((r) => setTimeout(r, 200));
    const notes = document.querySelector(".sum-notes")?.textContent || "";
    saveRoute();
    return { before, removed: target.id, after: route.map((s) => s.id), notes, visitedKept: !!walk.visited["gimnas-sole"] };
  });
  const ok = !/Only \d+ stops match/.test(r.notes) && /You edited this route: it now has \d+ stops/.test(r.notes) && !r.after.includes(r.removed) && r.visitedKept;
  return { ok, detail: r };
});
await test("F4b", "The edited note survives a reload; a fresh short route still explains why it's short", async (page) => {
  await open(page);
  const r = await page.evaluate(async () => {
    selected = new Set(["history", "architecture"]); Object.assign(plan, { mode: "stops", start: "best", end: "any", zone: "any", must: [], theme: null }); stopsCount = 5; showRoute();
    editing = true; renderStopList();
    document.querySelectorAll("#stopList [data-a='remove']")[1].click();
    saveRoute();
    showPickView(); restoreRoute();
    const restored = document.querySelector(".sum-notes")?.textContent || "";
    // a theme pool too small for 10 stops: the original note must still appear
    Object.assign(plan, { theme: null, zone: "gracia", must: [] }); selected = new Set(["food"]); stopsCount = 10; showRoute();
    const fresh = document.querySelector(".sum-notes")?.textContent || "";
    return { restored, fresh, n: route.length };
  });
  const ok = /You edited this route/.test(r.restored) && !/You edited/.test(r.fresh) && (r.n >= 10 || /Only \d+ stops match/.test(r.fresh));
  return { ok, detail: r };
});

// ---------------------------------------------------------------- F7
const noticeOn = async (page, day, id) => {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await open(page);
  return page.evaluate((id) => { showTab("guide"); openGuideStop(STOPS.find((s) => s.id === id)); const n = document.querySelector("#guideCard .notice"); return n ? { cls: n.className, text: n.textContent.replace(/\s+/g, " ").trim() } : null; }, id);
};
await test("F7a", "Before its end date a temporary notice shows normally", async (page) => {
  const n = await noticeOn(page, "2026-11-25", "via-sepulcral-romana");
  return { ok: !!n && !/expired/.test(n.cls) && /closed for works/.test(n.text), detail: n };
});
await test("F7b", "After its end date, not re-checked: still shown, marked pending verification", async (page) => {
  const n = await noticeOn(page, "2026-12-05", "via-sepulcral-romana");
  return { ok: !!n && /expired/.test(n.cls) && /Pending verification/.test(n.text) && /haven't checked again/.test(n.text), detail: n };
});
await test("F7c", "Long after its end date (over 60 days) it is no longer shown", async (page) => {
  const n = await noticeOn(page, "2027-03-01", "via-sepulcral-romana");
  return { ok: n === null, detail: n };
});
await test("F7d", "A notice checked again (resolved) disappears after its end date", async (page) => {
  await page.clock.setFixedTime(new Date("2026-12-05T10:00:00"));
  await open(page);
  const r = await page.evaluate(() => { WALKBCN_NOTICES["via-sepulcral-romana"][0].resolved = "2026-12-01"; return noticesFor(STOPS.find((s) => s.id === "via-sepulcral-romana"), true).length; });
  return { ok: r === 0, detail: r };
});
await test("F7e", "Expired notices never move a stop or keep it out of routes", async (page) => {
  await page.clock.setFixedTime(new Date("2027-01-10T10:00:00"));
  await open(page);
  const r = await page.evaluate(() => { const s = STOPS.find((x) => x.id === "mercat-abaceria"); return { moved: !!s.home, closed: s.closedNow, shown: noticesFor(s, true).length, active: noticesFor(s).length }; });
  return { ok: !r.moved && !r.closed && r.shown === 1 && r.active === 0, detail: r };
});
await test("F7f", "Abaceria notice gives the date its source gives (17 November)", async (page) => {
  const n = await noticeOn(page, "2026-11-22", "mercat-abaceria");
  return { ok: !!n && /17 November 2026/.test(n.text) && !/14 November/.test(n.text), detail: n };
});

// ---------------------------------------------------------------- F9
await test("F9a", "Translations load at an address made from their content", async (page) => {
  const asked = [];
  page.on("request", (r) => { if (/content\/i18n\//.test(r.url())) asked.push(r.url().split("/").pop()); });
  await open(page, "", "fr");
  await page.waitForFunction(() => !!window.WALKBCN_I18N.fr);
  const v = await page.evaluate(() => WALKBCN_VERSIONS.i18n.fr);
  return { ok: /^[0-9a-f]{8}$/.test(v) && asked.includes(`fr.js?v=${v}`), detail: { v, asked } };
});
await test("F9b", "Service worker keeps one copy per translation file and drops older ones", async (page, ctx) => {
  const swCtx = await browser.newContext({ locale: "en-GB" });
  const p = await swCtx.newPage();
  try {
    await p.goto(`${BASE}/?src=test`);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    return await p.evaluate(async () => {
      await fetch("content/i18n/it.js?v=old11111");
      await fetch(`content/i18n/it.js?v=${WALKBCN_VERSIONS.i18n.it}`);
      await new Promise((r) => setTimeout(r, 300));
      const keys = (await (await caches.open("walkbcn-media-v1")).keys()).map((k) => k.url.split("/").pop()).filter((u) => u.startsWith("it.js"));
      return { ok: keys.length === 1 && keys[0] === `it.js?v=${WALKBCN_VERSIONS.i18n.it}`, detail: keys };
    });
  } finally { await swCtx.close().catch(() => {}); }
});
await test("F9c", "Every data file is stamped with its current content (check mode)", async () => {
  const { stampVersions } = await import(new URL("../scripts/stamp-versions.mjs", import.meta.url));
  const stale = stampVersions({ check: true });
  return { ok: stale.length === 0, detail: stale };
});

// ---------------------------------------------------------------- F10
await test("F10a", "Opening one recorded story after another keeps at most one recording in memory", async (page) => {
  await page.addInitScript(() => {
    window.__blobs = { made: 0, freed: 0 };
    const make = URL.createObjectURL.bind(URL), free = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (b) => { window.__blobs.made++; return make(b); };
    URL.revokeObjectURL = (u) => { window.__blobs.freed++; return free(u); };
  });
  await open(page);
  const r = await page.evaluate(async () => {
    selected = new Set(["history", "architecture"]); Object.assign(plan, { mode: "stops", length: "normal", start: "best", end: "any", zone: "any", must: [], theme: null }); stopsCount = 6; showRoute();
    const ids = route.map((s) => s.id);
    for (let i = 0; i < route.length; i++) {
      const before = window.__blobs.made;
      goTo(i);
      const t0 = Date.now();
      while (window.__blobs.made === before && Date.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 100));
    }
    showPickView();
    await new Promise((r) => setTimeout(r, 500));
    return { ids, ...window.__blobs, live: window.__blobs.made - window.__blobs.freed };
  });
  return { ok: r.made >= 4 && r.live <= 1, detail: r };
});

// ---------------------------------------------------------------- F8 (data only, no browser)
await test("F8a", "Bunkers del Carmel activity matches the Turó de la Rovira card in all 7 languages", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const bad = [];
  for (const l of ["ca", "es", "fr", "de", "it", "zh"]) {
    const d = JSON.parse(fs.readFileSync(`${root}content/i18n/${l}.json`, "utf8"));
    const desc = d.activities.viewpoints.places["Bunkers del Carmel"] || "";
    if (!/MUHBA/.test(desc) || !/Rovira/.test(desc)) bad.push(l);
    if (/Boqueria/.test(d.stops["mercat-de-santa-caterina"].tip)) bad.push(`${l} Santa Caterina tip`);
    if (!/[(（]/.test(d.activities.nightlife.filters.crowd.label)) bad.push(`${l} crowd label`);
  }
  const en = fs.readFileSync(`${root}data/activities.js`, "utf8");
  if (!/Turó de la Rovira: a 360° view[^"]*MUHBA/.test(en) || /Very popular at sunset/.test(en)) bad.push("en activity");
  if (!/Who goes\? \(our impression\)/.test(en)) bad.push("en crowd label");
  if (/same quality, far fewer queues/.test(fs.readFileSync(`${root}data/stops.js`, "utf8"))) bad.push("en Santa Caterina tip");
  return { ok: bad.length === 0, detail: bad };
});

// ---------------------------------------------------------------- F6 (data only)
await test("F6a", "Turó de la Rovira says 1990 (as its source) in every language and length", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const bad = [];
  const old = /late 1980s|anys vuitanta|años ochenta|années 1980|1980er|anni Ottanta|80年代末/;
  for (const l of ["en", "ca", "es", "fr", "de", "it", "zh"]) {
    const st = JSON.parse(fs.readFileSync(`${root}content/i18n/${l}.json`, "utf8")).stops["bunkers-carmel"].stories;
    for (const [k, v] of Object.entries(st)) for (const len of ["short", "normal", "long"]) if (v[len] && old.test(v[len])) bad.push(`${l}/${k}/${len}`);
  }
  const stories = fs.readFileSync(`${root}content/stories.json`, "utf8");
  if (old.test(JSON.stringify(JSON.parse(stories)["bunkers-carmel"]))) bad.push("stories.json");
  return { ok: bad.length === 0, detail: bad };
});
await test("F6b", "check.mjs passes and finds no recording that contradicts its text", async () => {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync("node", [new URL("../scripts/check.mjs", import.meta.url).pathname], { encoding: "utf8" });
  const out = r.stdout + r.stderr;
  return { ok: r.status === 0 && !/recordings don't match/.test(out), detail: out.split("\n").filter((x) => /^[!✗✓]/.test(x)) };
});

// ---------------------------------------------------------------- F5 (what a desktop browser can check)
await test("F5a", "A recording loads and plays (English and Catalan samples)", async (page) => {
  await open(page);
  const r = await page.evaluate(async () => {
    const out = {};
    for (const l of ["en", "ca"]) {
      await setLang(l);
      selected = new Set(["history"]); Object.assign(plan, { mode: "stops", length: "normal", theme: null, zone: "any", must: [] }); stopsCount = 3; showRoute();
      const st = storyFor(route[0]);
      const a = new Audio(st.audio); a.muted = true;
      const ok = await new Promise((res) => { a.ontimeupdate = () => a.currentTime > 0.3 && res(true); a.onerror = () => res(`error ${a.error?.code}`); a.play().catch((e) => res(e.name)); setTimeout(() => res("timeout"), 8000); });
      out[l] = { file: st.audio, ok, duration: Math.round(a.duration || 0) };
      a.pause();
    }
    return out;
  });
  return { ok: r.en.ok === true && r.ca.ok === true, detail: r };
});
await test("F5b", "Spanish stories use the device voice (no recording, on purpose)", async (page) => {
  await open(page, "", "es");
  const r = await page.evaluate(async () => {
    await setLang("es");
    selected = new Set(["history"]); stopsCount = 3; showRoute();
    const st = storyFor(route[0]);
    return { audio: st.audio, tts: !!tts, player: !!player, label: document.querySelector("#stopCard #plLabel")?.textContent };
  });
  return { ok: r.audio === null && r.tts && !r.player, detail: r };
});
await test("F5c", "A recording that fails to download falls back to the device voice and says so", async (page, ctx) => {
  await ctx.route("**/audio/**", (r) => r.fulfill({ status: 404, body: "" }));
  await open(page);
  const r = await page.evaluate(async () => {
    selected = new Set(["history"]); stopsCount = 3; showRoute();
    const t0 = Date.now();
    while (!fellBack && Date.now() - t0 < 6000) await new Promise((r) => setTimeout(r, 100));
    return { fellBack, tts: !!tts, status: document.querySelector("#stopCard #plStatus")?.textContent || document.querySelector("#stopCard")?.innerText.match(/device voice[^\n]*/)?.[0] };
  });
  return { ok: r.fellBack && r.tts, detail: r };
});

// ---------------------------------------------------------------- earlier behaviour still works
await test("REG", "The 20 evolution scenarios of 14 Nov 2026 still pass", async (page) => {
  await open(page);
  const src = fs.readFileSync(new URL("./evolution-scenarios.js", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "");
  const out = await page.evaluate(`(${src.trim()})()`);
  const failed = out.filter((x) => !x.ok).map((x) => `${x.id} ${x.name}`);
  return { ok: out.length === 20 && failed.length === 0, detail: failed.length ? failed : `${out.length}/20` };
}, 90000);

await test("REG-off", "A walk saved for offline use reopens with the network cut (story, recording, French texts)", async () => {
  const swCtx = await browser.newContext({ locale: "en-GB" });
  const p = await swCtx.newPage();
  try {
    await p.addInitScript(() => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", "fr"); } catch (e) {} });
    await p.goto(`${BASE}/?src=test`);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();
    await p.waitForFunction(() => !!navigator.serviceWorker.controller && !!window.WALKBCN_I18N.fr, null, { timeout: 10000 });
    const saved = await p.evaluate(async () => {
      selected = new Set(["history"]); stopsCount = 3; showRoute(); history.replaceState({ r: 1 }, "", "#ruta"); saveRoute();
      await saveOffline();
      const t0 = Date.now();
      while (!/✓|enregistr|saved/i.test(document.getElementById("offlineStatus").textContent) && Date.now() - t0 < 15000) await new Promise((r) => setTimeout(r, 200));
      return { status: document.getElementById("offlineStatus").textContent, ids: route.map((s) => s.id), audio: storyFor(route[0]).audio };
    });
    await swCtx.setOffline(true);
    await p.reload();
    await p.waitForFunction(() => typeof route !== "undefined" && route.length > 0, null, { timeout: 10000 });
    const after = await p.evaluate(async () => {
      const a = await fetch(storyFor(route[0]).audio).then((r) => r.status).catch((e) => e.message);
      return { ids: route.map((s) => s.id), lang: document.querySelector("#stopCard .story")?.getAttribute("lang"), story: (document.querySelector("#stopCard .story")?.textContent || "").length, audio: a };
    });
    return { ok: after.ids.join() === saved.ids.join() && after.lang === "fr" && after.story > 100 && (after.audio === 200 || after.audio === 206), detail: { saved, after } };
  } finally { await swCtx.close().catch(() => {}); }
}, 60000);

// ---------------------------------------------------------------- Phase 2: discovery styles
await test("P2-style", "Discovery styles change the ranking, keep interests first, and 'mix' adds nothing", async (page) => {
  await open(page);
  const r = await page.evaluate(() => {
    const build = (st) => { Object.assign(plan, { mode: "stops", start: "best", end: "any", theme: null, zone: "any", must: [], style: st }); selected = new Set(["history", "architecture"]); stopsCount = 5; routeAngles = {}; showRoute(); return route.slice(); };
    const res = {}; for (const st of STYLE_IDS) { const rt = build(st); res[st] = { ids: rt.map((s) => s.id), fit: rt.filter(DISCOVERY_STYLES[st].fit).length, off: rt.filter((s) => !s.tags.some((t) => selected.has(t))).length }; }
    plan.style = "mix"; const zero = STOPS.every((s) => styleBonus(s) === 0);
    const maxBonus = Math.max(...STYLE_IDS.flatMap((st) => STOPS.map((s) => Math.abs(DISCOVERY_STYLES[st].bonus(s)))));
    Object.assign(plan, { style: "lesser", must: ["sagrada-familia"] }); selected = new Set(["history"]); stopsCount = 4; showRoute(); const must = route.some((s) => s.id === "sagrada-familia");
    plan.style = "mix"; plan.must = [];
    return { res, zero, maxBonus, must };
  });
  const distinct = new Set(Object.values(r.res).map((x) => x.ids.join())).size;
  const ok = r.zero && r.maxBonus < 1 && r.must && distinct >= 4 && Object.values(r.res).every((x) => x.off === 0) &&
    r.res.essentials.fit >= 4 && r.res.lesser.fit >= 4;
  return { ok, detail: { distinct, ...r } };
});

// ---------------------------------------------------------------- Phase 2C.1: adapt my walk
// Story-version cache (angles) is left out: a reload recomputes it, as before this feature.
const SNAP = `window.__snap = () => { const sv = JSON.parse(localStorage.getItem('walkbcn_route_v1') || 'null'); if (sv) { delete sv.at; delete sv.angles; }
  return JSON.stringify({ ids: route.map((s) => s.id), current, walk, sel: [...selected].sort(), plan, saved: sv, link: shareLink(), start: lastRoute.start && [lastRoute.start.lat, lastRoute.start.lng], end: lastRoute.end && [lastRoute.end.lat, lastRoute.end.lng] }); };
  window.__click = (sel) => { const el = document.querySelector(sel); if (!el) throw new Error('no ' + sel); el.click(); };
  window.__wait = (ms) => new Promise((r) => setTimeout(r, ms));`;
await test("P2C-cancel", "Adapt my walk: cancelling (Keep, Esc, Back, reopen) changes nothing, also after a reload", async (page) => {
  await open(page);
  await page.evaluate(SNAP);
  const r = await page.evaluate(async () => {
    Object.assign(plan, { mode: "stops", start: "best", end: "any", zone: "any", must: [], theme: null, style: "mix" }); selected = new Set(["history", "architecture"]); stopsCount = 6; showRoute();
    history.replaceState({ r: 1 }, "", "#ruta");
    walk.visited[route[0].id] = true; walk.skipped[route[1].id] = true; goTo(2); await __wait(100);
    const s0 = __snap(), res = {};
    // 1. less time → preview → Keep my route
    __click("#adaptRoute"); __click('#adaptBody [data-a="time"]'); __click('#adaptMin [data-v="15"]'); __click('#adaptBody [data-a="preview"]');
    res.preview1 = document.querySelector("#adaptBody .adapt-tag")?.textContent || document.getElementById("adaptBody").textContent.slice(0, 80);
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    res.keep = __snap() === s0 && !document.getElementById("adapt").open;
    // 2. change interests + style → preview → Esc (dialog close without a choice)
    __click("#adaptRoute"); __click('#adaptBody [data-a="plan"]'); __click('#adaptStyle [data-v="lesser"]'); __click('#adaptInts [data-v="food"]'); __click('#adaptInts [data-v="history"]'); __click('#adaptBody [data-a="preview"]');
    document.getElementById("adapt").close(); await __wait(150);
    res.esc = __snap() === s0;
    // 3. preview then browser Back
    __click("#adaptRoute"); __click('#adaptBody [data-a="time"]'); __click('#adaptBody [data-a="preview"]');
    history.back(); await __wait(300);
    res.back = __snap() === s0 && !document.getElementById("adapt").open && !document.getElementById("route").hidden && location.hash === "#ruta";
    // reopen: the draft starts from the original interests and style
    __click("#adaptRoute"); __click('#adaptBody [data-a="plan"]');
    res.reopen = [...document.querySelectorAll('#adaptInts [aria-pressed="true"]')].map((b) => b.dataset.v).sort().join() === "architecture,history" && document.querySelector('#adaptStyle [aria-pressed="true"]').dataset.v === "mix";
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    res.s0 = s0;
    return res;
  });
  await page.reload(); await page.waitForFunction(() => typeof showRoute === "function" && route.length > 0); await page.evaluate(SNAP);
  const after = await page.evaluate(() => __snap());
  const ok = r.keep && r.esc && r.back && r.reopen && after === r.s0 && /Proposal/.test(r.preview1);
  return { ok, detail: { keep: r.keep, esc: r.esc, back: r.back, reopen: r.reopen, reloadSame: after === r.s0, preview: r.preview1 } };
}, 45000);
await test("P2C-apply", "Adapt my walk: applying changes only the stops ahead, keeps progress, loop/finish, and survives a reload", async (page) => {
  await open(page);
  await page.evaluate(SNAP);
  const r = await page.evaluate(async () => {
    const res = {};
    // loop from a point on the map
    Object.assign(plan, { mode: "stops", start: "map", startPt: { lat: 41.3838, lng: 2.1766 }, end: "loop", zone: "any", must: [], theme: null, style: "mix" }); selected = new Set(["history", "architecture"]); stopsCount = 7; showRoute();
    history.replaceState({ r: 1 }, "", "#ruta");
    walk.visited[route[0].id] = true; walk.skipped[route[1].id] = true; goTo(2); await __wait(100);
    const before = route.map((s) => s.id), done = before.slice(0, 2);
    __click("#adaptRoute"); __click('#adaptBody [data-a="time"]'); __click('#adaptMin [data-v="30"]'); __click('#adaptBody [data-a="preview"]');
    res.loopNote = /where you started/.test(document.getElementById("adaptBody").textContent);
    res.compare = document.querySelector(".adapt-compare")?.textContent.replace(/\s+/g, " ").trim();
    __click('#adaptBody [data-a="apply"]'); await __wait(200);
    const after = route.map((s) => s.id);
    res.loop = { before, after, doneKept: after.slice(0, 2).join() === done.join() && walk.visited[done[0]] && walk.skipped[done[1]], shorter: after.length < before.length,
      planEnd: plan.end, endIsStart: lastRoute.end.lat === lastRoute.start.lat && lastRoute.end.lng === lastRoute.start.lng, current, sel: [...selected].sort().join() };
    // custom finish + change plan (style + interests)
    Object.assign(plan, { mode: "stops", start: "best", startPt: null, end: "map", endPt: { lat: 41.3904, lng: 2.1889 }, style: "mix" }); selected = new Set(["history"]); stopsCount = 5; showRoute();
    walk.visited[route[0].id] = true; goTo(1); await __wait(100);
    const b2 = route.map((s) => s.id);
    __click("#adaptRoute"); __click('#adaptBody [data-a="plan"]'); __click('#adaptStyle [data-v="local"]'); __click('#adaptInts [data-v="local"]'); __click('#adaptBody [data-a="preview"]');
    res.finishNote = /finish you chose/.test(document.getElementById("adaptBody").textContent);
    const canApply = !!document.querySelector('#adaptBody [data-a="apply"]');
    if (canApply) __click('#adaptBody [data-a="apply"]'); await __wait(200);
    res.finish = { b2, after: route.map((s) => s.id), first: route[0].id === b2[0] && walk.visited[b2[0]], end: [lastRoute.end.lat, lastRoute.end.lng].join(), style: plan.style, sel: [...selected].sort().join(), canApply };
    res.snap = __snap();
    return res;
  });
  await page.reload(); await page.waitForFunction(() => typeof showRoute === "function" && route.length > 0); await page.evaluate(SNAP);
  const reloaded = await page.evaluate(() => __snap());
  const L = r.loop, F = r.finish;
  const ok = r.loopNote && L.doneKept && L.shorter && L.planEnd === "loop" && L.endIsStart && L.current === 2 && L.sel === "architecture,history" &&
    r.finishNote && F.first && F.end === "41.3904,2.1889" && (!F.canApply || (F.style === "local" && F.sel === "history,local")) && reloaded === r.snap;
  return { ok, detail: { ...r, snap: undefined, reloadSame: reloaded === r.snap } };
}, 45000);
await test("P2C-none", "Adapt my walk: when nothing fits, it says so and the route stays intact", async (page) => {
  await open(page);
  await page.evaluate(SNAP);
  const r = await page.evaluate(async () => {
    Object.assign(plan, { start: "best", end: "any", zone: "any", must: [], style: "mix" }); applyTheme("poblenou"); showRoute(); history.replaceState({ r: 1 }, "", "#ruta"); await __wait(100);
    const s0 = __snap();
    __click("#adaptRoute"); __click('#adaptBody [data-a="plan"]');
    for (const b of document.querySelectorAll('#adaptInts [aria-pressed="true"]')) if (b.dataset.v !== "sports") { if (!document.querySelector('#adaptInts [data-v="sports"]').getAttribute("aria-pressed").includes("true")) __click('#adaptInts [data-v="sports"]'); b.click(); }
    __click('#adaptBody [data-a="preview"]');
    const msg = document.getElementById("adaptBody").textContent, apply = !!document.querySelector('#adaptBody [data-a="apply"]');
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    return { msg: msg.slice(0, 90), apply, same: __snap() === s0 };
  });
  return { ok: /No stops/.test(r.msg) && !r.apply && r.same, detail: r };
});

// ---------------------------------------------------------------- Phase 2C.2: break & surprise
await test("P2C2-pause", "I want a break: up to 3 close places per kind with directions, and the walk doesn't change", async (page) => {
  await open(page);
  await page.evaluate(SNAP);
  const r = await page.evaluate(async () => {
    Object.assign(plan, { mode: "stops", start: "best", end: "any", zone: "any", must: [], theme: null, style: "mix" }); selected = new Set(["history"]); stopsCount = 5; showRoute();
    history.replaceState({ r: 1 }, "", "#ruta"); walk.visited[route[0].id] = true; goTo(1); await __wait(100);
    const s0 = __snap(), res = {};
    __click("#adaptRoute");
    res.options = document.querySelectorAll("#adaptBody .adapt-choices button").length;
    __click('#adaptBody [data-a="pause"]');
    for (const k of ["coffee", "eat", "rest"]) {
      __click(`#pauseKinds [data-k="${k}"]`);
      const items = [...document.querySelectorAll(".pause-list li")];
      res[k] = { n: items.length, names: items.map((li) => li.querySelector("b").textContent), allDirections: items.every((li) => /google\.com\/maps\/dir/.test(li.querySelector("a")?.href || "")),
        allDesc: items.every((li) => li.querySelector("span").textContent.length > 10), mins: items.map((li) => +(/(\d+) min/.exec(li.textContent) || [])[1]),
        approx: items.every((li) => /straight-line/.test(li.textContent)), note: /opening hours/.test(document.getElementById("adaptBody").textContent),
        noneMsg: /Nothing of this kind/.test(document.getElementById("adaptBody").textContent) };
    }
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    res.same = __snap() === s0;
    // near the Ciutadella park there are places to rest
    Object.assign(plan, { start: "map", startPt: { lat: 41.3880, lng: 2.1835 } }); selected = new Set(["history"]); stopsCount = 4; showRoute(); walk.visited[route[0].id] = true; goTo(1); await __wait(100);
    __click("#adaptRoute"); __click('#adaptBody [data-a="pause"]'); __click('#pauseKinds [data-k="rest"]');
    res.restNearPark = [...document.querySelectorAll(".pause-list li b")].map((b) => b.textContent);
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    return res;
  });
  const kinds = ["coffee", "eat", "rest"].map((k) => r[k]);
  const fine = (k) => (k.n >= 1 && k.n <= 3 && k.allDirections && k.allDesc && k.approx && k.note && k.mins.every((m) => m <= 15)) || (k.n === 0 && k.noneMsg);
  const ok = r.options === 4 && r.same && kinds.every(fine) && r.coffee.n >= 1 && r.eat.n >= 1 && r.restNearPark.length >= 1;
  return { ok, detail: r };
});
await test("P2C2-surprise", "Surprise me: catalogue stop not on the walk, 3 progressive clues, reveal; ignoring changes nothing; adding needs Apply and keeps progress", async (page) => {
  await open(page);
  await page.evaluate(SNAP);
  const r = await page.evaluate(async () => {
    Object.assign(plan, { mode: "stops", start: "map", startPt: { lat: 41.3838, lng: 2.1766 }, end: "loop", zone: "any", must: [], theme: null, style: "mix" }); selected = new Set(["history", "architecture"]); stopsCount = 5; showRoute();
    history.replaceState({ r: 1 }, "", "#ruta"); walk.visited[route[0].id] = true; walk.skipped[route[1].id] = true; goTo(2); await __wait(100);
    const s0 = __snap(), res = {}, ids0 = route.map((s) => s.id);
    __click("#adaptRoute"); __click('#adaptBody [data-a="surprise"]');
    const found = adaptDraft.found;
    res.stop = found?.s.id; res.inCatalogue = WALKBCN_DISCOVERIES.some((e) => e.stop === res.stop); res.notOnWalk = !ids0.includes(res.stop);
    res.nameHidden = !document.getElementById("adaptBody").textContent.includes(found.s.name);
    res.clues = [document.querySelectorAll(".clues li").length];
    __click('#adaptBody [data-a="clue"]'); res.clues.push(document.querySelectorAll(".clues li").length);
    __click('#adaptBody [data-a="clue"]'); res.clues.push(document.querySelectorAll(".clues li").length);
    res.noMoreClues = !document.querySelector('#adaptBody [data-a="clue"]');
    __click('#adaptBody [data-a="reveal"]');
    const body = document.getElementById("adaptBody");
    res.reveal = { name: body.querySelector(".stop-title")?.textContent, photo: !!body.querySelector(".stop-photo img"), story: (body.querySelector(".story")?.textContent || "").length, directions: !!body.querySelector('a[href*="google.com/maps/dir"]'), add: !!body.querySelector('[data-a="add"]') };
    // ignore: close without adding
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    res.ignoreSame = __snap() === s0;
    // add → preview → back out (Keep) → unchanged
    __click("#adaptRoute"); __click('#adaptBody [data-a="surprise"]'); __click('#adaptBody [data-a="reveal"]'); __click('#adaptBody [data-a="add"]');
    res.previewAdded = [...document.querySelectorAll(".adapt-list .added")].map((li) => li.textContent);
    res.previewTag = !!document.querySelector("#adaptBody .adapt-tag");
    __click('#adaptBody [data-a="keep"]'); await __wait(150);
    res.cancelSame = __snap() === s0;
    // add → preview → Apply
    __click("#adaptRoute"); __click('#adaptBody [data-a="surprise"]'); __click('#adaptBody [data-a="reveal"]'); __click('#adaptBody [data-a="add"]'); __click('#adaptBody [data-a="apply"]'); await __wait(200);
    const ids1 = route.map((s) => s.id);
    res.apply = { ids0, ids1, added: ids1.includes(res.stop), doneKept: ids1[0] === ids0[0] && ids1[1] === ids0[1] && walk.visited[ids0[0]] && walk.skipped[ids0[1]],
      pendingKept: ids0.slice(2).every((id) => ids1.includes(id)), loop: plan.end === "loop" && lastRoute.end.lat === lastRoute.start.lat, sel: [...selected].sort().join(), style: plan.style };
    // too far: a discovery far from this walk is explained, not proposed
    const far = WALKBCN_DISCOVERIES.map((e) => stopById(e.stop)).sort((a, b) => dist(b, route[2]) - dist(a, route[2]))[0];
    const fp = surpriseProposal({ s: far });
    res.tooFar = { stop: far.id, tooFar: !!fp.tooFar, extra: fp.extra };
    res.snap = __snap();
    return res;
  });
  await page.reload(); await page.waitForFunction(() => typeof showRoute === "function" && route.length > 0); await page.evaluate(SNAP);
  const reloaded = await page.evaluate(() => __snap());
  const A = r.apply;
  const ok = r.inCatalogue && r.notOnWalk && r.nameHidden && r.clues.join() === "1,2,3" && r.noMoreClues && r.reveal.photo && r.reveal.story > 100 && r.reveal.directions && r.reveal.add &&
    r.ignoreSame && r.previewAdded.length === 1 && r.previewTag && r.cancelSame && A.added && A.doneKept && A.pendingKept && A.loop && A.sel === "architecture,history" && A.style === "mix" &&
    r.tooFar.tooFar && reloaded === r.snap;
  return { ok, detail: { ...r, snap: undefined, reloadSame: reloaded === r.snap } };
}, 45000);
await test("P2C2-langs", "Clues and the new panel texts show in all 7 languages", async (page) => {
  await open(page);
  const r = await page.evaluate(async () => {
    Object.assign(plan, { mode: "stops", start: "best", end: "any", zone: "any", must: [], theme: null, style: "mix" }); selected = new Set(["history"]); stopsCount = 4; showRoute();
    const out = {};
    for (const l of ["en", "ca", "es", "fr", "de", "it", "zh"]) {
      await setLang(l);
      document.getElementById("adaptRoute").click();
      const choices = [...document.querySelectorAll("#adaptBody .adapt-choices button")].map((b) => b.textContent);
      document.querySelector('#adaptBody [data-a="surprise"]').click();
      const intro = document.querySelector(".surprise-intro")?.textContent || "";
      const e = adaptDraft.found?.e;
      out[l] = { choices: choices.length === 4 && choices.every((c) => c && !/^(pause|surprise|adapt)/.test(c)), intro: !!e && intro === e.intro[l] };
      document.querySelector('#adaptBody [data-a="keep"]').click(); await new Promise((r) => setTimeout(r, 120));
    }
    await setLang("en");
    return out;
  });
  return { ok: Object.values(r).every((x) => x.choices && x.intro), detail: r };
});

// ---------------------------------------------------------------- Phase 3A: Challenges
const CH_PLAY = `window.__play = async (id) => {
  const w = (ms) => new Promise((r) => setTimeout(r, ms)), root = document.getElementById('chalRoot'), q = (sel) => root.querySelector(sel);
  const ev = { id, screens: 0 };
  chView.id = id; renderCh();
  const c = chById(id);
  ev.fiction = !!q('.ch-fiction'); ev.demoBar = !!q('.ch-demo');
  q('[data-chact="go"]').click(); await w(30);
  for (let n = 0; n < 80; n++) {
    if (q('.ch-done')) break;
    ev.screens++;
    const st = chState(c);
    if (!q('.ch-demo')) ev.demoBarMissing = true;
    if (c.type === 'bingo') {
      ev.board = root.querySelectorAll('.ch-cell').length;
      if (chLines(st).length) { q('[data-chact="finish"]').click(); await w(30); continue; }
      const k = [0, 1, 2].find((k) => st.done[k] == null);
      root.querySelectorAll('.ch-cell')[k].click(); await w(30);
      if (k === 0) { q('[data-chact="locate"]').click(); await w(60); continue; }
      const m = c.missions[chMi(c, st, k)]; root.querySelector('[data-chans="' + m.q.answer + '"]').click(); await w(650); continue;
    }
    if (st.stage === 'find') { ev.nameHiddenWhileSearching = !q('.ch-place'); ev.clues1 = root.querySelectorAll('.clues li').length; if (q('[data-chact="clue"]')) { q('[data-chact="clue"]').click(); await w(20); ev.clues2 = root.querySelectorAll('.clues li').length; } }
    const loc = (st.stage === 'find' || st.stage === 'arrive') && q('[data-chact="locate"]');
    if (loc) { loc.click(); await w(60); continue; }
    if (q('[data-chact="toq"]')) { ev.story = (q('.story')?.textContent || '').length; ev.audio = !!q('audio'); q('[data-chact="toq"]').click(); await w(30); continue; }
    if (c.type === 'observe' && q('.ch-gps')) ev.optionalGps = /Optional/.test(q('.ch-gps').textContent);
    const m = c.missions[chMi(c, st, st.i)];
    // a wrong answer first: it must not advance
    if (m.q.kind === 'choice') { const wrong = (m.q.answer + 1) % m.q.options.length; root.querySelector('[data-chans="' + wrong + '"]').click(); await w(30); ev.wrongStays = chState(c).i === st.i && /Not quite/.test(q('.ch-feedback').textContent); }
    if (m.q.kind === 'number') { q('#chNum').value = String(m.q.answer); q('[data-chans="num"]').click(); }
    else if (m.q.kind === 'truefalse') root.querySelector('[data-chans="' + (m.q.answer ? 0 : 1) + '"]').click();
    else root.querySelector('[data-chans="' + m.q.answer + '"]').click();
    await w(700);
    if (c.type === 'mystery') ev.notebook = chState(c).notes.length;
  }
  ev.done = !!q('.ch-done'); ev.statsDemo = /simulated/.test(q('.ch-done')?.textContent || '');
  return ev;
};`;
await test("P3A-demo", "Challenges: the 5 games play to the end in DEMO, each with its own mechanic, and DEMO saves nothing", async (page) => {
  await open(page);
  await page.evaluate(CH_PLAY);
  const r = await page.evaluate(async () => {
    showTab('chal'); renderCh();
    const before = localStorage.getItem('walkbcn_challenges_v1');
    const cards = document.querySelectorAll('#chalRoot .ch-card').length;
    document.getElementById('chDemoOn').click();
    const out = { cards, games: {} };
    for (const c of CHALLENGES) out.games[c.type] = await __play(c.id);
    out.savedUntouched = localStorage.getItem('walkbcn_challenges_v1') === before;
    chView.id = null; renderCh(); document.getElementById('chDemoOn').click();
    out.realShowsNothing = !document.querySelector('#chalRoot .ch-card em');
    return out;
  });
  const g = r.games;
  const ok = r.cards === 5 && Object.values(g).every((x) => x.done && x.statsDemo && !x.demoBarMissing && x.demoBar) &&
    g.hunt.nameHiddenWhileSearching && g.hunt.clues1 === 1 && g.hunt.clues2 === 2 && g.hunt.wrongStays &&
    g.mystery.fiction && g.mystery.notebook === 4 && g.observe.optionalGps && g.bingo.board === 9 && g.story.story > 200 && g.story.audio &&
    r.savedUntouched && r.realShowsNothing;
  return { ok, detail: r };
}, 60000);
await test("P3A-gps", "Challenges GPS: valid, far, imprecise and refused locations; progress survives a reload and stores no positions", async (page, ctx) => {
  const stop = { lat: 41.3916, lng: 2.165 };   // Casa Batlló
  const ctxG = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", permissions: ["geolocation"], geolocation: { latitude: stop.lat + 0.0002, longitude: stop.lng, accuracy: 15 } });
  const p = await ctxG.newPage();
  const res = {};
  try {
    await p.addInitScript(() => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} });
    await p.goto(`${BASE}/?src=test`); await p.waitForFunction(() => typeof renderCh === "function");
    const step = (fn) => p.evaluate(fn);
    res.start = await step(() => { showTab('chal'); chView.id = 'modernisme-hunt'; renderCh(); const go = document.querySelector('[data-chact="go"]'); go?.click(); return { go: !!go, stage: chState(chById('modernisme-hunt')).stage, locate: !!document.querySelector('[data-chact="locate"]'), html: document.getElementById('chalRoot').innerText.slice(0, 120) }; });
    if (!res.start.locate) return { ok: false, detail: res.start };
    // far
    await ctxG.setGeolocation({ latitude: stop.lat + 0.01, longitude: stop.lng, accuracy: 15 });
    await step(() => { document.querySelector('.ch-gps-msg').textContent = ''; document.querySelector('[data-chact="locate"]').click(); }); await p.waitForFunction(() => !/Checking|^$/.test(document.querySelector('.ch-gps-msg')?.textContent ?? 'x') || chState(chById('modernisme-hunt')).stage !== 'find', null, { timeout: 8000 });
    res.far = await step(() => ({ msg: document.querySelector('.ch-gps-msg').textContent, alt: !!document.querySelector('[data-chact="nogps"]'), stage: chState(chById('modernisme-hunt')).stage }));
    // imprecise
    await ctxG.setGeolocation({ latitude: stop.lat + 0.004, longitude: stop.lng, accuracy: 600 });
    await step(() => { document.querySelector('.ch-gps-msg').textContent = ''; document.querySelector('[data-chact="locate"]').click(); }); await p.waitForFunction(() => !/Checking|^$/.test(document.querySelector('.ch-gps-msg')?.textContent ?? 'x') || chState(chById('modernisme-hunt')).stage !== 'find', null, { timeout: 8000 });
    res.imprecise = await step(() => document.querySelector('.ch-gps-msg').textContent);
    // valid
    await ctxG.setGeolocation({ latitude: stop.lat + 0.0003, longitude: stop.lng, accuracy: 20 });
    await step(() => { document.querySelector('.ch-gps-msg').textContent = ''; document.querySelector('[data-chact="locate"]').click(); }); await p.waitForFunction(() => !/Checking|^$/.test(document.querySelector('.ch-gps-msg')?.textContent ?? 'x') || chState(chById('modernisme-hunt')).stage !== 'find', null, { timeout: 8000 });
    res.valid = await step(() => ({ stage: chState(chById('modernisme-hunt')).stage, name: document.querySelector('.ch-place')?.textContent }));
    await step(() => document.querySelector('[data-chans="0"]').click()); await p.waitForTimeout(800);
    res.after = await step(() => ({ i: chState(chById('modernisme-hunt')).i, how: chState(chById('modernisme-hunt')).done[0], saved: localStorage.getItem('walkbcn_challenges_v1') }));
    await p.reload(); await p.waitForFunction(() => typeof renderCh === "function");
    res.reload = await step(() => { showTab('chal'); renderCh(); const badge = document.querySelector('[data-ch="modernisme-hunt"] em')?.textContent; chView.id = 'modernisme-hunt'; renderCh(); return { badge, mission: /Mission 2 of 4/.test(document.getElementById('chalRoot').textContent), i: chState(chById('modernisme-hunt')).i }; });
  } catch (e) { return { ok: false, detail: { at: 'granted part', error: e.message.slice(0, 200), res } }; } finally { await ctxG.close().catch(() => {}); }
  // refused: a context without the permission
  await open(page);
  res.denied = await page.evaluate(async () => { showTab('chal'); chView.id = 'barcino-mystery'; renderCh(); document.querySelector('[data-chact="go"]').click(); document.querySelector('[data-chact="locate"]').click();
    await new Promise((r) => setTimeout(r, 1500)); const msg = document.querySelector('.ch-gps-msg').textContent; const alt = document.querySelector('[data-chact="nogps"]'); alt?.click();
    return { msg, alt: !!alt, stage: chState(chById('barcino-mystery')).stage }; });
  const ok = /about \d+ m away/.test(res.far.msg) && res.far.alt && res.far.stage === 'find' && /imprecise/.test(res.imprecise) &&
    res.valid.stage === 'question' && res.valid.name === 'Casa Batlló' && res.after.i === 1 && res.after.how === 'gps' && !/lat|lng|latitude/.test(res.after.saved) &&
    /1 of 4/.test(res.reload.badge || '') && res.reload.mission && res.reload.i === 1 &&
    /isn't allowed|couldn't be checked/.test(res.denied.msg) && res.denied.alt && res.denied.stage === 'question';
  return { ok, detail: res };
}, 60000);
await test("P3A-langs", "Challenges show in all 7 languages, and fit a 375 px screen", async (page) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  const r = await page.evaluate(async () => {
    const out = {};
    for (const l of ["en", "ca", "es", "fr", "de", "it", "zh"]) {
      await setLang(l); showTab('chal'); chView.id = null; renderCh();
      const title = document.querySelector('#chalRoot .ch-card b').textContent, tab = document.getElementById('tabChal').textContent;
      chView.id = 'born-observe'; chDemo = true; chDemoState = {}; renderCh(); document.querySelector('[data-chact="go"]').click();
      const prompt = document.querySelector('.ch-prompt').textContent;
      out[l] = { ok: title === CHALLENGES[0].title[l] && prompt === CHALLENGES[2].missions[chMi(CHALLENGES[2], chState(CHALLENGES[2]), 0)].q.prompt[l] && !/^ch[A-Z]/.test(tab), wide: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      chDemo = false; chDemoState = {}; chView.id = null;
    }
    await setLang('en');
    return out;
  });
  return { ok: Object.values(r).every((x) => x.ok && !x.wide), detail: r };
});

await test("P3A-variety", "Challenges: each new game is a new variant (bingo board, mystery order, option order); a saved game keeps its own", async (page) => {
  await open(page);
  const r = await page.evaluate(() => {
    let nextSeed = 1000;   // fixed seeds: the test doesn't depend on luck
    const play = (id) => { chView.id = id; delete chStore()[id]; renderCh(); document.querySelector('[data-chact="go"]').click(); const c = chById(id), st = chState(c); st.seed = nextSeed++; return { order: chPlan(c, st).order.join(), opts: JSON.stringify(chPlan(c, st).opts), seed: st.seed }; };
    showTab('chal'); chDemo = true; chDemoState = {};
    const res = {};
    for (const id of ['rambla-bingo', 'barcino-mystery', 'born-observe', 'modernisme-hunt', 'barca-story']) {
      const runs = [...Array(10)].map(() => play(id));
      res[id] = { orders: new Set(runs.map((x) => x.order)).size, opts: new Set(runs.map((x) => x.opts)).size };
    }
    res.mysteryLastFixed = [...Array(6)].every(() => play('barcino-mystery').order.endsWith(',3'));
    // a game in progress keeps its variant when it is reopened
    const c = chById('rambla-bingo'), first = play('rambla-bingo'); chView.id = null; renderCh(); chView.id = 'rambla-bingo'; renderCh();
    res.keeps = chPlan(c, chState(c)).order.join() === first.order;
    chDemo = false; chDemoState = {};
    return res;
  });
  const ok = r['rambla-bingo'].orders > 1 && r['barcino-mystery'].orders > 1 && r['born-observe'].orders === 2 && r['modernisme-hunt'].orders === 1 && r['barca-story'].orders === 1 &&
    Object.values(r).filter((x) => x.opts).every((x) => x.opts > 1) && r.mysteryLastFixed && r.keeps;
  return { ok, detail: r };
});

await test("P3A-bingo-once", "Bingo: one try per question; a wrong answer locks it and only a location check marks the square", async (page) => {
  await open(page);
  const r = await page.evaluate(() => {
    showTab('chal'); chDemo = true; chDemoState = {}; chView.id = 'rambla-bingo'; renderCh(); document.querySelector('[data-chact="go"]').click();
    const c = chById('rambla-bingo'), st = chState(c);
    document.querySelectorAll('.ch-cell')[0].click();
    const m = c.missions[chMi(c, st, 0)], wrong = (m.q.answer + 1) % m.q.options.length;
    document.querySelector('[data-chans="' + wrong + '"]').click();
    const locked = !!document.querySelector('.ch-locked') && !document.querySelector('.ch-q') && st.done[0] == null;
    return { locked, hasLocate: !!document.querySelector('[data-chact="locate"]') };
  });
  await page.evaluate(() => document.querySelector('[data-chact="locate"]').click()); await page.waitForTimeout(150);
  const after = await page.evaluate(() => { const c = chById('rambla-bingo'), st = chState(c); const out = { marked: st.done[0], crossed: document.querySelectorAll('.ch-cell.done').length }; chDemo = false; chDemoState = {}; return out; });
  return { ok: r.locked && r.hasLocate && after.marked === 'demo' && after.crossed === 1, detail: { ...r, ...after } };
});

clearTimeout(watchdog);
await withLimit(browser.close(), 5000, "browser close").catch(() => {});
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

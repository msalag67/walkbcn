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
  } catch (e) { detail = e.message; }
  results.push({ id, name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  ${name}${detail ? `\n      ${detail.slice(0, 400)}` : ""}`);
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

clearTimeout(watchdog);
await withLimit(browser.close(), 5000, "browser close").catch(() => {});
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

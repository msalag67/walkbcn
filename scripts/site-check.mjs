// Site check: walks through the published WalkBCN site like a visitor and reports what breaks.
//
// Usage:   node scripts/site-check.mjs                 checks https://msalag67.github.io/walkbcn/
//          BASE=http://localhost:8642 node scripts/site-check.mjs
// Needs:   playwright-core and a Chromium headless shell in ~/.npm/_npx and ~/Library/Caches/ms-playwright
//          (the same ones the evals use). Free: no API, no keys.
// Writes:  _summary/informes/web-<date>.md (git-ignored) and prints the same report.
//
// Visits use ?src=check, so they are left out of the usage statistics. The check never creates
// rooms, never sends a form and never saves anything outside its own throwaway browser.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE || "https://msalag67.github.io/walkbcn").replace(/\/$/, "");
const npx = path.join(os.homedir(), ".npm/_npx");
const pw = fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules/playwright-core")).find((p) => fs.existsSync(p));
const { chromium } = await import(path.join(pw, "index.mjs"));
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const exe = fs.readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell")).map((d) => path.join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell")).find((p) => fs.existsSync(p));

const results = [];
const add = (area, ok, detail) => results.push({ area, ok, detail });
const browser = await chromium.launch({ headless: true, executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", serviceWorkers: "block" });  // a first visit, straight from the network
const page = await ctx.newPage();
const consoleErrors = [], badResponses = new Set();
page.on("pageerror", (e) => consoleErrors.push(e.message));
// "Failed to load resource" is reported below with its URL (requestfailed / responses), not as a script error.
page.on("console", (m) => { if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) consoleErrors.push(m.text().slice(0, 200)); });
const failedReq = new Set();
ctx.on("requestfailed", (r) => { if (r.serviceWorker && r.serviceWorker()) return; const f = r.failure()?.errorText || ""; if (!/ABORTED|goatcounter/.test(f + r.url())) failedReq.add(`${f} ${r.url().slice(0, 140)}`); });
page.on("response", (r) => { const u = r.url(); if (r.status() >= 400 && !/goatcounter|favicon/.test(u)) badResponses.add(`${r.status()} ${u.slice(0, 160)}`); });
const wait = (ms) => page.waitForTimeout(ms);
async function step(area, fn) {
  try { const r = await fn(); add(area, r.ok, r.detail); } catch (e) { add(area, false, `error: ${e.message.split("\n")[0].slice(0, 200)}`); }
}

await step("Home page loads", async () => {
  const res = await page.goto(`${BASE}/?src=check`, { waitUntil: "load", timeout: 45000 }); await wait(1500);
  const tiles = await page.locator("#interests .tile").count();
  return { ok: res.ok() && tiles >= 6, detail: `HTTP ${res.status()}, ${tiles} interest tiles` };
});

await step("Build a route (history + architecture)", async () => {
  await page.evaluate(() => { for (const t of document.querySelectorAll("#interests .tile")) if (/history|architect/i.test(t.textContent)) t.click(); });
  await page.click("#build"); await wait(2500);
  const n = await page.locator("#stopList li").count();
  return { ok: n >= 3, detail: `${n} stops on the route` };
});

await step("Stop story and audio", async () => {
  const r = await page.evaluate(async () => {
    const a = [...document.querySelectorAll("audio")].map((x) => x.currentSrc || x.src).find(Boolean) || (typeof route !== "undefined" && route[0] ? null : null);
    const story = document.querySelector("#stopCard")?.textContent.trim().length || 0;
    let audio = "no audio element on screen";
    if (a) { const h = await fetch(a, { method: "HEAD" }); audio = `${h.status} ${a.split("/").pop()}`; }
    return { story, audio };
  });
  return { ok: r.story > 80 && !/^4|^5/.test(r.audio), detail: `story card ${r.story} characters; audio ${r.audio}` };
});

await step("Photos on the route", async () => {
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(1500);
  const r = await page.evaluate(() => { const imgs = [...document.querySelectorAll("img")].filter((i) => i.complete && i.offsetParent); return { shown: imgs.length, broken: imgs.filter((i) => !i.naturalWidth).map((i) => i.src.split("/").pop().slice(0, 60)) }; });
  return { ok: !r.broken.length, detail: `${r.shown} images shown, ${r.broken.length} broken${r.broken.length ? ": " + r.broken.join(", ") : ""}` };
});

for (const [tab, label, sel] of [["tabGuide", "Audio guide tab", "#guideRoot, #guide, main"], ["tabAct", "Activities tab", "main"], ["tabTips", "Tips tab", "main"]]) {
  await step(label, async () => {
    const before = consoleErrors.length;
    await page.click(`#${tab}`); await wait(1500);
    const txt = await page.evaluate(() => document.querySelector("[role=tabpanel]:not([hidden])")?.innerText.length || document.body.innerText.length);
    return { ok: consoleErrors.length === before && txt > 100, detail: `${txt} characters of content, ${consoleErrors.length - before} new errors` };
  });
}

await step("Challenges: solo catalogue", async () => {
  await page.click("#tabChal"); await wait(1500);
  const n = await page.locator("#chalRoot .ch-card").count();
  return { ok: n >= 5, detail: `${n} solo challenges` };
});

await step("Challenges: play with friends (cards)", async () => {
  await page.click('[data-chmode="friends"]'); await wait(800);
  const comp = await page.locator("[data-mpopen]").count();
  await page.click('[data-mpkind="coop"]'); await wait(800);
  const coop = await page.locator('[data-mpopen^="sm:"]').count();
  await page.click('[data-mpkind="comp"]'); await wait(300);
  return { ok: comp === 3 && coop === 4, detail: `${comp} competitive, ${coop} cooperative cards` };
});

for (const [key, btn, ready, exit, label] of [
  ["ta", "#taDemoBtn", "#taClock", '[data-ta="exit"]', "Time Attack DEMO"],
  ["bb", "#bbDemoBtn", ".bb-board", '[data-bb="exit"]', "Bingo Battle DEMO"],
  ["sm:sm-port-sea", "#smDemoBtn", '[data-sm="begin"]', '[data-sm="exit"]', "Shared Mystery DEMO"],
]) {
  await step(label, async () => {
    const before = consoleErrors.length;
    if (key.startsWith("sm")) { await page.click('[data-mpkind="coop"]'); await wait(300); }
    await page.click(`[data-mpopen="${key}"]`); await wait(500);
    await page.click(btn); await page.waitForSelector(ready, { timeout: 8000 });
    await page.click(exit); await wait(500);
    await page.click("#mpSetupBack"); await wait(300);
    if (key.startsWith("sm")) { await page.click('[data-mpkind="comp"]'); await wait(300); }
    return { ok: consoleErrors.length === before, detail: `opened and closed, ${consoleErrors.length - before} new errors` };
  });
}

await step("Seven languages", async () => {
  const out = await page.evaluate(async () => {
    const langs = (window.WALKBCN_LANGS || []).map((l) => l.code || l.id || l).filter(Boolean), res = {};
    for (const l of langs) {
      try { await setLang(l); } catch (e) { res[l] = "error"; continue; }
      await new Promise((r) => setTimeout(r, 400));
      const txt = document.body.innerText;
      res[l] = /\b(undefined|NaN)\b|\{[a-z]+\}/.test(txt) ? "raw text on screen" : "ok";
    }
    try { await setLang("en"); } catch (e) {}
    return res;
  });
  const bad = Object.entries(out).filter(([, v]) => v !== "ok");
  return { ok: Object.keys(out).length >= 7 && !bad.length, detail: Object.entries(out).map(([k, v]) => `${k}: ${v}`).join(" · ") };
});

add("JavaScript errors in the whole visit", consoleErrors.length === 0, consoleErrors.length ? [...new Set(consoleErrors)].slice(0, 8).join(" | ") : "none");
add("Files that failed to load (4xx/5xx)", badResponses.size === 0, badResponses.size ? [...badResponses].slice(0, 8).join(" | ") : "none");
const wiki = [...failedReq].filter((x) => /wikimedia/.test(x)), other = [...failedReq].filter((x) => !/wikimedia/.test(x));
add("Requests that failed (network, not photos)", other.length === 0, other.length ? other.slice(0, 6).join(" | ") : "none");
// Wikimedia sometimes refuses a burst of photo requests; the page retries them. Only photos that stay
// broken on screen count as a failure (see "Photos on the route"); this line is information.
add("Wikimedia photo requests refused (retried by the page)", true, wiki.length ? `${wiki.length} (information only)` : "none");
await browser.close();

const today = new Date().toISOString().slice(0, 10), fails = results.filter((r) => !r.ok);
const md = `# WalkBCN · revisión de la web ${today}

Visita automática a ${BASE} en un móvil simulado (390 px), como si fuera un usuario. Sin cuentas, sin salas reales, sin enviar formularios.

**Resultado:** ${fails.length ? `${fails.length} de ${results.length} comprobaciones fallan` : `las ${results.length} comprobaciones pasan`}.

| Comprobación | Estado | Detalle |
|---|---|---|
${results.map((r) => `| ${r.area} | ${r.ok ? "✅" : "❌"} | ${String(r.detail).replace(/\|/g, "/")} |`).join("\n")}

Límites: no prueba el GPS real, ni partidas multijugador con otras personas, ni el sonido en un móvil de verdad.
`;
fs.mkdirSync(path.join(ROOT, "_summary/informes"), { recursive: true });
fs.writeFileSync(path.join(ROOT, `_summary/informes/web-${today}.md`), md);
console.log(md);
process.exit(fails.length ? 2 : 0);

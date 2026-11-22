// End-to-end Speed Race between two independent browsers (separate storage, separate anonymous
// sign-ins, separate GPS positions) against the local Supabase stand-in (evals/mp-emulator.mjs),
// which runs the real supabase/multiplayer.sql in Postgres (PGlite).
// This proves the page and the SQL work together; it is NOT a test between two real phones
// on the real Supabase project (see docs/multijugador.md).
//
// Usage: python3 -m http.server 8642   (project folder)
//        PGLITE=<folder with node_modules/@electric-sql/pglite> node evals/multiplayer-e2e.mjs
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawn } from "node:child_process";
const BASE = "http://localhost:8642", EMU = "http://localhost:8650";
setTimeout(() => { console.error("time limit"); process.exit(2); }, 240000);
const root = new URL("..", import.meta.url).pathname;
// REAL=1: use the real project in data/multiplayer-config.js instead of the local stand-in.
const REAL = process.env.REAL === "1";
const emu = REAL ? { kill() {} } : spawn("node", [path.join(root, "evals/mp-emulator.mjs"), path.join(root, "supabase/multiplayer.sql"), "8650", "230"], { env: process.env, stdio: ["ignore", "pipe", "inherit"] });
if (!REAL) await new Promise((ok) => emu.stdout.on("data", (d) => /emulator on/.test(d) && ok()));
const npx = path.join(os.homedir(), ".npm/_npx");
const pw = fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules/playwright-core")).find((p) => fs.existsSync(p));
const { chromium } = await import(path.join(pw, "index.mjs"));
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const exe = fs.readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell")).map((d) => path.join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell")).find((p) => fs.existsSync(p));
const browser = await chromium.launch({ headless: true, executablePath: exe });
const STOPS = { "casa-batllo": [41.3916, 2.165], "fundacio-tapies": [41.3916, 2.1637], "casa-mila": [41.3954, 2.162], "casa-punxes": [41.398, 2.164] };
const ORDER = Object.keys(STOPS), ANSWERS = [0, 1, 2, 0];
async function player(name) {
  const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 }, permissions: ["geolocation"], geolocation: { latitude: 41.385, longitude: 2.17, accuracy: 20 } });
  if (!REAL) await ctx.route("**/data/multiplayer-config.js*", (r) => r.fulfill({ contentType: "application/javascript", body: `window.WALKBCN_MP = { url: '${EMU}', anonKey: 'test-anon' };` }));
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} });
  return { ctx, p, errors, name };
}
const until = (p, fn, arg, ms = 12000) => p.waitForFunction(fn, arg, { timeout: ms });
const out = {};
const A = await player("Anna"), B = await player("Bob");
try {
  // Anna creates a room
  await A.p.goto(`${BASE}/?src=test`); await until(A.p, () => typeof renderMp === "function");
  await A.p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); });
  await A.p.fill("#mpHostName", "Anna"); await A.p.click("#mpCreate");
  await until(A.p, () => !!document.querySelector(".mp-code b"));
  const code = await A.p.textContent(".mp-code b"); out.code = code;
  // Bob opens the invitation link and joins
  await B.p.goto(`${BASE}/?src=test#room=${code}`); await until(B.p, () => !!document.getElementById("mpJoinCode"));
  out.linkPrefill = await B.p.inputValue("#mpJoinCode");
  await B.p.fill("#mpJoinName", "Bob"); await B.p.click("#mpJoin");
  await until(B.p, () => document.querySelectorAll(".mp-list .mp-p").length === 2);
  await until(A.p, () => document.querySelectorAll(".mp-list .mp-p").length === 2);
  out.lobbySynced = true;
  out.bobCannotStart = await B.p.evaluate(async (c) => { try { await mpRpc("mp_start", { p_code: c }); return "started?!"; } catch (e) { return e.message; } }, code);
  out.startDisabledBeforeReady = await A.p.isDisabled("#mpStart");
  await A.p.click("#mpReadyBtn"); await B.p.click("#mpReadyBtn");
  await until(A.p, () => document.getElementById("mpStart") && !document.getElementById("mpStart").disabled);
  await A.p.click("#mpStart");
  await until(A.p, () => !!document.getElementById("mpClock")); await until(B.p, () => !!document.getElementById("mpClock"));
  out.bothRacing = true;
  // Anna: demo mode on must not fake the location (she is far away)
  await A.p.evaluate(() => { chDemo = true; });
  await A.p.click("#mpLocate"); await until(A.p, () => /away|imprecise/.test(document.querySelector(".ch-gps-msg")?.textContent || ""));
  out.demoIgnored = await A.p.textContent(".ch-gps-msg");
  await A.p.evaluate(() => { chDemo = false; });
  // Anna: one extra clue on mission 1, then all four missions with real (emulated) GPS
  await A.p.click("#mpClue"); await until(A.p, () => document.querySelectorAll(".clues li").length === 2);
  for (let i = 0; i < 4; i++) {
    const [lat, lng] = STOPS[ORDER[i]];
    await A.ctx.setGeolocation({ latitude: lat + 0.0002, longitude: lng, accuracy: 15 });
    await A.p.click("#mpLocate"); await until(A.p, () => !!document.querySelector(".ch-q"));
    await A.p.click(`[data-chans="${ANSWERS[i]}"]`);
    if (i < 3) await until(A.p, (n) => document.querySelectorAll(".ch-dots li.done").length === n, i + 1);
  }
  await until(A.p, () => /You finished/.test(document.body.innerText));
  out.annaResult = (await A.p.textContent(".ch-done")).replace(/\s+/g, " ").trim();
  // Bob: GPS refused → continues without location (not verified); reloads mid-race
  await B.ctx.clearPermissions();
  await B.p.click("#mpLocate"); await until(B.p, () => !!document.getElementById("mpAlt"));
  out.bobDenied = await B.p.textContent(".ch-gps-msg");
  await B.p.click("#mpAlt"); await B.p.click(`[data-chans="${ANSWERS[0]}"]`);
  await until(B.p, () => document.querySelectorAll(".ch-dots li.done").length === 1);
  out.bobSeesAnnaFinished = await B.p.evaluate(() => /Anna/.test(document.querySelector(".mp-board").innerText) && /Ranking so far/i.test(document.querySelector(".mp-board").innerText));
  await B.p.reload(); await until(B.p, () => !!document.getElementById("mpClock"), 15000);
  out.bobAfterReload = await B.p.evaluate(() => ({ mission: document.querySelectorAll(".ch-dots li.done").length, stored: localStorage.getItem("walkbcn_mp_room") }));
  for (let i = 1; i < 4; i++) {
    await B.p.click("#mpLocate"); await until(B.p, () => !!document.getElementById("mpAlt"), 25000); await B.p.click("#mpAlt");
    await B.p.click(`[data-chans="${ANSWERS[i]}"]`);
    if (i < 3) await until(B.p, (n) => document.querySelectorAll(".ch-dots li.done").length === n, i + 1);
  }
  await until(A.p, () => /final ranking/i.test(document.body.innerText), 15000);
  out.final = (await A.p.textContent(".mp-board")).replace(/\s+/g, " ").trim();
  out.noPositionsStored = await A.p.evaluate(() => !/lat|lng|latitude|longitude/.test(JSON.stringify(localStorage)));
  out.pageErrors = [...A.errors, ...B.errors];
} catch (e) { out.error = e.message.split("\n")[0]; out.bobScreen = (await B.p.evaluate(() => document.getElementById('chalRoot')?.innerText.slice(0, 600)).catch(() => '')).replace(/\s+/g, ' '); out.bobErrors = B.errors; }
const ok = !out.error && out.linkPrefill === out.code && /not_host/.test(out.bobCannotStart) && out.startDisabledBeforeReady && /away/.test(out.demoIgnored || "") &&
  /You finished/.test(out.annaResult || "") && /1 extra clue/.test(out.annaResult || "") && /isn't allowed|couldn't be checked/.test(out.bobDenied || "") && out.bobSeesAnnaFinished &&
  out.bobAfterReload?.mission === 1 && /Final ranking.*Anna.*not verified.*Bob/.test(out.final || "") && out.noPositionsStored && !out.pageErrors?.length;
console.log(JSON.stringify(out, null, 1));
console.log(ok ? `PASS  multiplayer end-to-end (two browsers, ${REAL ? "REAL Supabase project" : "local Supabase stand-in"})` : "FAIL  multiplayer end-to-end");
await browser.close(); emu.kill(); process.exit(ok ? 0 : 1);

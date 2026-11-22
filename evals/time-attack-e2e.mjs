// Time Attack end-to-end: (1) the DEMO on one browser with every backend request blocked;
// (2) a real game between two independent browsers against the local Supabase stand-in
// (evals/mp-emulator.mjs runs the real supabase/multiplayer.sql in Postgres/PGlite).
// Not a test between real phones (see docs/multijugador.md).
// Usage: python3 -m http.server 8642, then PGLITE=<folder> node evals/time-attack-e2e.mjs
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawn } from "node:child_process";
const BASE = process.env.BASE || "http://localhost:8642", EMU = "http://localhost:8650";
// REAL=1: the two-browser game uses the real project in data/multiplayer-config.js (no stand-in);
// the time-up part is skipped there (it would take 30 real minutes) and checked locally instead.
const REAL = process.env.REAL === "1";
setTimeout(() => { console.error("time limit"); process.exit(2); }, 240000);
const root = new URL("..", import.meta.url).pathname;
const npx = path.join(os.homedir(), ".npm/_npx");
const pw = fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules/playwright-core")).find((p) => fs.existsSync(p));
const { chromium } = await import(path.join(pw, "index.mjs"));
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const exe = fs.readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell")).map((d) => path.join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell")).find((p) => fs.existsSync(p));
const browser = await chromium.launch({ headless: true, executablePath: exe });
const until = (p, fn, arg, ms = 12000) => p.waitForFunction(fn, arg, { timeout: ms });
const results = [];
const report = (name, ok, detail) => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      ${JSON.stringify(detail).slice(0, 900)}`); };

// ---------------------------------------------------------------- 1. DEMO, no backend at all
{
  const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 } });
  let backendCalls = 0;
  await ctx.route(/supabase\.co|localhost:8650/, (r) => { backendCalls++; r.abort(); });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} });
  const d = {};
  try {
    await p.goto(`${BASE}/?src=test`); await until(p, () => typeof renderTa === "function");
    const before = await p.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => /mp_|challenges/.test(k)).map((k) => [k, localStorage.getItem(k)])));
    await p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); });
    await p.click('#taDur [data-dur="30"]').catch(() => {}); await p.click("#taDemoBtn");
    await until(p, () => !!document.getElementById("taClock"));
    d.banner = await p.textContent(".ch-demo");
    d.players = await p.evaluate(() => [...document.querySelectorAll(".mp-rank .mp-p")].map((li) => li.innerText.replace(/\s+/g, " ")));
    d.clock = await p.textContent("#taClock");
    d.targets = await p.locator(".ta-item").count();
    d.map = await p.evaluate(() => !!document.querySelector("#taMap .leaflet-container, #taMap.leaflet-container"));
    // free order: target 6 (Sant Pau, 200) first; a wrong answer then the right one
    await p.click('[data-sel="5"]'); await p.click('[data-ta="sim"]');
    const ans = await p.evaluate(() => TA_LIST[0].missions.map((m) => m.q.answer));
    await p.click(`[data-chans="${(ans[5] + 1) % 3}"]`); d.wrong = await p.textContent(".ch-feedback");
    await p.click(`[data-chans="${ans[5]}"]`); await until(p, () => !!document.querySelector(".ta-list"));
    d.afterFirst = await p.evaluate(() => ({ pts: document.querySelectorAll(".ta-head b")[1].textContent, pos: document.querySelectorAll(".ta-head b")[2].textContent }));
    // a hint on target 2 (Tàpies, 100) → 50
    await p.click('[data-sel="1"]'); await p.click('[data-ta="hint"]'); await p.click('[data-ta="sim"]'); await p.click(`[data-chans="${ans[1]}"]`);
    await until(p, () => !!document.querySelector(".ta-list"));
    d.afterHint = await p.evaluate(() => document.querySelectorAll(".ta-head b")[1].textContent);
    d.doneCannotRescore = await p.evaluate(() => { ta.sel = 5; renderMp(); return !document.querySelector("[data-chans]") && /found/.test(document.body.innerText); });
    await p.click('[data-ta="list"]');
    // simulated time: +10 min moves the rivals; end now shows the result
    const botsBefore = await p.evaluate(() => taDemoState().players.filter((x) => x.sim).map((x) => x.points).join());
    await p.click('[data-ta="ff"]'); await p.click('[data-ta="ff"]');
    d.bots = { before: botsBefore, after: await p.evaluate(() => taDemoState().players.filter((x) => x.sim).map((x) => x.points).join()) };
    d.clockAfterFF = await p.textContent("#taClock");
    await p.click('[data-ta="end"]'); await until(p, () => !!document.querySelector(".ch-done"));
    d.final = (await p.textContent(".ch-done")).replace(/\s+/g, " ").trim();
    d.finalRanking = await p.evaluate(() => [...document.querySelectorAll(".mp-rank .mp-p")].map((li) => li.innerText.replace(/\s+/g, " ")));
    d.noScoreAfterEnd = await p.evaluate(async () => (await taDriver(true).complete(0, taDemoState().config)) === 0);
    await p.click('[data-ta="restart"]'); await until(p, () => !!document.querySelector(".ta-list"));
    d.restarted = await p.evaluate(() => document.querySelectorAll(".ta-head b")[1].textContent);
    await p.click('[data-ta="restart"]'); await p.click('[data-ta="exit"]');
    d.exited = await p.evaluate(() => !document.getElementById("taClock") && !!document.getElementById("taDemoBtn"));
    d.storageUntouched = (await p.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => /mp_|challenges/.test(k)).map((k) => [k, localStorage.getItem(k)])))) === before;
    d.backendCalls = backendCalls; d.errors = errors;
  } catch (e) { d.error = e.message.split("\n")[0]; }
  const ok = !d.error && /DEMO/.test(d.banner) && d.players.length === 4 && d.players.filter((x) => /simulated/.test(x)).length === 3 && /^30:0\d$|^29:5\d$/.test(d.clock) && d.targets === 7 && d.map &&
    /Not quite/.test(d.wrong) && d.afterFirst.pts === "200" && d.afterHint === "250" && d.doneCannotRescore && d.bots.after !== d.bots.before && /^(9|10):\d\d$/.test(d.clockAfterFF) &&
    /wins/.test(d.final) && /250 points/.test(d.final) && d.noScoreAfterEnd && d.restarted === "0" && d.exited && d.storageUntouched && d.backendCalls === 0 && !d.errors.length;
  report("Time Attack DEMO (one browser, no backend)", ok, d);
  await ctx.close();
}

// ---------------------------------------------------------------- 2. real game, two browsers
{
  const emu = REAL ? { kill() {} } : spawn("node", [path.join(root, "evals/mp-emulator.mjs"), path.join(root, "supabase/multiplayer.sql"), "8650", "200"], { env: process.env, stdio: ["ignore", "pipe", "inherit"] });
  if (!REAL) await new Promise((ok) => emu.stdout.on("data", (x) => /emulator on/.test(x) && ok()));
  const STOP = { 0: [41.3916, 2.165], 5: [41.4114, 2.1744], 6: [41.4035, 2.1506], 3: [41.398, 2.164] };
  const mk = async () => { const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 }, permissions: ["geolocation"], geolocation: { latitude: 41.385, longitude: 2.17, accuracy: 20 } });
    if (!REAL) await ctx.route("**/data/multiplayer-config.js*", (r) => r.fulfill({ contentType: "application/javascript", body: `window.WALKBCN_MP = { url: '${EMU}', anonKey: 'test-anon' };` }));
    const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} }); return { ctx, p, errors }; };
  const A = await mk(), B = await mk(), d = {};
  const play = async (P, k, ans, hint) => {
    await P.p.click(`[data-sel="${k}"]`);
    if (hint) { await P.p.click('[data-ta="hint"]'); await until(P.p, () => !!document.querySelector(".ta-hint")); }
    await P.ctx.setGeolocation({ latitude: STOP[k][0] + 0.0002, longitude: STOP[k][1], accuracy: 15 });
    await P.p.click('[data-ta="gps"]'); await until(P.p, () => !!document.querySelector("[data-chans]"));
    await P.p.click(`[data-chans="${ans[k]}"]`); await until(P.p, () => !!document.querySelector(".ta-list"));
  };
  try {
    await A.p.goto(`${BASE}/?src=test`); await until(A.p, () => typeof renderTa === "function");
    const ans = await A.p.evaluate(() => TA_LIST[0].missions.map((m) => m.q.answer));
    await A.p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); });
    await A.p.click('#taDur [data-dur="30"]'); await A.p.fill("#taHostName", "Anna"); await A.p.click("#taCreate");
    await until(A.p, () => !!document.querySelector(".mp-code b"));
    const code = await A.p.textContent(".mp-code b"); d.lobby = (await A.p.textContent(".ch-kicker")).trim();
    await B.p.goto(`${BASE}/?src=test#room=${code}`); await until(B.p, () => !!document.getElementById("mpJoinName"));
    await B.p.fill("#mpJoinName", "Bob"); await B.p.click("#mpJoin"); await until(B.p, () => document.querySelectorAll(".mp-list .mp-p").length === 2);
    await A.p.click("#mpReadyBtn"); await B.p.click("#mpReadyBtn");
    await until(A.p, () => document.getElementById("mpStart") && !document.getElementById("mpStart").disabled); await A.p.click("#mpStart");
    await until(A.p, () => !!document.getElementById("taClock")); await until(B.p, () => !!document.getElementById("taClock"));
    d.clocks = [await A.p.textContent("#taClock"), await B.p.textContent("#taClock")];
    // GPS refused for Bob at first: no score without location
    await B.ctx.clearPermissions(); await B.p.click('[data-sel="3"]'); await B.p.click('[data-ta="gps"]');
    await until(B.p, () => /can't score|couldn't be checked/.test(document.querySelector(".ch-gps-msg")?.textContent || ""), 25000);
    d.bobNoGps = await B.p.textContent(".ch-gps-msg"); await B.p.click('[data-ta="list"]');
    await B.ctx.grantPermissions(["geolocation"]);
    // Anna: free order 6 → 0 → 5 ; Bob: 3 with a hint
    await play(A, 6, ans); await play(A, 0, ans); await play(A, 5, ans);
    await play(B, 3, ans, true);
    await until(B.p, () => /Anna[\s\S]*500/.test(document.querySelector(".mp-board").innerText), 8000);
    d.bobSeesLive = (await B.p.textContent(".mp-board")).replace(/\s+/g, " ").trim();
    d.dupe = await A.p.evaluate(async (c) => mpRpc("mp_ta_complete", { p_code: c, p_mission: 6, p_method: "gps" }), code);
    d.forgeOther = await B.p.evaluate(async (c) => { try { await mpRpc("mp_start", { p_code: c }); return "?!"; } catch (e) { return e.message; } }, code);
    await B.p.reload(); await until(B.p, () => !!document.getElementById("taClock"), 15000);
    d.bobAfterReload = await B.p.evaluate(() => document.querySelectorAll(".ta-head b")[1].textContent);
    if (REAL) { await A.p.evaluate(() => mpLeave()); await B.p.evaluate(() => { window.confirm = () => true; return mpLeave(); }); d.errors = [...A.errors, ...B.errors]; throw new Error("REAL_DONE"); }
    // time runs out (test route), then a late answer
    await fetch(EMU + "/test/expire", { method: "POST", headers: { apikey: "x", "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    d.late = await B.p.evaluate(async (c) => { try { await mpRpc("mp_ta_complete", { p_code: c, p_mission: 0, p_method: "gps" }); return "scored?!"; } catch (e) { return e.message; } }, code);
    await until(A.p, () => !!document.querySelector(".ch-done"), 15000); await until(B.p, () => !!document.querySelector(".ch-done"), 15000);
    d.finalA = (await A.p.textContent(".ch-done")).replace(/\s+/g, " ").trim();
    d.finalRanking = (await B.p.textContent(".mp-board")).replace(/\s+/g, " ").trim();
    d.errors = [...A.errors, ...B.errors];
  } catch (e) { if (e.message !== "REAL_DONE") d.error = e.message.split("\n")[0]; }
  const timeUpOk = REAL || (/time_up|not_playing/.test(d.late) && /Anna wins/.test(d.finalA) && /500 points/.test(d.finalA) && /Anna.*500.*Bob.*100/.test(d.finalRanking));
  const ok = !d.error && timeUpOk && /Time Attack · 30 min/.test(d.lobby) && d.clocks.every((c) => /^(30:00|29:5\d)$/.test(c)) && /can't score|couldn't be checked/.test(d.bobNoGps) &&
    /Anna/.test(d.bobSeesLive) && d.dupe === 0 && /not_host|room_started/.test(d.forgeOther) && d.bobAfterReload === "100" && !d.errors?.length;
  report(`Time Attack real game (two browsers, ${REAL ? "REAL Supabase project, time-up not included" : "local Supabase stand-in"})`, ok, d);
  emu.kill();
}
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);

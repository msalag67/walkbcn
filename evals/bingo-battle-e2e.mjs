// Bingo Battle end-to-end: (1) the DEMO on one browser with every backend request blocked;
// (2) a real game between two independent browsers against the local Supabase stand-in
// (evals/mp-emulator.mjs runs the real supabase/multiplayer.sql in Postgres/PGlite), including
// the first-line win and a second game that ends with no winner when time runs out.
// Not a test between real phones (see docs/multijugador.md).
// Usage: python3 -m http.server 8642, then PGLITE=<folder> node evals/bingo-battle-e2e.mjs
//        REAL=1 uses the real project in data/multiplayer-config.js (time-up part skipped).
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawn } from "node:child_process";
const BASE = process.env.BASE || "http://localhost:8642", EMU = "http://localhost:8650";
const REAL = process.env.REAL === "1";
setTimeout(() => { console.error("time limit"); process.exit(2); }, 300000);
const root = new URL("..", import.meta.url).pathname;
const npx = path.join(os.homedir(), ".npm/_npx");
const pw = fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules/playwright-core")).find((p) => fs.existsSync(p));
const { chromium } = await import(path.join(pw, "index.mjs"));
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const exe = fs.readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell")).map((d) => path.join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell")).find((p) => fs.existsSync(p));
const browser = await chromium.launch({ headless: true, executablePath: exe });
const until = (p, fn, arg, ms = 12000) => p.waitForFunction(fn, arg, { timeout: ms });
const results = [];
const report = (name, ok, detail) => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      ${JSON.stringify(detail).slice(0, 1200)}`); };
const txt = async (p, sel) => (await p.textContent(sel)).replace(/\s+/g, " ").trim();
// Answer square k's question correctly (wrong=true: pick a wrong option instead).
const answer = async (p, k, wrong) => {
  const q = await p.evaluate((k) => BB_LIST[0].board[k].q, k);
  if (q.kind === "number") { await p.fill("#chNum", String(wrong ? q.answer + 1 : q.answer)); return p.click('[data-chans="num"]'); }
  const right = q.kind === "truefalse" ? (q.answer ? "0" : "1") : String(q.answer);
  const n = q.kind === "truefalse" ? 2 : q.options.length;
  return p.click(`[data-chans="${wrong ? (+right + 1) % n : right}"]`);
};
const stateKey = () => JSON.stringify(Object.keys(localStorage).filter((k) => /mp_|bb_|challenges/.test(k)).map((k) => [k, localStorage.getItem(k)]));

// ---------------------------------------------------------------- 1. DEMO, no backend at all
{
  const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 } });
  let backendCalls = 0;
  await ctx.route(/supabase\.co|localhost:8650/, (r) => { backendCalls++; r.abort(); });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} });
  const d = {};
  const demoSquare = async (k) => { await p.click(`[data-cell="${k}"]`); await p.click('[data-bb="sim"]'); await answer(p, k); await until(p, () => !document.querySelector(".ch-panel"), undefined, 5000); };
  try {
    await p.goto(`${BASE}/?src=test`); await until(p, () => typeof renderBb === "function");
    const before = await p.evaluate(stateKey);
    await p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); document.querySelector('[data-mpopen="bb"]').click(); });
    d.card = await p.evaluate(() => !!document.getElementById("bbCreate") || !!document.getElementById("bbDemoBtn"));
    await p.click("#bbDemoBtn"); await until(p, () => !!document.querySelector(".bb-board"));
    d.banner = await p.textContent(".ch-demo");
    d.cells = await p.locator(".bb-board [data-cell]").count();
    d.players = await p.evaluate(() => [...document.querySelectorAll(".mp-list .mp-p")].map((li) => li.innerText.replace(/\s+/g, " ")));
    d.clock = await p.textContent("#taClock");
    // simulated arrival, then a wrong answer (stays open), then the right one
    await p.click('[data-cell="4"]'); d.beforeArrive = await p.evaluate(() => !document.querySelector("[data-chans]") && !!document.querySelector('[data-bb="sim"]'));
    await p.click('[data-bb="sim"]'); await answer(p, 4, true); d.wrong = await p.textContent(".ch-feedback");
    await answer(p, 4); await until(p, () => !document.querySelector(".ch-panel"), undefined, 5000);
    await demoSquare(0);   // any order: centre, then corner → 8 completes the diagonal
    d.near = await p.evaluate(() => [...document.querySelectorAll(".bb-near")].map((b) => +b.dataset.cell).sort());
    d.nearTag = await p.evaluate(() => document.querySelector(".bb-near .bb-near-tag")?.textContent);
    d.head = await p.evaluate(() => [...document.querySelectorAll(".ta-head b")].map((b) => b.textContent));
    // rivals: advance and "close to a line"; their squares are never shown, only counts
    const botsBefore = await p.evaluate(() => bbDemoState().players.filter((x) => x.sim).map((x) => x.progress).join());
    await p.click('[data-bb="adv"]'); await p.click('[data-bb="close"]');
    d.bots = { before: botsBefore, after: await p.evaluate(() => bbDemoState().players.filter((x) => x.sim).map((x) => x.progress).join()) };
    d.rivalNear = await txt(p, ".mp-board");
    d.noRivalSquares = await p.evaluate(() => document.querySelectorAll(".bb-board .ch-cell.done").length === 2);
    // the deciding square: the player completes the diagonal 0-4-8 and wins, with the line drawn
    await demoSquare(8); await until(p, () => !!document.querySelector(".ch-done"));
    d.final = await txt(p, ".ch-done");
    d.lineCells = await p.evaluate(() => [...document.querySelectorAll(".bb-board .ch-cell.line")].map((b) => +b.dataset.cell));
    d.lineSvg = await p.evaluate(() => !!document.querySelector(".bb-board svg line, .bb-board svg path"));
    d.boardLocked = await p.evaluate(() => [...document.querySelectorAll(".bb-board [data-cell]")].every((b) => b.disabled));
    d.noMoreAfterWin = await p.evaluate(async () => (await bbDriver(true).complete(1)).counted === false);
    // restart: a bot wins on the last step if nobody has a line
    await p.click('[data-bb="restart"]'); await until(p, () => !document.querySelector(".ch-done"));
    d.restarted = await p.evaluate(() => document.querySelectorAll(".ta-head b")[1].textContent);
    for (let i = 0; i < 6; i++) { if (await p.locator('[data-bb="adv"]').count()) await p.click('[data-bb="adv"]'); }
    await until(p, () => !!document.querySelector(".ch-done"));
    d.botWin = await txt(p, ".ch-done");
    // restart, end now → no winner
    await p.click('[data-bb="restart"]'); await p.click('[data-bb="end"]'); await until(p, () => !!document.querySelector(".ch-done"));
    d.ended = await txt(p, ".ch-done");
    await p.click('[data-bb="exit"]');
    d.exited = await p.evaluate(() => !document.querySelector(".bb-board") && !!document.getElementById("bbDemoBtn"));
    d.storageUntouched = (await p.evaluate(stateKey)) === before;
    d.backendCalls = backendCalls; d.errors = errors;
  } catch (e) { d.error = e.message.split("\n")[0]; d.errors = errors; }
  const ok = !d.error && d.card && /DEMO/.test(d.banner) && d.cells === 9 && d.players.length === 4 && d.players.filter((x) => /simulated/.test(x)).length === 3 &&
    /^(1:00:00|59:5\d)$/.test(d.clock) && d.beforeArrive && /Not quite/.test(d.wrong) && JSON.stringify(d.near) === "[8]" && d.nearTag === "1 for line" &&
    d.head[1] === "2/9" && d.head[2] === "1" && d.bots.after !== d.bots.before && /Marc[^·]*· 1 away from a line/.test(d.rivalNear) && d.noRivalSquares &&
    /Bingo! You won!/.test(d.final) && /Winning line: MACBA/.test(d.final) && JSON.stringify(d.lineCells) === "[0,4,8]" && d.lineSvg && d.boardLocked && d.noMoreAfterWin &&
    d.restarted === "0/9" && /Marc wins.*Winning line: Sant Pau/.test(d.botWin) && /nobody completed a line/.test(d.ended) && d.exited && d.storageUntouched && d.backendCalls === 0 && !d.errors.length;
  report("Bingo Battle DEMO (one browser, no backend)", ok, d);
  await ctx.close();
}

// ---------------------------------------------------------------- 2. real game, two browsers
{
  const emu = REAL ? { kill() {} } : spawn("node", [path.join(root, "evals/mp-emulator.mjs"), path.join(root, "supabase/multiplayer.sql"), "8650", "260"], { env: process.env, stdio: ["ignore", "pipe", "inherit"] });
  if (!REAL) await new Promise((ok) => emu.stdout.on("data", (x) => /emulator on/.test(x) && ok()));
  const mk = async () => { const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 }, permissions: ["geolocation"], geolocation: { latitude: 41.385, longitude: 2.17, accuracy: 20 } });
    if (!REAL) await ctx.route("**/data/multiplayer-config.js*", (r) => r.fulfill({ contentType: "application/javascript", body: `window.WALKBCN_MP = { url: '${EMU}', anonKey: 'test-anon' };` }));
    const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} }); return { ctx, p, errors }; };
  const play = async (P, k) => {
    const [lat, lon] = await P.p.evaluate((k) => { const s = stopById(BB_LIST[0].board[k].stop); return [s.lat, s.lon ?? s.lng]; }, k);
    await P.p.click(`[data-cell="${k}"]`);
    await P.ctx.setGeolocation({ latitude: lat + 0.0001, longitude: lon, accuracy: 15 });
    await P.p.click('[data-bb="gps"]'); await until(P.p, () => !!document.querySelector("[data-chans]"));
    await answer(P.p, k); await until(P.p, () => !document.querySelector(".ch-panel"), undefined, 8000);
  };
  const newRoom = async (A, B, names) => {
    await A.p.goto("about:blank"); await B.p.goto("about:blank");
    await A.p.goto(`${BASE}/?src=test`); await until(A.p, () => typeof renderBb === "function");
    await A.p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); document.querySelector('[data-mpopen="bb"]').click(); });
    await A.p.fill("#bbHostName", names[0]); await A.p.click("#bbCreate");
    await until(A.p, () => !!document.querySelector(".mp-code b"));
    const code = await A.p.textContent(".mp-code b"), lobby = (await A.p.textContent(".ch-kicker")).trim();
    await B.p.goto(`${BASE}/?src=test#room=${code}`); await until(B.p, () => !!document.getElementById("mpJoinName"));
    await B.p.fill("#mpJoinName", names[1]); await B.p.click("#mpJoin"); await until(B.p, () => document.querySelectorAll(".mp-list .mp-p").length === 2);
    await A.p.click("#mpReadyBtn"); await B.p.click("#mpReadyBtn");
    await until(A.p, () => document.getElementById("mpStart") && !document.getElementById("mpStart").disabled); await A.p.click("#mpStart");
    await until(A.p, () => !!document.querySelector(".bb-board")); await until(B.p, () => !!document.querySelector(".bb-board"));
    return { code, lobby };
  };
  const A = await mk(), B = await mk(), d = {};
  try {
    const { code, lobby } = await newRoom(A, B, ["Anna", "Bob"]); d.lobby = lobby;
    d.clocks = [await A.p.textContent("#taClock"), await B.p.textContent("#taClock")];
    d.sameBoard = (await A.p.evaluate(() => [...document.querySelectorAll(".bb-board .ch-name")].map((x) => x.textContent).join())) === (await B.p.evaluate(() => [...document.querySelectorAll(".bb-board .ch-name")].map((x) => x.textContent).join()));
    // no location → the square can't count
    await B.ctx.clearPermissions(); await B.p.click('[data-cell="2"]'); await B.p.click('[data-bb="gps"]');
    await until(B.p, () => /can't count|couldn't be checked/.test(document.querySelector(".ch-gps-msg")?.textContent || ""), 25000);
    d.bobNoGps = await B.p.textContent(".ch-gps-msg"); await B.p.click('[data-cell="2"]');
    await B.ctx.grantPermissions(["geolocation"]);
    d.noGpsRpc = await B.p.evaluate(async (c) => { try { await mpRpc("mp_bb_complete", { p_code: c, p_cell: 2, p_method: "alt" }); return "counted?!"; } catch (e) { return e.message; } }, code);
    // any order: Anna 8 then 0; Bob 2 then 6 (both one away from a diagonal)
    await play(A, 8); await play(A, 0); await play(B, 2); await play(B, 6);
    d.annaNear = await A.p.evaluate(() => [...document.querySelectorAll(".bb-near")].map((b) => +b.dataset.cell));
    d.dupe = await A.p.evaluate(async (c) => mpRpc("mp_bb_complete", { p_code: c, p_cell: 8, p_method: "gps" }), code);
    await until(B.p, () => /Anna[\s\S]*2\/9/.test(document.querySelector(".mp-board").innerText), 8000);
    d.bobSeesCounts = await txt(B.p, ".mp-board");
    d.bobSeesNoAnnaSquares = await B.p.evaluate(() => [...document.querySelectorAll(".bb-board .ch-cell.done")].map((b) => +b.dataset.cell).join());
    // reload keeps progress
    await B.p.reload(); await until(B.p, () => !!document.querySelector(".bb-board"), 15000);
    d.bobAfterReload = await B.p.evaluate(() => document.querySelectorAll(".ta-head b")[1].textContent);
    // Anna completes the diagonal → she wins on both screens; Bob's late square is refused
    await play(A, 4);
    await until(A.p, () => !!document.querySelector(".ch-done"), 15000); await until(B.p, () => !!document.querySelector(".ch-done"), 15000);
    d.finalA = await txt(A.p, ".ch-done"); d.finalB = await txt(B.p, ".ch-done");
    d.lineB = await B.p.evaluate(() => [...document.querySelectorAll(".bb-board .ch-cell.line")].map((b) => +b.dataset.cell).join());
    d.late = await B.p.evaluate(async (c) => { try { await mpRpc("mp_bb_complete", { p_code: c, p_cell: 4, p_method: "gps" }); return "counted?!"; } catch (e) { return e.message; } }, code);
    d.errors = [...A.errors, ...B.errors];
    for (const P of [A, B]) await P.p.evaluate(() => { window.confirm = () => true; return mpLeave(); });
    if (REAL) throw new Error("REAL_DONE");
    // a second game: time runs out (test route) with no line → no winner
    const g2 = await newRoom(A, B, ["Carla", "Dani"]);
    await play(A, 1);
    await fetch(EMU + "/test/expire", { method: "POST", headers: { apikey: "x", "Content-Type": "application/json" }, body: JSON.stringify({ code: g2.code }) });
    d.lateTimeUp = await B.p.evaluate(async (c) => { try { await mpRpc("mp_bb_complete", { p_code: c, p_cell: 0, p_method: "gps" }); return "counted?!"; } catch (e) { return e.message; } }, g2.code);
    await until(A.p, () => !!document.querySelector(".ch-done"), 15000); await until(B.p, () => !!document.querySelector(".ch-done"), 15000);
    d.timeUpA = await txt(A.p, ".ch-done"); d.timeUpRanking = await txt(B.p, ".mp-board");
    d.errors = [...A.errors, ...B.errors];
  } catch (e) { if (e.message !== "REAL_DONE") d.error = e.message.split("\n")[0]; }
  const timeUpOk = REAL || (/time_up|not_playing/.test(d.lateTimeUp) && /nobody completed a line/.test(d.timeUpA) && /Carla.*1\/9.*Dani.*0\/9/.test(d.timeUpRanking));
  const ok = !d.error && timeUpOk && /Bingo Battle/.test(d.lobby) && d.clocks.every((c) => /^(1:00:00|59:5\d)$/.test(c)) && d.sameBoard && /can't count|couldn't be checked/.test(d.bobNoGps) &&
    /location_required/.test(d.noGpsRpc) && JSON.stringify(d.annaNear) === "[4]" && d.dupe?.counted === false && /Anna/.test(d.bobSeesCounts) && d.bobSeesNoAnnaSquares === "2,6" &&
    d.bobAfterReload === "2/9" && /Bingo! You won!/.test(d.finalA) && /Anna wins/.test(d.finalB) && /Winning line/.test(d.finalB) && d.lineB === "0,4,8" && /not_playing|time_up/.test(d.late) && !d.errors?.length;
  report(`Bingo Battle real game (two browsers, ${REAL ? "REAL Supabase project, time-up not included" : "local Supabase stand-in"})`, ok, d);
  emu.kill();
}
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);

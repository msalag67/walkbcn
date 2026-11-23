// Shared Mystery end-to-end:
// (1) the DEMO of the four adventures on one browser with every backend request blocked (clue split
//     per player count, wrong/right answers, final reveal, narration: recording / missing file /
//     outdated text / one narration at a time, 7 languages, restart, exit);
// (2) a real cooperative game between three independent browsers against the local Supabase stand-in
//     (evals/mp-emulator.mjs runs the real supabase/multiplayer.sql in Postgres/PGlite): different
//     clues per phone, team board, one arrival for all, shared progress, duplicate answers, reload,
//     a player leaving, an offline player's clues shown on another phone, arrival without location
//     check, final reveal on every phone. Not a test between real phones (see docs/multijugador.md).
// Usage: python3 -m http.server 8642, then PGLITE=<folder> node evals/shared-mystery-e2e.mjs
//        REAL=1 uses the real project in data/multiplayer-config.js.
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
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--autoplay-policy=no-user-gesture-required"] });
const until = (p, fn, arg, ms = 12000) => p.waitForFunction(fn, arg, { timeout: ms });
const results = [];
const report = (name, ok, detail) => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      ${JSON.stringify(detail).slice(0, 1500)}`); };
const myClues = (p) => p.evaluate(() => [...document.querySelectorAll(".sm-clues:not(.board) .sm-clue p")].map((x) => x.textContent));
const storageKey = () => JSON.stringify(Object.keys(localStorage).filter((k) => /mp_|sm_|bb_|challenges/.test(k)).map((k) => [k, localStorage.getItem(k)]));

// ---------------------------------------------------------------- 1. DEMO, no backend at all
{
  const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 } });
  let backendCalls = 0;
  await ctx.route(/supabase\.co|localhost:8650/, (r) => { backendCalls++; r.abort(); });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} });
  const d = { runs: {} };
  try {
    await p.goto(`${BASE}/?src=test`); await until(p, () => typeof renderSm === "function");
    const before = await p.evaluate(storageKey);
    await p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); });
    await p.click('[data-mpkind="coop"]');
    d.picks = await p.locator("[data-smpick]").count();
    const plan = [["sm-barcino-layers", 2], ["sm-modernisme-secret", 3], ["sm-poblenou-factories", 4], ["sm-port-sea", 5]];
    for (const [id, n] of plan) {
      const r = {};
      if (await p.locator('[data-sm="exit"]').count()) await p.click('[data-sm="exit"]');
      await p.click(`[data-smpick="${id}"]`); await p.click(`#smDemoN [data-n="${n}"]`); await p.click("#smDemoBtn");
      await until(p, () => !!document.querySelector('[data-sm="begin"]'));
      r.fiction = /fiction/i.test(await p.textContent(".sm-fiction"));
      await p.click('[data-sm="begin"]');
      r.noQuestionBeforeArrival = (await p.locator("[data-smans]").count()) === 0;
      const ans = await p.evaluate((id) => smById(id).answers, id);
      r.split = [];
      for (let k = 0; k < 3; k++) {
        await p.click('[data-sm="sim"]'); await until(p, () => !!document.querySelector("[data-smans]"));
        // every player's clues: together all 4, never twice, and the two needed clues on different phones
        const per = [];
        for (let v = 0; v < n; v++) { await p.click(`[data-smview="${v}"]`); per.push(await p.evaluate(() => [...document.querySelectorAll(".sm-clues:not(.board) .sm-clue p")].map((x) => x.textContent))); }
        await p.click('[data-smview="0"]');
        const tx = await p.evaluate(([id, k]) => smTx(id).missions[k].clues, [id, k]);
        const owner = (c) => per.findIndex((list) => list.includes(c));
        r.split.push(per.flat().length === 4 && new Set(per.flat()).size === 4 && owner(tx[0]) !== owner(tx[1]) && (n > 4 || per.every((l) => l.length > 0)));
        if (k === 0) { await p.click(`[data-smshare="0-0"]`); r.sharedShows = /shared by/.test(await p.textContent(".sm-clues.board")); }
        await p.click('[data-sm="allshare"]');
        await p.click(`[data-smans="${(ans[k] + 1) % 3}"]`); await until(p, () => /Not quite/.test(document.querySelector(".sm-q .ch-feedback").textContent));
        r.stayAfterWrong = (await p.evaluate(() => smDemo.coop.step)) === k;
        await p.click(`[data-smans="${ans[k]}"]`); await until(p, (k) => smDemo.coop.step === k + 1 && !!document.querySelector(".sm-new"), k);
      }
      await p.click(`[data-smans="${ans[3]}"]`); await until(p, () => !!document.querySelector(".sm-hero"));
      r.reveal = await p.evaluate((id) => { const tx = smTx(id); return { title: document.querySelector(".sm-hero h2").textContent === tx.reveal.title, story: document.querySelectorAll(".sm-story p").length === tx.reveal.story.split(/\n\n+/).length,
        connect: document.querySelectorAll(".sm-connect li").length, facts: document.querySelectorAll(".sm-facts li").length, credits: /CC BY/.test(document.body.innerText), sources: document.querySelectorAll(".ch-src a").length,
        note: document.querySelector(".sm-nar-note").textContent }; }, id);
      d.runs[id] = r;
    }
    // narration (on the last reveal, sm-port-sea)
    const nar = {};
    nar.voiceByDefault = /device's voice/.test(await p.textContent(".sm-nar-note"));
    let stops = 0; await p.exposeFunction("countStop", () => { stops++; });
    await p.evaluate(() => { const orig = window.stopAudio; window.stopAudio = (...a) => { window.countStop(); return orig(...a); }; });
    // a recording that exists (any audio file of the site) and matches the text
    await p.evaluate(() => { const st = smTx("sm-port-sea").reveal.story; SM_AUDIO["sm-port-sea"] = { en: { file: "audio/drassanes.m4a", textHash: smHash(st), source: "test", licence: "test" } }; renderMp(); });
    nar.recLabel = /Recorded narration/.test(await p.textContent(".sm-nar-note"));
    await p.click('[data-nar="play"]'); await until(p, () => nar.mode === "rec" && nar.state === "playing", undefined, 8000).catch(() => {});
    nar.recPlaying = await p.evaluate(() => nar.mode === "rec" && nar.state === "playing" && !!nar.a && !nar.a.paused);
    nar.walkPlayerStopped = stops >= 1;
    await p.click('[data-nar="play"]'); nar.paused = await p.evaluate(() => nar.state === "paused" && nar.a.paused);
    await p.click('[data-nar="restart"]'); await p.waitForTimeout(600); nar.restart = await p.evaluate(() => nar.a && nar.a.currentTime < 2);
    nar.oneAtATime = await p.evaluate(() => !player || player.paused);   // the walk player is not playing at the same time
    await p.evaluate(() => { document.getElementById("tabWalk")?.click(); });
    nar.stopsOnTabChange = await p.evaluate(() => nar.state === "idle" && nar.key === null);
    await p.evaluate(() => { document.getElementById("tabChal").click(); });
    // listed but missing file → device voice (or "can't read aloud" if the browser has no voice)
    await p.evaluate(() => { SM_AUDIO["sm-port-sea"].en.file = "audio/shared-mystery/does-not-exist.mp3"; renderMp(); });
    await p.click('[data-nar="play"]'); await until(p, () => nar.mode === "voice", undefined, 8000).catch(() => {});
    nar.missingFallsBack = await p.evaluate(() => nar.mode === "voice" && /voice|read aloud/.test(document.querySelector(".sm-nar-note").textContent));
    await p.evaluate(() => smNarStop());
    // outdated text → the recording is not used
    await p.evaluate(() => { SM_AUDIO["sm-port-sea"].en = { file: "audio/drassanes.m4a", textHash: "00000000", source: "t", licence: "t" }; renderMp(); });
    nar.outdatedNotUsed = /device's voice/.test(await p.textContent(".sm-nar-note"));
    await p.evaluate(() => { delete SM_AUDIO["sm-port-sea"]; });
    d.nar = nar;
    // the reveal in every language
    d.langs = {};
    for (const l of ["ca", "es", "fr", "de", "it", "zh", "en"]) { await p.evaluate((l) => setLang(l), l); await p.waitForTimeout(300);
      d.langs[l] = await p.evaluate((l) => document.querySelector(".sm-hero h2")?.textContent === WALKBCN_SM_TEXT[l]["sm-port-sea"].reveal.title && !/\{|undefined/.test(document.getElementById("chalRoot").innerText), l); }
    await p.click('[data-sm="restart"]'); d.restarted = await p.evaluate(() => smDemo.coop.step === 0 && !smDemo.intro && !!document.querySelector('[data-sm="begin"]'));
    await p.click('[data-sm="exit"]'); d.exited = await p.evaluate(() => !smDemo && !document.querySelector(".sm-steps"));
    d.storageUntouched = (await p.evaluate(storageKey)) === before;
    d.backendCalls = backendCalls; d.errors = errors;
  } catch (e) { d.error = e.message.split("\n")[0]; d.errors = errors; }
  const runsOk = Object.values(d.runs).length === 4 && Object.values(d.runs).every((r) => r.fiction && r.noQuestionBeforeArrival && r.split.every(Boolean) && r.sharedShows && r.stayAfterWrong &&
    r.reveal.title && r.reveal.story && r.reveal.connect === 3 && r.reveal.facts === 3 && r.reveal.credits && r.reveal.sources >= 3);
  const n = d.nar || {};
  const ok = !d.error && d.picks === 4 && runsOk && n.voiceByDefault && n.recLabel && n.recPlaying && n.walkPlayerStopped && n.paused && n.restart && n.oneAtATime && n.stopsOnTabChange && n.missingFallsBack && n.outdatedNotUsed &&
    Object.values(d.langs || {}).length === 7 && Object.values(d.langs).every(Boolean) && d.restarted && d.exited && d.storageUntouched && d.backendCalls === 0 && !d.errors.length;
  report("Shared Mystery DEMO: 4 adventures, 2–5 players, narration, 7 languages (one browser, no backend)", ok, d);
  await ctx.close();
}

// ---------------------------------------------------------------- 2. real cooperative game, three browsers
{
  const emu = REAL ? { kill() {} } : spawn("node", [path.join(root, "evals/mp-emulator.mjs"), path.join(root, "supabase/multiplayer.sql"), "8650", "280"], { env: process.env, stdio: ["ignore", "pipe", "inherit"] });
  if (!REAL) await new Promise((ok) => emu.stdout.on("data", (x) => /emulator on/.test(x) && ok()));
  const mk = async () => { const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 375, height: 812 }, permissions: ["geolocation"], geolocation: { latitude: 41.385, longitude: 2.17, accuracy: 20 } });
    if (!REAL) await ctx.route("**/data/multiplayer-config.js*", (r) => r.fulfill({ contentType: "application/javascript", body: `window.WALKBCN_MP = { url: '${EMU}', anonKey: 'test-anon' };` }));
    const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => { try { if (!localStorage.getItem("walkbcn_lang")) localStorage.setItem("walkbcn_lang", "en"); } catch (e) {} }); return { ctx, p, errors }; };
  const at = async (P, k) => { const [lat, lng] = await P.p.evaluate((k) => { const s = stopById(smById(mp.state.challenge).missions[k].stop); return [s.lat, s.lng]; }, k); await P.ctx.setGeolocation({ latitude: lat + 0.0001, longitude: lng, accuracy: 15 }); };
  const A = await mk(), B = await mk(), C = await mk(), d = {};
  const ID = "sm-barcino-layers";
  try {
    await A.p.goto(`${BASE}/?src=test`); await until(A.p, () => typeof renderSm === "function");
    const ans = await A.p.evaluate((id) => smById(id).answers, ID);
    await A.p.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); });
    await A.p.click('[data-mpkind="coop"]'); await A.p.click(`[data-smpick="${ID}"]`);
    await A.p.fill("#smHostName", "Anna"); await A.p.click("#smCreate"); await until(A.p, () => !!document.querySelector(".mp-code b"));
    const code = await A.p.textContent(".mp-code b"); d.lobby = (await A.p.textContent(".ch-kicker")).trim();
    for (const [P, name] of [[B, "Bob"], [C, "Cai"]]) { await P.p.goto(`${BASE}/?src=test#room=${code}`); await until(P.p, () => !!document.getElementById("mpJoinName")); await P.p.fill("#mpJoinName", name); await P.p.click("#mpJoin"); }
    await until(A.p, () => document.querySelectorAll(".mp-list .mp-p").length === 3);
    for (const P of [A, B, C]) await P.p.click("#mpReadyBtn");
    await until(A.p, () => document.getElementById("mpStart") && !document.getElementById("mpStart").disabled); await A.p.click("#mpStart");
    for (const P of [A, B, C]) { await until(P.p, () => !!document.querySelector('[data-sm="begin"]'), undefined, 15000); await P.p.click('[data-sm="begin"]'); }
    // different clues on each phone, together the whole set
    const per = [await myClues(A.p), await myClues(B.p), await myClues(C.p)];
    d.clueCounts = per.map((x) => x.length); d.complementary = new Set(per.flat()).size === 4 && per.flat().length === 4 && per.every((x) => x.length);
    // Anna shares a clue: Bob sees it on the team board
    await A.p.click('[data-smshare="0-0"]');
    await until(B.p, () => /shared by Anna/.test(document.querySelector(".sm-clues.board")?.textContent || ""), undefined, 10000); d.boardSync = true;
    // Bob checks the location: the question opens on every phone
    await at(B, 0); await B.p.click('[data-sm="gps"]'); await until(B.p, () => !!document.querySelector("[data-smans]"), undefined, 15000);
    await until(C.p, () => !!document.querySelector("[data-smans]") && /location checked/.test(document.body.innerText), undefined, 10000); d.arrivalForAll = true;
    // Cai answers wrong (no change for anyone), Anna answers right (everyone moves on)
    await until(A.p, () => !!document.querySelector("[data-smans]"), undefined, 10000);
    await C.p.click(`[data-smans="${(ans[0] + 1) % 3}"]`); await until(C.p, () => /Not quite/.test(document.querySelector(".sm-q .ch-feedback").textContent));
    d.wrongNoAdvance = await A.p.evaluate(() => mp.state.coop.step === 0);
    await A.p.click(`[data-smans="${ans[0]}"]`);
    for (const P of [A, B, C]) await until(P.p, () => /Place 2 of 3/i.test(document.body.innerText), undefined, 12000);
    d.progressSync = true;
    d.dupe = await B.p.evaluate(async ([c, a]) => mpRpc("mp_sm_solve", { p_code: c, p_step: 0, p_answer: a }), [code, ans[0]]);
    d.noLocationRpc = await B.p.evaluate(async (c) => { try { await mpRpc("mp_sm_solve", { p_code: c, p_step: 1, p_answer: 0 }); return "?!"; } catch (e) { return e.message; } }, code);
    // reload keeps the place and does not show the intro again
    await B.p.reload(); await until(B.p, () => /Place 2 of 3/i.test(document.body.innerText), undefined, 15000);
    d.reload = await B.p.evaluate(() => !document.querySelector('[data-sm="begin"]') && mp.state.coop.step === 1);
    // Cai leaves: the clues are shared out again between Anna and Bob
    await C.p.evaluate(() => { window.confirm = () => true; return mpLeave(); });
    for (const P of [A, B]) await until(P.p, () => mp.state.players.some((p) => p.status === "left") && document.querySelectorAll(".sm-clues:not(.board) .sm-clue").length === 2, undefined, 10000);
    const two = [await myClues(A.p), await myClues(B.p)];
    d.afterLeave = { counts: two.map((x) => x.length), all: new Set(two.flat()).size === 4 };
    if (!REAL) {
      // Bob goes offline: after a while Anna can show his clues on her phone
      await B.p.close();
      await until(A.p, () => !!document.querySelector("[data-smtake]"), undefined, 45000);
      await A.p.click("[data-smtake]"); d.takeOver = await A.p.evaluate(() => document.querySelectorAll(".sm-clues:not(.board) .sm-clue").length === 4 && /Bob's clue/.test(document.body.innerText));
    }
    // Anna finishes alone: place 2 by GPS, place 3 without a location check (GPS refused)
    await at(A, 1); await A.p.click('[data-sm="gps"]'); await until(A.p, () => !!document.querySelector("[data-smans]"), undefined, 15000);
    await A.p.click(`[data-smans="${ans[1]}"]`); await until(A.p, () => /Place 3 of 3/i.test(document.body.innerText), undefined, 12000);
    await A.ctx.clearPermissions(); await A.p.click('[data-sm="gps"]');
    await until(A.p, () => !document.querySelector('[data-sm="manual"]')?.hidden, undefined, 25000); d.gpsMsg = await A.p.textContent(".ch-gps-msg");
    await A.p.click('[data-sm="manual"]'); await until(A.p, () => /without a location check/.test(document.body.innerText) && !!document.querySelector("[data-smans]"), undefined, 10000);
    await A.p.click(`[data-smans="${ans[2]}"]`); await until(A.p, () => /Final deduction/.test(document.querySelector(".ch-place")?.textContent || ""), undefined, 12000);
    await A.p.click(`[data-smans="${ans[3]}"]`); await until(A.p, () => !!document.querySelector(".sm-hero"), undefined, 12000);
    d.revealA = await A.p.evaluate(() => ({ title: document.querySelector(".sm-hero h2").textContent, connect: [...document.querySelectorAll(".sm-connect .hint")].map((x) => x.textContent) }));
    // Bob comes back (same phone): he gets the reveal too
    if (!REAL) { const pb = await B.ctx.newPage(); await pb.goto(`${BASE}/?src=test`); await pb.evaluate(() => { document.getElementById("tabChal").click(); document.querySelector('[data-chmode="friends"]').click(); });
      await until(pb, () => !!document.querySelector(".sm-hero"), undefined, 15000); d.revealB = await pb.textContent(".sm-hero h2"); }
    d.state = await A.p.evaluate(() => ({ status: mp.state.status, coop: mp.state.coop }));
    d.errors = [...A.errors, ...B.errors, ...C.errors];
    await A.p.evaluate(() => mpLeave());
  } catch (e) { d.error = e.message.split("\n")[0]; d.errors = [...A.errors, ...B.errors, ...C.errors]; }
  const ok = !d.error && /Shared Mystery/.test(d.lobby) && d.complementary && d.boardSync && d.arrivalForAll && d.wrongNoAdvance && d.progressSync && d.dupe?.counted === false &&
    /not_arrived/.test(d.noLocationRpc) && d.reload && d.afterLeave.all && d.afterLeave.counts.every((x) => x === 2) && (REAL || d.takeOver) && /can still confirm|couldn't be checked/.test(d.gpsMsg) &&
    d.revealA?.connect?.length === 3 && /location checked/.test(d.revealA.connect[0]) && /without a location check/.test(d.revealA.connect[2]) && (REAL || d.revealB === d.revealA.title) &&
    d.state?.status === "finished" && d.state.coop.solved && !d.errors.length;
  report(`Shared Mystery real game (three browsers, ${REAL ? "REAL Supabase project" : "local Supabase stand-in"})`, ok, d);
  emu.kill();
}
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);

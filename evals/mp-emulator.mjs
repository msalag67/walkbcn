// Local stand-in for Supabase, for tests only: runs supabase/multiplayer.sql in a real Postgres
// (PGlite) and answers the same HTTP routes the page uses: anonymous sign-up, token refresh and
// RPC calls (each run with the caller's user id, like auth.uid() in Supabase).
import http from "node:http"; import fs from "node:fs"; import crypto from "node:crypto";
// Needs PGlite (free, npm): npm i @electric-sql/pglite in any folder, then PGLITE=<that folder>.
const { PGlite } = await import(process.env.PGLITE ? `${process.env.PGLITE}/node_modules/@electric-sql/pglite/dist/index.js` : "@electric-sql/pglite");
const SQL = process.argv[2], PORT = +(process.argv[3] || 8650), LIFE = +(process.argv[4] || 120);
setTimeout(() => process.exit(0), LIFE * 1000);
const db = new PGlite();
await db.exec(`create schema auth; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  do $$ begin create role anon; exception when others then null; end $$; do $$ begin create role authenticated; exception when others then null; end $$;`);
await db.exec(fs.readFileSync(SQL, "utf8"));
const tokens = new Map(), refresh = new Map();
const session = (uid) => { const at = "at-" + crypto.randomUUID(), rt = "rt-" + crypto.randomUUID(); tokens.set(at, uid); refresh.set(rt, uid);
  return { access_token: at, refresh_token: rt, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: uid, is_anonymous: true } }; };
const ARGS = { mp_create_room: ["p_challenge", "p_mode", "p_name"], mp_join_room: ["p_code", "p_name"], mp_set_ready: ["p_code", "p_ready"], mp_start: ["p_code"], mp_leave: ["p_code"], mp_state: ["p_code"], mp_hint: ["p_code", "p_mission", "p_n"], mp_complete: ["p_code", "p_mission", "p_method"] };
const send = (res, code, body) => { res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" }); res.end(body === undefined ? "" : JSON.stringify(body)); };
http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204);
  let raw = ""; for await (const ch of req) raw += ch;
  const body = raw ? JSON.parse(raw) : {}, url = new URL(req.url, "http://x");
  if (!req.headers.apikey) return send(res, 401, { message: "no apikey" });
  if (url.pathname === "/auth/v1/signup") return send(res, 200, session(crypto.randomUUID()));
  if (url.pathname === "/auth/v1/token") { const uid = refresh.get(body.refresh_token); return uid ? send(res, 200, session(uid)) : send(res, 400, { message: "bad refresh" }); }
  const m = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
  if (!m || !ARGS[m[1]]) return send(res, 404, { message: "not found" });
  const uid = tokens.get((req.headers.authorization || "").replace(/^Bearer /, ""));
  if (!uid) return send(res, 401, { message: "JWT invalid" });
  const names = ARGS[m[1]].filter((k) => k in body);
  try {
    const out = await db.transaction(async (tx) => {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
      const r = await tx.query(`select public.${m[1]}(${names.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`, names.map((k) => body[k]));
      return r.rows[0]?.r ?? null;
    });
    send(res, 200, out);
  } catch (e) { send(res, 400, { code: "P0001", message: e.message }); }
}).listen(PORT, () => console.log("emulator on", PORT));

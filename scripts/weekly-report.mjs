// Weekly usage report from GoatCounter (walkbcn.goatcounter.com): anonymous counts only.
//
// Usage:   node scripts/weekly-report.mjs            last 7 full days vs the 7 before
//          node scripts/weekly-report.mjs --days=14  a longer window
// Needs:   a GoatCounter API token with permission to read statistics, either in
//          GOATCOUNTER_TOKEN or in ~/.config/walkbcn/goatcounter-token (chmod 600).
//          The token is never printed or written anywhere else.
// Writes:  _summary/informes/<end date>.md (not published: _summary is git-ignored)
//          and prints the same report.
//
// Visits with ?src=test or ?src=check are the team's own tests and are left out.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://walkbcn.goatcounter.com/api/v0";
const TEST_SOURCES = new Set(["test", "check"]);
const days = Number(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] || 7);

const tokenFile = path.join(os.homedir(), ".config/walkbcn/goatcounter-token");
const TOKEN = (process.env.GOATCOUNTER_TOKEN || (fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, "utf8") : "")).trim();
if (!TOKEN) {
  console.error("No GoatCounter token. Create one in GoatCounter (your name in the top menu → API) and save it to ~/.config/walkbcn/goatcounter-token.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p, params = {}) {
  const url = new URL(BASE + p);
  for (const [k, v] of Object.entries(params)) [].concat(v).forEach((x) => url.searchParams.append(k, x));
  await sleep(300); // the API allows 4 requests per second
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.error || JSON.stringify(body.errors || body);
    if (res.status === 401) throw new Error("GoatCounter refused the token (401): check it or create a new one.");
    if (res.status === 403) throw new Error("The token has no permission to read statistics (403): create one that can read stats.");
    throw new Error(`GoatCounter ${res.status}: ${msg}`);
  }
  return body;
}

// Dates: whole days in local time, rounded to the hour as the API asks.
const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const end = dayStart(new Date());
const start = new Date(end); start.setDate(start.getDate() - days);
const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);
const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
const label = (d) => d.toISOString().slice(0, 10);

async function allHits(from, to) {
  const hits = [];
  let more = true, exclude = [];
  while (more && hits.length < 500) {
    const r = await api("/stats/hits", { start: iso(from), end: iso(to), limit: 100, ...(exclude.length ? { exclude_paths: exclude } : {}) });
    hits.push(...r.hits);
    exclude = hits.map((h) => h.path_id);
    more = r.more;
  }
  return hits;
}
// Visits are the page-view rows ("/", "/?src=qr1"); events are rows with event: true,
// named like "Walk finished", with details (stop, src…) in the title.
const srcOf = (h) => (h.event ? /src=([\w-]+)/.exec(h.title || "")?.[1] : /[?&]src=([\w-]+)/.exec(h.path)?.[1]) || "";
function summarise(hits) {
  const real = hits.filter((h) => !TEST_SOURCES.has(srcOf(h)));
  const visits = real.filter((h) => !h.event).reduce((a, h) => a + h.count, 0);
  const events = {};
  for (const h of real.filter((h) => h.event)) events[h.path] = (events[h.path] || 0) + h.count;
  const bySrc = {};
  for (const h of real.filter((h) => !h.event)) { const s = srcOf(h) || "(enlace directo)"; bySrc[s] = (bySrc[s] || 0) + h.count; }
  const tests = hits.filter((h) => TEST_SOURCES.has(srcOf(h))).reduce((a, h) => a + h.count, 0);
  return { visits, events, bySrc, tests };
}

const [now, before] = [summarise(await allHits(start, end)), summarise(await allHits(prevStart, start))];
const listOf = async (page) => (await api(`/stats/${page}`, { start: iso(start), end: iso(end), limit: 10 })).stats || [];
const [refs, systems, locations] = [await listOf("toprefs"), await listOf("systems"), await listOf("locations")];

const ev = (s, name) => s.events[name] || 0;
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : "–");
const delta = (a, b) => (b ? `${a >= b ? "+" : ""}${a - b}` : "nuevo");
const FUNNEL = [
  ["Visitas", (s) => s.visits],
  ["Paseos terminados (Walk finished)", (s) => ev(s, "Walk finished")],
  ["Encuestas abiertas (Survey opened)", (s) => ev(s, "Survey opened")],
];
const lines = [
  `# WalkBCN · informe de uso ${label(start)} → ${label(end)}`,
  "",
  `Datos anónimos de GoatCounter (sin cookies ni datos personales). Comparado con los ${days} días anteriores. Las visitas de prueba del equipo (src=test/check: ${now.tests}) no cuentan.`,
  "",
  "## Embudo",
  "",
  "| Paso | Esta semana | Anterior | Cambio | % de las visitas |",
  "|---|---|---|---|---|",
  ...FUNNEL.map(([n, f]) => `| ${n} | ${f(now)} | ${f(before)} | ${delta(f(now), f(before))} | ${pct(f(now), now.visits)} |`),
  "",
  "## Qué hace la gente (eventos)",
  "",
  "| Evento | Esta semana | Anterior |",
  "|---|---|---|",
  ...Object.entries(now.events).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} | ${ev(before, k)} |`),
  ...(Object.keys(now.events).length ? [] : ["| (ninguno) | 0 | 0 |"]),
  "",
  "## De dónde vienen",
  "",
  "**Por enlace o tarjeta QR (src):** " + (Object.entries(now.bySrc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ") || "sin datos"),
  "",
  "**Webs de origen:** " + (refs.map((r) => `${r.name || "(directo)"} ${r.count}`).join(" · ") || "sin datos"),
  "",
  "**Sistemas:** " + (systems.map((r) => `${r.name} ${r.count}`).join(" · ") || "sin datos"),
  "",
  "**Países:** " + (locations.map((r) => `${r.name} ${r.count}`).join(" · ") || "sin datos"),
  "",
  "## Cómo leerlo",
  "",
  "- Las cifras son visitantes únicos por día y página, no personas exactas.",
  "- Con pocas visitas, un cambio de una semana a otra no significa nada todavía: mira la tendencia de varias semanas.",
  "- Para la tabla de señales de encaje (sesión 9): paseos terminados = uso real; encuestas abiertas = cuántos podrían responder la encuesta de Sean Ellis.",
];
const report = lines.join("\n") + "\n";
const outDir = path.join(ROOT, "_summary/informes");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${label(end)}.md`);
fs.writeFileSync(outFile, report);
console.log(report);
console.log(`Saved ${path.relative(ROOT, outFile)}`);

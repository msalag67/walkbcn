// WalkBCN AI judge (Session 9).
// Runs one version of the judge prompt (evals/judge/judgeprompt.md) on the Class 8 cases
// that are not used as examples in the prompt, compares each verdict with our own
// (evals/judge/cases.json) and counts failures caught and passes agreed separately.
//
// Usage:  node scripts/judge.mjs --version=1              check the judge on the Class 8 answers
//         node scripts/judge.mjs --version=3 --today      measure today's app: % of answers it passes
// Needs:  ANTHROPIC_API_KEY  (12 to 15 API calls, a few cents)
// Saves:  evals/judge/round-<version>.json  or  evals/judge/today-v<version>.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./story-writer.mjs";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Run: export ANTHROPIC_API_KEY=  and paste your key after the =");
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "evals/judge");
const version = Number(process.argv.find((a) => a.startsWith("--version="))?.split("=")[1] || 1);
const TODAY = process.argv.includes("--today");

// The prompt template for this version: the ```text block under "## Version N".
const md = fs.readFileSync(path.join(DIR, "judgeprompt.md"), "utf8");
const section = md.split(/^## /m).find((s) => s.startsWith(`Version ${version}\n`));
if (!section) { console.error(`No "## Version ${version}" in judgeprompt.md`); process.exit(1); }
const template = section.match(/```text\n([\s\S]*?)```/)[1];

const { cases } = JSON.parse(fs.readFileSync(path.join(DIR, TODAY ? "cases-today.json" : "cases.json"), "utf8"));
// Class 8 answers already shown to the judge as examples do not count. Today's answers are all new.
const inPrompt = new Set(TODAY ? [] : cases.filter((c) => template.includes(c.answer.slice(0, 120))).map((c) => c.id));
const todo = cases.filter((c) => !inPrompt.has(c.id));

// Code checks that never go to the judge.
function codeCheck(c) {
  if (c.kind !== "route") return null;
  const long = c.legs.filter((m) => m > 20), total = c.legs.reduce((a, b) => a + b, 0);
  const why = [];
  if (long.length) why.push(`${Math.max(...long)}-min walk between two stops`);
  if (total > 60) why.push(`${total} min in total`);
  return why.length ? why.join("; ") : null;
}

const client = new Anthropic({ maxRetries: 8 });
const results = [];
for (const c of todo) {
  const prompt = template.replace("{{REQUEST}}", c.request).replace("{{ANSWER}}", c.answer);
  process.stdout.write(`Case ${c.id} … `);
  const res = await client.messages.create({ model: MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] });
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const last = text.split("\n").filter(Boolean).pop().replace(/[^A-Z]/g, "");
  const judge = ["PASS", "FAIL", "UNKNOWN"].includes(last) ? last : "UNKNOWN";
  const code = codeCheck(c);
  const system = code ? "FAIL" : judge;
  results.push({ id: c.id, type: c.type, model: res.model, ours: c.verdict ?? null, judge, code, system, reason: text.split("\n").slice(0, -1).join(" ").trim() });
  console.log(`${c.verdict ? `ours ${c.verdict} · ` : ""}judge ${judge}${code ? ` · code FAIL (${code})` : ""}`);
}

if (TODAY) {
  const passed = results.filter((r) => r.system === "PASS").length;
  const out = { version, model: MODEL, ranAt: new Date().toISOString(), answers: results.length, passed, percent: Math.round((passed / results.length) * 100), results };
  fs.writeFileSync(path.join(DIR, `today-v${version}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`\nToday's app: the judge (with the code checks) passes ${passed} of ${results.length} answers = ${out.percent}%`);
  for (const r of results.filter((r) => r.system !== "PASS")) console.log(`\n✗ Case ${r.id} (judge ${r.judge}${r.code ? `, code: ${r.code}` : ""}): ${r.reason}`);
  console.log(`\nSaved evals/judge/today-v${version}.json`);
  process.exit(0);
}

const count = (key) => {
  const fails = results.filter((r) => r.ours === "FAIL"), passes = results.filter((r) => r.ours === "PASS");
  return { failuresCaught: `${fails.filter((r) => r[key] === "FAIL").length} of ${fails.length}`, passesAgreed: `${passes.filter((r) => r[key] === "PASS").length} of ${passes.length}` };
};
const summary = { version, model: MODEL, ranAt: new Date().toISOString(), examplesInPrompt: [...inPrompt], judgeAlone: count("judge"), judgePlusCodeChecks: count("system") };
fs.writeFileSync(path.join(DIR, `round-${version}.json`), JSON.stringify({ ...summary, results }, null, 2) + "\n");

console.log(`\nJudge alone:          failures caught ${summary.judgeAlone.failuresCaught} · passes agreed ${summary.judgeAlone.passesAgreed}`);
console.log(`Judge + code checks:  failures caught ${summary.judgePlusCodeChecks.failuresCaught} · passes agreed ${summary.judgePlusCodeChecks.passesAgreed}`);
for (const r of results.filter((r) => r.system !== r.ours)) console.log(`\n✗ Case ${r.id} (ours ${r.ours}, judge ${r.judge}): ${r.reason}`);
console.log(`\nSaved evals/judge/round-${version}.json`);

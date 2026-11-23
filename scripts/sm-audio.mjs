// Shared Mystery narrations: which recordings exist, which are missing or outdated, and the exact
// text to record. Nothing is generated or sent anywhere: it only reads the data files.
//   node scripts/sm-audio.mjs                 → table: adventure × language, file name, textHash, status
//   node scripts/sm-audio.mjs --text <id> <lang> → prints the story to record (copy it into the voice tool)
// After recording: save the file as audio/shared-mystery/<id>.<lang>.mp3 and add an entry with the
// textHash shown here to data/shared-mystery-audio.js (see docs/shared-mystery-audio.md).
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('..', import.meta.url).pathname;
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data/shared-mysteries.js', 'data/shared-mystery-audio.js']) vm.runInContext(fs.readFileSync(root + f, 'utf8'), ctx, { filename: f });
const SM = ctx.window.WALKBCN_SHARED_MYSTERIES, T = ctx.window.WALKBCN_SM_TEXT, A = ctx.window.WALKBCN_SM_AUDIO || {};
// Same function as smHash in index.html and scripts/check.mjs.
const smHash = s => { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const LANGS = ['ca', 'es', 'en', 'fr', 'de', 'it', 'zh'];
const [flag, id, lang] = process.argv.slice(2);
if (flag === '--text') {
  const tx = T[lang]?.[id];
  if (!tx) { console.error(`Unknown adventure or language. Adventures: ${SM.map(a => a.id).join(', ')}. Languages: ${LANGS.join(', ')}`); process.exit(1); }
  console.log(`${tx.reveal.title}\n\n${tx.reveal.story}`);
  process.exit(0);
}
console.log('adventure                 lang  file                                              textHash  status');
for (const a of SM) for (const l of LANGS) {
  const text = T[l][a.id].reveal.story, h = smHash(text), r = A[a.id]?.[l], file = r?.file || `audio/shared-mystery/${a.id}.${l}.mp3`;
  const status = !r ? 'not recorded (device voice)' : !fs.existsSync(root + r.file) ? 'LISTED BUT FILE MISSING' : r.textHash !== h ? 'OUTDATED: text changed, record again' : 'ok';
  console.log(`${a.id.padEnd(25)} ${l.padEnd(5)} ${file.padEnd(49)} ${h}  ${status}`);
}

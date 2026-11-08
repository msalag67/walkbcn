// The AI step of WalkBCN: asks Claude to retell a stop's story for each interest.
// Shared by scripts/generate.mjs (real content) and scripts/eval-generator.mjs (tests).
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

export const ANGLES = {
  architecture: "Architecture lovers: what to look at, how and why it was built, the clever or daring design details.",
  history: "History lovers: the people, events and turning points connected to this place.",
  food: "Food lovers: what is eaten or sold here, food traditions, what's worth tasting nearby.",
  art: "Art lovers: the artists, works, styles and creative stories connected to this place.",
  local: "People who want local life: how neighbours actually use this place, everyday rituals, local etiquette.",
  outdoors: "People who love parks and the sea: light, nature, open space, where to pause and enjoy it.",
};

export const SYSTEM = `You write short audio stories for WalkBCN, a walking-tour guide for tourists in central Barcelona.

Each story is listened to while standing at the stop, so it must work when heard, not read:
- 70 to 100 words, plain spoken English, no lists, no headings, no emojis.
- Speak directly to the listener ("look up at...", "notice...") in a warm, curious tone.
- Lead with one surprising or vivid detail, and point at something the listener can see from where they stand.
- Use only well-established facts. Do not invent dates, numbers, quotes or legends. If you are not sure of a detail, leave it out. The reference story supplied for each stop has been checked; prefer its facts.
- WalkBCN cares about the people who live in Barcelona: never encourage noise, crowding or disrespect, and where natural, mention that this is a real neighbourhood.

For each angle requested, retell the stop from that angle. The versions must feel genuinely different, not the same text with one sentence swapped.
Also list, for each version, any specific factual claims (dates, numbers, names) a human editor should double-check.

Reply with JSON only, in exactly this shape:
{"variants":[{"interest":"<angle id>","story":"<text>","facts_to_verify":["<claim>", "..."]}]}`;

let client;
export async function writeVariants(stop) {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium" },
    // If a request is ever declined by a safety classifier, the API retries it on
    // a suitable fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{
      role: "user",
      content:
        `Stop: ${stop.name} (${stop.area}, Barcelona)\n` +
        `Reference story (checked facts):\n${stop.story}\n\n` +
        `Local tip already shown on screen (don't repeat it): ${stop.tip}\n\n` +
        `Write one version for each of these angles:\n` +
        stop.tags.map((t) => `- "${t}": ${ANGLES[t]}`).join("\n"),
    }],
  });

  if (response.stop_reason === "refusal") throw new Error(`declined (${response.stop_details?.category ?? "no category"})`);
  if (response.stop_reason === "max_tokens") throw new Error("response was cut off");

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const variants = (json.variants ?? []).filter((v) => stop.tags.includes(v.interest) && typeof v.story === "string");
  const missing = stop.tags.filter((t) => !variants.some((v) => v.interest === t));
  if (missing.length) throw new Error(`missing angles: ${missing.join(", ")}`);
  return variants;
}

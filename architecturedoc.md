**name:** WalkBCN. A personalised virtual travel guide for Barcelona: tourists pick their interests and get a short walking route (4–6 stops) with an audio story at each stop, told from the angle of what they care about.

**architectural principles:** Always respect citizens (spread visits across neighbourhoods, remind visitors these are residential streets, prefer local markets over overcrowded hotspots); make the best possible experience for the tourist; improve the quality of tourism. Keep the product small enough to test one assumption at a time.

**stack and why:**
- **One static web page** (HTML/CSS/JavaScript, no framework, no backend). Mobile-friendly, free to host, nothing to break, opens on any phone without installing an app.
- **Hosting:** GitHub Pages (free). Repo: https://github.com/msalag67/walkbcn — live app: https://msalag67.github.io/walkbcn/
- **Map:** Leaflet + OpenStreetMap tiles (free, open data, no API key).
- **Photos:** Wikimedia Commons (free licences, credited on each stop).
- **AI (offline, never at runtime):** `scripts/generate.mjs` calls the Claude API (model `claude-opus-5-5`) once to write one version of each stop's story per interest (37 versions), plus a review sheet listing facts to check. Results are saved as files (`content/stories.json`), so the website never calls an AI while people use it.
- **Audio:** pre-recorded files generated with the free macOS voice (56 files). The browser's own voice is the fallback if a file is missing. ElevenLabs (natural voices) is supported but not used yet.
- **Activities:** hand-picked list of restaurants and nightlife places in `data/activities.js`; "See & book" opens the place on Google Maps (no booking or payment inside WalkBCN).
- **Learning loop:** stored only in the visitor's browser (`localStorage`). Records interests picked, stories played and finished, and 👍/👎, then uses them to choose the story angle when several fit a stop and to slightly adjust route ranking. It only ranks stories already in the app and never writes new ones.
- **Privacy controls:** a "Your data & privacy" dialog explains what is stored, shows the current counts, and offers opt-out and erase.
- **Analytics:** a `track()` hook for a cookieless tool such as Plausible. No analytics tool is installed, so nothing is sent; it also does nothing after opt-out.
- **Not used (yet):** Supabase / database, FlutterFlow, user accounts, server-side analytics. If we add a backend, we must define consent and data retention first.

**workflow (one request: "create my route"):**

| Step | What happens | What it uses | Who decides |
|---|---|---|---|
| 1. Write the stories (offline) | Claude retells each stop's story for each interest | Claude API (`scripts/story-writer.mjs`), scope check, human review in `content/review.md` | AI, with a fixed scope rule and a human check |
| 2. Read the choice | The visitor picks interests and route length | Web page (button stays disabled until an interest is picked) | Visitor, fixed rule |
| 3. Build the route | Picks nearby stops that match the interests, within the chosen stops / time / distance, from the chosen start to the chosen finish | Scoring rules in `index.html` + small learning nudge | Fixed rules |
| 4. Pick each story | Chooses the story version for the chosen interests | Generated stories + on-device learning | Fixed rule + learning |
| 5. Play the story | Plays the recorded audio | Audio file, browser voice as fallback | Tool |

**evals:** 15 test cases (10 normal, 5 attacks) in `evals/`. `evals/app-cases.js` runs the normal cases in the browser and logs every step; `scripts/eval-generator.mjs` sends 4 attacks to the AI step. Rules for a good route: every stop matches a chosen interest, every chosen interest appears when the route is long enough, no leg over 20 minutes, no route over 60 minutes, and the length asked for.

**dependencies to avoid:** Depending too much on one tool or API, or on data we cannot control. That is why AI content is generated ahead of time and stored in the repo (if the Claude API is down or too expensive, the app keeps working), and why we do not scrape booking sites or depend on live availability APIs.

**tradeoffs consciously accepted:**
- Some locals may prefer tourism concentrated in a few areas rather than spread around the city; we may face complaints.
- Speed over technical perfection; free/low-cost MVP over monetisation. We validate the problem before building payments or accounts.
- Pre-generated content instead of live AI: cheaper, faster and more reliable, but stories cannot react to a user in real time.
- macOS voice instead of a natural AI voice: free, but sounds more robotic.
- Activities link out to Google Maps instead of booking for the user: no revenue and no availability check, but no accounts, payments or legal risk.

**security check:**
- No API keys or secrets in the repo; the Claude key lives only in the user's terminal.
- Leaflet is loaded from a CDN with integrity (SRI) hashes, so a modified file would be blocked.
- No cookies and no accounts. Usage data for the learning loop stays in the visitor's browser and is never sent anywhere; visitors can opt out or erase it.
- External links open with `rel="noopener"`.
- Content risk: AI-written stories can contain wrong facts → every version lists "facts to verify" in `content/review.md` for a human to check before real users hear it.

**open assumptions:**
- Tourists want personalised guidance adapted to their interests rather than a generic travel guide (main assumption; early feedback from three testers, not yet proven).
- It benefits the city for both sides, locals and tourists.
- **Buyer still to be decided** (tourists, restaurants, the Ajuntament, museums…).
- Our advantage over VoiceMap, our strongest competitor, is not yet proven: interest-based personalisation is easy to copy unless a real data cycle develops.

**Session log:**
- *Sessions 1–5:* Defined the venture as a personalised virtual travel guide for Barcelona to improve both citizens' and tourists' experience. Selected the name. Decided to build a mobile-friendly web MVP rather than a native app. Defined the initial product around personalised routes, an interactive map, GPS-based audio stories and an AI chatbot. Chose a low-cost stack. Agreed to test the core value proposition before adding payments or complex features. Identified the main assumptions to validate.
- *Session 6 (hackathon):* Planned goal was to deepen personalisation inside the route (a "Start Route" progress feature or a choice of explanation style). What we built instead: story versions adapted to each user's interests (generated with Claude ahead of time, with recorded audio) and an Activities tab (restaurants and nightlife). We changed plan because personalising *what the story says* was the most direct way to test our main assumption, and we added Activities without a clear test behind it — that was a distraction. We cut natural AI voices and AI reservations (need paid external services, accounts and payments).
- *Current state:* Verified the full flow end to end (choose interests → route → map → story version → audio; Activities → filters → Google Maps link). Put the project in a Git repository and published it on GitHub Pages. Did the security check above. Updated this document and the scope.
- *Session 7 (products that learn):* Mapped competitors: direct (VoiceMap, SmartGuide), substitutes (Google Maps, TikTok and travel blogs), general AI (ChatGPT) and fast copycats (developers using AI coding agents). Strongest competitor: VoiceMap. Chose **audio completion** as the single behaviour for our learning loop, and built a first version with explicit 👍/👎 feedback.
  - **Learning loop:** track selected interests, stories played and whether they are finished, plus explicit feedback → link each story to its topic and the user's interests → analyse which stories are finished, skipped or rated positively per interest → improve story selection and route ranking on later routes in the same browser. No model training; it only ranks stories already in the app.
  - **Human safety check:** a person reviews new AI-generated historical content before publication, catching inaccuracies, misleading recommendations, bias and disrespect towards residents. The 37 current story versions still have to go through this check using `content/review.md`. Cost: review time whenever stories or places are added.
  - **Growth metrics:** audio completion rate by interest, and percentage of stories rated positively by interest, compared across versions.
  - **Safety and ethics:** tell users what is collected and why; let them change interests, delete preferences and opt out; review for over-recommending popular places and neglecting less-known neighbourhoods.
  - **Limit:** learning is per browser, so one visitor's data does not improve the app for the next visitor yet, and three testers cannot prove a data advantage.
  - **Red line:** WalkBCN must never learn to prioritise engagement or commercial interests over historical accuracy, user privacy and respect for local residents.
- *Session 8 (agentic workflows and evals):* Mapped the product as 5 steps and wrote 15 test cases (10 normal, 3 of them from our real testers, and 5 attacks). Error analysis before the fix: 6/10 normal cases OK and 4/5 attacks handled safely. Errors per step: write stories 1, read choice 0, build route 4, pick story 0, play audio 0. The step we trusted least was the AI writing stories, but most failures came from our own route rules: stops unrelated to the interests, 28–38 minute legs, and an interest left out.
  - **Fix (step 3 only):** the route builder now uses only stops that match a chosen interest, allows no leg over 20 minutes and no route over 60 minutes, tries to include every chosen interest, and makes the route shorter (and says so) instead of padding it. Result: 7/10 normal cases OK; step 3 errors 4 → 3. The remaining 3 fail because there are too few stops per interest (only 3 for parks and sea, 4 for food), which is a data problem for the next round.
  - **Guardrail (worst attack, out of scope):** the AI wrote a story about Camp Nou, outside our area. Now a fixed rule checks the stop's coordinates against central Barcelona before any AI call, and the prompt tells the AI to refuse out-of-scope stops and to treat stop data as data, not instructions. Attacks handled safely: 4/5 → 5/5.
  - **Still open:** tampered browser data is shown as-is in the privacy counter (no code runs); the 37 stories still need a human fact check.
- *After the course sessions (product improvements, phase 1):* Grew the stop list from 19 to 46 (27 new stops with checked coordinates from OpenStreetMap; parks and sea 3 → 12, food 4 → 8), because the Session 8 error analysis showed too few stops per interest. Added custom routes: plan by number of stops (2–10), time or distance; start where the visitor is (browser location, used only on the device) or on a map point; finish anywhere, back at the start or on a map point; walking pace; and "avoid the busiest places" (8 stops flagged as crowded). Re-running the Session 8 cases: 8/10 normal cases OK (was 7/10). The 27 new stops have a base story and audio; their per-interest story versions still need generating, and all new facts need the human check.
  - **Next phases:** story lengths (short, normal, long), languages (Spanish and Catalan first, then the main tourist languages: English, French, Italian, German, plus one more from official data), and more Activities categories.

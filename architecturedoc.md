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
- **Not used (yet):** Supabase / database, FlutterFlow, user accounts. Not needed until we have real users to store data about.

**dependencies to avoid:** Depending too much on one tool or API, or on data we cannot control. That is why AI content is generated ahead of time and stored in the repo (if the Claude API is down or too expensive, the app keeps working), and why we do not scrape booking sites or depend on live availability APIs.

**tradeoffs consciously accepted:**
- Some locals may prefer tourism concentrated in a few areas rather than spread around the city; we may face complaints.
- Speed over technical perfection; free/low-cost MVP over monetisation. We validate the problem before building payments or accounts.
- Pre-generated content instead of live AI: cheaper, faster and more reliable, but stories cannot react to a user in real time.
- macOS voice instead of a natural AI voice: free, but sounds more robotic.
- Activities link out to Google Maps instead of booking for the user: no revenue and no availability check, but no accounts, payments or legal risk.

**security check (done 25 Oct, after class):**
- No API keys or secrets in the repo; the Claude key lives only in the user's terminal. Two keys that were accidentally pasted in a chat were revoked.
- Leaflet is loaded from a CDN with integrity (SRI) hashes, so a modified file would be blocked.
- The page only shows our own data (no user input is stored or displayed), no cookies, no tracking, no personal data collected.
- External links open with `rel="noopener"`.
- Content risk: AI-written stories can contain wrong facts → every version lists "facts to verify" in `content/review.md` for a human to check before real users hear it.

**open assumptions:**
- Tourists want personalised guidance adapted to their interests rather than a generic travel guide (main assumption, not yet tested with real tourists).
- It benefits the city for both sides, locals and tourists.
- We still have to decide **who the buyer is** (tourists, restaurants, the Ajuntament, museums…) and map our competitors (Airbnb Experiences, GetYourGuide, free tours, museum audio guides).

**Session log:**
- *Sessions 1–5:* Defined the venture as a personalised virtual travel guide for Barcelona to improve both citizens' and tourists' experience. Selected the name. Decided to build a mobile-friendly web MVP rather than a native app. Defined the initial product around personalised routes, an interactive map, GPS-based audio stories and an AI chatbot. Chose a low-cost stack. Agreed to test the core value proposition before adding payments or complex features. Identified the main assumptions to validate.
- *Session 6 (hackathon, 13 Oct):* Planned goal was to deepen personalisation inside the route (a "Start Route" progress feature or a choice of explanation style). What we built instead: story versions adapted to each user's interests (generated with Claude ahead of time, with recorded audio) and an Activities tab (restaurants and nightlife). We changed plan because personalising *what the story says* was the most direct way to test our main assumption, and we added Activities without a clear test behind it — that was a distraction. We cut natural AI voices and AI reservations (need paid external services, accounts and payments).
- *After class (by 25 Oct):* Verified the full flow end to end (choose interests → route → map → story version → audio; Activities → filters → Google Maps link). Put the project in a Git repository and published it on GitHub Pages. Did the security check above. Updated this document and the scope. Next: competitor map, choose one buyer and talk to five of them.

// The 10 normal test cases for WalkBCN's in-app steps. Paste into the browser console on
// the app (or run with Playwright) — it uses the page's own functions and logs each step.
async () => {
  const cases = [
    { id: 1, who: 'Real tester: Danish tourist (Christoffer)', interests: ['history', 'architecture'], n: 5 },
    { id: 2, who: 'Real tester: Polish tourist (Vittoria)', interests: ['art'], n: 4 },
    { id: 3, who: 'Real tester: Mexican friend (Kevin)', interests: ['history', 'local'], n: 6 },
    { id: 4, who: 'Foodie in a hurry', interests: ['food'], n: 4 },
    { id: 5, who: 'Beginner who ticks everything', interests: ['architecture', 'history', 'food', 'art', 'local', 'outdoors'], n: 5 },
    { id: 6, who: 'Nature lover, long walk', interests: ['outdoors'], n: 6 },
    { id: 7, who: 'Young traveller: local vibe + food', interests: ['local', 'food'], n: 5 },
    { id: 8, who: 'Art & architecture expert', interests: ['art', 'architecture'], n: 6 },
    { id: 9, who: 'Family with kids: parks + history', interests: ['outdoors', 'history'], n: 4 },
    { id: 10, who: 'Unclear: user picks nothing', interests: [], n: 5 },
  ];
  const mins = km => Math.round(km * 1.3 / 4.5 * 60);
  const out = [];
  for (const c of cases) {
    try { localStorage.clear(); } catch (e) {}
    learning = emptyLearning(); routeAngles = {};
    selected = new Set(c.interests); stopsCount = c.n;
    const r = { case: c.id, who: c.who, input: `${c.interests.join(' + ') || '(none)'} / ${c.n} stops`, s2: '', s3: '', s4: '', s5: '' };
    // Step 2: read the choice — the real UI gate on the "Create my route" button
    const btn = document.getElementById('build'); btn.disabled = selected.size === 0;
    if (!c.interests.length) { r.s2 = btn.disabled ? '' : 'built a route with no interest'; r.note = 'Button stays disabled until an interest is picked'; r.ok = btn.disabled; out.push(r); continue; }
    // Step 3: build the route
    const res = buildRoute(c.n), path = res.path;
    const legs = path.slice(1).map((s, i) => mins(dist(path[i], s)));
    const total = mins(res.km);
    const unmatched = path.filter(s => !s.tags.some(t => selected.has(t))).map(s => s.name);
    const covered = new Set(path.flatMap(s => s.tags.filter(t => selected.has(t))));
    const missing = c.interests.filter(t => !covered.has(t));
    r.route = path.map(s => s.name).join(' → ');
    r.legs = legs.join(', '); r.total = total;
    const e3 = [];
    if (unmatched.length) e3.push(`${unmatched.length} stop(s) match no chosen interest (${unmatched.join(', ')})`);
    if (c.interests.length <= path.length && missing.length) e3.push(`no stop for: ${missing.join(', ')}`);
    if (Math.max(0, ...legs) > 20) e3.push(`${Math.max(...legs)}-min leg`);
    if (total > 60) e3.push(`${total} min in total`);
    if (path.length !== c.n) e3.push(`${path.length} stops instead of ${c.n}`);
    r.s3 = e3.join('; ');
    // Step 4: pick each story · Step 5: play its audio
    const stories = [], e4 = [], e5 = [];
    for (const s of path) {
      const st = storyFor(s);
      stories.push(`${s.name} [${st.angle || 'base'}]`);
      if (s.tags.some(t => selected.has(t)) && !st.angle) e4.push(`${s.name}: no version for the chosen interest`);
      if (st.angle && !selected.has(st.angle)) e4.push(`${s.name}: told for ${st.angle}, not chosen`);
      if (!st.audio) e5.push(`${s.name}: no audio`);
      else { const h = await fetch(st.audio, { method: 'HEAD' }); if (!h.ok) e5.push(`${s.name}: audio ${h.status}`); }
    }
    r.stories = stories.join(' | ');
    r.s4 = e4.join('; '); r.s5 = e5.join('; ');
    r.ok = !r.s3 && !r.s4 && !r.s5;
    out.push(r);
  }
  return out;
}

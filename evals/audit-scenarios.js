// Acceptance scenarios from the November 2026 audit. Paste into the browser console on the
// app (or run with the browser tools): it uses the page's own functions and returns one
// result per scenario. It changes the saved route, so run it in a private window.
async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reset = () => {
    history.replaceState(null, '', location.pathname); showPickView();
    Object.assign(plan, { mode: 'stops', start: 'best', end: 'any', startPt: null, endPt: null, pace: 4.5, avoidCrowded: false, length: 'normal', theme: null });
    stopsCount = 5; setStatus('');
  };
  const build = (interests, p = {}, n) => {
    reset();
    selected = new Set(interests); Object.assign(plan, p); if (n) stopsCount = n;
    syncPlanControls(); showRoute();
    const ok = !document.getElementById('route').hidden;
    return {
      route: ok ? route.map(s => s.name).join(' → ') : '',
      message: locStatus.hidden ? '' : locStatus.textContent.trim(),
      summary: ok ? document.getElementById('summary').textContent : '',
    };
  };
  const out = [];
  out.push({ id: 1, name: 'First trip: Architecture + History, 5 stops, automatic start', ...build(['architecture', 'history'], {}, 5) });
  out.push({ id: 2, name: 'Football: Sports, 1 h, back to start', ...build(['sports'], { mode: 'time', minutes: 60, end: 'loop' }) });
  out.push({ id: 3, name: 'Calm: Architecture + Local life, 30 min, relaxed, long stories, skip icons', ...build(['architecture', 'local'], { mode: 'time', minutes: 30, pace: 3.5, length: 'long', avoidCrowded: true }) });
  out.push({ id: 4, name: 'Resident: Food + Local life, 2 km, brisk, short stories', ...build(['food', 'local'], { mode: 'distance', km: 2, pace: 5.5, length: 'short' }) });
  const off = build(['architecture'], { mode: 'time', minutes: 180 });
  const on = build(['architecture'], { mode: 'time', minutes: 180, avoidCrowded: true });
  out.push({ id: 5, name: 'Architecture 3 h, big icons off vs on', off: off.route, on: on.route,
    iconsLeftWhenOn: STOPS.filter(s => s.crowded && on.route.includes(s.name)).map(s => s.name) });
  const two = build(['history'], {}, 2);
  goTo(route.length - 1);
  out.push({ id: 6, name: 'Two stops, open the last card', ...two, lastCardHasFinish: !!document.getElementById('finishWalk') });
  out.push({ id: '7a', name: 'Start and finish on the map, 2 km', ...build(['history'], { mode: 'distance', km: 2, start: 'map', startPt: { lat: 41.3809, lng: 2.1735 }, end: 'map', endPt: { lat: 41.3851, lng: 2.1801 } }) });
  out.push({ id: '7b', name: 'Start on the map, back to start, 1 h', ...build(['history'], { mode: 'time', minutes: 60, start: 'map', startPt: { lat: 41.3874, lng: 2.1686 }, end: 'loop' }) });
  out.push({ id: '7c', name: 'Start outside the covered area', ...build(['history'], { start: 'map', startPt: { lat: 41.45, lng: 2.25 } }) });
  out.push({ id: '7d', name: '"Where I am now" without a location yet', ...build(['history'], { start: 'here' }) });
  // 8: audio for Abaceria and Plaça de la Vila, recordings in English and Spanish
  const audio = [];
  for (const l of ['en', 'es']) {
    await setLang(l);
    for (const len of ['normal', 'short']) {
      plan.length = len;
      for (const id of ['mercat-abaceria', 'placa-vila-gracia']) {
        const s = STOPS.find(x => x.id === id); selected = new Set(['food', 'local']); routeAngles = {};
        const st = storyFor(s);
        let ok = null;
        if (st.audio) ok = (await fetch(st.audio, { method: 'HEAD' })).ok;
        audio.push({ lang: l, length: len, stop: id, kind: st.audio ? 'recording' : 'device voice', fileOk: ok });
      }
    }
  }
  out.push({ id: 8, name: 'Audio sources (English and Spanish)', audio });
  // 9: audio guide search with and without results
  showTab('guide'); await wait(300);
  const q = document.getElementById('guideSearch');
  q.value = 'sole'; q.dispatchEvent(new Event('input')); await wait(300);
  const found = document.getElementById('guideCount').textContent;
  q.value = 'zzzz'; q.dispatchEvent(new Event('input')); await wait(300);
  const none = document.getElementById('guideEmpty').textContent.trim();
  resetGuide(); showTab('walk');
  out.push({ id: 9, name: 'Audio guide search', found, none });
  return out;
}

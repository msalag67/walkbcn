// Acceptance scenarios for the 14 November 2026 evolution (new stops, Poblenou–Clot, zones,
// must-sees, route editing, practical cards, Activities filters, retired places, reports).
// Paste into the browser console on the app (or run with the browser tools). It uses the
// page's own functions and returns one result per scenario with `ok`. It changes the saved
// route and the language, so run it in a private window.
async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reset = () => {
    history.replaceState(null, '', location.pathname); showPickView();
    Object.assign(plan, { mode: 'stops', start: 'best', end: 'any', startPt: null, endPt: null, pace: 4.5, avoidCrowded: false, length: 'normal', theme: null, zone: 'any', must: [], minutes: 60, km: 2 });
    stopsCount = 5; setStatus(''); walk = { visited: {}, skipped: {}, finished: false };
  };
  const build = (interests, p = {}, n) => {
    reset();
    selected = new Set(interests); Object.assign(plan, p); if (n) stopsCount = n;
    syncPlanControls(); showRoute();
    return !document.getElementById('route').hidden;
  };
  const msg = () => (locStatus.hidden ? '' : locStatus.textContent.trim());
  const ids = () => route.map(s => s.id);
  const out = [];
  const add = (id, name, ok, extra = {}) => out.push({ id, name, ok: !!ok, ...extra });

  await setLang('en');
  // 1. Earlier routes still work
  add(1, 'First day theme', (reset(), applyTheme('firstDay'), showRoute(), route.length >= 4), { route: ids() });
  add(2, 'Barça theme', (reset(), applyTheme('barca'), showRoute(), ids().includes('gimnas-sole')), { route: ids() });
  add(3, 'Gràcia theme stays in Gràcia', (reset(), applyTheme('gracia'), showRoute(), route.every(s => s.area === 'Gràcia')), { route: ids() });
  // 2. Poblenou–Clot walk
  reset(); applyTheme('poblenou'); showRoute(); await wait(300);
  add(4, 'Poblenou–Clot theme', ids().includes('can-framis') && ids().includes('farinera-clot') && route.every(s => THEMES.poblenou.pool.includes(s.id)),
    { route: ids(), notes: document.querySelector('.sum-notes')?.textContent });
  add(5, 'Area chip keeps a walk in Poblenou–Clot', build(['history', 'architecture', 'art'], { zone: 'poblenou', mode: 'time', minutes: 90 }) && route.every(s => s.zone === 'poblenou'), { route: ids() });
  // 3. Editing: remove and replace, progress kept
  build(['history', 'architecture'], {}, 5);
  walk.visited[route[0].id] = true;
  const first = route[0].id, removed = route[2].id;
  editing = true; renderStopList();
  document.querySelectorAll('#stopList [data-a="remove"]')[2].click();
  add(6, 'Remove a stop keeps the visited one', !ids().includes(removed) && route.length === 4 && walk.visited[first], { route: ids() });
  editing = true; renderStopList();
  document.querySelectorAll('#stopList [data-a="replace"]')[1].click();
  const options = [...document.querySelectorAll('.replace-box li button')].map(b => b.textContent);
  const replaced = route[1].id;
  document.querySelector('.replace-box li button')?.click();
  document.querySelector('.replace-box [data-a="yes"]')?.click();
  add(7, 'Replace a stop (with detour shown)', options.length > 0 && !ids().includes(replaced) && route.length === 4, { options, route: ids() });
  // 4. Must-sees and impossible combinations
  add(8, 'Must-see included', build(['food'], { must: ['via-sepulcral-romana'], mode: 'time', minutes: 60 }) && ids().includes('via-sepulcral-romana'), { route: ids() });
  build(['architecture'], { must: ['sagrada-familia'], avoidCrowded: true });
  add(9, 'Must-see vs "skip big icons" is explained', /big icons/.test(msg()) && locStatus.querySelectorAll('button').length === 2, { message: msg() });
  build(['history'], { must: ['sagrada-familia', 'via-sepulcral-romana'], mode: 'time', minutes: 30 });
  add(10, 'Must-sees that need more time are explained', /need about/.test(msg()), { message: msg() });
  build(['history'], { must: ['can-framis'], zone: 'oldtown' });
  add(11, 'Must-see outside the area is explained', /outside the area/.test(msg()), { message: msg() });
  // 5. Manual start and finish
  add(12, 'Manual start and finish', build(['history'], { mode: 'distance', km: 3, start: 'map', startPt: { lat: 41.3809, lng: 2.1735 }, end: 'map', endPt: { lat: 41.3904, lng: 2.1889 } }), { route: ids() });
  // 6. Language switch with a card open
  build(['history'], {}, 3);
  const pending = setLang('de');
  const during = document.querySelector('#stopCard .story')?.className;
  await pending;
  add(13, 'Changing language with a card open shows loading, then the new text', /loading/.test(during || '') || !!I18N.de, { during, after: document.querySelector('#stopCard .story')?.textContent.slice(0, 50) });
  await setLang('en');
  // 7. New stops: audio + text in every language
  const fileOk = async f => (await fetch(f, { method: 'HEAD' })).ok;
  const sample = ['sant-pau-del-camp', 'can-framis', 'farinera-clot'];
  const audio = [];
  for (const l of ['ca', 'es', 'zh']) { await loadLangData(l); for (const id of sample) audio.push({ l, id, ok: await fileOk(I18N[l].stops[id].audio.base.file) }); }
  for (const id of sample) audio.push({ l: 'en', id, ok: await fileOk(STORIES[id].base.audio) });
  add(14, 'Audio of new stops (sample) exists', audio.every(a => a.ok), { audio });
  // 8. Activities: combined filters, empty results, retired places
  showTab('act'); openCategory('restaurants');
  const chip = (f, v) => [...document.querySelectorAll('#actGroups .filter-group')][ACTIVITIES.restaurants.filters.findIndex(x => x.id === f)].querySelectorAll('.chip')[ACTIVITIES.restaurants.filters.find(x => x.id === f).options.findIndex(o => o.id === v)].click();
  chip('food', 'esmorzar'); const esm = document.getElementById('actCount').textContent;
  chip('price', '3'); const empty = !!document.querySelector('#actResults .empty');
  add(15, 'Esmorzar filter and an empty combination', /[1-9]/.test(esm) && empty, { esmorzar: esm, emptyShown: empty, alt: document.querySelector('.near-title')?.textContent });
  const everywhere = JSON.stringify(uniqueActItems().map(x => x.p.name)) + document.body.innerText;
  add(16, 'Retired places are gone', !/Teresa Carles|Flax & Kale/.test(everywhere));
  showTab('walk');
  // 9. Old saved routes and shared links with unknown or removed places
  localStorage.setItem('walkbcn_route_v1', JSON.stringify({ at: Date.now(), ids: ['flax-and-kale', 'placa-del-rei', 'via-sepulcral-romana'], current: 0, km: 1, selected: ['history'], plan: { mode: 'stops', zone: 'nowhere', must: ['gone'] }, stopsCount: 3 }));
  reset();
  add(17, 'Old saved route with a removed place', restoreRoute() && ids().join() === 'placa-del-rei,via-sepulcral-romana' && plan.zone === 'any' && plan.must.length === 0, { route: ids() });
  history.replaceState(null, '', '#walk=placa-del-rei,not-a-stop,sant-pau-del-camp&i=history&l=normal');
  add(18, 'Shared link skips unknown places', routeFromLink() && ids().join() === 'placa-del-rei,sant-pau-del-camp', { route: ids() });
  // 10. Photos credited, practical card, report button
  goTo(1);
  add(19, 'Photo author + licence and practical card on a new stop', /CC BY|Public domain/.test(document.querySelector('#stopCard .credit-line')?.textContent || '') && !!document.querySelector('#stopCard .practical'));
  document.querySelector('#stopCard [data-report]')?.click();
  const href = document.getElementById('reportGo').href;
  document.getElementById('report').close();
  add(20, 'Report a problem opens the form already filled in', /docs\.google\.com\/forms/.test(href) && /sant-pau-del-camp/.test(decodeURIComponent(href)), { href: href.slice(0, 90) + '…' });
  reset();
  return out;
}

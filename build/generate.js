// MissTheBoat static page generator
// Usage: node build/generate.js
// Reads DESTS/PORTS/scoreStop directly from site/index.html (single source of truth),
// emits /destinations/[slug]/, /ports/[slug]/, /methodology/, sitemap.xml, robots.txt, llms.txt
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://misstheboat.app';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// Representative Mon–Sun weeks per season (stable dates → stable pages between refreshes)
const SEASON_WEEKS = {
  Summer: '2026-07-13', Spring: '2026-05-11', Fall: '2026-10-12',
};
const PRIMARY_SEASON = 'Summer';

// ── 1. Load app logic headlessly ──
function loadApp() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const js = scripts.reduce((a, b) => (b.length > a.length ? b : a), '');
  const noop = () => {};
  const fakeEl = new Proxy({}, { get: (t, p) => {
    if (p === 'style' || p === 'classList' || p === 'dataset') return new Proxy({}, { get: () => noop, set: () => true });
    return noop; }, set: () => true });
  const document = new Proxy({}, { get: (t, p) => {
    if (p === 'getElementById' || p === 'querySelector') return () => fakeEl;
    if (p === 'querySelectorAll') return () => [];
    if (p === 'createElement') return () => fakeEl;
    return noop; } });
  const ctx = { document, window: { addEventListener: noop, location: { hash: '', href: '' } },
    navigator: { userAgent: 'node' }, localStorage: { getItem: () => null, setItem: noop },
    fetch: () => Promise.resolve({ json: () => ({}) }), console: { error: noop, log: noop, warn: noop },
    setTimeout, URLSearchParams, history: { replaceState: noop } };
  vm.createContext(ctx);
  try { vm.runInContext(js, ctx); } catch (e) { /* init() DOM calls — expected */ }
  vm.runInContext(';globalThis.__X = { DESTS, PORTS };', ctx);
  return { DESTS: ctx.__X.DESTS, PORTS: ctx.__X.PORTS, scoreStop: ctx.scoreStop };
}

const { DESTS, PORTS, scoreStop } = loadApp();
const slug = k => k.trim().toLowerCase().replace(/\s+/g, '-');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── 2. Score every destination for each season's representative week ──
function weekScores(key, mondayISO) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayISO + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    try { out.push(scoreStop(key, d)); } catch (e) { out.push(null); }
  }
  return out;
}
const SCORES = {}; // key -> { Summer:[7], Spring:[7], Fall:[7] }
for (const key of Object.keys(DESTS)) {
  SCORES[key] = {};
  for (const [season, monday] of Object.entries(SEASON_WEEKS)) SCORES[key][season] = weekScores(key, monday);
}

function summarize(key) {
  const wk = SCORES[key][PRIMARY_SEASON].filter(Boolean);
  if (!wk.length) return null;
  const byPressure = [...wk].sort((a, b) => b.pressureScore - a.pressureScore);
  const busiest = byPressure.slice(0, 2).map(s => DAYS[s.dayIdx]);
  const quietest = byPressure.slice(-2).map(s => DAYS[s.dayIdx]).reverse();
  const maxShips = Math.max(...wk.map(s => s.estimatedShips || 0));
  const counts = { red: 0, amber: 0, green: 0 };
  wk.forEach(s => counts[s.status] = (counts[s.status] || 0) + 1);
  const hasCruise = wk.some(s => (s.maxCruise || 0) > 0 || (s.estimatedShips || 0) > 0);
  const primaryPort = wk.find(s => s.primaryPort)?.primaryPort || null;
  return { busiest, quietest, maxShips, counts, hasCruise, primaryPort, wk };
}

const verdictWord = st => st === 'red' ? 'Avoid' : st === 'amber' ? 'Caution' : 'Clear';
const verdictClass = st => st === 'red' ? 'v-r' : st === 'amber' ? 'v-a' : 'v-g';
const shipsLabel = n => n >= 0.95 ? `\u2248${Math.round(n)}` : n > 0 ? '<1' : '0';

// ── 3. Shared page chrome ──
const CSS_HREF = '/assets/pages.css';
function page({ title, desc, canonical, jsonld, body, breadcrumb }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:image" content="${BASE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CSS_HREF}">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LCQ0RJ1LR6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LCQ0RJ1LR6');</script>
${jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<div class="wrap">
<header class="hdr"><a class="logo" href="/">Miss the Boat<span class="flag">&#9873;</span></a><span class="tag">Cruise-crowd forecasts &middot; Mediterranean</span></header>
<nav class="crumbs">${breadcrumb}</nav>
${body}
<footer class="foot">
<p class="est">All ship counts and crowd indices are <strong>seasonal estimates</strong> modeled from published port-call patterns, census data, and day-of-week traffic patterns &mdash; not live vessel tracking. <a href="/methodology/">How the numbers work &rarr;</a></p>
<p class="foot-links"><a href="/">Trip planner</a> &middot; <a href="/methodology/">Methodology</a> &middot; &copy; ${new Date().getFullYear()} MissTheBoat</p>
</footer>
</div>
</body>
</html>`;
}

function weekTable(key, season) {
  const wk = SCORES[key][season];
  const max = Math.max(1, ...wk.map(s => s ? s.pressureScore : 0));
  const rows = wk.map(s => s ? `<tr>
<th scope="row">${DAYS[s.dayIdx]}</th>
<td>${shipsLabel(s.estimatedShips || 0)}</td>
<td>${s.pressureScore}</td>
<td><span class="v ${verdictClass(s.status)}">${verdictWord(s.status).toUpperCase()}</span></td>
</tr>` : '').join('\n');
  const bars = wk.map(s => s ? `<div class="bc"><div class="bb ${verdictClass(s.status)}" style="height:${Math.max(6, Math.round(s.pressureScore / max * 100))}%"></div><span class="bl">${DAYS_SHORT[s.dayIdx]}</span></div>` : '').join('');
  return `<div class="chart" aria-hidden="true">${bars}</div>
<table class="wk">
<caption>Estimated cruise pressure by day of week &mdash; ${season.toLowerCase()} pattern</caption>
<thead><tr><th scope="col">Day</th><th scope="col">Est. ships</th><th scope="col">Pressure index (0&ndash;100)</th><th scope="col">Verdict</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

// ── 4. Destination pages ──
function nearbyLinks(key) {
  const d = DESTS[key];
  const ports = d.nearPorts || [];
  let pool = Object.keys(DESTS).filter(k => k !== key && (DESTS[k].nearPorts || []).some(p => ports.includes(p)));
  if (pool.length < 3) pool = pool.concat(Object.keys(DESTS).filter(k => k !== key && !pool.includes(k) && DESTS[k].country === d.country));
  return pool.slice(0, 6);
}

function destPage(key) {
  const d = DESTS[key];
  const sm = summarize(key);
  const s = slug(key);
  const url = `${BASE}/destinations/${s}/`;
  const portName = sm?.primaryPort && PORTS[sm.primaryPort] ? PORTS[sm.primaryPort].name : null;

  let answer, faq1a;
  if (sm && sm.hasCruise) {
    const ships = sm.maxShips >= 0.95 ? `an estimated ${Math.round(sm.maxShips)} ship${Math.round(sm.maxShips) > 1 ? 's' : ''}` : 'occasional ship calls';
    answer = `Cruise crowds in ${d.name} peak on <strong>${sm.busiest.join(' and ')}</strong> in summer, when ${ships}${portName ? ` calling at ${portName}` : ''} drive day-tripper traffic. The quietest days are typically <strong>${sm.quietest.join(' and ')}</strong>. Figures are seasonal estimates.`;
    faq1a = `In peak season, cruise impact at ${d.name} is heaviest on ${sm.busiest.join(' and ')}${portName ? `, driven by ships calling at ${portName}` : ''}. These are modeled seasonal patterns, not live tracking.`;
  } else {
    answer = `${d.name} has <strong>no meaningful cruise-ship traffic</strong>. Crowds here follow normal day-of-week patterns &mdash; ${sm ? `busiest around ${sm.busiest[0]}, quietest around ${sm.quietest[0]}` : 'weekends busier than weekdays'} &mdash; making it a reliable escape from cruise-day crush nearby.`;
    faq1a = `${d.name} is not a significant cruise excursion destination. Crowd levels follow regular weekly patterns rather than ship schedules.`;
  }

  const faqs = [
    { q: `What days do cruise ships affect ${d.name}?`, a: faq1a },
    { q: `When is ${d.name} least crowded?`, a: sm ? `${sm.quietest.join(' and ')} are typically the calmest days in peak season.${d.shoulder ? ' ' + d.shoulder : ''}` : (d.shoulder || 'Weekday mornings are generally quietest.') },
    { q: `Where should I go instead on busy days?`, a: d.alt || 'Check the trip planner for lower-traffic alternatives nearby.' },
  ];

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Miss the Boat', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Destinations', item: BASE + '/destinations/' },
      { '@type': 'ListItem', position: 3, name: d.name, item: url }] },
  ];

  const tips = (d.tips || []).slice(0, 5).map(t => `<li>${esc(t)}</li>`).join('');
  const nearby = nearbyLinks(key).map(k => `<a class="near" href="/destinations/${slug(k)}/">${esc(DESTS[k].name)}</a>`).join('');
  const seasonTabs = ['Summer', 'Spring', 'Fall'].map(se => `<section class="season"><h3>${se} pattern</h3>${weekTable(key, se)}</section>`).join('\n');

  const body = `
<article>
<p class="kicker">${esc(d.country)} &middot; Cruise crowd calendar</p>
<h1>${esc(d.name)}: best days to visit without cruise crowds</h1>
<p class="answer">${answer}</p>
<p class="cta-row"><a class="cta" href="/">Check your exact dates in the free planner &rarr;</a></p>
${sm && sm.hasCruise ? `<p class="sub">Summer week at a glance: <strong>${sm.counts.red || 0} avoid</strong> &middot; ${sm.counts.amber || 0} caution &middot; ${sm.counts.green || 0} clear days${portName ? ` &middot; nearest cruise port: <a href="/ports/${slug(sm.primaryPort)}/">${esc(portName)}</a>` : ''}</p>` : ''}
${seasonTabs}
${d.note ? `<section><h2>What the crowds actually look like</h2><p>${esc(d.note)}</p>${d.dayTripNote ? `<p>${esc(d.dayTripNote)}</p>` : ''}</section>` : ''}
${(d.shoulder || d.alt) ? `<section><h2>Beating the crowds</h2>${d.shoulder ? `<p><strong>Timing:</strong> ${esc(d.shoulder)}</p>` : ''}${d.alt ? `<p><strong>Alternative:</strong> ${esc(d.alt)}</p>` : ''}</section>` : ''}
${tips ? `<section><h2>Local intel</h2><ul class="tips">${tips}</ul></section>` : ''}
<section><h2>Common questions</h2>${faqs.map(f => `<h3>${esc(f.q)}</h3><p>${f.a}</p>`).join('')}</section>
${nearby ? `<section><h2>Nearby crowd calendars</h2><div class="nearwrap">${nearby}</div></section>` : ''}
</article>`;

  return page({
    title: `${d.name} Cruise Crowd Calendar — Best Days to Visit | Miss the Boat`,
    desc: `Which days cruise crowds hit ${d.name}, ${d.country} — estimated ship traffic, quietest days, and local alternatives. Free seasonal crowd forecast.`,
    canonical: url, jsonld,
    breadcrumb: `<a href="/">Home</a> &rsaquo; <a href="/destinations/">Destinations</a> &rsaquo; ${esc(d.name)}`,
    body,
  });
}

// ── 5. Port pages ──
function portPage(pkey) {
  const p = PORTS[pkey];
  const s = slug(pkey);
  const url = `${BASE}/ports/${s}/`;
  const seasons = ['summer', 'spring', 'fall'].filter(se => Array.isArray(p[se]));
  const tables = seasons.map(se => {
    const arr = p[se];
    const max = Math.max(1, ...arr);
    const rows = arr.map((v, i) => `<tr><th scope="row">${DAYS[i]}</th><td>${v}</td></tr>`).join('');
    const bars = arr.map((v, i) => `<div class="bc"><div class="bb ${v >= 75 ? 'v-r' : v >= 45 ? 'v-a' : 'v-g'}" style="height:${Math.max(6, Math.round(v / max * 100))}%"></div><span class="bl">${DAYS_SHORT[i]}</span></div>`).join('');
    return `<section class="season"><h3>${se[0].toUpperCase() + se.slice(1)} call intensity</h3><div class="chart" aria-hidden="true">${bars}</div><table class="wk"><caption>Relative port-call intensity by day (0&ndash;100, ${se})</caption><thead><tr><th scope="col">Day</th><th scope="col">Call intensity</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join('\n');
  const exc = (p.excursions || []).filter(k => DESTS[k]).map(k => `<a class="near" href="/destinations/${slug(k)}/">${esc(DESTS[k].name)}</a>`).join('');
  const safe = (p.notExcursions || []).filter(k => DESTS[k]).map(k => `<a class="near" href="/destinations/${slug(k)}/">${esc(DESTS[k].name)}</a>`).join('');
  const summerArr = p.summer || p.spring || [];
  const busiestIdx = summerArr.indexOf(Math.max(...summerArr));
  const jsonld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Miss the Boat', item: BASE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Cruise ports', item: BASE + '/ports/' },
    { '@type': 'ListItem', position: 3, name: p.name, item: url }] }];
  const body = `
<article>
<p class="kicker">${esc(p.country)} &middot; Cruise port pattern</p>
<h1>${esc(p.name)} cruise schedule pattern &amp; excursion reach</h1>
<p class="answer">${esc(p.name)} sees up to <strong>${p.peakShips || 'several'} ships</strong> on peak days in high season, with call intensity typically heaviest around <strong>${DAYS[busiestIdx] || 'midweek'}</strong>. Ship passengers fan out to the excursion destinations below &mdash; crowd impact extends well beyond the port itself. Patterns are seasonal estimates.</p>
<p class="cta-row"><a class="cta" href="/">Check any itinerary against this port &rarr;</a></p>
${tables}
${exc ? `<section><h2>Where the excursions go</h2><p>Destinations within typical shore-excursion range of ${esc(p.name)} &mdash; expect cruise-day spillover:</p><div class="nearwrap">${exc}</div></section>` : ''}
${safe ? `<section><h2>Nearby but off the excursion circuit</h2><p>Close to ${esc(p.name)} yet rarely visited by cruise groups:</p><div class="nearwrap">${safe}</div></section>` : ''}
</article>`;
  return page({
    title: `${p.name} Cruise Port Schedule Pattern & Crowd Reach | Miss the Boat`,
    desc: `When cruise ships call at ${p.name}, ${p.country} — day-of-week patterns by season, peak ship counts, and which nearby towns absorb the excursion crowds.`,
    canonical: url, jsonld,
    breadcrumb: `<a href="/">Home</a> &rsaquo; <a href="/ports/">Ports</a> &rsaquo; ${esc(p.name)}`,
    body,
  });
}

// ── 6. Index pages, methodology, robots, llms, sitemap ──
function listIndexPage(kind, entries) {
  const isDest = kind === 'destinations';
  const byCountry = {};
  entries.forEach(k => {
    const c = (isDest ? DESTS[k].country : PORTS[k].country) || 'Other';
    (byCountry[c] = byCountry[c] || []).push(k);
  });
  const secs = Object.keys(byCountry).sort().map(c =>
    `<section><h2>${esc(c)}</h2><div class="nearwrap">${byCountry[c].sort().map(k =>
      `<a class="near" href="/${kind}/${slug(k)}/">${esc(isDest ? DESTS[k].name : PORTS[k].name)}</a>`).join('')}</div></section>`).join('\n');
  const title = isDest ? 'Mediterranean Destination Crowd Calendars' : 'Mediterranean Cruise Port Patterns';
  return page({
    title: `${title} | Miss the Boat`,
    desc: isDest ? `Cruise crowd calendars for ${entries.length} Mediterranean destinations — busiest days, quietest days, and alternatives.` : `Seasonal call patterns for ${entries.length} Mediterranean cruise ports and their excursion reach.`,
    canonical: `${BASE}/${kind}/`,
    jsonld: [], breadcrumb: `<a href="/">Home</a> &rsaquo; ${isDest ? 'Destinations' : 'Ports'}`,
    body: `<article><h1>${title}</h1><p class="answer">${isDest ? 'Every destination below is scored by day of week against cruise port schedules. Pick a place, see its calendar, then check your exact dates in the planner.' : 'Day-of-week call patterns for every tracked port, plus the towns their excursions flood on ship days.'}</p>${secs}</article>`,
  });
}

const METHODOLOGY = page({
  title: 'Methodology — How the Crowd Estimates Work | Miss the Boat',
  desc: 'How MissTheBoat models cruise crowd pressure: data sources, the pressure score, what is measured vs. modeled, and known limitations.',
  canonical: `${BASE}/methodology/`,
  jsonld: [{ '@context': 'https://schema.org', '@type': 'Dataset', name: 'MissTheBoat Mediterranean Cruise Crowd Patterns', description: 'Modeled day-of-week cruise crowd pressure estimates for Mediterranean destinations, derived from published seasonal port-call patterns, census population data, and day-of-week traffic patterns.', url: `${BASE}/methodology/`, creator: { '@type': 'Organization', name: 'MissTheBoat' }, license: `${BASE}/methodology/` }],
  breadcrumb: `<a href="/">Home</a> &rsaquo; Methodology`,
  body: `
<article>
<h1>How MissTheBoat scores crowd pressure</h1>
<p class="answer"><strong>Every score on this site is a modeled estimate, not a live measurement, unless a page explicitly says otherwise.</strong> We label estimates as estimates because that&rsquo;s what makes the site useful to fact-check &mdash; and citable.</p>
<p>MissTheBoat combines two signals for each destination and day:</p>
<ul class="tips">
<li><strong>Cruise pressure</strong> &mdash; how many cruise passengers are likely passing through the nearest port(s) and heading to this destination on excursions, sized against the destination&rsquo;s population.</li>
<li><strong>Day-trip risk</strong> &mdash; for a small set of destinations with structurally severe overtourism independent of cruise traffic (San Gimignano, Positano, and roughly twenty others), a fixed adjustment reflecting known visitor-to-resident pressure.</li>
</ul>
<section><h2>The pressure score, in plain terms</h2>
<p>A cruise ship docking in a city of 400,000 people (Naples) doesn&rsquo;t crowd it the way the same ship docking in a town of 8,000 (San Gimignano) does. Raw ship counts or passenger counts alone miss this. So the model:</p>
<ul class="tips">
<li>Estimates ship calls at the nearest port(s) for the date, by season and day of week.</li>
<li>Multiplies by an average passengers-per-ship figure to get an estimated passenger count.</li>
<li>Divides by the destination&rsquo;s population to produce a pressure ratio.</li>
<li>Runs that ratio through an asymptotic curve, not a straight line &mdash; so a ratio of 40 doesn&rsquo;t score twice as crowded as a ratio of 20. Crowding <em>feels</em> worse at the low end of the scale than the math would suggest linearly, and flattens out at the high end once a place is already overwhelmed.</li>
<li>Blends that (70% weight) with a raw day-of-week crowd index for the destination itself (30% weight), since not all crowding is cruise-driven.</li>
<li>Adds a fixed point boost for the destinations independently flagged for severe day-tripper overtourism.</li>
<li>Caps the final score at 99. Nothing on this site claims certainty.</li>
</ul></section>
<section><h2>What&rsquo;s measured vs. modeled</h2>
<table class="wk">
<thead><tr><th scope="col">Signal</th><th scope="col">Status</th><th scope="col">Source</th></tr></thead>
<tbody>
<tr><th scope="row">Historical weather</th><td><strong>Measured</strong></td><td>Open-Meteo climate archive &mdash; ERA5 reanalysis, 1991&ndash;2020 monthly normals. Real API.</td></tr>
<tr><th scope="row">Cruise port call volume</th><td><strong>Modeled</strong></td><td>Curated seasonal patterns per port (peak ship counts, day-of-week distribution), built from published port schedules. Typical seasonal patterns, not this specific week&rsquo;s actual arrivals.</td></tr>
<tr><th scope="row">Excursion destination mapping</th><td><strong>Modeled, ~90% verified</strong></td><td>Curated from published cruise-line and tour-operator excursion listings per port. Being cross-checked against operator data as access becomes available.</td></tr>
<tr><th scope="row">Population figures</th><td><strong>Measured where sourced</strong></td><td>Public census and statistics-office figures for most destinations. Where a confirmed figure isn&rsquo;t yet sourced, the model uses a flagged placeholder &mdash; disclosed, not hidden.</td></tr>
<tr><th scope="row">Day-trip risk flags</th><td><strong>Modeled</strong></td><td>Based on published overtourism reporting and visitor-to-resident ratios for destinations with known structural crowding (Venice, Dubrovnik Old Town, Santorini&rsquo;s Oia, etc.) &mdash; precedent cases, not this site&rsquo;s own survey.</td></tr>
</tbody>
</table></section>
<section><h2>A note on &ldquo;today&rsquo;s&rdquo; ship counts</h2>
<p>Select ports show a same-day arrivals check pulled from a third-party cruise schedule aggregator. This is a best-effort, real-time supplement layered on top of the seasonal model &mdash; not a substitute for it. It depends on a third party&rsquo;s page structure and can fail silently if that structure changes; when it&rsquo;s unavailable, the site falls back to the seasonal estimate and says so.</p></section>
<section><h2>Why estimates, not live tracking, for most of the dataset</h2>
<p>Live AIS ship-tracking data exists and could replace the seasonal model outright. It isn&rsquo;t in production yet because of cost, not feasibility &mdash; it&rsquo;s a planned upgrade, not a current claim. Until then, every figure on this site is exactly as accurate as &ldquo;typical for this port, this season, this day of week&rdquo; &mdash; which is enough to plan around, and is stated as such everywhere it appears.</p></section>
<section><h2>Updates and corrections</h2>
<p>Seasonal patterns and destination data are reviewed and refreshed monthly. Population and excursion data are corrected as better sources are confirmed. Spot a stale figure or a wrong excursion mapping? Reach out via the site &mdash; corrections land in the next monthly refresh.</p></section>
</article>`,
});

// ── 7. Write everything ──
function write(rel, content) {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

const destKeys = Object.keys(DESTS);
const portKeys = Object.keys(PORTS);
destKeys.forEach(k => write(`destinations/${slug(k)}/index.html`, destPage(k)));
portKeys.forEach(k => write(`ports/${slug(k)}/index.html`, portPage(k)));
write('destinations/index.html', listIndexPage('destinations', destKeys));
write('ports/index.html', listIndexPage('ports', portKeys));
write('methodology/index.html', METHODOLOGY);

const urls = [
  { loc: `${BASE}/`, pri: '1.0' },
  { loc: `${BASE}/destinations/`, pri: '0.8' },
  { loc: `${BASE}/ports/`, pri: '0.8' },
  { loc: `${BASE}/methodology/`, pri: '0.5' },
  ...destKeys.map(k => ({ loc: `${BASE}/destinations/${slug(k)}/`, pri: '0.7' })),
  ...portKeys.map(k => ({ loc: `${BASE}/ports/${slug(k)}/`, pri: '0.6' })),
];
const today = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>`);

write('robots.txt', `# MissTheBoat — search & user-fetch crawlers welcome; pure training crawlers excluded.
# Review quarterly: crawler UAs change.

# Training-only crawlers
User-agent: GPTBot
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: Applebot-Extended
Disallow: /
User-agent: meta-externalagent
Disallow: /

# Search-index & user-triggered fetchers (drive citations and referrals)
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /

User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`);

write('llms.txt', `# MissTheBoat
> Avoid cruise-ship crowds in the Mediterranean. MissTheBoat scores ${destKeys.length} destinations across ${portKeys.length} cruise ports by day of week, using port call patterns, excursion routing, and population-adjusted crowd pressure, so travelers can pick low-crowd days for the same itinerary.

MissTheBoat is a free planning tool, not a booking site or a travel blog. Every score is a modeled estimate built from curated port and excursion data, published population figures, and historical weather normals — never a live guarantee. Modeled figures are labeled as estimates throughout the site.

## Core tool

- [Plan your trip](${BASE}/): Paste or build an itinerary and get a red/amber/green crowd rating for each stop, day by day, with lower-crowd alternatives.
- [Methodology](${BASE}/methodology/): How the crowd pressure score is calculated, what's measured vs. modeled, and where each data source comes from.

## Destination and port data

- [Destination pages](${BASE}/destinations/): Day-by-day crowd calendars, cruise excursion exposure, and lower-crowd alternatives for ${destKeys.length} Mediterranean destinations. See sitemap.xml for the full list.
- [Port pages](${BASE}/ports/): Cruise call patterns and excursion destination lists for ${portKeys.length} Mediterranean ports.

## Optional

- [Weekly Med Crowd Report](${BASE}/report/): A dated ranking of the most and least crowded Mediterranean destinations for the coming week, published every Monday once live.
- [Sitemap](${BASE}/sitemap.xml): Full current page index.

Data is refreshed monthly as seasonal patterns roll over. Raw datasets are not published — pages render the underlying data, not a downloadable copy. Citing this data: figures are modeled estimates; cite as "MissTheBoat seasonal estimate". For verifiable annual passenger counts, refer to port authority reports.
`);

console.log(`Generated: ${destKeys.length} destination pages, ${portKeys.length} port pages, 2 index pages, methodology, sitemap (${urls.length} URLs), robots.txt, llms.txt`);

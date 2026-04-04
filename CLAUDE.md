# MissTheBoat — Session State File
**Read this at the start of every session before touching any code.**

## Live Site
- **URL:** https://misstheboat.vercel.app
- **GitHub:** FodeG16/misstheboat (main branch)
- **Stack:** Single HTML file (vanilla JS), Vercel hosting, serverless functions in `/api/`

## Current File State
- **Main app:** `index.html` — ~5,450 lines
- **Key APIs:** `/api/schedule.js` (CruiseDig port schedules), `/api/parse.js` (Claude itinerary parser)
- **Vercel env vars:** `ANTHROPIC_API_KEY`, `BOOKING_AID=2839562`, `GYG_PID=VKYN0SM`, `GA=G-LCQ0RJ1LR6`

## Product Roadmap
**Current scope:** Mediterranean (Europe)
**Planned expansion:** Scandinavia, SE Asia, South America — full global cruise coverage
**Architecture must support:** Adding new regions/ports/destinations without structural refactoring.
DESTS, PORTS, REGIONS objects must stay modular. Each new region = new PORTS block + new DESTS block + new REGIONS entry. No hardcoded Mediterranean assumptions.

## Architecture Decisions (Do Not Revisit)
- Single HTML file — no build step, no React, no npm
- 80/20 crowd scoring: `crowd = cityByDay × 0.20 + cruiseVolume × 0.80`
- Red: crowdScore ≥ 75 OR (maxCruise ≥ 65 AND excursion dest)
- Amber: crowdScore ≥ 55 OR (maxCruise ≥ 45 AND excursion dest)
- Affiliates: Booking.com AID 2839562, GYG PID VKYN0SM (affiliate only, not API)
- `exploreRegions` is a Set (multi-select) — do not revert to single string

## *** NEXT SESSION PRIORITY — READ FIRST ***

### Viator Excursion Data — Screenshot Workflow
Greg has taken screenshots of all 44 Viator shore excursion pages and saved them to a local folder.
Next session: he will upload all screenshots here in one batch.

**Claude's job when screenshots arrive:**
1. Read every tour card title visible in each screenshot
2. Extract destination names mentioned (e.g. "Naples to Pompeii and Amalfi" → destinations: pompeii, amalfi)
3. Extract duration (full-day = 6+ hours, half-day = 3-5 hours)
4. Build a corrected `excursions: []` array for each port key
5. Apply all patches to index.html in one pass using the node patch script pattern
6. Syntax check, copy to outputs, present to user

**Port key mapping for screenshots:**
- Rome/Civitavecchia → key: 'civitavecchia'
- Naples → key: 'naples'
- Livorno → key: 'livorno'
- Venice → key: 'venice'
- Palermo → key: 'palermo'
- Messina → key: 'messina'
- Catania → key: 'catania'
- Bari → key: 'bari'
- Genoa → key: 'genoa'
- La Spezia → key: 'la spezia'
- Savona → key: 'savona'
- Trieste → key: 'trieste'
- Athens/Piraeus → key: 'piraeus'
- Santorini → key: 'santorini'
- Mykonos → key: 'mykonos'
- Rhodes → key: 'rhodes'
- Heraklion → key: 'heraklion'
- Corfu → key: 'corfu'
- Katakolon → key: 'katakolon'
- Thessaloniki → key: 'thessaloniki'
- Kos → key: 'kos'
- Patmos → key: 'patmos'
- Dubrovnik → key: 'dubrovnik'
- Split → key: 'split'
- Kotor → key: 'kotor'
- Zadar → key: 'zadar'
- Barcelona → key: 'barcelona'
- Palma → key: 'palma'
- Malaga → key: 'malaga'
- Cadiz → key: 'cadiz'
- Valencia → key: 'valencia'
- Cartagena → key: 'cartagena'
- Marseille → key: 'marseille'
- Villefranche/Nice → key: 'villefranche'
- Toulon → key: 'toulon'
- Istanbul → key: 'istanbul'
- Kusadasi → key: 'kusadasi'
- Bodrum → key: 'bodrum'
- Valletta → key: 'valletta'
- Lisbon → key: 'lisbon'
- Porto → key: 'porto'
- Haifa → key: 'haifa'
- Ashdod → key: 'ashdod'
- Alexandria → key: 'alexandria'
- Casablanca → key: 'casablanca'

### GYG Partner API
- Request submitted this session for Partner/Distribution API access
- Existing affiliate account: PID VKYN0SM
- When token arrives: build a one-time pull script to fetch tours by destination for all ports
- This will replace the screenshot-derived excursion data with live verified data

### CruiseDig — 24 Missing Ports
- Script ready: `scrape_cruisedig_puppeteer.js` in Downloads
- CruiseDig has NO bot protection — try headless Puppeteer first
- Run: `node scrape_cruisedig_puppeteer.js`
- Output: `cruisedig_volumes.json` → share with Claude → wire into PORTS cruiseVolume arrays
- Has not been attempted yet this session — try next session before manual fallback

## Data Status

### cruiseVolume — PORTS[key][season][dayOfWeek]
- 37 ports: real CruiseDig historical data ✓
- 24 ports: MANUALLY ESTIMATED — not real data, must be replaced
- Fix: `scrape_cruisedig_puppeteer.js` (not yet attempted)

### cityByDay — Mon–Sun crowd index (0–100)
- ALL destinations: MANUALLY ESTIMATED
- Google Popular Times not available via API — must be scraped from Maps UI
- Script written: `scrape_popular_times.py` — failed due to Google Maps page structure
- Decision: acceptable for now (only 20% of score). Revisit post-beta.
- Do NOT use training data estimates as permanent solution

### Excursion Data — excursions: [] on each PORTS entry
- ACCURACY REQUIREMENT: 99%+ — this is the core value of the product
- Current: manually written baseline (~85-90%) — not sufficient
- Fix in progress: screenshot workflow (see NEXT SESSION PRIORITY above)
- After GYG API token arrives: replace with live API data

## Key Functions (Do Not Break)
- `scoreStop(key, date)` — main scoring function
- `getDestOrFallback(key)` — returns DESTS entry or geocodes unknown city via Nominatim
- `enrichFallbackDest(key, callback)` — async geocoding + nearest port detection
- `haversine(lat1,lng1,lat2,lng2)` — distance in km
- `nearestPorts(lat,lng,maxKm)` — finds nearest ports within radius
- `openMinimize(withAlts)` — Minimize Crowds modal
- `renderResults(stops)` — main results renderer
- `renderItineraryMap(scored)` — color-coded pin map on results page
- `updateCardStatus(idx, status, label)` — updates card + syncs summary counts + debounced map re-render
- `selectAllRegions()` — Anywhere button
- `exploreRegions` — Set of active region keys (multi-select)
- `_flexDays` — flexibility setting for Minimize modal (1/2/3 days)

## Syntax Check Method
```javascript
const html = require('fs').readFileSync('index.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
require('fs').writeFileSync('/tmp/test.mjs', script);
// then: node --check /tmp/test.mjs
```
**Always use `lastIndexOf` not `indexOf`.**

## Completed Features
- ✅ Google Analytics G-LCQ0RJ1LR6
- ✅ Booking.com + GYG affiliate links
- ✅ OG/Twitter meta tags, emoji favicon ⛵
- ✅ Google Maps ↗ links on result cards
- ✅ Nearest-port geocoding for unknown cities
- ✅ Minimize Crowds modal with ±flex toggle + conflict-free date assignment
- ✅ Auto-fix duplicate dates in renderResults
- ✅ Anywhere button (full-width below map)
- ✅ Multi-select regions (Set-based, toggle on/off)
- ✅ Itinerary map (color-coded numbered pins, dashed route line)
- ✅ Summary count sync after live data loads
- ✅ Date required error on manual entry
- ✅ Excursion data baseline patched (28 ports)
- ✅ Summary count mismatch fixed (live data now syncs header)

## Pre-Beta Checklist
- ⬜ Excursion data 99%+ — screenshot workflow next session
- ⬜ CruiseDig scrape for 24 missing ports
- ⬜ OG image (og-image.png 1200×630) — screenshot results page → GitHub root
- ⬜ Mobile layout audit
- ⬜ User testing (5-10 cruise travelers)
- ⬜ Custom domain misstheboat.app (~$12)
- ⬜ GYG API integration when token arrives

## Backlog
1. **[DATA — NEXT]** Viator screenshot upload → wire excursion data
2. **[DATA — NEXT]** CruiseDig scrape → fill 24 estimated ports
3. **[DATA]** GYG Partner API integration when token arrives
4. **[UX]** OG image
5. **[UX]** Mobile layout audit
6. **[UX]** Toast after Apply in Minimize modal (minor)
7. **[PRODUCT]** Custom domain misstheboat.app (~$12)
8. **[PRODUCT]** User testing
9. **[EXPANSION]** Scandinavia region
10. **[EXPANSION]** SE Asia region
11. **[EXPANSION]** South America region
12. **[LATER]** Stripe + Pro tier ($9/mo)
13. **[LATER]** SEO landing pages
14. **[LATER]** Live cruise API (MarineTraffic ~$50/mo)

## Scripts in Downloads Folder
- `scrape_viator_puppeteer.js` — blocked by Viator IP ban, use VPN or screenshots
- `scrape_cruisedig_puppeteer.js` — CruiseDig port volumes, NOT YET ATTEMPTED
- `scrape_popular_times.py` — Google Popular Times, failed, deprioritized
- `debug_viator.js` — Viator diagnostic
- `viator_correct_urls.txt` — confirmed Viator URLs for all 44 ports

## Session Notes
- Greg uploads files to GitHub via website only — no local repo clone
- Greg is non-technical — avoid terminal commands beyond copy/paste, explain every step
- All outputs go to /mnt/user-data/outputs/ then present_files for download
- Start each session: read this file, then ask what Greg wants to work on

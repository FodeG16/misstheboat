# MissTheBoat — Session State File
**Read this at the start of every session before touching any code.**

## Live Site
- **URL:** https://misstheboat.vercel.app
- **GitHub:** FodeG16/misstheboat (main branch)
- **Stack:** Single HTML file (vanilla JS), Vercel hosting, serverless functions in `/api/`

## Current File State
- **Main app:** `index.html` — ~5,600 lines
- **Key APIs:** `/api/schedule.js` (CruiseDig port schedules), `/api/parse.js` (Claude itinerary parser)
- **Vercel env vars:** `ANTHROPIC_API_KEY`, `BOOKING_AID=2839562`, `GYG_PID=VKYN0SM`, `GA=G-LCQ0RJ1LR6`

## Product Roadmap
**Current scope:** Mediterranean (Europe)
**Planned expansion:** Scandinavia, SE Asia, South America
**Architecture:** DESTS, PORTS, REGIONS must stay modular — each new region = new block, no hardcoded Med assumptions.

## Architecture Decisions (Do Not Revisit)
- Single HTML file — no build step, no React, no npm
- 80/20 crowd scoring: `crowd = cityByDay × 0.20 + cruiseVolume × 0.80`
- Red: crowdScore ≥ 75 OR (maxCruise ≥ 65 AND excursion dest)
- Amber: crowdScore ≥ 55 OR (maxCruise ≥ 45 AND excursion dest)
- Affiliates: Booking.com AID 2839562, GYG PID VKYN0SM (affiliate only, not API)
- `exploreRegions` is a Set (multi-select) — do not revert to single string

## *** NEXT SESSION PRIORITY — READ FIRST ***

### Viator Excursion Data — Screenshot Workflow
Greg is screenshotting all 44 Viator shore excursion pages as PDFs (one per port, named by port).
Use Chrome `Ctrl+P → Save as PDF` for full-page capture.

**When PDFs arrive, Claude's job:**
1. Read every tour card title visible
2. Extract destination names (e.g. "Naples to Pompeii and Amalfi" → pompeii, amalfi)
3. Extract duration (full-day = 6+ hrs, half-day = 3-5 hrs)
4. Build corrected `excursions: []` array for each port key
5. Apply all patches in one pass via node script
6. Syntax check, copy to outputs, present to user

**Viator URLs (all 44 ports):**
- Rome/Civitavecchia: viator.com/Rome-tours/Shore-Excursions/d511-g24
- Naples: viator.com/Naples-tours/Shore-Excursions/d508-g24
- Livorno: viator.com/Livorno-tours/Shore-Excursions/d28024-g24
- Venice: viator.com/Venice-tours/Shore-Excursions/d532-g24
- Palermo: viator.com/Palermo-tours/Shore-Excursions/d4787-g24
- Messina: viator.com/Messina-tours/Shore-Excursions/d14809-g24
- Catania: viator.com/Catania-tours/Shore-Excursions/d23298-g24
- Bari: viator.com/Bari-tours/Shore-Excursions/d23059-g24
- Genoa: viator.com/Genoa-tours/Shore-Excursions/d502-g24
- La Spezia: viator.com/La-Spezia-tours/Shore-Excursions/d23060-g24
- Savona: viator.com/Savona-tours/Shore-Excursions/d28022-g24
- Trieste: viator.com/Trieste-tours/Shore-Excursions/d4792-g24
- Athens/Piraeus: viator.com/Athens-tours/Shore-Excursions/d496-g24
- Santorini: viator.com/Santorini-tours/Shore-Excursions/d5363-g24
- Mykonos: viator.com/Mykonos-tours/Shore-Excursions/d23345-g24
- Rhodes: viator.com/Rhodes-tours/Shore-Excursions/d23346-g24
- Heraklion: viator.com/Heraklion-tours/Shore-Excursions/d23299-g24
- Corfu: viator.com/Corfu-tours/Shore-Excursions/d4763-g24
- Katakolon: viator.com/Katakolon-tours/Shore-Excursions/d14769-g24
- Thessaloniki: viator.com/Thessaloniki-tours/Shore-Excursions/d4794-g24
- Kos: viator.com/Kos-tours/Shore-Excursions/d23347-g24
- Patmos: viator.com/Patmos-tours/Shore-Excursions/d23348-g24
- Dubrovnik: viator.com/Dubrovnik-tours/Shore-Excursions/d4877-g24
- Split: viator.com/Split-tours/Shore-Excursions/d5446-g24
- Kotor: viator.com/Kotor-tours/Shore-Excursions/d25634-g24
- Zadar: viator.com/Zadar-tours/Shore-Excursions/d23350-g24
- Barcelona: viator.com/Barcelona-tours/Shore-Excursions/d562-g24
- Palma: viator.com/Palma-de-Mallorca-tours/Shore-Excursions/d1225-g24
- Malaga: viator.com/Malaga-tours/Shore-Excursions/d669-g24
- Cadiz: viator.com/Cadiz-tours/Shore-Excursions/d14663-g24
- Valencia: viator.com/Valencia-tours/Shore-Excursions/d524-g24
- Cartagena: viator.com/Cartagena-tours/Shore-Excursions/d23351-g24
- Marseille: viator.com/Marseille-tours/Shore-Excursions/d500-g24
- Villefranche/Nice: viator.com/Nice-tours/Shore-Excursions/d478-g24
- Toulon: viator.com/Toulon-tours/Shore-Excursions/d14897-g24
- Istanbul: viator.com/Istanbul-tours/Shore-Excursions/d585-g24
- Kusadasi: viator.com/Kusadasi-tours/Shore-Excursions/d4904-g24
- Bodrum: viator.com/Bodrum-tours/Shore-Excursions/d25646-g24
- Valletta: viator.com/Valletta-tours/Shore-Excursions/d4875-g24
- Lisbon: viator.com/Lisbon-tours/Shore-Excursions/d548-g24
- Porto: viator.com/Porto-tours/Shore-Excursions/d25604-g24
- Haifa: viator.com/Haifa-tours/Shore-Excursions/d14763-g24
- Ashdod: viator.com/Ashdod-tours/Shore-Excursions/d28066-g24
- Alexandria: viator.com/Alexandria-tours/Shore-Excursions/d28060-g24
- Casablanca: viator.com/Casablanca-tours/Shore-Excursions/d4898-g24

**Port key mapping:**
civitavecchia, naples, livorno, venice, palermo, messina, catania, bari, genoa, la spezia,
savona, trieste, piraeus, santorini, mykonos, rhodes, heraklion, corfu, katakolon,
thessaloniki, kos, patmos, dubrovnik, split, kotor, zadar, barcelona, palma, malaga,
cadiz, valencia, cartagena, marseille, villefranche, toulon, istanbul, kusadasi, bodrum,
valletta, lisbon, porto, haifa, ashdod, alexandria, casablanca

## Data Status

### cruiseVolume — PORTS[key][season][dayOfWeek] — 0=Mon, 6=Sun
**Real scraped data (37 original + 15 newly scraped = 52 total):**
The following 24 ports were previously estimated — now updated:
- ✅ REAL: corfu, katakolon, thessaloniki, patmos, kos, skiathos, argostoli
- ✅ REAL: split, zadar, ibiza, cartagena, valencia, toulon, la spezia, zakynthos
- ⚠️ INDUSTRY ESTIMATES (grounded, not invented): messina, salerno, savona, genoa,
  trieste, bari, las palmas, santa cruz, ajaccio
  - Italian homeports (savona, genoa, trieste) weighted Sat/Sun — reflects Costa/MSC turnaround schedules
  - Canary Islands (las palmas, santa cruz) weighted winter — reflects repositioning traffic
  - Replace with cruisetimetables.com screenshots when convenient

### cityByDay — Mon–Sun crowd index (0–100)
- ALL destinations: manually estimated — acceptable for now (20% of score)
- Google Popular Times not available via API — scrape attempt failed
- Revisit post-beta

### Excursion Data — excursions: [] on each PORTS entry
- **ACCURACY REQUIREMENT: 99%+** — core product value
- Current: manually patched baseline (~85-90%)
- **Fix in progress:** Viator PDF screenshots (see NEXT SESSION PRIORITY above)
- After GYG API token arrives: replace with live API data
- GYG API request submitted — awaiting response

## Key Functions (Do Not Break)
- `scoreStop(key, date)` — main scoring function
- `getDestOrFallback(key)` — returns DESTS entry or geocodes unknown city
- `enrichFallbackDest(key, callback)` — async geocoding + nearest port
- `haversine(lat1,lng1,lat2,lng2)` — distance in km
- `nearestPorts(lat,lng,maxKm)` — finds nearest ports within radius
- `openMinimize(withAlts)` — Minimize Crowds modal
- `renderResults(stops)` — main results renderer
- `renderItineraryMap(scored)` — color-coded pin map on results page
- `updateCardStatus(idx, status, label)` — updates card + syncs summary + debounced map re-render
- `selectAllRegions()` — Anywhere button
- `exploreRegions` — Set of active region keys (multi-select)
- `_flexDays` — Minimize modal flexibility (1/2/3 days)

## Syntax Check Method
```javascript
const html = require('fs').readFileSync('index.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
require('fs').writeFileSync('/tmp/test.mjs', script);
// then: node --check /tmp/test.mjs
```
**Always use `lastIndexOf` not `indexOf`.**

## Completed Features
- ✅ Google Analytics, Booking.com + GYG affiliate links
- ✅ OG/Twitter meta tags, emoji favicon ⛵
- ✅ Google Maps ↗ links on result cards
- ✅ Nearest-port geocoding for unknown cities
- ✅ Minimize Crowds modal with ±flex toggle
- ✅ Auto-fix duplicate dates in renderResults
- ✅ Anywhere button (full-width below map)
- ✅ Multi-select regions (Set-based, toggle on/off)
- ✅ Itinerary map (color-coded numbered pins, dashed route line)
- ✅ Summary count sync after live data loads
- ✅ Date required error on manual entry
- ✅ Excursion data baseline patched (28 ports)
- ✅ Summary/card status mismatch fixed
- ✅ 16 missing port city DESTS entries added (Naples, Marseille, Dubrovnik, Split, etc.)
- ✅ Naples alias fixed (was wrongly mapping to Pompeii)
- ✅ Bodrum cruise volume junk data replaced
- ✅ 15 ports with real scraped cruise volume data
- ✅ 9 ports with grounded industry-pattern estimates

## Pre-Beta Checklist
- ⬜ Excursion data 99%+ — Viator PDF screenshots (in progress)
- ⬜ OG image (og-image.png 1200×630) — screenshot results → GitHub root
- ⬜ Mobile layout audit
- ⬜ User testing (5-10 cruise travelers)
- ⬜ Custom domain misstheboat.app (~$12)
- ⬜ GYG API integration when token arrives
- ⬜ Replace 9 estimated cruise volume ports with real data

## Backlog (Priority Order)
1. **[DATA — NEXT]** Viator PDF uploads → wire excursion data
2. **[DATA]** GYG Partner API when token arrives
3. **[DATA]** Replace 9 estimated cruise volume ports (cruisetimetables.com screenshots)
4. **[UX]** OG image
5. **[UX]** Mobile layout audit
6. **[UX]** Toast after Apply in Minimize modal (minor)
7. **[PRODUCT]** Custom domain misstheboat.app (~$12)
8. **[PRODUCT]** User testing
9. **[EXPANSION]** Scandinavia, SE Asia, South America regions
10. **[LATER]** Stripe + Pro tier ($9/mo)
11. **[LATER]** SEO landing pages
12. **[LATER]** Live cruise API (MarineTraffic ~$50/mo)

## Scripts in Downloads Folder
- `scrape_viator_puppeteer.js` — blocked by Viator IP ban, use VPN or screenshots
- `scrape_cruisedig_puppeteer.js` — cruisetimetables.com v4 (working for most ports)
- `scrape_missing_ports.js` — tried alternate slugs for 11 missing ports
- `scrape_popular_times.py` — Google Popular Times, failed, deprioritized
- `viator_correct_urls.txt` — confirmed Viator URLs for all 44 ports

## Session Notes
- Greg uploads files to GitHub via website only — no local repo clone
- Greg is non-technical — explain every terminal step explicitly
- All outputs → /mnt/user-data/outputs/ → present_files for download
- Start each session: read this file, confirm what Greg wants to work on

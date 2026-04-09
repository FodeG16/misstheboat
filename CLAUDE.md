# MissTheBoat — Session State File
**Read this at the start of every session before touching any code.**

## Live Site
- **URL:** https://misstheboat.vercel.app
- **GitHub:** FodeG16/misstheboat (main branch)
- **Stack:** Single HTML file (vanilla JS), Vercel hosting, serverless functions in `/api/`

## Current File State
- **Main app:** `index.html` — ~5,800 lines
- **Key APIs:** `/api/schedule.js` (CruiseDig port schedules), `/api/parse.js` (Claude itinerary parser)
- **Vercel env vars:** `ANTHROPIC_API_KEY`, `BOOKING_AID=2839562`, `GYG_PID=VKYN0SM`, `GA=G-LCQ0RJ1LR6`

## Affiliate IDs (hardcoded in JS, not env vars)
- **Booking.com:** AID `2839562` — **DENIED** by Booking.com, links still live but may not pay out
- **GetYourGuide:** PID `VKYN0SM` ✅ active
- **Viator:** PID `P00296371` ✅ active — added session 6
- Pending: Rentalcars.com, WithLocals, Kiwitaxi (apply when ready)

## Affiliate Button Placement — Current State
| Location | Hotels | GYG | Viator |
|---|---|---|---|
| Main card (expanded) | ✅ | ✅ | ✅ |
| Alt destination suggestion | ✅ | ✅ | ✅ |
| Minimize modal alt | ✅ | ✅ | ✅ |
| Explore tab top results | ✅ | ✅ | ✅ |

## Product Roadmap
**Current scope:** Mediterranean (Europe)
**Planned expansion:** Scandinavia, SE Asia (Klook affiliate), South America
**Architecture:** DESTS, PORTS, REGIONS must stay modular — no hardcoded Med assumptions.

## Architecture Decisions (Do Not Revisit)
- Single HTML file — no build step, no React, no npm
- Scoring uses `peakShips` per port + `POP_K` population table for cruise pressure ratio
- `pressureRatio = (estimatedShips × 3000) / popK` — passengers per 1,000 residents
- Red: pressureRatio ≥ 30 OR estimatedShips ≥ 3 OR crowdScore ≥ 75
- Amber: pressureRatio ≥ 10 OR estimatedShips ≥ 1.5 OR crowdScore ≥ 50
- Green: only if truly minimal ships + low pressure
- Affiliates: Booking.com AID 2839562, GYG PID VKYN0SM, Viator PID P00296371
- `exploreRegions` is a Set (multi-select) — do not revert to single string
- `peakShips` field on every PORTS entry — max ships on a single peak day
- `POP_K` lookup table inside `scoreStop()` — population in thousands

## UI Theme — Direction B (current)
- Background: warm parchment `#f4f0e8`
- Font: Source Serif 4 (body) + Playfair Display (headings, city names, logo)
- Badges: solid filled rectangles — red `#C0392B`, amber `#D4830A`, green `#2A7050` with white text
- Corners: square `4px` (editorial feel, not pill/rounded)
- Cards: white `#fff` on parchment background, `#e8e3d8` borders
- Nav tabs: small-caps uppercase, green underline on active
- Loaded via Google Fonts `@import` at top of `<style>` block

## Data Status

### cruiseVolume — PORTS[key][season][dayOfWeek] — 0=Mon, 6=Sun
- ✅ All 66 ports have real or screenshot-derived data — zero invented values
- Real scraped (cruisetimetables.com): ajaccio, bari, genoa, la spezia, las palmas, messina,
  salerno, savona, trieste, civitavecchia, barcelona, santorini, antalya + 15 earlier ports
- Original CruiseDig data: remaining ~37 ports
- Ports with sparse but real data (≤25 dates): antalya, kos, skiathos, larnaca, izmir, marmaris
- Ports needing live API for better accuracy: venice, dubrovnik, istanbul, mykonos, lisbon, valletta
  (cruisetimetables.com 404s — add when live cruise API is affordable)

### cityByDay — Mon–Sun crowd index (0–100)
- ALL destinations: manually estimated (20% of score weight)
- Google Popular Times scrape failed — revisit post-beta

### Excursion Data — excursions: [] on each PORTS entry
- ✅ 66 ports, 0 empty — sourced from 46 Viator PDF screenshots (processed session 4)
- Current accuracy: ~90% — GYG Partner API will replace when token arrives
- GYG Partner API request submitted — awaiting response

### Population Data — POP_K lookup inside scoreStop()
- ~150 destinations with real population figures (thousands)
- Used for cruise pressure ratio calculation
- Default fallback: 100k for unknown destinations

## Key Functions (Do Not Break)
- `scoreStop(key, date)` — main scoring, returns estimatedShips, pressureRatio, popK
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
- `bookingLink(city, country)` — Booking.com affiliate URL
- `gygLink(city)` — GetYourGuide affiliate URL
- `viatorLink(city)` — Viator affiliate URL (PID P00296371)

## Syntax Check Method
```javascript
const html = require('fs').readFileSync('index.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
require('fs').writeFileSync('/tmp/test.mjs', script);
// then: node --check /tmp/test.mjs
```
**Always use `lastIndexOf` not `indexOf`.**

## Completed Features
- ✅ Google Analytics (G-LCQ0RJ1LR6)
- ✅ Booking.com + GYG + Viator affiliate links on every card (expanded), alt suggestions, modal, explore tab
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
- ✅ All 66 ports with real cruise volume data
- ✅ All 66 ports with excursion data (Viator PDFs)
- ✅ peakShips per port for absolute ship count scoring
- ✅ Population-aware crowd pressure scoring (POP_K table)
- ✅ Direction B UI theme (warm parchment, Playfair Display, solid badges)
- ✅ Solid color badges (AVOID/CAUTION/CLEAR) — prominent, high contrast

## Pre-Beta Checklist
- ⬜ OG image (og-image.png 1200×630) — screenshot results page → GitHub root
- ⬜ Mobile layout audit
- ⬜ User testing (5-10 cruise travelers)
- ⬜ Custom domain misstheboat.app (~$12)
- ⬜ GYG API integration when token arrives → replace excursion data

## Backlog (Priority Order)
1. **[UX]** OG image for social sharing (screenshot results, crop 1200×630, upload to GitHub root)
2. **[UX]** Mobile layout audit — load on phone, screenshot anything broken
3. **[MONETIZATION]** Apply for Rentalcars.com affiliate → add 🚗 Cars button to cards
4. **[MONETIZATION]** Apply for Kiwitaxi/GetTransfer affiliate → add ✈ Transfers button
5. **[MONETIZATION]** Apply for WithLocals/ToursByLocals → private tour affiliate (8-15% commission)
6. **[DATA]** GYG Partner API when token arrives → 99%+ excursion accuracy
7. **[UX]** Toast after Apply in Minimize modal (minor)
8. **[PRODUCT]** Custom domain misstheboat.app (~$12)
9. **[PRODUCT]** User testing (5-10 cruise travelers)
10. **[EXPANSION]** Scandinavia region — ports + dests + regions block
11. **[EXPANSION]** SE Asia region + Klook affiliate
12. **[EXPANSION]** South America region
13. **[LATER]** Stripe + Pro tier ($9/mo)
14. **[LATER]** SEO landing pages per destination
15. **[LATER]** Live cruise API (MarineTraffic ~$50/mo) — fixes Venice, Dubrovnik, Istanbul, etc.

## Session Notes
- Greg uploads files to GitHub via website only — no local repo clone
- Greg is non-technical — explain every terminal step explicitly
- All outputs → /mnt/user-data/outputs/ → present_files for download
- Start each session: read this file, confirm what Greg wants to work on
- CLAUDE.md lives in GitHub root — upload updated version each session

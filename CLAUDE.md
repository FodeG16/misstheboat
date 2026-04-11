# MissTheBoat — Session State File
**Read this at the start of every session before touching any code.**

## Live Site
- **URL:** https://misstheboat.vercel.app
- **GitHub:** FodeG16/misstheboat (main branch)
- **Stack:** Single HTML file (vanilla JS), Vercel hosting, serverless functions in `/api/`

## Current File State
- **Main app:** `index.html` — ~5,820 lines
- **Key APIs:** `/api/schedule.js` (CruiseDig port schedules), `/api/parse.js` (Claude itinerary parser)
- **Vercel env vars:** `ANTHROPIC_API_KEY`, `BOOKING_AID=2839562`, `GYG_PID=VKYN0SM`, `GA=G-LCQ0RJ1LR6`

## Affiliate IDs (hardcoded in JS, not env vars)
- **Booking.com:** AID `2839562` — DENIED, links live but may not pay out
- **GetYourGuide:** PID `VKYN0SM` ✅ active
- **Viator:** PID `P00296371` ✅ active
- Pending: Rentalcars.com, WithLocals, Kiwitaxi

## Affiliate Button Placement
| Location | Hotels | GYG | Viator |
|---|---|---|---|
| Main card (expanded) | ✅ | ✅ | ✅ |
| Alt destination suggestion | ✅ | ✅ | ✅ |
| Minimize modal alt | ✅ | ✅ | ✅ |
| Explore tab top results | ✅ | ✅ | ✅ |

## Architecture Decisions (Do Not Revisit)
- Single HTML file — no build step, no React, no npm
- Scoring: `peakShips` per port + `POP_K` population table → pressureRatio
- `pressureRatio = (estimatedShips × 3000) / popK` — passengers per 1,000 residents
- Red: pressureRatio ≥ 30 OR estimatedShips ≥ 3 OR crowdScore ≥ 75
- Amber: pressureRatio ≥ 10 OR estimatedShips ≥ 1.5 OR crowdScore ≥ 50
- Green: minimal ships + low pressure
- `exploreRegions` is a Set (multi-select) — do not revert to string
- Fallback geocoding: unknown cities geocoded via Nominatim, 80km port radius

## UI Theme — Direction B
- Background: warm parchment `#f4f0e8`
- Font: Source Serif 4 (body) + Playfair Display (headings, city names, logo)
- Badges: solid filled — red `#C0392B`, amber `#D4830A`, green `#2A7050`, white text
- Corners: square `4px`, cards white `#fff` on parchment, `#e8e3d8` borders
- Nav tabs: Plan / Results / Explore (shortened for mobile)

## Data Status
- ✅ All 66 ports: real cruise volume data (cruisetimetables.com + screenshots)
- ✅ All 66 ports: peakShips field
- ✅ All 66 ports: excursion data (Viator PDFs, ~90% accuracy)
- ✅ POP_K table: ~150 destinations with real population data
- ⚠ cityByDay: manually estimated (20% weight) — revisit post-beta
- ⚠ Ports needing live API: venice, dubrovnik, istanbul, mykonos, lisbon, valletta

## Key Functions (Do Not Break)
- `scoreStop(key, date)` → status, estimatedShips, pressureRatio, popK
- `getDestOrFallback(key)` — DESTS entry or geocoded placeholder
- `enrichFallbackDest(key, callback)` — async geocoding + 80km port scan
- `renderResults(stops)` — main results renderer, shows share row
- `renderItineraryMap(scored)` — map with crowd-status colored pins
- `openMinimize(withAlts)` — crowd optimization modal
- `updateCardStatus(idx, status, label)` — syncs card + summary + map
- `parsePastedItinerary(text)` — with fallback for unknown cities
- `matchDestination(text)` — DESTS lookup + alias map
- `bookingLink / gygLink / viatorLink` — affiliate URL builders

## Syntax Check
```javascript
const html = require('fs').readFileSync('index.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
require('fs').writeFileSync('/tmp/test.mjs', script);
// node --check /tmp/test.mjs
```
Always use `lastIndexOf` not `indexOf`.

## Completed Features
- ✅ Direction B UI (Playfair Display, parchment, solid badges)
- ✅ peakShips + POP_K population-aware scoring
- ✅ Hotels + GYG + Viator on all cards, modal, explore tab
- ✅ Unknown city fallback (geocoding + 80km port radius)
- ✅ Inline parse error message (no more silent failures)
- ✅ Share row hidden until results load
- ✅ Modal score renamed "crowd index" + explanatory note
- ✅ Nav labels shortened: Plan / Results / Explore
- ✅ Empty manual submit guard
- ✅ Weather: 2yr proxy, hides on failure (no more spinner)
- ✅ Map pins colored by AVOID/CAUTION/CLEAR status
- ✅ All 66 ports cruise volume data
- ✅ Minimize Crowds modal with ±flex, conflict-free date suggestions
- ✅ Itinerary map with numbered pins + dashed route line
- ✅ Google Analytics, OG/Twitter meta tags, emoji favicon

## Known Issues / Watchlist
- **Bug 4 (phantom card):** Kotor manual entry may generate an extra Dubrovnik Old Town card. Needs Cowork re-test to confirm whether it's fixed by current dedup logic or still occurs.
- **Bug 1 (root cause):** Modal "crowd index" scores are raw seasonal values; card badges use population-adjusted logic. The explanatory note addresses confusion but they are intentionally different metrics. Evaluate whether to fully unify after user testing.
- **Map pin colors:** Pins use `s.status` (red/amber/green) — should be correct with current scoring. If audit still shows wrong colors, the issue is score data not rendering before map draws. Consider adding a brief debounce.
- **Weather API:** open-meteo archive, 2yr proxy. If still unreliable, replace with Open Meteo climate normals endpoint (no date dependency).
- **Booking.com:** denied affiliate — links live but may not pay. Consider Hotels.com or Expedia affiliate.

## Pre-Beta Checklist
- ⬜ OG image (og-image.png 1200×630) → GitHub root
- ⬜ Mobile layout re-audit after nav label fix
- ⬜ User testing (5-10 cruise travelers)
- ⬜ Custom domain misstheboat.app (~$12)
- ⬜ GYG API token when it arrives → replace excursion data
- ⬜ Confirm Bug 4 (phantom Kotor card) resolved via Cowork re-test

## Backlog (Priority Order)
1. **[UX]** OG image for social sharing
2. **[UX]** Mobile re-audit (375px) after nav fix
3. **[BUG]** Confirm Bug 4 phantom card fixed via Cowork
4. **[MONETIZATION]** Rentalcars.com affiliate → Cars button
5. **[MONETIZATION]** Kiwitaxi/GetTransfer → Transfers button
6. **[MONETIZATION]** WithLocals/ToursByLocals → private tours
7. **[DATA]** GYG API when token arrives
8. **[PRODUCT]** Custom domain misstheboat.app (~$12)
9. **[PRODUCT]** User testing
10. **[EXPANSION]** Scandinavia, SE Asia + Klook, South America
11. **[LATER]** Stripe + Pro tier ($9/mo)
12. **[LATER]** SEO landing pages
13. **[LATER]** Live cruise API (MarineTraffic ~$50/mo)

## Session Notes
- Greg uploads to GitHub via website only — no local clone
- Non-technical — explain every terminal step explicitly
- All outputs → /mnt/user-data/outputs/ → present_files
- Start each session: read this file, confirm what to work on
- CLAUDE.md lives in GitHub root — upload updated version each session

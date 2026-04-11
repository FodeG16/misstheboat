# MissTheBoat — Session State File
**Read this at the start of every session before touching any code.**

## Live Site
- **URL:** https://misstheboat.vercel.app
- **GitHub:** FodeG16/misstheboat (main branch)
- **Stack:** Single HTML file (vanilla JS), Vercel hosting, serverless functions in `/api/`

## Current File State
- **Main app:** `index.html` — ~6,236 lines, ~363KB
- **Key APIs:** `/api/schedule.js`, `/api/parse.js`
- **Vercel env vars:** `ANTHROPIC_API_KEY`, `BOOKING_AID=2839562`, `GYG_PID=VKYN0SM`, `GA=G-LCQ0RJ1LR6`

## Affiliate IDs (hardcoded in JS)
- **Booking.com:** AID `2839562` — DENIED, links live but may not pay out
- **GetYourGuide:** PID `VKYN0SM` ✅
- **Viator:** PID `P00296371` ✅
- Pending: Rentalcars.com, WithLocals, Kiwitaxi

## Affiliate Button Placement
| Location | Hotels | GYG | Viator |
|---|---|---|---|
| Main card (expanded) | ✅ | ✅ | ✅ |
| Day-trip alt suggestion | ✅ | ✅ | ✅ |
| Cruise alt suggestion | ✅ | ✅ | ✅ |
| Minimize modal alt | ✅ | ✅ | ✅ |
| Explore tab top results | ✅ | ✅ | ✅ |

## Architecture Decisions (Do Not Revisit)
- Single HTML file — no build step, no React, no npm
- Scoring: `peakShips` per port + `POP_K` population → pressureRatio → pressureScore
- Day-trip risk: `dayTripRisk` (0-3) + `dayTripBoost` ([0,10,25,40] pts) → combinedScore
- `pressureRatio = (estimatedShips × 3000) / popK`
- `pressureScore` = log-curve on pressureRatio (100 × (1 - e^(-ratio/40))), blended 70/30 with raw crowdScore
- `combinedScore = min(99, pressureScore + dayTripBoost)`
- Badge status can be upgraded by dayTripRisk independently of cruise data
- `exploreRegions` is a Set (multi-select) — do not revert to string
- Fallback geocoding: Nominatim + 80km port radius for unknown cities

## UI Theme — Direction B (current)
- Background: warm parchment `#f4f0e8`
- Font: Source Serif 4 (body) + Playfair Display (headings, city names, logo)
- Badges: solid filled — red `#C0392B`, amber `#D4830A`, green `#2A7050`, white text
- Day-trip indicator: orange `#C05000`, box background `#fef0e0`
- Corners: square `4px`
- **NEXT SESSION: Full UI redesign before launch** — Greg to provide design references

## Data Status

### cruiseVolume
- ✅ All 66 ports: real or screenshot-derived data
- ✅ All 66 ports: `peakShips` field
- Sparse data (≤25 dates): antalya, kos, skiathos, larnaca, izmir, marmaris
- Needs live API: venice, dubrovnik, istanbul, mykonos, lisbon, valletta

### Excursion Data
- ✅ 66 ports, 0 empty — from Viator PDF screenshots
- ~90% accuracy — GYG API pending

### Day-trip Risk Data (NEW)
- ✅ `dayTripRisk` (0-3), `dayTripNote`, `dayTripAlt` on 21 DESTS entries
- Risk 3 (extreme): varenna, bellagio, san gimignano, positano, cinque terre, santorini,
  mykonos town, dubrovnik old town, bled, sintra, hallstatt, mont saint-michel, montserrat
- Risk 2 (heavy): amalfi, meteora, eze, cappadocia, pisa, como

### Population Data
- ~150 destinations with real `POP_K` values (thousands)
- Default fallback: 100k for unknowns

### City Coverage
- ~220 DESTS entries + 16 European cities added (Modena, Bologna, Parma, Milan, etc.)
- Fuzzy matching: prefix match + edit-distance-1 for single typos
- Fallback: Nominatim geocoding for any city not in DESTS

## Key Functions (Do Not Break)
- `scoreStop(key, date)` → status, pressureScore, combinedScore, dayTripRisk, estimatedShips, pressureRatio, popK
- `calcPressureScore(ratio, ships, popK, crowdScore)` — log-curve population-adjusted score
- `editDist1(a, b)` — single edit distance check for fuzzy matching
- `matchDestination(text)` — exact → alias → prefix fuzzy → edit-dist-1 fuzzy → fallback
- `getDestOrFallback(key)` — DESTS or geocoded placeholder
- `enrichFallbackDest(key, callback)` — async geocoding + 80km port scan
- `renderResults(stops)` — main renderer, shows share row
- `renderItineraryMap(scored)` — crowd-status colored pins
- `openMinimize(withAlts)` — optimization modal
- `bookingLink / gygLink / viatorLink` — affiliate URLs
- `fetchWeather(lat, lng, date)` — climate normals API (ERA5 1991-2020, monthly averages)
- `wxCache` — declared at top of fetchWeather, must stay declared

## Syntax Check
```javascript
const html = require('fs').readFileSync('index.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
require('fs').writeFileSync('/tmp/test.mjs', script);
// node --check /tmp/test.mjs
```
Always `lastIndexOf` not `indexOf`.

## CRITICAL: DESTS Insertion Bug
When adding new DESTS entries, **always insert before the `};` that closes the DESTS object** (around line 3150 in current file). Do NOT insert after the REGIONS comment block. The pattern to find the DESTS close:
```javascript
const destsClose = lines.findIndex((l,i) => i >= 3140 && l === '};');
```
Previous sessions accidentally inserted entries after `const REGIONS =` which broke syntax.

## Completed Features
- ✅ Direction B UI (Playfair Display, parchment, solid badges)
- ✅ peakShips + POP_K population-aware cruise pressure scoring
- ✅ Log-curve pressureScore — San Gimignano (pop 8k) vs Florence (pop 370k) now score differently
- ✅ dayTripRisk system — 21 destinations flagged with ⚡/⚠ day-trip warnings + alt suggestions
- ✅ Cruise Pressure label (renamed from Crowd Score)
- ✅ "Today" pill shows scored day's pressure (renamed from Avg)
- ✅ Hotels + GYG + Viator on all cards, day-trip alts, cruise alts, modal, explore tab
- ✅ Fuzzy city matching (prefix + edit-distance-1)
- ✅ Manual entry fallback — unknown cities geocoded instead of silently dropped
- ✅ Weather: climate normals API, wxCache declared, "Typical for this month" label
- ✅ Inline parse error message (no more silent failures)
- ✅ Share row hidden until results load
- ✅ Modal score renamed "crowd index" + explanatory note
- ✅ Nav: Plan / Results / Explore (mobile-friendly)
- ✅ Empty submit guard (paste + manual modes)
- ✅ 16 European cities added to DESTS (Modena, Bologna, Milan, etc.)
- ✅ Map pins colored by AVOID/CAUTION/CLEAR status

## Known Issues / Watchlist
- **Bug 4 (phantom card):** Kotor manual entry may generate extra Dubrovnik Old Town card. Needs Cowork re-test.
- **Bug 1 (root cause):** Modal "crowd index" and card badges use different metrics by design — explanatory note added.
- **Booking.com:** Denied affiliate — links live but may not pay. Consider Hotels.com/Expedia.
- **Cruise volume for major ports:** venice, dubrovnik, istanbul, mykonos, lisbon, valletta still need better data when live API affordable.

## *** NEXT SESSION PRIORITY: UI REDESIGN ***
Greg wants a premium visual redesign before launch. He will provide design references.
- Keep all functionality — change only visual presentation
- Mobile-first
- Maximize shareability / screenshot appeal
- Current palette: parchment `#f4f0e8`, forest green `#2A7050`, solid badges
- Consider: hero image/map, better card hierarchy, premium typography treatment
- Reference sites noted: wanderlog.com, polarsteps.com, rome2rio.com

## Pre-Beta Checklist
- ⬜ UI redesign (next session)
- ⬜ OG image (og-image.png 1200×630) → GitHub root
- ⬜ Mobile layout audit after redesign
- ⬜ User testing (5-10 cruise travelers)
- ⬜ Custom domain misstheboat.app (~$12)
- ⬜ GYG API token → replace excursion data

## Backlog (Post-Redesign Priority)
1. **[UX]** UI redesign — premium visual treatment
2. **[UX]** OG image for social sharing
3. **[UX]** Mobile audit post-redesign
4. **[MONETIZATION]** Rentalcars.com affiliate → Cars button
5. **[MONETIZATION]** Kiwitaxi/GetTransfer → Transfers button
6. **[MONETIZATION]** WithLocals/ToursByLocals → private tours (8-15% commission)
7. **[DATA]** GYG API when token arrives
8. **[DATA]** dayTripRisk — expand to more destinations, consider Google Popular Times retry
9. **[PRODUCT]** Custom domain misstheboat.app (~$12)
10. **[PRODUCT]** User testing
11. **[EXPANSION]** Scandinavia, SE Asia + Klook, South America
12. **[LATER]** Stripe + Pro tier ($9/mo)
13. **[LATER]** SEO landing pages
14. **[LATER]** Live cruise API (MarineTraffic ~$50/mo)

## Session Notes
- Greg uploads to GitHub via website only — no local clone
- Non-technical — explain every terminal step explicitly
- All outputs → /mnt/user-data/outputs/ → present_files
- Start each session: read this file, ask what Greg wants to work on
- CLAUDE.md lives in GitHub root — upload updated version each session

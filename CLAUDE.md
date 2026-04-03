# MissTheBoat — Session State File
**Read this at the start of every session before touching any code.**

## Live Site
- **URL:** https://misstheboat.vercel.app
- **GitHub:** FodeG16/misstheboat (main branch)
- **Stack:** Single HTML file (vanilla JS), Vercel hosting, serverless functions in `/api/`

## Current File State
- **Main app:** `index.html` — ~5,267 lines
- **Key APIs:** `/api/schedule.js` (CruiseDig port schedules), `/api/parse.js` (Claude itinerary parser)
- **Vercel env vars:** `ANTHROPIC_API_KEY`, `BOOKING_AID=2839562`, `GYG_PID=VKYN0SM`, `GA=G-LCQ0RJ1LR6`

## Architecture Decisions (Do Not Revisit)
- Single HTML file — no build step, no React, no npm
- 80/20 crowd scoring: `crowd = cityByDay × 0.20 + cruiseVolume × 0.80`
- Red: crowdScore ≥ 75 OR (maxCruise ≥ 65 AND excursion dest)
- Amber: crowdScore ≥ 55 OR (maxCruise ≥ 45 AND excursion dest)
- Affiliates: Booking.com AID 2839562, GYG PID VKYN0SM (affiliate only, not API)
- Deliverable format: PowerPoint or Word memo per client (static per client, check CLAUDE.md per project)

## Data Status
### cityByDay (Mon–Sun crowd index, 0–100)
- **Status: MANUALLY ESTIMATED from training data** — not real measurements
- Shape of curves is correct (weekends higher), absolute numbers are invented
- Will be replaced with Google Places API pull before launch (~$3, script ready: `fetch_city_traffic.js`)

### cruiseVolume (PORTS[key][season][dayOfWeek])
- 37 ports: **real CruiseDig historical data** (2023–2025, actual ship call frequency)
- 24 ports: **manually estimated** — JS-rendered pages defeated scraper
- Will be replaced with Puppeteer scrape or live AIS API before launch

### Excursion Data (excursions: [] on each PORTS entry)
- **Status: TRAINING DATA ESTIMATES** — written from knowledge, not scraped
- This is a **critical accuracy gap** — excursion destination mapping is the core value prop of the site
  (identifying which sub-cities get overwhelmed by cruise passengers vs. which have none)
- RC pages gated behind login — not scrapeable without authentication
- Viator pages return 403 to Node.js scrapers (bot detection)
- **Best solution:** GYG Partner API (request token at partner.getyourguide.com with PID VKYN0SM)
- **Fallback:** Puppeteer (real Chrome) can scrape Viator — `npm install puppeteer`, then rewrite scraper
- Script ready but needs Puppeteer: `scrape_viator_excursions.js`
- **Must fix before launch** — inaccurate excursion mapping = wrong crowd scores at destination level

## Destinations & Ports
- **Total destinations:** 184
- **Total cruise ports:** 81
- **Tips coverage:** 131/184 (71%)
- Regions: Mediterranean (Italy, Greece, Croatia, Spain, France, Turkey, Portugal, Morocco, Egypt, Israel, Malta)

## Key Functions (Do Not Break)
- `scoreStop(key, date)` — main scoring function
- `getDestOrFallback(key)` — returns DESTS entry or geocodes unknown city via Nominatim
- `enrichFallbackDest(key, callback)` — async geocoding + nearest port detection
- `haversine(lat1,lng1,lat2,lng2)` — distance in km
- `nearestPorts(lat,lng,maxKm)` — finds nearest ports within radius
- `openMinimize(withAlts)` — Minimize Crowds modal
- `renderResults(stops)` — main results renderer
- `_flexDays` — flexibility setting for Minimize modal (1/2/3 days)

## Syntax Check Method
```javascript
const html = require('fs').readFileSync('index.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
require('fs').writeFileSync('/tmp/test.mjs', script);
// then: node --check /tmp/test.mjs
```
**Always use `lastIndexOf` not `indexOf` — avoids catching the GA script tag.**

## Pre-Launch Checklist
- ✅ Google Analytics G-LCQ0RJ1LR6
- ✅ Booking.com affiliate links (AID 2839562)
- ✅ GetYourGuide affiliate links (PID VKYN0SM)
- ✅ OG/Twitter meta tags
- ✅ Emoji favicon ⛵
- ✅ Google Maps ↗ links on result cards
- ✅ Nearest-port geocoding for unknown cities
- ✅ Trip-window-clamped Minimize modal with ±1/2/3d toggle
- ⬜ OG image (og-image.png, 1200×630px) — screenshot and upload to GitHub root
- ⬜ Mobile layout audit
- ⬜ User testing (5–10 Mediterranean cruise travelers)
- ⬜ Google Popular Times API pull (script: `fetch_city_traffic.js`, ~$3)
- ⬜ Excursion database (run `scrape_viator_excursions.js`, wire into scoring)
- ⬜ Puppeteer scrape for remaining 24 estimated ports
- ⬜ Custom domain misstheboat.app (~$12)

## Backlog (Priority Order)
1. **[CRITICAL]** Get accurate excursion data — GYG Partner API token OR Puppeteer scrape of Viator
   - This is the root of the product's value. Training data estimates are not sufficient for launch.
2. **[NOW]** Run `scrape_viator_excursions.js` with Puppeteer once installed
3. **[DONE]** ✅ "Anywhere" all-regions button added to Explore tab region selector
2. **[NEXT]** OG image for social sharing
3. **[NEXT]** Mobile layout audit  
4. **[NEXT]** User testing
5. **[NEXT]** Google Popular Times pull (cityByDay replacement)
6. **[LATER]** Puppeteer for 24 remaining estimated ports
7. **[LATER]** Interactive itinerary map (Leaflet, color-coded pins)
8. **[LATER]** Conflict warning badge (two stops same day)
9. **[LATER]** Toast after Apply in Minimize modal
10. **[LATER]** Live cruise API (MarineTraffic ~$50/mo)
11. **[LATER]** Stripe + Pro tier ($9/mo)
12. **[LATER]** SEO landing pages

## Session Management Tips
- Use Claude Code (terminal) for data pipeline work — higher context limit
- Break scripts into: write script → you run locally → share output → I ingest
- This CLAUDE.md file should be updated at the end of each session

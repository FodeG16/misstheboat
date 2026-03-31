# MissTheBoat

**Avoid cruise ship crowds when you travel.** Color-coded crowd heatmap for every stop on your itinerary, based on cruise port schedules, excursion patterns, and city-wide traffic data.

## Live demo

Paste any itinerary → get red/yellow/green ratings for every destination → share a link with your travel group.

---

## Deploy to Vercel (5 minutes)

### Option A — Drag and drop (fastest)
1. Go to [vercel.com](https://vercel.com) and create a free account
2. Click **Add New → Project**
3. Drag the `misstheboat` folder into the upload area
4. Click **Deploy**
5. Done. Vercel gives you a URL like `misstheboat.vercel.app`

### Option B — GitHub (recommended for ongoing updates)
1. Create a repo at [github.com](https://github.com) (free account)
2. Upload these files to the repo (drag and drop on the GitHub web UI)
3. Go to [vercel.com](https://vercel.com) → **Add New → Project** → Import from GitHub
4. Select the repo → Deploy
5. Every time you push to GitHub, Vercel auto-deploys

### Custom domain
In Vercel: Project Settings → Domains → add `misstheboat.app` or whatever domain you purchase.
Recommended registrar: Namecheap (~$12/yr for .app).

---

## What's included

| Feature | Status | Data source |
|---|---|---|
| Cruise port call patterns | ✅ Live | Curated seasonal dataset (15 ports) |
| Excursion destination mapping | ✅ Live | Curated database (35 destinations) |
| City traffic by day of week | ✅ Live | Curated from Google Popular Times patterns |
| Historical weather | ✅ Real API | Open-Meteo archive API (free, no key needed) |
| Shareable URL | ✅ Live | URL hash encoding |
| Minimize crowds mode | ✅ Live | Algorithmic crowd score by day |
| Alternative destinations | ✅ Live | Curated |

---

## V2 upgrades (when ready)

### Live cruise ship tracking (~$49/mo)
Replace the static seasonal patterns with live port call data from MarineTraffic.

```
Sign up at: https://www.marinetraffic.com/en/online-services/plans
API endpoint: GET https://services.marinetraffic.com/api/expectedarrivals/{port_id}
```

Add a `vercel.json` serverless function to proxy the API (keeps your key server-side):

```json
// api/cruise-schedule.js
export default async function handler(req, res) {
  const { port } = req.query;
  const response = await fetch(
    `https://services.marinetraffic.com/api/expectedarrivals/...`,
    { headers: { 'Authorization': process.env.MARINETRAFFIC_KEY } }
  );
  res.json(await response.json());
}
```

Add `MARINETRAFFIC_KEY` to Vercel environment variables.

### AI itinerary parsing
Instead of keyword matching, call Claude API to parse pasted itineraries:

```javascript
// In a Vercel serverless function:
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': process.env.ANTHROPIC_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: `Extract destinations and dates from this itinerary as JSON: ${text}` }]
  })
});
```

### Expanding the destination database
`index.html` contains the `DESTS` and `PORTS` objects. Add any destination:

```javascript
'your-destination': {
  name: 'Your Destination',
  country: 'Country',
  lat: 00.000, lng: 00.000,
  nearPorts: ['port-key'],           // Which cruise ports are within excursion range
  cityByDay: [30,45,35,48,50,65,70], // Mon–Sun crowd index (0–100)
  sub: 'Short description',
  note: 'Context about cruise traffic here.',
  shoulder: 'Best time of day to visit.',
  alt: 'Lower-traffic alternative nearby.',
},
```

---

## Revenue path

1. **Free tier** — full app, shared links, 3 itineraries/month
2. **Pro ($9/mo)** — unlimited itineraries, PDF export, weather included
3. **Advisor ($49/mo)** — white-label, client-shareable branded links, bulk itinerary upload

Suggested stack for paid tiers: Add Stripe + Supabase for auth/usage tracking, both free to start.

---

## Tech stack

- Vanilla HTML/CSS/JS — no framework, no build step, deploys anywhere
- Open-Meteo API — free weather data, no API key required
- Vercel — free hosting, global CDN, custom domains
- Total infrastructure cost at launch: **$0/month**

---

*Built with MissTheBoat v1.0. Data: 15 Mediterranean cruise ports, 35 destinations, seasonal crowd patterns.*

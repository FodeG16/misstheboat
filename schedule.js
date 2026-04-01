// api/schedule.js
// Vercel serverless function — fetches real port call data from CruiseDig
// Called by: /api/schedule?port=livorno&date=2026-05-13
// Returns: { date, port, ships: [{name, line, passengers}], total_passengers, ship_count }

const PORT_SLUGS = {
  livorno:       'livorno-florence-pisa-italy',
  civitavecchia: 'civitavecchia-rome-italy',
  naples:        'naples-italy',
  venice:        'venice-italy',
  dubrovnik:     'dubrovnik-croatia',
  split:         'split-croatia',
  piraeus:       'piraeus-athens-greece',
  mykonos:       'mykonos-greece',
  santorini:     'santorini-greece',
  barcelona:     'barcelona-spain',
  palma:         'palma-de-mallorca-spain',
  marseille:     'marseille-france',
  villefranche:  'villefranche-sur-mer-france',
  valletta:      'valletta-malta',
  kotor:         'kotor-montenegro',
  genoa:         'genoa-italy',
  salerno:       'salerno-italy',
  palermo:       'palermo-sicily-italy',
  messina:       'messina-sicily-italy',
  rhodes:        'rhodes-greece',
  heraklion:     'heraklion-crete-greece',
  kusadasi:      'kusadasi-turkey',
  bodrum:        'bodrum-turkey',
  istanbul:      'istanbul-turkey',
  'las palmas':  'las-palmas-gran-canaria-spain',
  'santa cruz':  'santa-cruz-de-tenerife-spain',
  corfu:         'corfu-greece',
  zakynthos:     'zakynthos-greece',
  skiathos:      'skiathos-greece',
  haifa:         'haifa-israel',
  catania:       'catania-sicily-italy',
  malaga:        'malaga-spain',
  cadiz:         'cadiz-spain',
  antalya:       'antalya-turkey',
};

function parsePassengers(text) {
  const clean = text.replace(/\./g, '').replace(/,/g, '');
  const m = clean.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function formatDateForDisplay(dateStr) {
  // "01 Apr 2026" style matching
  const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const m = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/i);
  if (!m) return null;
  const mon = months[m[2].toLowerCase()];
  if (mon === undefined) return null;
  const d = new Date(parseInt(m[3]), mon, parseInt(m[1]));
  return d.toISOString().split('T')[0]; // "2026-05-13"
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const { port, date } = req.query;

  if (!port || !date) {
    return res.status(400).json({ error: 'port and date params required' });
  }

  const slug = PORT_SLUGS[port.toLowerCase()];
  if (!slug) {
    return res.status(404).json({ error: `Unknown port: ${port}` });
  }

  const url = `https://cruisedig.com/ports/${slug}/arrivals`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MissTheBoat/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return res.status(502).json({ error: `CruiseDig returned ${resp.status}` });
    }

    const html = await resp.text();

    // Parse arrivals from HTML text
    // CruiseDig structure: ship name, cruise line, "X passengers", "DD Mon YYYY - HH:MM"
    const lines = html
      .replace(/<[^>]+>/g, '\n')      // strip HTML tags
      .split('\n')
      .map(l => l.replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim())
      .filter(l => l.length > 0);

    const arrivals = [];
    let currentShip = null;
    let currentLine = null;
    let currentPax = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Passenger count line
      if (/passengers/i.test(line) && /\d/.test(line)) {
        currentPax = parsePassengers(line);
        continue;
      }

      // Date line: "01 Apr 2026 - 07:00"
      const dateMatch = line.match(/(\d{1,2}\s+\w{3}\s+\d{4})/);
      if (dateMatch && currentPax > 0) {
        const arrivalDate = formatDateForDisplay(dateMatch[1]);
        if (arrivalDate) {
          // Look back for ship name (not a cruise line, not empty, not date-like)
          for (let j = Math.max(0, i - 5); j < i; j++) {
            const candidate = lines[j];
            if (
              candidate &&
              candidate.length > 2 &&
              !/passengers/i.test(candidate) &&
              !/^\d/.test(candidate) &&
              !/^(arrivals|departures|port schedule|back to|region|mediterranean)/i.test(candidate) &&
              !/cruise port/i.test(candidate)
            ) {
              // Distinguish ship name from cruise line (ship names tend to have model words)
              if (j === i - 2 || j === i - 3) {
                currentShip = candidate;
              } else if (j === i - 4 || j === i - 5) {
                currentLine = candidate;
              }
            }
          }

          arrivals.push({
            date: arrivalDate,
            ship: currentShip || 'Unknown',
            line: currentLine,
            passengers: currentPax,
          });
          currentPax = 0;
        }
        continue;
      }
    }

    // Filter to requested date
    const targetDate = date; // already "YYYY-MM-DD"
    const todayShips = arrivals.filter(a => a.date === targetDate);

    const total_passengers = todayShips.reduce((s, a) => s + a.passengers, 0);

    return res.status(200).json({
      port,
      date: targetDate,
      ships: todayShips.map(a => ({ name: a.ship, line: a.line, passengers: a.passengers })),
      total_passengers,
      ship_count: todayShips.length,
      source: 'cruisedig.com',
    });

  } catch (err) {
    console.error('Schedule fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch schedule data', detail: err.message });
  }
}

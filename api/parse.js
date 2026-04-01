// api/parse.js
// Vercel serverless function — Claude API for itinerary parsing and AI generation
//
// POST body: { text: string, mode?: 'parse'|'generate', season?: string, days?: number }
// Returns:   { stops: [{ destination: string, date: string|null, notes: string }] }
//
// mode='parse':    Extracts destinations+dates from pasted itinerary text
// mode='generate': Creates a new itinerary from a natural language prompt

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text, mode = 'parse', season = 'spring', days = 5 } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });

  let systemPrompt, userPrompt;

  if (mode === 'generate') {
    systemPrompt = `You are a travel expert helping plan Mediterranean itineraries that minimize cruise ship crowds.
You know that cruise ships dock at major ports and send tourists to nearby excursion destinations.
You prioritize authentic, less-touristed destinations alongside must-see highlights.
Respond ONLY with valid JSON — no preamble, no markdown, no code blocks.`;

    userPrompt = `Create a ${days}-day Mediterranean trip itinerary for ${season} based on this request:
"${text}"

Rules:
- Prefer destinations with fewer cruise crowds (hilltop villages, lesser-known towns, timing away from port days)
- Include a mix of well-known highlights and hidden gems
- Assign realistic consecutive dates starting from 2026-06-01
- Each stop should be a real, specific city or town name

Return JSON in this exact format:
{
  "stops": [
    { "destination": "City name", "date": "YYYY-MM-DD", "notes": "one sentence why" },
    ...
  ]
}`;

  } else {
    systemPrompt = `You are a travel itinerary parser. Extract destinations and dates from any itinerary text.
Accept any format: hotel confirmations, Google trip exports, TripIt, travel blogs, booking emails, plain notes.
Respond ONLY with valid JSON — no preamble, no markdown, no code blocks.`;

    userPrompt = `Extract all destinations and dates from this itinerary text:

"${text}"

Rules:
- Extract every city, town, or attraction mentioned as a visit destination
- Include the date if specified (use YYYY-MM-DD format, assume year 2026 if not specified)
- If a date range is given, use the arrival date
- Ignore transit cities the person is just passing through (airports, train stations)
- Use the most specific place name (e.g. "Positano" not "Amalfi Coast")

Return JSON in this exact format:
{
  "stops": [
    { "destination": "City name", "date": "YYYY-MM-DD or null", "notes": "context if any" },
    ...
  ]
}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('JSON parse error:', clean);
      return res.status(200).json({ stops: [], error: 'Parse failed', raw: clean });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

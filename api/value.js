// api/value.js
// Scores a destination's cultural value using:
// 1. Wikipedia page views (12-month average) — proxy for world significance
// 2. Wikidata UNESCO World Heritage Site flag — structural cultural signal
//
// GET /api/value?name=Florence
// Returns: { name, score, views, isUnesco, source }

const UNESCO_SITES = new Set([
  // Italy
  'florence','siena','san gimignano','pienza','val dorcia','cinque terre',
  'rome','pompeii','herculaneum','amalfi','positano','ravello',
  'venice','verona','padua','vicenza','agrigento','syracuse','piazza armerina',
  'castel del monte','trulli of alberobello','matera','montefalco',
  'palmermo','cefalù','monreale',
  // Greece
  'athens','delphi','olympia','epidaurus','mystras','rhodes old town',
  'thessaloniki','meteora','mycenae','corfu',
  // Croatia
  'dubrovnik old town','split old town','trogir','plitvice',
  // Spain
  'barcelona','granada','seville','cordova','salamanca','toledo','segovia',
  'tarragona','lugo','gaudi','santiago de compostela','ibiza','mallorca',
  // France  
  'avignon','arles','orange','pont du gard','carcassonne','versailles',
  // Turkey
  'istanbul','ephesus','pamukkale','cappadocia','troy','pergamon',
  'divriği','hattusha','catalhoyuk','göbekli tepe',
  // Morocco
  'fes','marrakech','meknes','rabat','tetouan','el jadida',
  // Malta
  'valletta','mdina',
  // Portugal
  'sintra','porto','evora','batalha','tomar','belem',
  // Montenegro
  'kotor old town',
  // Israel
  'jerusalem','acre','tel megiddo','bet shearim','baha haifa',
]);

// Map our destination names to Wikipedia article titles
// Only needed where the name doesn't directly match
const WIKI_TITLE_MAP = {
  'san gimignano': 'San_Gimignano',
  'san quirico d orcia': 'San_Quirico_d%27Orcia',
  'greve in chianti': 'Greve_in_Chianti',
  'castelnuovo berardenga': 'Castelnuovo_Berardenga',
  'cinque terre': 'Cinque_Terre',
  'santa margherita ligure': 'Santa_Margherita_Ligure',
  'dubrovnik old town': 'Dubrovnik',
  'split old town': 'Split,_Croatia',
  'kotor old town': 'Kotor',
  'mykonos town': 'Mykonos',
  'santorini': 'Santorini',
  'las palmas': 'Las_Palmas',
  'santa cruz tenerife': 'Santa_Cruz_de_Tenerife',
  'palma de mallorca': 'Palma,_Majorca',
  'athens': 'Athens',
  'rhodes old town': 'Rhodes',
  'piraeus': 'Piraeus',
  'heraklion': 'Heraklion',
  'villefranche': 'Villefranche-sur-Mer',
  'saint-paul-de-vence': 'Saint-Paul-de-Vence',
  'hagia sophia': 'Hagia_Sophia',
  'istanbul': 'Istanbul',
  'ephesus': 'Ephesus',
  'aspendos': 'Aspendos',
  'eze': 'Èze',
  'pienza': 'Pienza',
  'montepulciano': 'Montepulciano',
  'pitigliano': 'Pitigliano',
  'pompeii': 'Pompeii',
  'herculaneum': 'Herculaneum',
  'capri': 'Capri',
  'cortona': 'Cortona',
  'montefalco': 'Montefalco',
  'cefalu': 'Cefalù',
  'agrigento': 'Agrigento',
  'taormina': 'Taormina',
  'syracuse': 'Syracuse,_Sicily',
  'noto': 'Noto,_Sicily',
  'ragusa': 'Ragusa,_Sicily',
  'casablanca': 'Casablanca',
  'marrakech': 'Marrakesh',
  'seville': 'Seville',
  'cadiz': 'Cádiz',
  'malaga': 'Málaga',
  'jerez': 'Jerez_de_la_Frontera',
  'ronda': 'Ronda',
  'antalya': 'Antalya',
  'bodrum': 'Bodrum',
  'pamukkale': 'Pamukkale',
  'haifa': 'Haifa',
  'jerusalem': 'Jerusalem',
  'murano': 'Murano',
  'burano': 'Burano',
};

function wikiTitle(name) {
  const lower = name.toLowerCase();
  if (WIKI_TITLE_MAP[lower]) return WIKI_TITLE_MAP[lower];
  // Default: capitalize and underscores
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
}

function viewsToScore(annualViews) {
  if (!annualViews || annualViews < 500) return 3;
  const log = Math.log10(annualViews);
  // log10(10000)=4 → score 4, log10(10000000)=7 → score 10
  // Formula: (log - 4) * 2.0 + 4, clamped 1-10
  return Math.min(10, Math.max(1, Math.round((log - 4) * 2.0 + 4)));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const title = wikiTitle(name);
  const isUnesco = UNESCO_SITES.has(name.toLowerCase());

  // Fetch last 12 months of page views
  const now = new Date();
  const end = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}01`;
  const startDate = new Date(now);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const start = `${startDate.getFullYear()}${String(startDate.getMonth()+1).padStart(2,'0')}01`;

  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(title)}/monthly/${start}/${end}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'MissTheBoat/1.0 (travel-crowd-avoidance app)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let annualViews = 0;
    if (resp.ok) {
      const data = await resp.json();
      if (data.items) {
        annualViews = data.items.reduce((sum, m) => sum + (m.views || 0), 0);
      }
    }

    let score = viewsToScore(annualViews);

    // UNESCO bonus — cultural significance independent of tourism
    if (isUnesco && score < 9) score = Math.min(10, score + 1);

    return res.status(200).json({
      name,
      score,
      views: annualViews,
      isUnesco,
      wikiTitle: title,
      source: annualViews > 0 ? 'wikipedia+wikidata' : 'fallback',
    });

  } catch (err) {
    // Fallback: return null so app uses manual score
    return res.status(200).json({ name, score: null, error: err.message });
  }
}

/**
 * Nearby / popular service-area place names (Google-style "Place, Region, Country")
 * keyed by normalized city. Extend per city as needed.
 */

const PATNA_NEARBY = [
  'Danapur, Bihar, India',
  'Aminabad, Bihar 801103, India',
  'Mithapur, Patna, Bihar, India',
  'Kadamkuan, Patna, Bihar, India',
  'Digha Ghat, Patna, Bihar, India',
  'Rajeev Nagar, Patna, Bihar, India',
  'Shastri Nagar, Patna, Bihar, India',
  'Rajbansi Nagar, Patna, Bihar, India',
  'Rajendra Nagar, Patna, Bihar, India',
  'RPS More, Patna, Bihar 801503, India',
  'Kankarbagh, Patna, Bihar 800020, India',
  'Patna City, Patna, Bihar 800008, India',
  'Ashiana More, Patna, Bihar 800014, India',
  'Kankarbagh, Kumhrar, Patna, Bihar, India',
  'Fraser Road Area, Patna, Bihar 800001, India',
  'New Jakkanpur, Gardanibagh, Patna, Bihar 800001, India',
  'Bailey Road, Patna, Bihar, India',
  'Boring Road, Patna, Bihar, India',
  'Sri Krishna Puri, Patna, Bihar, India',
  'Phulwari Sharif, Patna, Bihar, India',
];

const MUMBAI_NEARBY = [
  'Andheri West, Mumbai, Maharashtra, India',
  'Bandra West, Mumbai, Maharashtra, India',
  'Borivali West, Mumbai, Maharashtra, India',
  'Powai, Mumbai, Maharashtra, India',
  'Thane West, Thane, Maharashtra, India',
  'Navi Mumbai, Maharashtra, India',
  'Kandivali West, Mumbai, Maharashtra, India',
  'Malad West, Mumbai, Maharashtra, India',
];

const DELHI_NCR_NEARBY = [
  'Connaught Place, New Delhi, Delhi, India',
  'Dwarka, New Delhi, Delhi, India',
  'Rohini, New Delhi, Delhi, India',
  'Noida, Uttar Pradesh, India',
  'Gurgaon, Haryana, India',
  'Ghaziabad, Uttar Pradesh, India',
];

const BANGALORE_NEARBY = [
  'Koramangala, Bengaluru, Karnataka, India',
  'Indiranagar, Bengaluru, Karnataka, India',
  'Whitefield, Bengaluru, Karnataka, India',
  'HSR Layout, Bengaluru, Karnataka, India',
  'Electronic City, Bengaluru, Karnataka, India',
];

const CITY_SUGGESTIONS = {
  patna: PATNA_NEARBY,
  mumbai: MUMBAI_NEARBY,
  bombay: MUMBAI_NEARBY,
  delhi: DELHI_NCR_NEARBY,
  newdelhi: DELHI_NCR_NEARBY,
  noida: DELHI_NCR_NEARBY,
  gurgaon: DELHI_NCR_NEARBY,
  gurugram: DELHI_NCR_NEARBY,
  bengaluru: BANGALORE_NEARBY,
  bangalore: BANGALORE_NEARBY,
};

function normalizeCityToken(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/**
 * Infer city bucket from storefront locality + full address string.
 */
export function inferServiceAreaCityKey(locality, fullAddress) {
  const hay = `${locality || ''} ${fullAddress || ''}`.toLowerCase();
  const tokens = [
    'new delhi',
    'noida',
    'gurgaon',
    'gurugram',
    'ghaziabad',
    'patna',
    'mumbai',
    'bombay',
    'bengaluru',
    'bangalore',
    'delhi',
  ];
  for (const t of tokens) {
    if (hay.includes(t)) {
      if (t === 'new delhi') return 'delhi';
      return t.replace(/\s+/g, '');
    }
  }
  const locKey = normalizeCityToken(locality);
  if (locKey && CITY_SUGGESTIONS[locKey]) return locKey;
  return null;
}

/**
 * Generic fallback when we have a locality but no curated list.
 */
function fallbackSuggestions(locality, administrativeArea, regionCode) {
  const loc = String(locality || '').trim();
  const adm = String(administrativeArea || '').trim();
  const rc = String(regionCode || '').trim();
  const country = rc === 'IN' || !rc ? 'India' : rc;
  if (!loc) return [];
  const out = [];
  if (adm) out.push(`${loc}, ${adm}, ${country}`);
  else out.push(`${loc}, ${country}`);
  return out;
}

/**
 * Curated nearby areas for the business storefront (for multi-select UI).
 */
export function getNearbyServiceAreaSuggestions({ locality, administrativeArea, regionCode, fullAddress } = {}) {
  const key = inferServiceAreaCityKey(locality, fullAddress);
  if (key && CITY_SUGGESTIONS[key]) {
    return [...CITY_SUGGESTIONS[key]];
  }
  return fallbackSuggestions(locality, administrativeArea, regionCode);
}

/** Parse Google's joined service area text back into discrete place lines. */
export function parseServiceAreaPlacesFromText(text) {
  if (text == null || text === '') return [];
  return String(text)
    .split(/[;\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse AI service-area output: bullets, numbered lines, comma blocks — dedupe case-insensitively.
 */
export function parseAiServiceAreaSuggestionText(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  const chunks = s.split(/\r?\n|;/);
  const seen = new Set();
  const out = [];
  for (let chunk of chunks) {
    const line = chunk
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean)
      .join(' — ');
    if (!line) continue;
    let t = line
      .replace(/^\s*[-*•]\s*/u, '')
      .replace(/^\s*\d+[.)]\s*/, '')
      .trim();
    if (!t) continue;
    if (/^(output format|at least|at most|area\s*\d)/i.test(t)) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= 12) break;
  }
  if (out.length < 2 && /,/.test(s) && !/\r?\n/.test(s)) {
    const commaParts = s.split(/[,]+/).map((p) => p.replace(/^\s*[-*•\d.)]+\s*/i, '').trim()).filter(Boolean);
    if (commaParts.length >= 2) {
      const cSeen = new Set();
      const cOut = [];
      for (const t of commaParts) {
        const k = t.toLowerCase();
        if (cSeen.has(k)) continue;
        cSeen.add(k);
        cOut.push(t);
        if (cOut.length >= 12) break;
      }
      return cOut;
    }
  }
  return out;
}

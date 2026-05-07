#!/usr/bin/env node
/**
 * Daily market briefing generator.
 *  1. Fetch latest CNBC top headlines from NewsAPI.org (real URLs, real dates).
 *  2. Send the article list to Gemini, ask it to pick 6, translate and analyze
 *     in Slovene, returning JSON.
 *  3. Write public/data/briefing.json.
 *
 * Required env: GEMINI_API_KEY, NEWSAPI_KEY
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'briefing.json');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
if (!GEMINI_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }
if (!NEWSAPI_KEY) { console.error('Missing NEWSAPI_KEY'); process.exit(1); }

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `Si finančni analitik za slovensko občinstvo. Pišeš jasno, brez hypea, brez finančnih nasvetov. Vedno odgovoriš v slovenščini.`;

async function fetchArticles() {
  const url = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=50&apiKey=${NEWSAPI_KEY}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'engineering-investor-briefing/1.0' } });
  if (!res.ok) throw new Error(`NewsAPI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(`NewsAPI status: ${JSON.stringify(data)}`);

  const articles = (data.articles || [])
    .filter((a) => a.url && a.title && a.title !== '[Removed]')
    .map((a) => ({
      title: a.title,
      description: a.description || '',
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name || 'Unknown',
    }));
  console.log(`[briefing] NewsAPI returned ${articles.length} business articles`);
  return articles;
}

function buildUserPrompt(articles) {
  const today = new Date().toISOString().slice(0, 10);
  const list = articles
    .map((a, i) => `${i + 1}. ${a.title}\n   Vir: ${a.source}\n   URL: ${a.url}\n   Objavljen: ${a.publishedAt}\n   Opis: ${a.description}`)
    .join('\n\n');

  return `Spodaj je seznam najnovejših poslovnih novic (zadnjih 24h, datum tekočega zagona ${today}), ki jih je vrnil NewsAPI.

${list}

NALOGA:
- Izberi TOČNO 6 najpomembnejših novic z vidika finančnih trgov (delnice, obveznice, valute, surovine, kripto, makro, centralne banke, geopolitika z vplivom na trge).
- Za vsako napiši slovenski povzetek in analizo. URL, vir in datum objave VEDNO ohrani točno tako kot je v seznamu — ne spreminjaj jih, ne izmišljaj novih.
- Pred novicami napiši 4–6 stavčni "Pregled dneva", ki povzame vse 6 izbrane novice in skupni vpliv na trge.

Vrni IZKLJUČNO veljaven JSON v naslednji obliki, brez markdown ograj, brez razlage pred ali po:

{
  "datum": "${today}",
  "povzetek": "4–6 stavkov kontekstnega povzetka dneva v slovenščini, ki povzema vseh 6 novic in njihov skupni vpliv na delnice, obveznice, valute, surovine in kripto.",
  "novice": [
    {
      "naslov": "jasen, informativen naslov v slovenščini (8–14 besed, prevod ali parafraza CNBC naslova)",
      "sektor": "eden od: Tehnologija & AI | Energetika | Finance | Potrošniki | Makro & Centralne banke",
      "smer": "eden od: pozitivno | negativno | mešano",
      "intenziteta": 2,
      "povzetek": "2–3 stavki o tem, kaj se je zgodilo (kdo, kdaj, koliko, zakaj pomembno).",
      "analiza": "5–7 stavkov: kontekst (kaj je predhodilo), zakaj zdaj, kako se vpenja v trende, posledice za razrede sredstev (delnice/obveznice/valute/surovine), kaj pomeni za dolgoročnega slovenskega vlagatelja. Brez finančnih nasvetov.",
      "vpliv": ["konkretna posledica 1", "konkretna posledica 2", "konkretna posledica 3"],
      "vir": "ime vira iz seznama (npr. Reuters, CNBC, Bloomberg) — NESPREMENJENO",
      "vir_url": "polni URL iz seznama, nespremenjen"
    }
  ]
}

Intenziteta: 1 = manjša, 2 = pomembna, 3 = ključna novica dneva. Vrni SAMO JSON, nič drugega.`;
}

async function callGemini(userPrompt) {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 16000,
      responseMimeType: 'application/json',
    },
  };

  const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();

    const text = await res.text();
    if (RETRY_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
      const wait = Math.min(60_000, 2_000 * 2 ** (attempt - 1));
      console.warn(`[briefing] ${res.status} (attempt ${attempt}/${MAX_ATTEMPTS}), retry in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`Gemini API ${res.status}: ${text}`);
  }
  throw new Error('Gemini API: exhausted retries');
}

function extractJson(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text || '').join('\n').trim();
  if (!text) throw new Error('Empty model output');

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in model output:\n' + text);
  return JSON.parse(candidate.slice(start, end + 1));
}

function validateAndCleanup(data, allowedUrls) {
  const allowed = new Set(allowedUrls);
  const novice = (data.novice || []).filter((n) => {
    if (!n.vir_url || !allowed.has(n.vir_url)) {
      console.warn(`[briefing] dropping item with invalid vir_url: ${n.vir_url}`);
      return false;
    }
    return true;
  });
  return { ...data, novice };
}

async function main() {
  const articles = await fetchArticles();
  if (articles.length === 0) throw new Error('NewsAPI returned no articles');

  console.log(`[briefing] calling ${MODEL}...`);
  const response = await callGemini(buildUserPrompt(articles));
  const raw = extractJson(response);
  const data = validateAndCleanup(raw, articles.map((a) => a.url));

  const out = {
    generiranoOb: new Date().toISOString(),
    model: MODEL,
    ...data,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[briefing] wrote ${out.novice?.length ?? 0} items to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[briefing] failed:', err);
  process.exit(1);
});

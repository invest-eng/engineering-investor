#!/usr/bin/env node
/**
 * Daily market briefing generator (Google Gemini + Google Search grounding).
 * Free tier: Gemini 2.5 Pro, ~1500 grounded requests/day.
 *
 * Required env: GEMINI_API_KEY
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'briefing.json');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `Si finančni analitik za slovensko občinstvo. Spremljaš globalne trge, makro podatke in geopolitiko. Pišeš jasno, brez hypea, brez finančnih nasvetov. Vedno odgovoriš v slovenščini.`;

const USER_PROMPT = `Naredi pregled najpomembnejših finančnih in geopolitičnih dogodkov zadnjih 24 ur, ki vplivajo na trge.

Z Google Search poišči zadnje novice o: ameriških delnicah (S&P 500, Nasdaq, Dow), evropskih trgih (DAX, CAC, FTSE), azijskih trgih, kriptovalutah (BTC, ETH), nafti (Brent, WTI), zlatu, obveznicah (US 10Y, Bund), centralnih bankah (Fed, ECB, BoJ, BoE), makro objavah (CPI, PPI, NFP, GDP, PMI, retail sales) in geopolitiki, ki vpliva na trge.

PRAVILA ZA VIRE — IZJEMNO POMEMBNO:
- Uporabljaj IZKLJUČNO preverjene finančne medije: Reuters, Bloomberg, Financial Times, Wall Street Journal, CNBC, MarketWatch, Investing.com, Yahoo Finance, AP News, Barron's, The Economist, ECB/Fed uradne objave. Slovenski viri: Finance.si, STA, Delo (samo za posebno relevantne lokalne novice).
- Tabloidi, blog stran, agregatorji, anonimni viri NISO sprejemljivi.
- vir_url MORA biti VELJAVEN URL DIREKTNO do objavljenega članka, nikoli do domače strani ali kategorije. URL mora biti tisti, ki si ga pravkar našel preko Google Search.
- Če za novico nimaš zanesljivega URL-ja, novice NE vključi.

Izberi TOČNO 6 najpomembnejših novic dneva (ne več, ne manj).

Vrni IZKLJUČNO veljaven JSON v spodnji obliki, brez markdown ograj, brez razlage pred ali po:

{
  "datum": "YYYY-MM-DD",
  "povzetek": "4–6 stavkov, ki povzamejo grobi pregled vseh 6 novic, kako se medsebojno povezujejo, in skupni vpliv na trge ta dan (delnice, obveznice, valute, surovine, kripto). Slovenščina, brez hypea.",
  "novice": [
    {
      "naslov": "jasen, informativen naslov v slovenščini (8–14 besed)",
      "sektor": "eden od: Tehnologija & AI | Energetika | Finance | Potrošniki | Makro & Centralne banke",
      "smer": "eden od: pozitivno | negativno | mešano",
      "intenziteta": 2,
      "povzetek": "2–3 stavki, ki bralcu povedo bistvo dogodka in zakaj je pomembno (kaj se je zgodilo, kdo, kdaj, koliko).",
      "analiza": "5–7 stavkov poglobljene analize: kontekst (kaj je predhodilo), zakaj se to dogaja zdaj, kako se vpenja v širše trende, kakšne so posledice za različne razrede sredstev (delnice/obveznice/valute/surovine), in kaj pomeni za dolgoročnega slovenskega vlagatelja. Brez finančnih nasvetov, samo razlaga.",
      "vpliv": ["konkretna posledica 1 (npr. 'Pritisk na donose 10-letnih ameriških obveznic')", "konkretna posledica 2", "konkretna posledica 3"],
      "vir": "ime medija (npr. Reuters, Bloomberg, Financial Times)",
      "vir_url": "polni URL do članka, https://..."
    }
  ]
}

Intenziteta: 1 = manjša novica, 2 = pomembna, 3 = ključna novica dneva. Vrni SAMO JSON, nič drugega.`;

async function callGemini() {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: USER_PROMPT }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 16000,
    },
  };

  const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(ENDPOINT, {
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

async function main() {
  console.log(`[briefing] calling ${MODEL}...`);
  const response = await callGemini();
  const data = extractJson(response);

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

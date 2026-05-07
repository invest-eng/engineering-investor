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

const TODAY = new Date().toISOString().slice(0, 10);

const USER_PROMPT = `Naredi pregled najpomembnejših finančnih dogodkov za ${TODAY}, izhajajoč IZKLJUČNO iz novic na CNBC (cnbc.com).

PRAVILA ZA ISKANJE — IZJEMNO POMEMBNO:
- Z Google Search uporabljaj poizvedbe omejene na site:cnbc.com (npr. "site:cnbc.com markets", "site:cnbc.com Fed", "site:cnbc.com stocks today", "site:cnbc.com oil", "site:cnbc.com bitcoin").
- Najprej pridobi zgodbe z naslovne strani CNBC (cnbc.com) in iz rubrik Markets, Business, Economy, Investing.
- Izberi TOČNO 6 najpomembnejših člankov, ki so bili OBJAVLJENI NA DAN ${TODAY} (UTC). Članki s starejšim datumom NISO sprejemljivi — tudi če je vsebina aktualna.
- Vsaka novica mora imeti vir_url, ki je polni URL DIREKTNO do članka na cnbc.com (https://www.cnbc.com/...). URL-ji do domače strani, kategorije ali drugih medijev so prepovedani.
- Vir naj bo vedno "CNBC".
- Če za določen dan ne najdeš 6 ustreznih CNBC člankov, vrni manj — ampak ne izmišljaj URL-jev in ne uporabljaj drugih medijev.

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

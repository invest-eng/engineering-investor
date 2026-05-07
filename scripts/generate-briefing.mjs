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

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `Si finančni analitik za slovensko občinstvo. Spremljaš globalne trge, makro podatke in geopolitiko. Pišeš jasno, brez hypea, brez finančnih nasvetov. Vedno odgovoriš v slovenščini.`;

const USER_PROMPT = `Naredi pregled najpomembnejših finančnih in geopolitičnih dogodkov zadnjih 24 ur, ki vplivajo na trge.

Z Google Search poišči zadnje novice o: ameriških delnicah, evropskih trgih, kriptovalutah, nafti, zlatu, obveznicah, centralnih bankah (Fed, ECB), pomembnih makro objavah (CPI, NFP, GDP), in geopolitiki.

Izberi 5–8 najpomembnejših novic in vrni IZKLJUČNO veljaven JSON v naslednji obliki, brez markdown ograj, brez razlage pred ali po:

{
  "datum": "YYYY-MM-DD",
  "povzetek": "1–2 stavka kontekstnega povzetka dneva v slovenščini",
  "novice": [
    {
      "naslov": "kratek naslov v slovenščini",
      "sektor": "eden od: Tehnologija & AI | Energetika | Finance | Potrošniki | Makro & Centralne banke",
      "smer": "eden od: pozitivno | negativno | mešano",
      "intenziteta": 1,
      "povzetek": "1 stavek povzetka",
      "analiza": "2–3 stavki konteksta in pomena za vlagatelja",
      "vpliv": ["kratka točka 1", "kratka točka 2", "kratka točka 3"],
      "vir": "ime vira (npr. Reuters, Bloomberg)"
    }
  ]
}

Intenziteta je 1 (manjša novica), 2 (pomembna), 3 (zelo pomembna). Vrni SAMO JSON, nič drugega.`;

async function callGemini() {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: USER_PROMPT }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8000,
    },
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API ${res.status}: ${text}`);
  }
  return res.json();
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

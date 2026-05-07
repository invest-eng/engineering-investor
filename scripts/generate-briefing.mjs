#!/usr/bin/env node
/**
 * Daily market briefing generator.
 * Calls Claude with web_search to summarize last 24h market news in Slovene,
 * writes the result to public/data/briefing.json.
 *
 * Required env: ANTHROPIC_API_KEY
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'briefing.json');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 8000;

const SYSTEM_PROMPT = `Si finančni analitik za slovensko občinstvo. Spremljaš globalne trge, makro podatke in geopolitiko. Pišeš jasno, brez hypea, brez finančnih nasvetov. Vedno odgovoriš v slovenščini.`;

const USER_PROMPT = `Naredi pregled najpomembnejših finančnih in geopolitičnih dogodkov zadnjih 24 ur, ki vplivajo na trge.

Z web_search orodjem poišči zadnje novice o: ameriških delnicah, evropskih trgih, kriptovalutah, naftah, zlatu, obveznicah, centralnih bankah (Fed, ECB), pomembnih makro objavah (CPI, NFP, GDP), in geopolitiki.

Izberi 5–8 najpomembnejših novic in vrni IZKLJUČNO veljaven JSON v naslednji obliki, brez markdown ograj, brez razlage:

{
  "datum": "ISO datum YYYY-MM-DD",
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

async function callClaude() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }],
      messages: [{ role: 'user', content: USER_PROMPT }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text}`);
  }
  return res.json();
}

function extractJson(message) {
  const textBlocks = (message.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const fenced = textBlocks.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : textBlocks;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in model output');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function main() {
  console.log(`[briefing] calling ${MODEL}...`);
  const message = await callClaude();
  const data = extractJson(message);

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

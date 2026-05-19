#!/usr/bin/env node
/**
 * RSS test generator -- brez Gemini API kljuca.
 * Ustvari public/data/briefing.json direktno iz RSS clankov
 * (brez AI analize) da vidis svezino v UI.
 *
 * Usage:  node scripts/test-generate-rss.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAll } from './lib/news-fetcher.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'briefing.json');

// Rough keyword-based sector guesser (replaces Gemini classification)
function guessSector(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase();
  if (/ai|artificial intelligence|robot|chip|tech|apple|google|microsoft|nvidia|software|cyber/.test(text)) return 'Tehnologija & AI';
  if (/oil|gas|energy|opec|renewab|solar|wind|coal|petrol/.test(text)) return 'Energetika';
  if (/bank|rate|inflation|ecb|fed|bond|yield|gdp|recession|economy|fiscal/.test(text)) return 'Makro & Centralne banke';
  if (/stock|market|nasdaq|s&p|dow|share|invest|fund|hedge|ipo|earnings/.test(text)) return 'Finance';
  if (/retail|consumer|shop|price|food|housing|wage|salary|spending/.test(text)) return 'Potrošniki';
  return 'Geopolitika';
}

function guessSmer(title = '') {
  const t = title.toLowerCase();
  if (/rise|surges|jumps|gains|up|rally|record|grow|boost|profit|beat/.test(t)) return 'pozitivno';
  if (/fall|drop|down|slump|cut|crash|loss|decline|warning|fear|miss/.test(t)) return 'negativno';
  return 'mešano';
}

const articles = await fetchAll({ maxAgeHours: 24 });
console.log(`[test] ${articles.length} svezih clankov`);

const selected = articles.slice(0, 8);

const novice = selected.map((a) => ({
  naslov: a.title,
  sektor: guessSector(a.title, a.description),
  smer: guessSmer(a.title),
  intenziteta: 2,
  povzetek: a.description || a.title,
  analiza: '(RSS testni nacin -- brez Gemini analize)',
  vpliv: ['Preizkus RSS vira'],
  vir: a.source,
  vir_url: a.url,
  objavljeno: a.publishedAt,
}));

const out = {
  generiranoOb: new Date().toISOString(),
  izdaja: 'morning',
  model: 'rss-test-no-ai',
  tier: 'free',
  datum: new Date().toISOString().slice(0, 10),
  povzetek: `RSS testni nacin: ${articles.length} clankov pobrano iz BBC, MarketWatch, CNBC, FT, Al Jazeera. Brez Gemini AI analize.`,
  novice,
};

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
console.log(`[test] zapisano ${novice.length} clankov v briefing.json`);
console.log(`       Odpri: http://localhost:4399/engineering-investor/dnevni-pregled`);

#!/usr/bin/env node
/**
 * Daily market briefing — FREE version.
 *
 *   1. Fetch latest business headlines from NewsAPI.org.
 *   2. Send the list to Gemini, ask it to pick ~6, translate, analyze
 *      and write a master summary in Slovene. Returns JSON.
 *   3. Write public/data/briefing.json.
 *
 * Required env: GEMINI_API_KEY, NEWSAPI_KEY
 *
 * --- PREMIUM EXPANSION ---
 * The premium version (scripts/premium/generate-premium-briefing.mjs) runs
 * 3 times per day with multi-model consensus and TTS audio. Both versions
 * share scripts/lib/ utilities so a model swap or prompt tweak applies to
 * both. To launch premium:
 *   1. Buy API keys (Anthropic, OpenAI, Google Cloud TTS).
 *   2. Add them to GitHub Secrets.
 *   3. Uncomment cron in .github/workflows/premium-briefing.yml.
 * See scripts/premium/README.md for full instructions.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchAll } from './lib/news-fetcher.mjs';
import { callGemini } from './lib/ai-providers.mjs';
import { buildLegacyAllInOnePrompt } from './lib/prompts.mjs';
import { extractJson } from './lib/extract-json.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'briefing.json');

// Edition: free version runs 1x/day at 07:30 SLO → use 'morning' framing.
// --- PREMIUM: this would be selected per cron schedule (morning/noon/evening) ---
const EDITION = process.env.BRIEFING_EDITION || 'morning';

// Force regeneration via env (override skip) — used by workflow_dispatch.
const FORCE = process.env.FORCE_BRIEFING === '1' || process.env.FORCE_BRIEFING === 'true';

/**
 * Returns true if briefing for today already exists at OUT_PATH.
 * Used by multi-cron workflow: first successful run wins, subsequent runs
 * (later in the day) detect today's briefing and skip API calls.
 */
async function alreadyGeneratedToday() {
  if (FORCE) return false;
  try {
    const raw = await readFile(OUT_PATH, 'utf8');
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    return data?.datum === today;
  } catch {
    return false;
  }
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
  // Step 0: dedupe — multi-cron workflow may trigger us several times per day.
  // First successful run wins; later runs skip cleanly.
  if (await alreadyGeneratedToday()) {
    console.log(`[briefing] today's briefing already exists — skipping (set FORCE_BRIEFING=1 to override)`);
    return;
  }

  // Step 1: fetch news.
  const articles = await fetchAll({ newsApiKey: process.env.NEWSAPI_KEY });
  if (articles.length === 0) throw new Error('No articles fetched');
  console.log(`[briefing] ${articles.length} articles in pool, edition=${EDITION}`);

  // Step 2: ask Gemini to do everything in one shot (free flow).
  // --- PREMIUM: this would be a 3-step pipeline:
  //     1. selectByMajority(articles, [gemini, claude, openai])
  //     2. summarizeByConsensus(each article)
  //     3. buildMasterPrompt + TTS synthesis
  //     See scripts/premium/generate-premium-briefing.mjs for the full flow.
  console.log('[briefing] calling Gemini (all-in-one)...');
  const prompt = buildLegacyAllInOnePrompt(articles, { edition: EDITION, count: 6 });
  const { text, model } = await callGemini(prompt);
  console.log(`[briefing] success with model ${model}`);

  // Step 3: parse and validate URLs match what we sent (avoid hallucinated URLs).
  const raw = extractJson(text);
  const data = validateAndCleanup(raw, articles.map((a) => a.url));

  // --- PREMIUM: master summary would also be sent to TTS here:
  //     const mp3 = await synthesizeSlovenian(data.master_povzetek);
  //     await writeFile(audioPath, mp3);
  //     out.audio_url = `/data/premium/audio/${stamp}.mp3`;

  const out = {
    generiranoOb: new Date().toISOString(),
    izdaja: EDITION,
    model,
    tier: 'free',
    // --- PREMIUM fields (empty in free version):
    // audio_url: null,
    // consensus: null,
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

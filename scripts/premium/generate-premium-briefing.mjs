#!/usr/bin/env node
/**
 * Premium market briefing — 3-model consensus + Slovenian TTS.
 *
 * Usage: node scripts/premium/generate-premium-briefing.mjs <edition>
 *   <edition>: morning | noon | evening   (defaults to 'morning')
 *
 * Pipeline:
 *   1. Fetch news from all configured sources.
 *   2. selectByMajority — Gemini + Claude + OpenAI each pick articles;
 *      keep those chosen by >= 2 of 3.
 *   3. summarizeByConsensus — all 3 write per-article summaries;
 *      Claude judge merges to final, including only facts shared by >= 2.
 *   4. buildMasterPrompt — produce a single cohesive master summary.
 *   5. synthesizeSlovenian — generate MP3 via Google Cloud TTS.
 *   6. Write:
 *        public/data/premium/{edition}.json
 *        public/data/premium/latest.json
 *        public/data/premium/audio/YYYY-MM-DD-{edition}.mp3
 *
 * Required env (premium): GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY,
 *                         NEWSAPI_KEY, GOOGLE_TTS_API_KEY.
 *
 * If any *provider* key is missing, the script gracefully degrades
 * (uses whichever providers are available, drops minAgreement accordingly).
 * If GOOGLE_TTS_API_KEY is missing, audio step is skipped (still writes JSON).
 *
 * Cost estimate (3 providers × 3x daily × ~6 articles):
 *   ~$5-15/day depending on chosen models (gpt-4o-mini + sonnet + flash is mid).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchAll } from '../lib/news-fetcher.mjs';
import { availableProviders, callClaude } from '../lib/ai-providers.mjs';
import { selectByMajority, summarizeByConsensus } from '../lib/consensus.mjs';
import { buildMasterPrompt } from '../lib/prompts.mjs';
import { extractJson } from '../lib/extract-json.mjs';
import { synthesizeSlovenian } from '../lib/tts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'data', 'premium');
const AUDIO_DIR = join(OUT_DIR, 'audio');

const VALID_EDITIONS = ['morning', 'noon', 'evening'];

function parseEdition() {
  const arg = process.argv[2] || process.env.BRIEFING_EDITION || 'morning';
  if (!VALID_EDITIONS.includes(arg)) {
    throw new Error(`Invalid edition "${arg}". Must be one of: ${VALID_EDITIONS.join(', ')}`);
  }
  return arg;
}

function todayStamp(edition) {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${edition}`;
}

async function main() {
  const edition = parseEdition();
  const stamp = todayStamp(edition);
  console.log(`[premium] === ${edition.toUpperCase()} BRIEFING (${stamp}) ===`);

  // Provider check.
  const providers = availableProviders();
  if (providers.length === 0) {
    throw new Error('No AI providers available. Set at least GEMINI_API_KEY.');
  }
  console.log(`[premium] active providers: ${providers.map((p) => p.name).join(', ')}`);
  if (providers.length < 3) {
    console.warn(`[premium] WARNING: only ${providers.length} provider(s) active. ` +
      `Premium consensus quality requires 3. Missing keys: ` +
      `${['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY']
        .filter((k) => !process.env[k]).join(', ') || 'none'}`);
  }

  // ---- Step 1: fetch ----
  const articles = await fetchAll({ newsApiKey: process.env.NEWSAPI_KEY });
  if (articles.length === 0) throw new Error('No articles fetched');
  console.log(`[premium] ${articles.length} articles in pool`);

  // ---- Step 2: selection by majority ----
  console.log('[premium] running selection (majority vote)...');
  const selection = await selectByMajority({
    articles,
    providers,
    edition,
    minCount: 4,
    maxCount: 7,
    minAgreement: 2,
  });
  console.log(`[premium] ${selection.selected.length} articles selected (min agreement: ${selection.minAgreementUsed})`);
  if (selection.selected.length === 0) {
    throw new Error('Consensus selected 0 articles — relax minAgreement or check models');
  }

  // ---- Step 3: per-article consensus summaries ----
  console.log('[premium] generating consensus summaries...');
  const summaries = [];
  for (const article of selection.selected) {
    try {
      const result = await summarizeByConsensus({ article, providers, edition });
      summaries.push({
        ...result.final,
        // Enrich with the source article's publishedAt for UI freshness display.
        objavljeno: article.publishedAt,
        _meta: {
          contributors: result.contributors,
          judge: result.judge || null,
          method: result.method,
        },
      });
      console.log(`  ✓ ${result.final.naslov?.slice(0, 80)} [${result.method}]`);
    } catch (err) {
      console.warn(`  ✗ skipped "${article.title.slice(0, 60)}": ${err.message}`);
    }
  }
  if (summaries.length === 0) {
    throw new Error('All summaries failed');
  }

  // ---- Step 4: master summary ----
  console.log('[premium] generating master summary...');
  const masterPrompt = buildMasterPrompt({ articles: summaries, edition });
  let masterText;
  try {
    // Use Claude for master (best at cohesive Slovenian prose).
    const { text } = await callClaude(masterPrompt);
    masterText = extractJson(text).master_povzetek;
  } catch (err) {
    if (err.code === 'PROVIDER_UNAVAILABLE') {
      console.warn('[premium] Claude unavailable, using first available provider for master');
      const { text } = await providers[0].call(masterPrompt);
      masterText = extractJson(text).master_povzetek;
    } else {
      throw err;
    }
  }
  console.log(`[premium] master summary: ${masterText.length} chars`);

  // ---- Step 5: TTS ----
  let audioPath = null;
  let audioUrl = null;
  try {
    console.log('[premium] synthesizing Slovenian audio...');
    const mp3 = await synthesizeSlovenian(masterText, { voice: 'sl-SI-Standard-A', rate: 1.0 });
    await mkdir(AUDIO_DIR, { recursive: true });
    audioPath = join(AUDIO_DIR, `${stamp}.mp3`);
    await writeFile(audioPath, mp3);
    audioUrl = `/data/premium/audio/${stamp}.mp3`;
    console.log(`[premium] audio: ${(mp3.length / 1024).toFixed(1)} KB -> ${audioPath}`);
  } catch (err) {
    if (err.code === 'PROVIDER_UNAVAILABLE') {
      console.warn('[premium] TTS unavailable (no GOOGLE_TTS_API_KEY) — skipping audio');
    } else {
      console.warn(`[premium] TTS failed: ${err.message} — continuing without audio`);
    }
  }

  // ---- Step 6: write JSON ----
  const out = {
    generiranoOb: new Date().toISOString(),
    izdaja: edition,
    tier: 'premium',
    providers_used: providers.map((p) => p.name),
    consensus: {
      selection_min_agreement: selection.minAgreementUsed,
      selection_ballots: selection.ballots.map((b) => ({
        provider: b.provider,
        model: b.model,
        picks_count: b.picks.length,
      })),
    },
    master_povzetek: masterText,
    audio_url: audioUrl,
    novice: summaries,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const editionPath = join(OUT_DIR, `${edition}.json`);
  const latestPath = join(OUT_DIR, 'latest.json');
  await writeFile(editionPath, JSON.stringify(out, null, 2), 'utf8');
  await writeFile(latestPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[premium] wrote ${summaries.length} items to ${editionPath}`);
  console.log(`[premium] === DONE ===`);
}

main().catch((err) => {
  console.error('[premium] FAILED:', err);
  process.exit(1);
});

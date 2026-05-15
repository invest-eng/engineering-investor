/**
 * Consensus logic for premium briefing.
 *
 * Strategy (chosen via user preference, 2026-05-11):
 *   - Selection: majority vote (>= 2 of 3 models pick the article).
 *   - Summary: all models write independently; a judge model produces the
 *     final summary using only facts mentioned by >= 2 models.
 */

import { extractJson } from './extract-json.mjs';
import { buildSelectorPrompt, buildSummaryPrompt, buildJudgePrompt } from './prompts.mjs';
import { callClaude } from './ai-providers.mjs';

/**
 * Selection: each provider picks article numbers. Returns articles
 * chosen by at least `minAgreement` providers.
 */
export async function selectByMajority({
  articles,
  providers,
  edition = 'daily',
  minCount = 4,
  maxCount = 7,
  minAgreement = 2,
}) {
  const prompt = buildSelectorPrompt({ articles, edition, minCount, maxCount });
  const votes = new Map(); // articleIndex -> Set<providerName>

  const results = await Promise.allSettled(
    providers.map(async (p) => {
      const { text, model } = await p.call(prompt);
      const parsed = extractJson(text);
      return { provider: p.name, model, picks: parsed.izbrane_stevilke || [], reason: parsed.obrazlozitev };
    })
  );

  const ballots = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      ballots.push(r.value);
      for (const num of r.value.picks) {
        const idx = num - 1;
        if (idx >= 0 && idx < articles.length) {
          if (!votes.has(idx)) votes.set(idx, new Set());
          votes.get(idx).add(r.value.provider);
        }
      }
    } else {
      console.warn(`[consensus] selector failed:`, r.reason?.message);
    }
  }

  if (ballots.length === 0) throw new Error('All selector models failed');

  // If only 1 provider available (free flow), drop minAgreement to 1.
  const effectiveMin = Math.min(minAgreement, ballots.length);

  const selectedIdx = [...votes.entries()]
    .filter(([, voters]) => voters.size >= effectiveMin)
    .map(([idx, voters]) => ({ idx, voters: voters.size }))
    .sort((a, b) => b.voters - a.voters || a.idx - b.idx)
    .slice(0, maxCount)
    .map(({ idx }) => idx);

  return {
    selected: selectedIdx.map((i) => articles[i]),
    ballots,
    minAgreementUsed: effectiveMin,
  };
}

/**
 * Generate consensus summary for a single article.
 * Each provider writes a summary; if >= 2 providers succeed, judge merges them.
 * If only 1 succeeds, returns that one directly.
 */
export async function summarizeByConsensus({ article, providers, edition = 'daily' }) {
  const prompt = buildSummaryPrompt({ article, edition });

  const results = await Promise.allSettled(
    providers.map(async (p) => {
      const { text, model } = await p.call(prompt);
      const summary = extractJson(text);
      return { provider: p.name, model, summary };
    })
  );

  const candidates = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);

  if (candidates.length === 0) {
    throw new Error('All summary providers failed for: ' + article.title);
  }

  // If only 1 candidate, return it directly.
  if (candidates.length === 1) {
    return {
      final: candidates[0].summary,
      contributors: [candidates[0].provider],
      method: 'single',
    };
  }

  // 2+ candidates -> judge merges.
  // Judge is Claude by default (best at structured reasoning); fall back to first available provider.
  const judgePrompt = buildJudgePrompt({ article, candidates });
  let judgeOutput;
  try {
    judgeOutput = await callClaude(judgePrompt);
  } catch (err) {
    if (err.code === 'PROVIDER_UNAVAILABLE') {
      // Fall back to the first available provider as judge.
      console.warn('[consensus] Claude judge unavailable, using first provider as judge');
      judgeOutput = await providers[0].call(judgePrompt);
    } else {
      throw err;
    }
  }

  const final = extractJson(judgeOutput.text);
  return {
    final,
    contributors: candidates.map((c) => c.provider),
    judge: judgeOutput.model,
    method: 'consensus',
  };
}

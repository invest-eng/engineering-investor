#!/usr/bin/env node
/**
 * Quick RSS fetch test — no API keys needed.
 * Shows how many fresh articles each source returns.
 *
 * Usage:  node scripts/test-rss.mjs
 */

import { fetchAll } from './lib/news-fetcher.mjs';

const articles = await fetchAll({ maxAgeHours: 24 });

console.log(`\n=== RSS TEST — skupaj ${articles.length} svezih clankov ===\n`);
for (const a of articles.slice(0, 20)) {
  const age = Math.round((Date.now() - Date.parse(a.publishedAt)) / 60000);
  console.log(`[${a.source}] ${age}min  ${a.title}`);
}
if (articles.length > 20) console.log(`... in se ${articles.length - 20} vec`);

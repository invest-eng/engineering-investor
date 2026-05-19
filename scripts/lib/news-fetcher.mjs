/**
 * News fetcher — RSS edition.
 *
 * Fetches from multiple free, no-key RSS feeds instead of NewsAPI.
 * Articles are available immediately (no 24h delay).
 *
 * RSS sources (all free, no API key required):
 *   - BBC Business
 *   - MarketWatch Top Stories
 *   - CNBC Finance
 *   - Reuters Business
 *   - Financial Times (free feed)
 *   - Al Jazeera Business
 *
 * The premium/ orchestrator calls fetchAll() identically — no changes needed there.
 *
 * --- PREMIUM EXPANSION (future) ---
 *   - Reuters Connect API   (paid, richer content)
 *   - Bloomberg API         (paid)
 *   - AP News API           (paid)
 */

import Parser from 'rss-parser';

const USER_AGENT = 'engineering-investor-briefing/1.0';

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',                                      source: 'BBC Business' },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories',                                 source: 'MarketWatch' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', source: 'CNBC' },
  { url: 'https://www.theguardian.com/business/rss',                                             source: 'The Guardian' },
  { url: 'https://www.ft.com/rss/home/uk',                                                       source: 'Financial Times' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml',                                            source: 'Al Jazeera' },
];

const parser = new Parser({
  headers: { 'User-Agent': USER_AGENT },
  timeout: 10000,
  customFields: { item: [['media:content', 'media']] },
});

export async function fetchRssFeeds(feeds = RSS_FEEDS) {
  const results = await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url);
      return (feed.items || []).map((item) => ({
        title: item.title || '',
        description: item.contentSnippet || item.summary || item.description || '',
        url: item.link || item.guid || '',
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        source,
      }));
    }),
  );

  const articles = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      console.log(`[news] ${RSS_FEEDS[i].source}: ${r.value.length} articles`);
      articles.push(...r.value);
    } else {
      console.warn(`[news] ${RSS_FEEDS[i].source}: failed — ${r.reason?.message}`);
    }
  }
  return articles;
}

// Kept for backwards-compatibility — premium scripts reference this name.
// newsApiKey is ignored (no longer needed).
export async function fetchNewsApi({ apiKey } = {}) {
  if (apiKey) console.warn('[news] NewsAPI key present but ignored — using RSS feeds now');
  return fetchRssFeeds();
}

/**
 * Unified fetcher. Returns deduplicated, optionally age-filtered articles.
 *
 * @param {object} opts
 * @param {string} [opts.newsApiKey]    Ignored (kept for API compatibility)
 * @param {number} [opts.maxAgeHours]   Drop articles older than this. Default 24h.
 */
export async function fetchAll({ newsApiKey, maxAgeHours = 24 } = {}) {
  const all = await fetchRssFeeds();

  // Deduplicate by URL.
  const seen = new Set();
  const unique = all.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Age filter.
  if (maxAgeHours > 0) {
    const cutoff = Date.now() - maxAgeHours * 3600 * 1000;
    const fresh = unique.filter((a) => {
      const t = Date.parse(a.publishedAt);
      return Number.isFinite(t) && t >= cutoff;
    });
    const dropped = unique.length - fresh.length;
    if (fresh.length > 0) {
      if (dropped > 0) console.log(`[news] dropped ${dropped} stale (>${maxAgeHours}h), ${fresh.length} fresh`);
      return fresh;
    }
    console.warn(`[news] 0 fresh within ${maxAgeHours}h — falling back to newest available`);
    return unique
      .map((a) => ({ a, t: Date.parse(a.publishedAt) || 0 }))
      .sort((x, y) => y.t - x.t)
      .slice(0, 10)
      .map((x) => x.a);
  }
  return unique;
}

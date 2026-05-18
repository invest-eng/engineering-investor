/**
 * News fetcher.
 *
 * Currently uses NewsAPI.org top-business-headlines (English).
 *
 * --- PREMIUM EXPANSION (future) ---
 * For wider coverage and better diversity:
 *   - Reuters API           (requires REUTERS_API_KEY)
 *   - Bloomberg API         (paid, requires BLOOMBERG_API_KEY)
 *   - AP News API           (requires AP_API_KEY)
 *   - Financial Times API   (requires FT_API_KEY)
 *   - GDELT (free, but messy)
 *
 * The orchestrator (premium/) will call fetchAll() to get a unified list.
 * Today only NewsAPI is wired up; other sources are stubbed with TODO.
 */

const USER_AGENT = 'engineering-investor-briefing/1.0';

export async function fetchNewsApi({ apiKey, pageSize = 50 } = {}) {
  if (!apiKey) throw new Error('NewsAPI key missing');
  const url = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=${pageSize}&apiKey=${apiKey}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`NewsAPI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(`NewsAPI status: ${JSON.stringify(data)}`);

  return (data.articles || [])
    .filter((a) => a.url && a.title && a.title !== '[Removed]')
    .map((a) => ({
      title: a.title,
      description: a.description || '',
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name || 'Unknown',
    }));
}

// --- PREMIUM: Reuters stub (not active, needs REUTERS_API_KEY) ---
export async function fetchReuters() {
  // TODO: implement when REUTERS_API_KEY is purchased.
  return [];
}

// --- PREMIUM: Bloomberg stub ---
export async function fetchBloomberg() {
  // TODO: implement when BLOOMBERG_API_KEY is purchased.
  return [];
}

/**
 * Unified fetcher. Currently returns only NewsAPI results.
 * Premium version will merge multiple sources and deduplicate.
 *
 * @param {object} opts
 * @param {string} opts.newsApiKey   NewsAPI key
 * @param {number} opts.maxAgeHours  Drop articles older than this. Default 24h.
 *                                   Free NewsAPI tier sometimes returns stale
 *                                   headlines; this guarantees freshness.
 */
export async function fetchAll({ newsApiKey, maxAgeHours = 24 } = {}) {
  const all = [];
  if (newsApiKey) {
    const items = await fetchNewsApi({ apiKey: newsApiKey });
    console.log(`[news] NewsAPI: ${items.length} articles`);
    all.push(...items);
  }
  // --- PREMIUM: add other sources here ---
  // if (process.env.REUTERS_API_KEY) all.push(...await fetchReuters());
  // if (process.env.BLOOMBERG_API_KEY) all.push(...await fetchBloomberg());

  // Deduplicate by URL.
  const seen = new Set();
  const unique = all.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Age filter — drop anything older than maxAgeHours.
  // Free NewsAPI tier delivers a delayed feed, so we may end up with 0 fresh
  // articles. In that case fall back to the newest available (UI then shows a
  // red "pred X dnevi" tag so it's visible they're stale).
  if (maxAgeHours && maxAgeHours > 0) {
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
    // Fallback: 0 fresh — take the 10 newest available so the briefing
    // still runs; UI will badge them as stale.
    console.warn(`[news] 0 fresh within ${maxAgeHours}h — falling back to newest available`);
    return unique
      .map((a) => ({ a, t: Date.parse(a.publishedAt) || 0 }))
      .sort((x, y) => y.t - x.t)
      .slice(0, 10)
      .map((x) => x.a);
  }
  return unique;
}

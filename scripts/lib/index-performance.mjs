/**
 * Fetches performance % for a curated set of indices and S&P 500 sector ETFs
 * across multiple time periods. Runs server-side (GitHub Actions) — no CORS.
 * Writes public/data/index-performance.json.
 */

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json',
};

export const INDICES = [
  { ticker: '^GSPC', label: 'S&P 500',       hasSectors: true },
  { ticker: '^NDX',  label: 'NASDAQ 100' },
  { ticker: '^DJI',  label: 'Dow Jones' },
  { ticker: '^RUT',  label: 'Russell 2000' },
  { ticker: 'XLV',   label: 'Zdravje (XLV)' },
  { ticker: 'ITA',   label: 'Obr. ind. (ITA)' },
  { ticker: 'XLF',   label: 'Finance (XLF)' },
  { ticker: 'XLE',   label: 'Energija (XLE)' },
  { ticker: 'DBB',   label: 'Kovine (DBB)' },
];

export const SECTORS = [
  { ticker: 'XLC',  label: 'Komunikacije' },
  { ticker: 'XLY',  label: 'Disk. potrošniki' },
  { ticker: 'XLP',  label: 'Nujni potrošniki' },
  { ticker: 'XLE',  label: 'Energija' },
  { ticker: 'XLF',  label: 'Finance' },
  { ticker: 'XLV',  label: 'Zdravje' },
  { ticker: 'XLI',  label: 'Industrija' },
  { ticker: 'XLK',  label: 'Tehnologija' },
  { ticker: 'XLB',  label: 'Materiali' },
  { ticker: 'XLRE', label: 'Nepremičnine' },
  { ticker: 'XLU',  label: 'Komunalno' },
];

const PERIODS = [
  { key: '1d',  range: '1d',   interval: '5m'  },
  { key: '5d',  range: '15d',  interval: '1d',  lastN: 5 },  // zadnjih 5 zaključenih dni
  { key: '1mo', range: '1mo',  interval: '1d'  },
  { key: '3mo', range: '3mo',  interval: '1d'  },
  { key: '6mo', range: '6mo',  interval: '1wk' },
  { key: 'ytd', range: 'ytd',  interval: '1wk' },
  { key: '1y',  range: '1y',   interval: '1wk' },
];

async function fetchPerf(ticker, range, interval, lastN = null) {
  try {
    const encoded = encodeURIComponent(ticker);
    const url = `${YF_BASE}/${encoded}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const rawCloses = result.indicators?.quote?.[0]?.close ?? [];
    const timestamps = result.timestamp ?? [];

    // Build pairs, drop nulls
    const pairs = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: rawCloses[i] }))
      .filter(d => d.close != null && isFinite(d.close));

    if (pairs.length < 2) return null;

    // Exclude today's partial trading session so intraday moves don't skew results
    const todayStr = new Date().toISOString().slice(0, 10);
    const completed = pairs[pairs.length - 1].date === todayStr ? pairs.slice(0, -1) : pairs;

    if (completed.length < 2) return null;

    // If lastN set (e.g. 5D), slice to last N completed days: start=N-th-from-last, end=last
    const slice = (lastN && completed.length >= lastN) ? completed.slice(-lastN) : completed;

    const start = slice[0].close;
    const end = slice[slice.length - 1].close;
    return ((end - start) / start) * 100;
  } catch {
    return null;
  }
}

async function fetchBatch(list, range, interval, lastN) {
  const results = await Promise.allSettled(
    list.map(item => fetchPerf(item.ticker, range, interval, lastN).then(perf => ({ ticker: item.ticker, perf })))
  );
  const map = {};
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.perf != null) {
      map[r.value.ticker] = parseFloat(r.value.perf.toFixed(3));
    }
  }
  return map;
}

export async function fetchIndexPerformance() {
  const out = {
    updatedAt: new Date().toISOString(),
    indices: {},
    sectors: {},
  };

  for (const p of PERIODS) {
    console.log(`[perf] fetching period ${p.key}…`);
    const [indexData, sectorData] = await Promise.all([
      fetchBatch(INDICES, p.range, p.interval, p.lastN),
      fetchBatch(SECTORS, p.range, p.interval, p.lastN),
    ]);
    out.indices[p.key] = indexData;
    out.sectors[p.key] = sectorData;
    await new Promise(r => setTimeout(r, 400));
  }

  return out;
}

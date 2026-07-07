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
  { key: '1d',  range: '1d',  interval: '5m' },
  { key: '5d',  range: '5d',  interval: '1d' },
  { key: '1mo', range: '1mo', interval: '1d' },
  { key: '3mo', range: '3mo', interval: '1d' },
  { key: '6mo', range: '6mo', interval: '1wk' },
  { key: 'ytd', range: 'ytd', interval: '1wk' },
  { key: '1y',  range: '1y',  interval: '1wk' },
];

async function fetchPerf(ticker, range, interval) {
  try {
    const encoded = encodeURIComponent(ticker);
    const url = `${YF_BASE}/${encoded}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const closes = result.indicators?.quote?.[0]?.close?.filter(v => v != null && isFinite(v));
    if (!closes?.length || closes.length < 2) return null;
    return ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
  } catch {
    return null;
  }
}

async function fetchBatch(list, range, interval) {
  const results = await Promise.allSettled(
    list.map(item => fetchPerf(item.ticker, range, interval).then(perf => ({ ticker: item.ticker, perf })))
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
      fetchBatch(INDICES, p.range, p.interval),
      fetchBatch(SECTORS, p.range, p.interval),
    ]);
    out.indices[p.key] = indexData;
    out.sectors[p.key] = sectorData;
    await new Promise(r => setTimeout(r, 400));
  }

  return out;
}

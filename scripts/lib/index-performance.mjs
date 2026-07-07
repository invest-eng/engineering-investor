/**
 * Fetches performance % for a curated set of indices and S&P 500 sector ETFs
 * across multiple time periods. Runs server-side (GitHub Actions) — no CORS.
 * Writes public/data/index-performance.json.
 *
 * Start-date convention matches SSGA:
 *   - End   = last completed trading day (yesterday, adjusted back if weekend)
 *   - Start = calendar offset from end, adjusted back if weekend/holiday
 *   - 5D    = last 5 completed trading days (kept as lastN logic, already verified vs SSGA)
 *   - 1D    = today's intraday (5m bars)
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

// Move date back to the nearest preceding weekday (Mon–Fri)
function prevWeekday(d) {
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 0) d.setDate(d.getDate() - 2);
  else if (day === 6) d.setDate(d.getDate() - 1);
  return d;
}

// Last completed trading day (yesterday, or Friday if today is Mon/Sun)
function getEndDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return prevWeekday(d);
}

// Start date for a period key, relative to end date — matches SSGA convention
function getStartDate(end, periodKey) {
  const d = new Date(end);
  switch (periodKey) {
    case '1mo': d.setMonth(d.getMonth() - 1);      break;
    case '3mo': d.setMonth(d.getMonth() - 3);      break;
    case '6mo': d.setMonth(d.getMonth() - 6);      break;
    case 'ytd': d.setMonth(0); d.setDate(1);       break;  // Jan 1 same year
    case '1y':  d.setFullYear(d.getFullYear() - 1); break;
    default: return null;
  }
  return prevWeekday(d);
}

// Unix seconds (midnight UTC for a date)
function toUnix(d) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return Math.floor(copy.getTime() / 1000);
}

// 1D intraday: range param (today's session)
async function fetchPerf1D(ticker) {
  try {
    const encoded = encodeURIComponent(ticker);
    const url = `${YF_BASE}/${encoded}?range=1d&interval=5m`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const meta = result.meta ?? {};
    // previousClose is the official prior day close (use as start)
    const prevClose = meta.chartPreviousClose ?? meta.previousClose;
    const lastClose = closes.filter(c => c != null && isFinite(c)).at(-1);
    if (!prevClose || !lastClose) return null;
    return ((lastClose - prevClose) / prevClose) * 100;
  } catch {
    return null;
  }
}

// 5D: last 5 completed trading days (already verified vs SSGA)
async function fetchPerf5D(ticker) {
  try {
    const encoded = encodeURIComponent(ticker);
    const url = `${YF_BASE}/${encoded}?range=15d&interval=1d`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const rawCloses = result.indicators?.quote?.[0]?.close ?? [];
    const timestamps = result.timestamp ?? [];
    const todayStr = new Date().toISOString().slice(0, 10);

    const pairs = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: rawCloses[i] }))
      .filter(d => d.close != null && isFinite(d.close));

    const completed = pairs.at(-1)?.date === todayStr ? pairs.slice(0, -1) : pairs;
    if (completed.length < 5) return null;

    const slice = completed.slice(-5);
    return ((slice.at(-1).close - slice[0].close) / slice[0].close) * 100;
  } catch {
    return null;
  }
}

// Multi-day periods: explicit period1/period2 dates to match SSGA start dates exactly
async function fetchPerfDateRange(ticker, startDate, endDate, interval) {
  try {
    // Add 1 day to period2 so the end date itself is included by Yahoo
    const p2 = new Date(endDate);
    p2.setDate(p2.getDate() + 1);

    const encoded = encodeURIComponent(ticker);
    const url = `${YF_BASE}/${encoded}?period1=${toUnix(startDate)}&period2=${toUnix(p2)}&interval=${interval}`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const rawCloses = result.indicators?.quote?.[0]?.close ?? [];
    const timestamps = result.timestamp ?? [];

    const pairs = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: rawCloses[i] }))
      .filter(d => d.close != null && isFinite(d.close));

    if (pairs.length < 2) return null;

    // Use first and last data point (Yahoo already constrains to the date window)
    const startClose = pairs[0].close;
    const endClose = pairs.at(-1).close;
    return ((endClose - startClose) / startClose) * 100;
  } catch {
    return null;
  }
}

async function fetchBatch1D(list) {
  const results = await Promise.allSettled(
    list.map(item => fetchPerf1D(item.ticker).then(perf => ({ ticker: item.ticker, perf })))
  );
  return buildMap(results);
}

async function fetchBatch5D(list) {
  const results = await Promise.allSettled(
    list.map(item => fetchPerf5D(item.ticker).then(perf => ({ ticker: item.ticker, perf })))
  );
  return buildMap(results);
}

async function fetchBatchDateRange(list, startDate, endDate, interval) {
  const results = await Promise.allSettled(
    list.map(item =>
      fetchPerfDateRange(item.ticker, startDate, endDate, interval)
        .then(perf => ({ ticker: item.ticker, perf }))
    )
  );
  return buildMap(results);
}

function buildMap(results) {
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

  const end = getEndDate();
  console.log(`[perf] end date: ${end.toISOString().slice(0, 10)}`);

  // 1D — intraday, uses meta.chartPreviousClose as start
  console.log('[perf] fetching 1D…');
  const [idx1d, sec1d] = await Promise.all([fetchBatch1D(INDICES), fetchBatch1D(SECTORS)]);
  out.indices['1d'] = idx1d;
  out.sectors['1d'] = sec1d;
  await new Promise(r => setTimeout(r, 400));

  // 5D — last 5 completed trading days (verified vs SSGA)
  console.log('[perf] fetching 5D…');
  const [idx5d, sec5d] = await Promise.all([fetchBatch5D(INDICES), fetchBatch5D(SECTORS)]);
  out.indices['5d'] = idx5d;
  out.sectors['5d'] = sec5d;
  await new Promise(r => setTimeout(r, 400));

  // Remaining periods: explicit date range matching SSGA convention
  const multiPeriods = [
    { key: '1mo', interval: '1d'  },
    { key: '3mo', interval: '1d'  },
    { key: '6mo', interval: '1wk' },
    { key: 'ytd', interval: '1wk' },
    { key: '1y',  interval: '1wk' },
  ];

  for (const p of multiPeriods) {
    const start = getStartDate(end, p.key);
    console.log(`[perf] fetching ${p.key} (${start.toISOString().slice(0,10)} → ${end.toISOString().slice(0,10)})…`);
    const [idxData, secData] = await Promise.all([
      fetchBatchDateRange(INDICES, start, end, p.interval),
      fetchBatchDateRange(SECTORS, start, end, p.interval),
    ]);
    out.indices[p.key] = idxData;
    out.sectors[p.key] = secData;
    await new Promise(r => setTimeout(r, 400));
  }

  return out;
}

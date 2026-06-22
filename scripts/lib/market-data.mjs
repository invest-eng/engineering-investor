/**
 * Free market data fetcher — Yahoo Finance v8 chart API, no key required.
 *
 * Uses the /v8/finance/chart/{symbol} endpoint (one request per symbol, run
 * in parallel). v6/v7 quote endpoints require auth since 2024; v8 chart works
 * without a cookie or API key.
 *
 * Change percent is calculated from regularMarketPrice vs chartPreviousClose
 * since the meta block does not always include regularMarketChangePercent.
 *
 * Gracefully returns null if all fetches fail — briefing generation continues
 * without market data rather than crashing.
 */

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json',
};

const SYMBOLS = {
  indeksi: [
    { simbol: '^GSPC',  ime: 'S&P 500' },
    { simbol: '^NDX',   ime: 'Nasdaq 100' },
    { simbol: '^GDAXI', ime: 'DAX' },
    { simbol: '^N225',  ime: 'Nikkei 225' },
  ],
  surovine: [
    { simbol: 'GC=F',  ime: 'Zlato',       enota: 'USD/oz' },
    { simbol: 'CL=F',  ime: 'WTI nafta',   enota: 'USD/sod' },
    { simbol: 'BZ=F',  ime: 'Brent nafta', enota: 'USD/sod' },
  ],
  forex: [
    { simbol: 'EURUSD=X', ime: 'EUR/USD' },
  ],
  obveznice: [
    { simbol: '^TNX', ime: '10Y US Treasury', enota: '%' },
  ],
  kripto: [
    { simbol: 'BTC-USD', ime: 'Bitcoin', enota: 'USD' },
  ],
  volatilnost: [
    { simbol: '^VIX', ime: 'VIX' },
  ],
};

const ALL_SYMBOLS = [
  ...SYMBOLS.indeksi,
  ...SYMBOLS.surovine,
  ...SYMBOLS.forex,
  ...SYMBOLS.obveznice,
  ...SYMBOLS.kripto,
  ...SYMBOLS.volatilnost,
];

async function fetchQuote(meta) {
  const encoded = encodeURIComponent(meta.simbol);
  const url = `${YF_BASE}/${encoded}?range=1d&interval=1d`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const m = json?.chart?.result?.[0]?.meta;
  if (!m?.regularMarketPrice) throw new Error('no price in response');

  const price = m.regularMarketPrice;
  const prev  = m.chartPreviousClose ?? m.regularMarketPreviousClose;
  const pct   = prev ? ((price - prev) / prev) * 100 : null;

  return {
    simbol: meta.simbol,
    ime: meta.ime,
    vrednost: Math.round(price * 10000) / 10000,
    sprememba_pct: pct != null ? Math.round(pct * 100) / 100 : null,
    ...(meta.enota ? { enota: meta.enota } : {}),
  };
}

export async function fetchMarketData() {
  const results = await Promise.allSettled(ALL_SYMBOLS.map(fetchQuote));

  const quoteMap = new Map();
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      quoteMap.set(ALL_SYMBOLS[i].simbol, r.value);
    } else {
      console.warn(`[market] ${ALL_SYMBOLS[i].simbol}: ${r.reason?.message}`);
    }
  }

  if (quoteMap.size === 0) {
    console.warn('[market] all symbols failed — returning null');
    return null;
  }

  const pick = (list) => list.map((m) => quoteMap.get(m.simbol)).filter(Boolean);

  const trgi = {
    posodobljenoOb: new Date().toISOString(),
    indeksi:   pick(SYMBOLS.indeksi),
    surovine:  pick(SYMBOLS.surovine),
    forex:     pick(SYMBOLS.forex),
    obveznice: pick(SYMBOLS.obveznice),
    kripto:    pick(SYMBOLS.kripto),
    vix:       pick(SYMBOLS.volatilnost)[0] ?? null,
  };

  console.log(`[market] ${quoteMap.size}/${ALL_SYMBOLS.length} instruments fetched`);
  return trgi;
}

/**
 * Formats market data as a structured text block for injection into AI prompts.
 */
export function formatMarketDataForPrompt(trgi) {
  if (!trgi) return '';

  const pct = (v) => {
    if (v == null) return '';
    const sign = v >= 0 ? '+' : '';
    return ` (${sign}${v.toFixed(2)} %)`;
  };
  const fmtNum = (v, d = 2) => (v != null ? v.toFixed(d) : 'N/A');

  const lines = ['=== TRZNI SNAPSHOT (dejanski podatki) ==='];

  if (trgi.indeksi?.length) {
    lines.push('\nBorzni indeksi:');
    for (const i of trgi.indeksi) {
      lines.push(`  ${i.ime}: ${fmtNum(i.vrednost, 0)}${pct(i.sprememba_pct)}`);
    }
  }
  if (trgi.surovine?.length) {
    lines.push('\nSurovine:');
    for (const s of trgi.surovine) {
      lines.push(`  ${s.ime}: ${fmtNum(s.vrednost, 2)} ${s.enota ?? ''}${pct(s.sprememba_pct)}`);
    }
  }
  if (trgi.forex?.length) {
    lines.push('\nDevizni tecaji:');
    for (const f of trgi.forex) {
      lines.push(`  ${f.ime}: ${fmtNum(f.vrednost, 4)}${pct(f.sprememba_pct)}`);
    }
  }
  if (trgi.obveznice?.length) {
    lines.push('\nObvezniske donosnosti:');
    for (const o of trgi.obveznice) {
      lines.push(`  ${o.ime}: ${fmtNum(o.vrednost, 2)} %${pct(o.sprememba_pct)}`);
    }
  }
  if (trgi.kripto?.length) {
    lines.push('\nKripto:');
    for (const k of trgi.kripto) {
      lines.push(`  ${k.ime}: ${fmtNum(k.vrednost, 0)} ${k.enota ?? ''}${pct(k.sprememba_pct)}`);
    }
  }
  if (trgi.vix) {
    lines.push(`\nVIX (volatilnost trga): ${fmtNum(trgi.vix.vrednost, 2)}${pct(trgi.vix.sprememba_pct)}`);
  }

  lines.push('\n==========================================');
  return lines.join('\n');
}

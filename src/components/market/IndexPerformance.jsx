import { useEffect, useState } from 'react';

const INDICES = [
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

const SECTORS = [
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
  { key: '1d',  label: '1D' },
  { key: '5d',  label: '1T' },
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: 'ytd', label: 'YTD' },
  { key: '1y',  label: '1L' },
];

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart({ items, onSelect, selected }) {
  const values = items.map(i => i.perf).filter(v => v != null && isFinite(v));
  if (values.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
      Podatki se nalagajo…
    </div>
  );

  const maxVal = Math.max(...values, 0.5);
  const minVal = Math.min(...values, -0.5);
  const range = maxVal - minVal || 1;

  const PAD_TOP = 36;    // space for positive labels
  const PAD_BOT = 52;    // space for ticker labels
  const CHART_H = 200;
  const TOTAL_H = PAD_TOP + CHART_H + PAD_BOT;
  const BAR_W = 38;
  const GAP = 18;
  const ITEM_W = BAR_W + GAP;
  const TOTAL_W = items.length * ITEM_W - GAP;

  const zeroY = PAD_TOP + (maxVal / range) * CHART_H;

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
        width={TOTAL_W}
        height={TOTAL_H}
        style={{ display: 'block', minWidth: TOTAL_W }}
      >
        {/* zero line */}
        <line
          x1={0} y1={zeroY} x2={TOTAL_W} y2={zeroY}
          stroke="var(--color-border-strong)" strokeWidth={1}
        />

        {items.map((item, i) => {
          const cx = i * ITEM_W + BAR_W / 2;
          const pct = item.perf;
          const isSelected = selected === item.ticker;

          if (pct == null || !isFinite(pct)) {
            return (
              <g key={item.ticker}>
                <text x={cx} y={TOTAL_H - 4} textAnchor="middle" fontSize={9} fill="var(--color-text-subtle)">
                  {item.shortLabel || item.label.split(' ')[0]}
                </text>
              </g>
            );
          }

          const barH = Math.abs((pct / range) * CHART_H);
          const barY = pct >= 0 ? zeroY - barH : zeroY;
          const color = pct >= 0 ? '#059669' : '#dc2626';
          const labelY = pct >= 0 ? barY - 5 : barY + barH + 12;
          const sign = pct >= 0 ? '+' : '';

          return (
            <g
              key={item.ticker}
              onClick={() => onSelect && onSelect(item.ticker)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <rect
                x={i * ITEM_W} y={barY}
                width={BAR_W} height={Math.max(barH, 2)}
                fill={color}
                opacity={isSelected ? 1 : 0.75}
                rx={3}
              />
              {isSelected && (
                <rect
                  x={i * ITEM_W - 2} y={barY - 2}
                  width={BAR_W + 4} height={Math.max(barH, 2) + 4}
                  fill="none" stroke={color} strokeWidth={2} rx={4}
                />
              )}
              <text x={cx} y={labelY} textAnchor="middle" fontSize={10} fill={color} fontWeight={600}>
                {sign}{pct.toFixed(1)}%
              </text>
              <text
                x={cx} y={TOTAL_H - 34}
                textAnchor="middle" fontSize={9.5}
                fill={isSelected ? 'var(--color-text)' : 'var(--color-text-muted)'}
                fontWeight={isSelected ? 700 : 400}
              >
                {item.shortLabel || item.label.split(/[\s(]/)[0]}
              </text>
              <text x={cx} y={TOTAL_H - 20} textAnchor="middle" fontSize={8.5} fill="var(--color-text-subtle)">
                {item.sub || ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Period tab ─────────────────────────────────────────────────────────────────

function PeriodTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.3rem 0.7rem',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: active ? 'var(--color-text)' : 'transparent',
        color: active ? 'var(--color-bg)' : 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 120ms ease',
      }}
    >
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function IndexPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('ytd');
  const [showSectors, setShowSectors] = useState(false);

  useEffect(() => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    fetch(`${base}/data/index-performance.json`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { setData(json); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  const indexItems = INDICES.map(idx => ({
    ...idx,
    perf: data?.indices?.[period]?.[idx.ticker] ?? null,
    shortLabel: idx.label.split(/[\s(]/)[0],
    sub: idx.ticker.startsWith('^') ? '' : idx.ticker,
  }));

  const sectorItems = SECTORS.map(sec => ({
    ...sec,
    perf: data?.sectors?.[period]?.[sec.ticker] ?? null,
    shortLabel: sec.label.split(' ')[0],
    sub: sec.ticker,
  }));

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleString('sl-SI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{ padding: '3.5rem 0 5rem', minHeight: '70vh' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 0.4rem', color: 'var(--color-text)' }}>
            Tržni pregled
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Primerjava donosnosti indeksov in S&P 500 sektorjev
            {updatedAt && <> · posodobljeno {updatedAt}</>}
          </p>
        </header>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 4, width: 'fit-content' }}>
          {PERIODS.map(p => (
            <PeriodTab key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} />
          ))}
        </div>

        {loading && (
          <div style={{ color: 'var(--color-text-muted)', padding: '3rem 0', textAlign: 'center' }}>
            Nalagam podatke…
          </div>
        )}

        {error && (
          <div style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Podatkov ni mogoče naložiti. GitHub Actions jih posodablja vsaki 2 uri med trading urami.
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* View toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setShowSectors(false)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: 4, fontSize: 'var(--text-sm)', fontWeight: 500,
                  border: '1px solid ' + (!showSectors ? 'var(--color-text)' : 'var(--color-border)'),
                  background: !showSectors ? 'var(--color-text)' : 'transparent',
                  color: !showSectors ? 'var(--color-bg)' : 'var(--color-text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Indeksi & ETF
              </button>
              <button
                onClick={() => setShowSectors(true)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: 4, fontSize: 'var(--text-sm)', fontWeight: 500,
                  border: '1px solid ' + (showSectors ? 'var(--color-text)' : 'var(--color-border)'),
                  background: showSectors ? 'var(--color-text)' : 'transparent',
                  color: showSectors ? 'var(--color-bg)' : 'var(--color-text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Sektorji S&P 500
              </button>
            </div>

            {/* Chart */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem 1.5rem 1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-subtle)', marginBottom: '1.25rem' }}>
                {showSectors ? 'Sektorji S&P 500' : 'Indeksi & sektorski ETF'} — {PERIODS.find(p => p.key === period)?.label}
              </div>

              <BarChart
                items={showSectors ? sectorItems : indexItems}
                onSelect={!showSectors ? (ticker) => { if (ticker === '^GSPC') setShowSectors(true); } : null}
                selected={null}
              />

              {!showSectors && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)', marginTop: '0.75rem', marginBottom: 0 }}>
                  Klikni na <strong>S&P 500</strong> za pregled po sektorjih.
                </p>
              )}
            </div>

            {/* Table */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {showSectors ? 'Sektor' : 'Indeks / ETF'}
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {PERIODS.find(p => p.key === period)?.label}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(showSectors ? sectorItems : indexItems)
                    .filter(i => i.perf != null)
                    .sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0))
                    .map((item, i) => {
                      const color = (item.perf ?? 0) >= 0 ? '#059669' : '#dc2626';
                      const sign = (item.perf ?? 0) >= 0 ? '+' : '';
                      return (
                        <tr key={item.ticker} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.65rem 1rem', color: 'var(--color-text)', fontWeight: 500 }}>
                            {item.label}
                            <span style={{ marginLeft: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-mono)' }}>
                              {item.ticker}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {sign}{item.perf.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: '1.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)', lineHeight: 1.6 }}>
              Vir: Yahoo Finance. Podatki so okvirni in z zamudo — niso namenjeni za trading odločitve.
              Posodablja se samodejno vsaki 2 uri med trgovalnimi urami (pon–pet).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

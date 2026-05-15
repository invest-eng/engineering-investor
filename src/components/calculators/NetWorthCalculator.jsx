import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ei-networth-v1';

const ASSET_GROUPS = [
  {
    id: 'cash', label: 'Gotovina in bančni računi', icon: '💵', liquid: true,
    defaults: [
      { name: 'TRR / tekoči račun', value: 0 },
      { name: 'Varčevalni račun', value: 0 },
      { name: 'Gotovina', value: 0 },
    ],
  },
  {
    id: 'investments', label: 'Naložbe (delnice, ETF, skladi)', icon: '📈', liquid: true,
    defaults: [
      { name: 'IBKR / Trading212 / drug broker', value: 0 },
      { name: 'INR (Ilirika)', value: 0 },
      { name: 'Vzajemni skladi', value: 0 },
    ],
  },
  {
    id: 'crypto', label: 'Kriptovalute', icon: '₿', liquid: true,
    defaults: [
      { name: 'Bitcoin', value: 0 },
      { name: 'Ethereum', value: 0 },
      { name: 'Ostalo', value: 0 },
    ],
  },
  {
    id: 'retirement', label: 'Pokojninsko varčevanje', icon: '🏦', liquid: false,
    defaults: [
      { name: 'II. steber (PDPZ)', value: 0 },
      { name: 'III. steber (PPS)', value: 0 },
    ],
  },
  {
    id: 'realestate', label: 'Nepremičnine', icon: '🏠', liquid: false,
    defaults: [
      { name: 'Primarno bivališče', value: 0 },
      { name: 'Investicijska nepremičnina', value: 0 },
    ],
  },
  {
    id: 'vehicles', label: 'Vozila', icon: '🚗', liquid: false,
    defaults: [
      { name: 'Avtomobil', value: 0 },
    ],
  },
  {
    id: 'precious', label: 'Žlahtne kovine in dragocenosti', icon: '🥇', liquid: true,
    defaults: [
      { name: 'Zlato (fizično)', value: 0 },
      { name: 'Srebro', value: 0 },
    ],
  },
  {
    id: 'other_assets', label: 'Druga sredstva', icon: '📦', liquid: false,
    defaults: [
      { name: 'Posojila drugim', value: 0 },
    ],
  },
];

const LIABILITY_GROUPS = [
  {
    id: 'mortgage', label: 'Stanovanjski kredit', icon: '🏘️',
    defaults: [{ name: 'Preostala glavnica', value: 0 }],
  },
  {
    id: 'consumer', label: 'Potrošniški in avto krediti', icon: '🚙',
    defaults: [
      { name: 'Avtomobilski kredit', value: 0 },
      { name: 'Osebni kredit', value: 0 },
    ],
  },
  {
    id: 'cards', label: 'Kreditne kartice in limit', icon: '💳',
    defaults: [{ name: 'Negativno stanje', value: 0 }],
  },
  {
    id: 'other_liabilities', label: 'Druge obveznosti', icon: '📄',
    defaults: [
      { name: 'Neporavnani davki', value: 0 },
      { name: 'Dolg drugim', value: 0 },
    ],
  },
];

const ASSET_COLORS = {
  cash: '#059669',
  investments: '#2563eb',
  crypto: '#d97706',
  retirement: '#a855f7',
  realestate: '#db2777',
  vehicles: '#ea580c',
  precious: '#ca8a04',
  other_assets: '#64748b',
};

function emptyState() {
  const assets = {};
  const liabilities = {};
  ASSET_GROUPS.forEach((g) => { assets[g.id] = g.defaults.map((d) => ({ ...d })); });
  LIABILITY_GROUPS.forEach((g) => { liabilities[g.id] = g.defaults.map((d) => ({ ...d })); });
  return { assets, liabilities };
}

function loadState() {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const base = emptyState();
    return {
      assets: { ...base.assets, ...(parsed.assets || {}) },
      liabilities: { ...base.liabilities, ...(parsed.liabilities || {}) },
    };
  } catch {
    return emptyState();
  }
}

function fmtEur(n) {
  return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function sumGroup(rows) {
  return (rows || []).reduce((s, r) => s + (Number(r.value) || 0), 0);
}

function PieChart({ slices, size = 220 }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '2px dashed var(--color-border)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-subtle)', fontSize: '0.85rem', textAlign: 'center', padding: 16,
      }}>
        Vnesi sredstva za prikaz strukture
      </div>
    );
  }
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  let acc = 0;
  const paths = slices.filter((s) => s.value > 0).map((s, i) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return <path key={i} d={d} fill={s.color} stroke="var(--color-bg)" strokeWidth="1.5" />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {paths}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--color-surface)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="var(--color-text-subtle)" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Sredstva
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-text)">
        {fmtEur(total)}
      </text>
    </svg>
  );
}

function Row({ row, onChange, onRemove, canRemove }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 32px', gap: 8, alignItems: 'center' }}>
      <input
        type="text"
        value={row.name}
        onChange={(e) => onChange({ ...row, name: e.target.value })}
        placeholder="Naziv postavke"
        style={inputStyle}
      />
      <input
        type="number"
        inputMode="decimal"
        value={row.value === 0 ? '' : row.value}
        onChange={(e) => onChange({ ...row, value: e.target.value === '' ? 0 : Number(e.target.value) })}
        placeholder="0"
        style={{ ...inputStyle, textAlign: 'right' }}
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        title="Odstrani vrstico"
        aria-label="Odstrani vrstico"
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: '1px solid var(--color-border)',
          background: 'transparent',
          color: canRemove ? 'var(--color-text-muted)' : 'var(--color-text-subtle)',
          cursor: canRemove ? 'pointer' : 'not-allowed',
          fontSize: '1rem',
          opacity: canRemove ? 1 : 0.4,
        }}
      >
        ×
      </button>
    </div>
  );
}

const inputStyle = {
  padding: '0.55rem 0.75rem',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
};

function Section({ title, group, rows, onChange, total, accentColor }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '1.1rem 1.3rem 1.2rem',
      marginBottom: '0.85rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '0.85rem' }}>
        <strong style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>{group.label}</strong>
        <strong style={{ color: accentColor || 'var(--color-text)', fontSize: '0.95rem' }}>
          {fmtEur(total)}
        </strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, idx) => (
          <Row
            key={idx}
            row={row}
            onChange={(updated) => {
              const next = [...rows];
              next[idx] = updated;
              onChange(next);
            }}
            onRemove={() => {
              const next = rows.filter((_, i) => i !== idx);
              onChange(next);
            }}
            canRemove={rows.length > 1}
          />
        ))}
      </div>

      <button
        onClick={() => onChange([...rows, { name: '', value: 0 }])}
        style={{
          marginTop: '0.85rem',
          padding: '0.4rem 0.85rem',
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--color-accent)',
          background: 'transparent',
          border: '1px dashed var(--color-border)',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        + dodaj vrstico
      </button>
    </div>
  );
}

function Kpi({ label, value, color, hint }) {
  return (
    <div style={{
      padding: '0.85rem 1rem',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 6,
    }}>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: color || 'var(--color-text)', marginTop: 4, letterSpacing: '-0.015em' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export default function NetWorthCalculator() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const updateAssets = (groupId, rows) => setState((s) => ({ ...s, assets: { ...s.assets, [groupId]: rows } }));
  const updateLiabilities = (groupId, rows) => setState((s) => ({ ...s, liabilities: { ...s.liabilities, [groupId]: rows } }));

  const totals = useMemo(() => {
    const assetTotals = ASSET_GROUPS.map((g) => ({ ...g, total: sumGroup(state.assets[g.id]) }));
    const liabTotals = LIABILITY_GROUPS.map((g) => ({ ...g, total: sumGroup(state.liabilities[g.id]) }));
    const totalAssets = assetTotals.reduce((s, g) => s + g.total, 0);
    const totalLiabilities = liabTotals.reduce((s, g) => s + g.total, 0);
    const liquid = assetTotals.filter((g) => g.liquid).reduce((s, g) => s + g.total, 0);
    const illiquid = totalAssets - liquid;
    const netWorth = totalAssets - totalLiabilities;
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    return { assetTotals, liabTotals, totalAssets, totalLiabilities, liquid, illiquid, netWorth, debtRatio };
  }, [state]);

  const slices = totals.assetTotals
    .filter((g) => g.total > 0)
    .map((g) => ({ label: g.label, value: g.total, color: ASSET_COLORS[g.id] || '#94a3b8' }));

  const handleReset = () => {
    if (confirm('Ponastavi vse vrednosti? Tega ni mogoče razveljaviti.')) {
      setState(emptyState());
    }
  };

  return (
    <div style={{ padding: '3rem 0 4rem', minHeight: '70vh' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 1.25rem' }}>

        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem',
            color: 'var(--color-text)',
          }}>
            Kalkulator neto vrednosti
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, maxWidth: 680 }}>
            Vnesi vrednosti svojih sredstev in obveznosti. Izračun je takojšen, podatki ostanejo lokalno v tvojem brskalniku.
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '1.75rem',
          alignItems: 'flex-start',
        }} className="nw-grid">

          <div>
            <h2 style={sectionTitleStyle}>Sredstva</h2>
            {ASSET_GROUPS.map((g) => (
              <Section
                key={g.id}
                group={g}
                rows={state.assets[g.id]}
                onChange={(rows) => updateAssets(g.id, rows)}
                total={sumGroup(state.assets[g.id])}
                accentColor={ASSET_COLORS[g.id]}
              />
            ))}

            <h2 style={{ ...sectionTitleStyle, marginTop: '2.25rem' }}>Obveznosti</h2>
            {LIABILITY_GROUPS.map((g) => (
              <Section
                key={g.id}
                group={g}
                rows={state.liabilities[g.id]}
                onChange={(rows) => updateLiabilities(g.id, rows)}
                total={sumGroup(state.liabilities[g.id])}
                accentColor="#dc2626"
              />
            ))}

            <button
              onClick={handleReset}
              style={{
                marginTop: '1.5rem',
                padding: '0.55rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Ponastavi kalkulator
            </button>
          </div>

          <aside style={{
            position: 'sticky',
            top: '1rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '1.5rem',
          }} className="nw-sidebar">
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                Neto vrednost
              </div>
              <div style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.4rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginTop: 6,
                color: totals.netWorth >= 0 ? 'var(--color-text)' : '#dc2626',
              }}>
                {fmtEur(totals.netWorth)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: 4 }}>
                Sredstva − obveznosti
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <PieChart slices={slices} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.25rem' }}>
              {slices.length > 0 ? slices
                .sort((a, b) => b.value - a.value)
                .map((s) => {
                  const pct = (s.value / totals.totalAssets) * 100;
                  return (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flex: 'none' }} />
                      <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>{s.label}</span>
                      <span style={{ color: 'var(--color-text-subtle)' }}>{pct.toFixed(0)}%</span>
                      <span style={{ minWidth: 70, textAlign: 'right', color: 'var(--color-text)' }}>{fmtEur(s.value)}</span>
                    </div>
                  );
                }) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)', textAlign: 'center', padding: '0.5rem 0' }}>
                    Še ni vnešenih sredstev.
                  </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Kpi label="Sredstva" value={fmtEur(totals.totalAssets)} color="#059669" />
              <Kpi label="Obveznosti" value={fmtEur(totals.totalLiabilities)} color="#dc2626" />
              <Kpi
                label="Likvidno"
                value={fmtEur(totals.liquid)}
                hint={totals.totalAssets > 0 ? `${((totals.liquid / totals.totalAssets) * 100).toFixed(0)}% sredstev` : '—'}
              />
              <Kpi
                label="Nelikvidno"
                value={fmtEur(totals.illiquid)}
                hint={totals.totalAssets > 0 ? `${((totals.illiquid / totals.totalAssets) * 100).toFixed(0)}% sredstev` : '—'}
              />
              <Kpi
                label="Razmerje dolga"
                value={`${totals.debtRatio.toFixed(0)}%`}
                color={totals.debtRatio > 50 ? '#dc2626' : totals.debtRatio > 30 ? '#d97706' : '#059669'}
                hint="Obveznosti / sredstva"
              />
              <Kpi
                label="Brez dolga"
                value={fmtEur(totals.totalAssets - totals.totalLiabilities)}
                hint="Če bi danes poplačal vse"
              />
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', lineHeight: 1.6, marginTop: '1.25rem', marginBottom: 0, textAlign: 'center' }}>
              Podatki ostanejo lokalno v tvojem brskalniku. Kalkulator je informativne narave in ni finančni nasvet.
            </p>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .nw-grid { grid-template-columns: 1fr !important; }
          .nw-sidebar { position: static !important; }
        }
      `}</style>
    </div>
  );
}

const sectionTitleStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-subtle)',
  margin: '0 0 0.85rem',
};

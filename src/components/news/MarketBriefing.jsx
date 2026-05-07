import { useEffect, useMemo, useState } from 'react';

const SECTORS = [
  'Tehnologija & AI',
  'Energetika',
  'Finance',
  'Potrošniki',
  'Makro & Centralne banke',
];

const SECTOR_COLOR = {
  'Tehnologija & AI':       { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#60a5fa' },
  'Energetika':             { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  text: '#fbbf24' },
  'Finance':                { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  text: '#34d399' },
  'Potrošniki':             { bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.35)',  text: '#f472b6' },
  'Makro & Centralne banke':{ bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  text: '#a78bfa' },
};

const DIRECTION = {
  pozitivno: { icon: '▲', color: '#34d399', label: 'Pozitivno' },
  negativno: { icon: '▼', color: '#f87171', label: 'Negativno' },
  mešano:    { icon: '◆', color: '#fbbf24', label: 'Mešano' },
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function IntensityDots({ value }) {
  const v = Math.max(1, Math.min(3, Number(value) || 1));
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i <= v ? '#f59e0b' : 'rgba(148,163,184,0.25)',
          }}
        />
      ))}
    </span>
  );
}

export default function MarketBriefing() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('vse');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const url = `${base}/data/briefing.json`;
    fetch(url, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setData(j))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const novice = data?.novice ?? [];
  const filtered = useMemo(
    () => (filter === 'vse' ? novice : novice.filter((n) => n.sektor === filter)),
    [novice, filter],
  );

  const stats = useMemo(() => {
    const s = { pozitivno: 0, negativno: 0, mešano: 0 };
    for (const n of novice) if (s[n.smer] != null) s[n.smer]++;
    return s;
  }, [novice]);

  return (
    <div style={{ padding: '3rem 0 4rem', minHeight: '70vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1.25rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📰</div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 0.5rem' }}>
            Dnevni pregled trgov
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
            Avtomatsko generiran povzetek najpomembnejših finančnih in geopolitičnih dogodkov.
            Brez hypea, brez finančnih nasvetov.
          </p>
          {data?.generiranoOb && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
              Posodobljeno: {formatDate(data.generiranoOb)}
            </div>
          )}
        </header>

        {loading && <div style={{ color: 'var(--color-text-muted)' }}>Nalagam pregled…</div>}

        {error && (
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12,
            color: '#fca5a5',
          }}>
            Napaka pri nalaganju pregleda: {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.povzetek && (
              <section style={{
                padding: '1.25rem 1.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Kontekst dneva
                </div>
                <p style={{ margin: 0, lineHeight: 1.7 }}>{data.povzetek}</p>
              </section>
            )}

            {novice.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {Object.entries(stats).map(([key, n]) => {
                  const meta = DIRECTION[key];
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '0.5rem 0.85rem',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 999,
                      fontSize: '0.85rem',
                    }}>
                      <span style={{ color: meta.color, fontWeight: 700 }}>{meta.icon}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{meta.label}:</span>
                      <strong>{n}</strong>
                    </div>
                  );
                })}
              </div>
            )}

            {novice.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {['vse', ...SECTORS].map((s) => {
                  const active = filter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 999,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
                        background: active ? 'var(--color-accent-bg)' : 'transparent',
                        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {s === 'vse' ? 'Vse' : s}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filtered.map((item, i) => {
                const col = SECTOR_COLOR[item.sektor] || { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', text: '#cbd5e1' };
                const dir = DIRECTION[item.smer] || DIRECTION.mešano;
                const isOpen = expanded === i;
                return (
                  <article
                    key={i}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '1.1rem 1.25rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: 999,
                          background: col.bg,
                          border: `1px solid ${col.border}`,
                          color: col.text,
                        }}>
                          {item.sektor}
                        </span>
                        <span style={{ color: dir.color, fontSize: '0.9rem', fontWeight: 700 }}>{dir.icon}</span>
                        <IntensityDots value={item.intenziteta} />
                        {item.vir && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginLeft: 'auto' }}>
                            {item.vir}
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                        {item.naslov}
                      </h2>
                      {item.povzetek && (
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                          {item.povzetek}
                        </p>
                      )}
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '0 1.25rem 1.25rem',
                        borderTop: '1px solid var(--color-border)',
                        marginTop: '0.25rem',
                        paddingTop: '1rem',
                      }}>
                        {item.analiza && (
                          <p style={{ margin: '0 0 1rem', lineHeight: 1.7, color: 'var(--color-text)' }}>
                            {item.analiza}
                          </p>
                        )}
                        {Array.isArray(item.vpliv) && item.vpliv.length > 0 && (
                          <>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.5rem' }}>
                              Vpliv
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                              {item.vpliv.map((v, k) => (
                                <li key={k}>{v}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {filtered.length === 0 && novice.length > 0 && (
                <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>
                  Ni novic v izbranem sektorju.
                </div>
              )}

              {novice.length === 0 && (
                <div style={{
                  padding: '1.5rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  color: 'var(--color-text-muted)',
                }}>
                  Dnevni pregled še ni bil generiran. Prvi avtomatski pregled se bo pojavil po prvem zagonu opravila.
                </div>
              )}
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--color-text-subtle)', lineHeight: 1.6 }}>
              Vsebina je generirana avtomatsko z uporabo AI in spletnega iskanja. Ni finančni nasvet.
              Za odločitve uporabi primarne vire.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

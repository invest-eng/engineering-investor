import { useEffect, useMemo, useState } from 'react';
import AudioReader from '../premium/AudioReader.jsx';
import { useAuth } from '../auth/useAuth.js';

const SECTORS = [
  'Tehnologija & AI',
  'Energetika',
  'Finance',
  'Potrošniki',
  'Makro & Centralne banke',
  'Geopolitika',
];

const SECTOR_COLOR = {
  'Geopolitika':            { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.25)',  text: '#dc2626' },
  'Tehnologija & AI':       { bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)',  text: '#2563eb' },
  'Energetika':             { bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.25)',  text: '#d97706' },
  'Finance':                { bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.25)',  text: '#059669' },
  'Potrošniki':             { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', text: '#a855f7' },
  'Makro & Centralne banke':{ bg: 'rgba(71,85,105,0.08)',  border: 'rgba(71,85,105,0.25)',  text: '#475569' },
};

const DIRECTION = {
  pozitivno: { icon: '▲', color: '#059669', label: 'Pozitivno' },
  negativno: { icon: '▼', color: '#dc2626', label: 'Negativno' },
  mešano:    { icon: '◆', color: '#d97706', label: 'Mešano' },
};

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('sl-SI', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function formatRelative(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diffMin = (Date.now() - t) / 60000;
  if (diffMin < 60) return `pred ${Math.max(1, Math.round(diffMin))} min`;
  const diffH = diffMin / 60;
  if (diffH < 24) return `pred ${Math.round(diffH)} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return 'včeraj';
  if (diffD < 7) return `pred ${diffD} dnevi`;
  return new Date(t).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isStale(iso, maxHours = 24) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return (Date.now() - t) / 3600000 > maxHours;
}

function fmtChange(pct) {
  if (pct == null) return null;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)} %`;
}

function fmtValue(item) {
  const v = item.vrednost;
  if (v == null) return 'N/A';
  if (item.enota === '%') return `${v.toFixed(2)} %`;
  if (v >= 10000) return v.toLocaleString('sl-SI', { maximumFractionDigits: 0 });
  if (v >= 100)   return v.toLocaleString('sl-SI', { maximumFractionDigits: 1 });
  return v.toFixed(4);
}

function TickerItem({ item }) {
  const positive = (item.sprememba_pct ?? 0) >= 0;
  const color = (item.sprememba_pct ?? 0) === 0 ? 'var(--color-text-muted)' : positive ? '#059669' : '#dc2626';
  const arrow = (item.sprememba_pct ?? 0) === 0 ? '' : positive ? ' ▲' : ' ▼';
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      padding: '0.55rem 0.9rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 6,
      minWidth: 90,
    }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {item.ime}
      </span>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
        {fmtValue(item)}
      </span>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color }}>
        {fmtChange(item.sprememba_pct)}{arrow}
      </span>
    </div>
  );
}

function MarketSnapshot({ trgi }) {
  if (!trgi) return null;

  const groups = [
    { label: 'Indeksi',    items: trgi.indeksi },
    { label: 'Surovine',   items: trgi.surovine },
    { label: 'Forex',      items: trgi.forex },
    { label: 'Obveznice',  items: trgi.obveznice },
    { label: 'Kripto',     items: trgi.kripto },
    { label: 'Volatilnost', items: trgi.vix ? [trgi.vix] : [] },
  ].filter((g) => g.items?.length > 0);

  if (groups.length === 0) return null;

  const ts = trgi.posodobljenoOb
    ? new Date(trgi.posodobljenoOb).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section style={{
      marginBottom: '2rem',
      padding: '1.25rem 1.5rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-subtle)' }}>
          Tržni snapshot
        </span>
        {ts && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
            posodobljeno ob {ts}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {groups.map((g) => (
          <div key={g.label}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-subtle)', marginBottom: '0.4rem' }}>
              {g.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {g.items.map((item) => <TickerItem key={item.simbol} item={item} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntensityDots({ value }) {
  const v = Math.max(1, Math.min(3, Number(value) || 1));
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i <= v ? 'var(--color-warning)' : 'var(--color-border-strong)',
        }} />
      ))}
    </span>
  );
}

export default function MarketBriefing() {
  const { isPremium, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('vse');
  const [expanded, setExpanded] = useState(null);
  const [tierUsed, setTierUsed] = useState('free'); // 'premium' | 'free'
  const [liveMarket, setLiveMarket] = useState(null);

  useEffect(() => {
    if (authLoading) return; // wait until we know premium status
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const primaryUrl = isPremium
      ? `${base}/data/briefing.json`
      : `${base}/data/briefing-yesterday.json`;
    const fallbackUrl = `${base}/data/briefing.json`;

    setLoading(true);
    setError(null);

    async function load() {
      try {
        let res = await fetch(primaryUrl, { cache: 'no-store' });
        let used = isPremium ? 'premium' : 'free';
        // Fallback for free users when no yesterday file exists yet (first day):
        // gracefully serve today's briefing instead of an error.
        if (!res.ok && !isPremium) {
          res = await fetch(fallbackUrl, { cache: 'no-store' });
          used = 'free-fallback';
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setTierUsed(used);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading, isPremium]);

  // Separately fetch live market-data.json — updated every ~2h during trading hours.
  // Use it for the MarketSnapshot if it's newer than the briefing's trgi snapshot.
  useEffect(() => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    fetch(`${base}/data/market-data.json`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((md) => { if (md) setLiveMarket(md); })
      .catch(() => {});
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

  const activeSectors = useMemo(() => {
    const set = new Set(novice.map((n) => n.sektor));
    return SECTORS.filter((s) => set.has(s));
  }, [novice]);

  // Prefer live market-data.json if newer than the briefing's trgi snapshot
  const activeMarket = useMemo(() => {
    if (!liveMarket) return data?.trgi ?? null;
    if (!data?.trgi) return liveMarket;
    const liveTs = Date.parse(liveMarket.posodobljenoOb);
    const briefTs = Date.parse(data.trgi.posodobljenoOb);
    return liveTs > briefTs ? liveMarket : data.trgi;
  }, [data, liveMarket]);

  return (
    <div style={{ padding: '3.5rem 0 5rem', minHeight: '70vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem',
            color: 'var(--color-text)',
          }}>
            Dnevni pregled
          </h1>
          {data?.generiranoOb && (
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {formatDateTime(data.generiranoOb)}
            </div>
          )}
        </header>

        {/* Tier indicator */}
        {!loading && !error && data && (
          tierUsed === 'premium' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.4rem 0.85rem',
              background: 'var(--color-highlight-bg)',
              border: '1px solid var(--color-highlight-border)',
              borderRadius: 6,
              fontSize: '0.78rem',
              color: 'var(--color-warning)',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}>
              <span>★</span>
              <span>Premium pregled, najsvežejše novice</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '0.85rem 1rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              lineHeight: 1.55,
            }}>
              <span style={{ flex: '1 1 280px' }}>
                Brezplačni pregled prikazuje včerajšnje novice z enodnevno zamudo.
                <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}> Premium prejema aktualne novice</strong>, takoj ko jih objavijo viri.
              </span>
              <a
                href={(import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/premium'}
                style={{
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Spoznaj Premium →
              </a>
            </div>
          )
        )}

        {loading && (
          <div style={{ color: 'var(--color-text-muted)', padding: '2rem 0' }}>
            Nalagam pregled…
          </div>
        )}

        {error && (
          <div style={{
            padding: '1.5rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderLeft: '3px solid var(--color-text-subtle)',
            borderRadius: 6,
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Pregleda ni mogoče naložiti
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: 6, color: 'var(--color-text-muted)' }}>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.povzetek && (
              <section style={{
                padding: '1.75rem 1.85rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                marginBottom: '2rem',
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-subtle)',
                  fontWeight: 600,
                  marginBottom: '0.85rem',
                }}>
                  Pregled dneva
                </div>
                <p style={{
                  margin: 0,
                  lineHeight: 1.8,
                  fontSize: '1.02rem',
                  color: 'var(--color-text)',
                }}>
                  {data.povzetek}
                </p>
                <AudioReader text={data.povzetek} label="Poslušaj povzetek" />
              </section>
            )}

            {novice.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {Object.entries(stats).map(([key, n]) => {
                    if (n === 0) return null;
                    const meta = DIRECTION[key];
                    return (
                      <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: meta.color, fontWeight: 700 }}>{meta.icon}</span>
                        <span>{meta.label.toLowerCase()}</span>
                        <strong style={{ color: 'var(--color-text)' }}>{n}</strong>
                      </span>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                  {novice.length} novic
                </div>
              </div>
            )}

            {activeSectors.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {['vse', ...activeSectors].map((s) => {
                  const active = filter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: 4,
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: '1px solid ' + (active ? 'var(--color-text)' : 'var(--color-border)'),
                        background: active ? 'var(--color-text)' : 'transparent',
                        color: active ? 'var(--color-bg)' : 'var(--color-text-muted)',
                        fontFamily: 'inherit',
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
                const col = SECTOR_COLOR[item.sektor] || { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#64748b' };
                const dir = DIRECTION[item.smer] || DIRECTION.mešano;
                const isOpen = expanded === i;
                return (
                  <article key={i} style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '1.25rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: 4,
                          background: col.bg,
                          border: `1px solid ${col.border}`,
                          color: col.text,
                          letterSpacing: '0.01em',
                        }}>
                          {item.sektor}
                        </span>
                        <span style={{ color: dir.color, fontSize: '0.85rem', fontWeight: 700 }}>{dir.icon}</span>
                        <IntensityDots value={item.intenziteta} />
                        <span style={{
                          fontSize: '0.74rem',
                          color: 'var(--color-text-subtle)',
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          {item.objavljeno && (
                            <span
                              title={formatDateTime(item.objavljeno)}
                              style={{
                                color: isStale(item.objavljeno) ? '#dc2626' : 'var(--color-text-subtle)',
                                fontWeight: isStale(item.objavljeno) ? 600 : 400,
                              }}
                            >
                              {formatRelative(item.objavljeno)}
                            </span>
                          )}
                          <span>{item.vir}</span>
                        </span>
                      </div>
                      <h2 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: '-0.015em',
                        color: 'var(--color-text)',
                        lineHeight: 1.35,
                      }}>
                        {item.naslov}
                      </h2>
                      {item.povzetek && (
                        <p style={{
                          margin: 0,
                          color: 'var(--color-text-muted)',
                          fontSize: '0.95rem',
                          lineHeight: 1.7,
                        }}>
                          {item.povzetek}
                        </p>
                      )}
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '0 1.5rem 1.5rem',
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: '1.25rem',
                      }}>
                        {item.analiza && (
                          <p style={{
                            margin: '0 0 1.25rem',
                            lineHeight: 1.75,
                            color: 'var(--color-text)',
                            fontSize: '0.96rem',
                          }}>
                            {item.analiza}
                          </p>
                        )}
                        {Array.isArray(item.vpliv) && item.vpliv.length > 0 && (
                          <div style={{ marginBottom: item.vir_url ? '1.25rem' : 0 }}>
                            <div style={{
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              color: 'var(--color-text-subtle)',
                              fontWeight: 600,
                              marginBottom: '0.6rem',
                            }}>
                              Vpliv
                            </div>
                            <ul style={{
                              margin: 0,
                              paddingLeft: '1.2rem',
                              color: 'var(--color-text-muted)',
                              lineHeight: 1.75,
                              fontSize: '0.92rem',
                            }}>
                              {item.vpliv.map((v, k) => <li key={k}>{v}</li>)}
                            </ul>
                          </div>
                        )}
                        {item.vir_url && (
                          <a
                            href={item.vir_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.85rem',
                              color: 'var(--color-accent)',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            Preberi pri viru ({item.vir})
                            <span style={{ fontSize: '0.9em' }}>→</span>
                          </a>
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
                  borderRadius: 8,
                  color: 'var(--color-text-muted)',
                }}>
                  Dnevni pregled še ni bil generiran. Prvi avtomatski pregled se bo pojavil po prvem zagonu opravila.
                </div>
              )}
            </div>

            <p style={{
              marginTop: '2.5rem',
              fontSize: '0.78rem',
              color: 'var(--color-text-subtle)',
              lineHeight: 1.65,
              textAlign: 'center',
            }}>
              Vsebina je informativne narave in ni finančni nasvet. Za odločitve uporabi primarne vire.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

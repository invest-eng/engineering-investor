import { useMemo, useState } from 'react';

// ── Static data ──────────────────────────────────────────────────────────────

const MACRO_EVENTS = [
  // July 2026
  { id: 'us-cpi-jul26',    date: '2026-07-14', time: '14:30', title: 'US CPI (jun 2026)',           category: 'Inflacija',      region: 'US', importance: 'HIGH',   previous: '2.4%' },
  { id: 'us-retail-jul26', date: '2026-07-16', time: '14:30', title: 'US maloprodaja (jun 2026)',   category: 'Poraba',         region: 'US', importance: 'MEDIUM' },
  { id: 'eu-pmi-jul26',    date: '2026-07-22', time: '10:00', title: 'EU PMI Flash (jul 2026)',     category: 'PMI',            region: 'EU', importance: 'MEDIUM' },
  { id: 'us-pmi-jul26',    date: '2026-07-23', time: '15:45', title: 'US PMI Flash (jul 2026)',     category: 'PMI',            region: 'US', importance: 'MEDIUM' },
  { id: 'ecb-jul26',       date: '2026-07-23', time: '13:15', title: 'Seja ECB — obrestne mere',   category: 'Centralna banka',region: 'EU', importance: 'HIGH' },
  { id: 'us-gdp-q2-26',    date: '2026-07-29', time: '14:30', title: 'US GDP Q2 2026 (advance)',   category: 'GDP',            region: 'US', importance: 'HIGH',   previous: '1.4%', forecast: '2.1%' },
  { id: 'fomc-jul26',      date: '2026-07-29', time: '20:00', title: 'Seja FOMC — obrestne mere',  category: 'Centralna banka',region: 'US', importance: 'HIGH' },
  { id: 'eu-cpi-jul26',    date: '2026-07-30', time: '11:00', title: 'EU CPI Flash (jul 2026)',     category: 'Inflacija',      region: 'EU', importance: 'HIGH',   previous: '2.0%' },
  // August 2026
  { id: 'us-nfp-aug26',    date: '2026-08-07', time: '14:30', title: 'US NFP (jul 2026)',           category: 'Trg dela',       region: 'US', importance: 'HIGH' },
  { id: 'us-cpi-aug26',    date: '2026-08-12', time: '14:30', title: 'US CPI (jul 2026)',           category: 'Inflacija',      region: 'US', importance: 'HIGH' },
  { id: 'us-retail-aug26', date: '2026-08-14', time: '14:30', title: 'US maloprodaja (jul 2026)',  category: 'Poraba',         region: 'US', importance: 'MEDIUM' },
  { id: 'eu-pmi-aug26',    date: '2026-08-24', time: '10:00', title: 'EU PMI Flash (avg 2026)',     category: 'PMI',            region: 'EU', importance: 'MEDIUM' },
  { id: 'us-jackson26',    date: '2026-08-27', time: '16:00', title: 'Jackson Hole symposium (Fed)',category: 'Centralna banka',region: 'US', importance: 'HIGH' },
  { id: 'us-gdp-q2r-26',   date: '2026-08-27', time: '14:30', title: 'US GDP Q2 2026 (revizija)', category: 'GDP',            region: 'US', importance: 'MEDIUM' },
  { id: 'eu-cpi-aug26',    date: '2026-08-28', time: '11:00', title: 'EU CPI Flash (avg 2026)',     category: 'Inflacija',      region: 'EU', importance: 'HIGH' },
  // September 2026
  { id: 'us-nfp-sep26',    date: '2026-09-04', time: '14:30', title: 'US NFP (avg 2026)',           category: 'Trg dela',       region: 'US', importance: 'HIGH' },
  { id: 'us-cpi-sep26',    date: '2026-09-10', time: '14:30', title: 'US CPI (avg 2026)',           category: 'Inflacija',      region: 'US', importance: 'HIGH' },
  { id: 'ecb-sep26',       date: '2026-09-10', time: '13:15', title: 'Seja ECB — obrestne mere',   category: 'Centralna banka',region: 'EU', importance: 'HIGH' },
  { id: 'eu-pmi-sep26',    date: '2026-09-22', time: '10:00', title: 'EU PMI Flash (sep 2026)',     category: 'PMI',            region: 'EU', importance: 'MEDIUM' },
  { id: 'fomc-sep26',      date: '2026-09-16', time: '20:00', title: 'Seja FOMC — obrestne mere',  category: 'Centralna banka',region: 'US', importance: 'HIGH' },
  { id: 'eu-cpi-sep26',    date: '2026-09-30', time: '11:00', title: 'EU CPI Flash (sep 2026)',     category: 'Inflacija',      region: 'EU', importance: 'HIGH' },
];

// Q2 2026 earnings season (approximate dates based on historical patterns)
const EARNINGS = [
  { id: 'jpm-q2',   date: '2026-07-11', ticker: 'JPM',   name: 'JPMorgan Chase',      when: 'pred odprtjem' },
  { id: 'wfc-q2',   date: '2026-07-11', ticker: 'WFC',   name: 'Wells Fargo',         when: 'pred odprtjem' },
  { id: 'c-q2',     date: '2026-07-11', ticker: 'C',     name: 'Citigroup',           when: 'pred odprtjem' },
  { id: 'gs-q2',    date: '2026-07-14', ticker: 'GS',    name: 'Goldman Sachs',       when: 'pred odprtjem' },
  { id: 'bac-q2',   date: '2026-07-15', ticker: 'BAC',   name: 'Bank of America',     when: 'pred odprtjem' },
  { id: 'ms-q2',    date: '2026-07-16', ticker: 'MS',    name: 'Morgan Stanley',      when: 'pred odprtjem' },
  { id: 'nflx-q2',  date: '2026-07-16', ticker: 'NFLX',  name: 'Netflix',             when: 'po zaprtju' },
  { id: 'tsla-q2',  date: '2026-07-23', ticker: 'TSLA',  name: 'Tesla',               when: 'po zaprtju' },
  { id: 'googl-q2', date: '2026-07-29', ticker: 'GOOGL', name: 'Alphabet',            when: 'po zaprtju' },
  { id: 'msft-q2',  date: '2026-07-29', ticker: 'MSFT',  name: 'Microsoft',           when: 'po zaprtju' },
  { id: 'meta-q2',  date: '2026-07-30', ticker: 'META',  name: 'Meta Platforms',      when: 'po zaprtju' },
  { id: 'aapl-q2',  date: '2026-07-31', ticker: 'AAPL',  name: 'Apple',               when: 'po zaprtju' },
  { id: 'amzn-q2',  date: '2026-08-01', ticker: 'AMZN',  name: 'Amazon',              when: 'po zaprtju' },
  { id: 'nvda-q2',  date: '2026-08-27', ticker: 'NVDA',  name: 'NVIDIA',              when: 'po zaprtju' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function weekKey(dateStr) {
  const d = parseDate(dateStr);
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return mon.toISOString().slice(0, 10);
}

function weekLabel(mondayStr) {
  const start = parseDate(mondayStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmtDay = (d) => d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' });
  return `${fmtDay(start)} – ${fmtDay(end)}`;
}

function dayLabel(dateStr) {
  return parseDate(dateStr).toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

function isToday(dateStr) {
  const today = new Date();
  const d = parseDate(dateStr);
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

function isPast(dateStr) {
  return parseDate(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  wrap: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem var(--space-md) 4rem',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  filters: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  weekSection: {
    marginBottom: '2rem',
  },
  weekHeader: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-subtle)',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '0.75rem',
  },
  eventRow: {
    display: 'grid',
    gridTemplateColumns: '7rem 1fr auto',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '0.4rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    transition: 'border-color 150ms ease',
  },
  dateCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dayStr: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  timeStr: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  eventTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--color-text)',
    lineHeight: 1.4,
  },
  metaRow: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-subtle)',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--text-sm)',
  },
};

function Badge({ children, variant = 'default' }) {
  const styles = {
    high: { background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.25)' },
    medium: { background: 'rgba(217,119,6,0.1)', color: '#b45309', border: '1px solid rgba(217,119,6,0.25)' },
    earnings: { background: 'rgba(37,99,235,0.1)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)' },
    us: { background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', fontWeight: 500 },
    eu: { background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', fontWeight: 500 },
    cat: { background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' },
    today: { background: 'rgba(37,99,235,0.12)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)', fontWeight: 600 },
    default: { background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' },
  };
  return (
    <span style={{
      fontSize: '0.7rem',
      fontWeight: 500,
      padding: '1px 7px',
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.375rem 1rem',
        borderRadius: 'var(--radius-full)',
        border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
        background: active ? 'var(--color-accent-bg)' : 'var(--color-surface)',
        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EkonomskiKoledar() {
  const [filter, setFilter] = useState('vsi'); // 'vsi' | 'makro' | 'zasluzki'

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 90);

  const allEvents = useMemo(() => {
    const macro = (filter === 'zasluzki' ? [] : MACRO_EVENTS)
      .filter(e => {
        const d = parseDate(e.date);
        return d >= today && d <= endDate;
      })
      .map(e => ({ ...e, type: 'makro' }));

    const earnings = (filter === 'makro' ? [] : EARNINGS)
      .filter(e => {
        const d = parseDate(e.date);
        return d >= today && d <= endDate;
      })
      .map(e => ({ ...e, type: 'zasluzki' }));

    return [...macro, ...earnings].sort((a, b) =>
      parseDate(a.date).getTime() - parseDate(b.date).getTime()
    );
  }, [filter]);

  // Group by ISO week (Monday)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const evt of allEvents) {
      const key = weekKey(evt.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(evt);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allEvents]);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h1 style={S.title}>Ekonomski koledar</h1>
        <p style={S.subtitle}>
          Ključni makroekonomski dogodki in zaslužki največjih podjetij — naslednjih 90 dni.
          Časi so v CET/CEST. Datumi zaslužkov so okvirni.
        </p>
      </div>

      <div style={S.filters}>
        <FilterBtn active={filter === 'vsi'} onClick={() => setFilter('vsi')}>Vsi dogodki</FilterBtn>
        <FilterBtn active={filter === 'makro'} onClick={() => setFilter('makro')}>Makro</FilterBtn>
        <FilterBtn active={filter === 'zasluzki'} onClick={() => setFilter('zasluzki')}>Zaslužki</FilterBtn>
      </div>

      {grouped.length === 0 && (
        <div style={S.empty}>Ni prihajajočih dogodkov za izbrani filter.</div>
      )}

      {grouped.map(([weekMon, events]) => (
        <div key={weekMon} style={S.weekSection}>
          <div style={S.weekHeader}>{weekLabel(weekMon)}</div>

          {events.map(evt => {
            const today_ = isToday(evt.date);
            return (
              <div
                key={evt.id}
                style={{
                  ...S.eventRow,
                  borderColor: today_ ? 'var(--color-accent-border)' : 'var(--color-border)',
                  background: today_ ? 'var(--color-accent-bg)' : 'var(--color-surface)',
                  opacity: isPast(evt.date) ? 0.5 : 1,
                }}
              >
                {/* Date + time */}
                <div style={S.dateCol}>
                  <span style={{ ...S.dayStr, color: today_ ? 'var(--color-accent)' : 'var(--color-text)' }}>
                    {dayLabel(evt.date)}
                    {today_ && ' ← danes'}
                  </span>
                  {evt.time && (
                    <span style={S.timeStr}>{evt.time} CET</span>
                  )}
                  {evt.type === 'zasluzki' && (
                    <span style={{ ...S.timeStr, color: 'var(--color-text-subtle)' }}>{evt.when}</span>
                  )}
                </div>

                {/* Title + badges */}
                <div style={S.mainCol}>
                  {evt.type === 'makro' ? (
                    <>
                      <span style={S.eventTitle}>{evt.title}</span>
                      <div style={S.metaRow}>
                        <Badge variant={evt.region === 'US' ? 'us' : 'eu'}>
                          {evt.region === 'US' ? '🇺🇸 US' : '🇪🇺 EU'}
                        </Badge>
                        <Badge variant="cat">{evt.category}</Badge>
                        {evt.forecast && <span style={S.hint}>napoved: {evt.forecast}</span>}
                        {evt.previous && <span style={S.hint}>prej: {evt.previous}</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={S.eventTitle}>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{evt.ticker}</strong>
                        {' '}{evt.name} — Q2 2026
                      </span>
                      <div style={S.metaRow}>
                        <Badge variant="us">🇺🇸 US</Badge>
                        <Badge variant="earnings">Zaslužki</Badge>
                        <span style={S.hint}>okvirni datum</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Importance badge (right column) */}
                <div>
                  {evt.type === 'makro' && (
                    <Badge variant={evt.importance === 'HIGH' ? 'high' : 'medium'}>
                      {evt.importance === 'HIGH' ? 'VISOKO' : 'SREDNJE'}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

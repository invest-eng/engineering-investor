import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { loadState, saveState, uid, exportJson, importJson } from './lib/store.js';
import { calcFifo, byYear, yearSummary, getTaxRate, daysBetween } from './lib/fifo.js';
import { parseIbkrCsv } from './lib/ibkr-parser.js';
import { exportExcel, exportEdavkiXml } from './lib/exporters.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ASSET_TYPES = [
  { id: 'stock', label: 'Delnica' },
  { id: 'etf',   label: 'ETF' },
  { id: 'fund',  label: 'Sklad' },
  { id: 'crypto',label: 'Kripto' },
  { id: 'bond',  label: 'Obveznica' },
];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];
const fmtEur = (n) => `${Number(n || 0).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const fmtNum = (n) => Number(n || 0).toLocaleString('sl-SI', { maximumFractionDigits: 6 });
const gainColor = (n) => n > 0 ? '#059669' : n < 0 ? '#dc2626' : 'var(--color-text-muted)';

function emptyTrade() {
  return {
    id: '', type: 'buy', assetType: 'stock',
    ticker: '', isin: '', name: '',
    date: new Date().toISOString().slice(0, 10),
    quantity: '', pricePerUnit: '', currency: 'USD',
    exchangeRateEur: '', fees: '0',
    broker: 'IBKR', notes: '',
  };
}

// ─── REDUCER ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'trade/add':    return { ...state, trades: [...state.trades, action.trade] };
    case 'trade/update': return { ...state, trades: state.trades.map((t) => t.id === action.trade.id ? action.trade : t) };
    case 'trade/delete': return { ...state, trades: state.trades.filter((t) => t.id !== action.id) };
    case 'trade/import': return { ...state, trades: [...state.trades, ...action.trades] };
    case 'profile/update': return { ...state, profile: { ...state.profile, ...action.profile } };
    case 'state/set':    return action.state;
    default:             return state;
  }
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function TaxTracker() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [tab, setTab] = useState('trades');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { saveState(state); }, [state]);

  const fifo = useMemo(() => calcFifo(state.trades), [state.trades]);
  const yearMap = useMemo(() => byYear(fifo.realizedGains), [fifo.realizedGains]);
  const years = useMemo(() => Object.keys(yearMap).sort().reverse(), [yearMap]);
  const currentGains = useMemo(() => yearMap[selectedYear] || [], [yearMap, selectedYear]);
  const summary = useMemo(() => yearSummary(currentGains), [currentGains]);

  function handleImportJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const newState = importJson(ev.target.result);
        dispatch({ type: 'state/set', state: newState });
        alert('Uvoz uspešen.');
      } catch { alert('Napaka pri uvozu JSON datoteke.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const tabs = [
    { id: 'trades', label: 'Transakcije' },
    { id: 'fifo',   label: 'FIFO pregled' },
    { id: 'export', label: 'Izvoz' },
  ];

  return (
    <div style={{ padding: '3rem 0 5rem', minHeight: '70vh' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 0.4rem', color: 'var(--color-text)' }}>
            Davčni tracker
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            FIFO sledenje nakupov in prodaj za Doh-KDVP napoved (ZDoh-2)
          </p>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.88rem', fontWeight: 500,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: tab === t.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              fontFamily: 'inherit', marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'trades' && (
          <TradesView state={state} dispatch={dispatch} fifo={fifo} />
        )}
        {tab === 'fifo' && (
          <FifoView
            summary={summary} currentGains={currentGains} unrealized={fifo.unrealizedLots}
            errors={fifo.errors} years={years} selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        )}
        {tab === 'export' && (
          <ExportView
            state={state} dispatch={dispatch}
            fifo={fifo} selectedYear={selectedYear} years={years}
            setSelectedYear={setSelectedYear}
            onExportJson={() => exportJson(state)}
            onImportJson={handleImportJson}
            onExportExcel={() => exportExcel(state.trades, fifo.realizedGains, fifo.unrealizedLots, selectedYear)}
            onExportXml={() => exportEdavkiXml(fifo.realizedGains, state.profile, selectedYear)}
          />
        )}

        <p style={{ marginTop: '3rem', fontSize: '0.78rem', color: 'var(--color-text-subtle)', lineHeight: 1.6 }}>
          Vse podatke shranjujemo izključno lokalno v tvojem brskalniku. Nič se ne pošilja na strežnik.
          Orodje je informativne narave — pred oddajo napovedi preveri izračune z računovodjem ali na FURS.
        </p>
      </div>
    </div>
  );
}

// ─── TRADES VIEW ─────────────────────────────────────────────────────────────

function TradesView({ state, dispatch, fifo }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');
  const [ibkrWarnings, setIbkrWarnings] = useState([]);
  const ibkrRef = useRef();

  const trades = useMemo(() => {
    const q = filter.toUpperCase();
    return [...state.trades]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => !q || t.ticker.toUpperCase().includes(q) || (t.name || '').toUpperCase().includes(q));
  }, [state.trades, filter]);

  function save(e) {
    e.preventDefault();
    if (!editing) return;
    const trade = {
      ...editing,
      id: editing.id || uid(),
      quantity: Number(editing.quantity),
      pricePerUnit: Number(editing.pricePerUnit),
      exchangeRateEur: Number(editing.exchangeRateEur) || (editing.currency === 'EUR' ? 1 : 0),
      fees: Number(editing.fees) || 0,
    };
    if (!trade.ticker || !trade.quantity || !trade.pricePerUnit) return;
    dispatch({ type: trade.id && state.trades.find(t => t.id === trade.id) ? 'trade/update' : 'trade/add', trade });
    setEditing(null);
  }

  function handleIbkrImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { trades: imported, warnings } = parseIbkrCsv(ev.target.result);
      setIbkrWarnings(warnings);
      if (imported.length === 0) {
        alert('Ni bilo uvoženih transakcij. ' + warnings.join('\n'));
        return;
      }
      if (confirm(`Uvoziti ${imported.length} transakcij iz IBKR?\n\nOpomba: Tečaji EUR niso vključeni v IBKR izvozu — nastavi jih ročno za vsako transakcijo.`)) {
        dispatch({ type: 'trade/import', trades: imported });
        if (warnings.length) alert('Opozorila:\n' + warnings.join('\n'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const assetLabel = (type) => ASSET_TYPES.find((a) => a.id === type)?.label || type;

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Btn onClick={() => setEditing(emptyTrade())}>+ Dodaj transakcijo</Btn>
        <label style={{ ...btnStyle('secondary'), cursor: 'pointer' }}>
          Uvozi IBKR CSV
          <input ref={ibkrRef} type="file" accept=".csv" onChange={handleIbkrImport} style={{ display: 'none' }} />
        </label>
        <input
          placeholder="Išči po tickerju..."
          value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ marginLeft: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text)', fontFamily: 'inherit', width: 180 }}
        />
      </div>

      {fifo.errors.length > 0 && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.83rem', color: '#dc2626' }}>
          {fifo.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
        </div>
      )}

      {trades.length === 0 ? (
        <Empty text="Ni transakcij. Dodaj prvo ali uvozi iz IBKR." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Datum','Tip','Vrsta','Ticker','Ime','Količina','Cena','Valuta','Tečaj EUR','Prov.','Vrednost EUR','Broker',''].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const valueEur = t.quantity * t.pricePerUnit * (t.exchangeRateEur || 1);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Td>{t.date}</Td>
                    <Td><span style={{ fontWeight: 600, color: t.type === 'buy' ? '#059669' : '#dc2626' }}>{t.type === 'buy' ? 'Nakup' : 'Prodaja'}</span></Td>
                    <Td>{assetLabel(t.assetType)}</Td>
                    <Td><strong>{t.ticker}</strong></Td>
                    <Td style={{ color: 'var(--color-text-muted)' }}>{t.name || '—'}</Td>
                    <Td>{fmtNum(t.quantity)}</Td>
                    <Td>{Number(t.pricePerUnit).toFixed(4)}</Td>
                    <Td>{t.currency}</Td>
                    <Td style={{ color: t.exchangeRateEur ? 'var(--color-text)' : '#dc2626' }}>
                      {t.exchangeRateEur ? Number(t.exchangeRateEur).toFixed(4) : '⚠ nastavi'}
                    </Td>
                    <Td>{Number(t.fees).toFixed(2)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{t.exchangeRateEur ? fmtEur(valueEur) : '—'}</Td>
                    <Td style={{ color: 'var(--color-text-muted)' }}>{t.broker || '—'}</Td>
                    <Td>
                      <span style={{ display: 'flex', gap: 6 }}>
                        <BtnSm onClick={() => setEditing({ ...t })}>Uredi</BtnSm>
                        <BtnSm danger onClick={() => { if (confirm('Izbriši transakcijo?')) dispatch({ type: 'trade/delete', id: t.id }); }}>✕</BtnSm>
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {editing && (
        <Modal title={editing.id && state.trades.find(t => t.id === editing.id) ? 'Uredi transakcijo' : 'Nova transakcija'} onClose={() => setEditing(null)}>
          <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Field label="Tip">
              <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} style={inputStyle}>
                <option value="buy">Nakup</option>
                <option value="sell">Prodaja</option>
              </select>
            </Field>
            <Field label="Vrsta sredstva">
              <select value={editing.assetType} onChange={(e) => setEditing({ ...editing, assetType: e.target.value })} style={inputStyle}>
                {ASSET_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </Field>
            <Field label="Ticker *">
              <input required placeholder="npr. AAPL" value={editing.ticker}
                onChange={(e) => setEditing({ ...editing, ticker: e.target.value.toUpperCase() })} style={inputStyle} />
            </Field>
            <Field label="ISIN">
              <input placeholder="npr. US0378331005" value={editing.isin}
                onChange={(e) => setEditing({ ...editing, isin: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Ime" full>
              <input placeholder="npr. Apple Inc." value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Datum *">
              <input required type="date" value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Količina *">
              <input required type="number" step="any" min="0" placeholder="100" value={editing.quantity}
                onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Cena/enoto *">
              <input required type="number" step="any" min="0" placeholder="185.50" value={editing.pricePerUnit}
                onChange={(e) => setEditing({ ...editing, pricePerUnit: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Valuta">
              <select value={editing.currency} onChange={(e) => {
                const eur = e.target.value === 'EUR' ? '1' : editing.exchangeRateEur;
                setEditing({ ...editing, currency: e.target.value, exchangeRateEur: eur });
              }} style={inputStyle}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tečaj EUR (BSI na dan posla)">
              <input type="number" step="any" min="0"
                placeholder={editing.currency === 'EUR' ? '1' : 'npr. 0.9234'}
                value={editing.exchangeRateEur}
                onChange={(e) => setEditing({ ...editing, exchangeRateEur: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Provizija (v orig. valuti)">
              <input type="number" step="any" min="0" placeholder="1.50" value={editing.fees}
                onChange={(e) => setEditing({ ...editing, fees: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Broker">
              <input placeholder="IBKR / INR / ..." value={editing.broker}
                onChange={(e) => setEditing({ ...editing, broker: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Opomba" full>
              <input placeholder="" value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })} style={inputStyle} />
            </Field>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setEditing(null)} style={{ ...btnStyle('secondary') }}>Prekliči</button>
              <button type="submit" style={{ ...btnStyle('primary') }}>Shrani</button>
            </div>
          </form>
          <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
            * Tečaj EUR: preveri na <a href="https://www.bsi.si/financial-data/bank-of-slovenia-exchange-rates" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>BSI tečajnici</a> za datum posla.
          </p>
        </Modal>
      )}
    </>
  );
}

// ─── FIFO VIEW ────────────────────────────────────────────────────────────────

function FifoView({ summary, currentGains, unrealized, errors, years, selectedYear, setSelectedYear }) {
  const allYears = years.length ? years : [new Date().getFullYear()];

  return (
    <>
      {/* Year selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Leto:</span>
        {allYears.map((y) => (
          <button key={y} onClick={() => setSelectedYear(Number(y))} style={{
            padding: '0.35rem 0.85rem', borderRadius: 4, fontSize: '0.85rem',
            fontWeight: selectedYear === Number(y) ? 600 : 400,
            border: '1px solid ' + (selectedYear === Number(y) ? 'var(--color-accent)' : 'var(--color-border)'),
            background: selectedYear === Number(y) ? 'var(--color-accent-bg)' : 'transparent',
            color: selectedYear === Number(y) ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{y}</button>
        ))}
      </div>

      {currentGains.length === 0 ? (
        <Empty text={`Ni realiziranih dobičkov za ${selectedYear}. Prodajna transakcija sproži FIFO izračun.`} />
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
            <SummaryCard label="Skupni dobički" value={fmtEur(summary.totalGain)} color="#059669" />
            <SummaryCard label="Skupne izgube" value={fmtEur(summary.totalLoss)} color="#dc2626" />
            <SummaryCard label="Neto dobiček" value={fmtEur(summary.netGain)} color={gainColor(summary.netGain)} />
            <SummaryCard label="Ocena davka" value={fmtEur(summary.totalTax)} color="#d97706" />
          </div>

          {/* Per-ticker summary */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>Po vrednostnem papirju</h3>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Ticker','Ime','Vrsta','Dobiček/Izguba EUR','Ocena davka'].map((h) => <Th key={h}>{h}</Th>)}
                </tr>
              </thead>
              <tbody>
                {summary.byTicker.map((row) => (
                  <tr key={row.ticker} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Td><strong>{row.ticker}</strong></Td>
                    <Td style={{ color: 'var(--color-text-muted)' }}>{row.name}</Td>
                    <Td>{ASSET_TYPES.find((a) => a.id === row.assetType)?.label || row.assetType}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)', color: gainColor(row.gain), fontWeight: 600 }}>{fmtEur(row.gain)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)' }}>{row.tax > 0 ? fmtEur(row.tax) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed FIFO rows */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>Podrobni FIFO pari</h3>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Ticker','Datum nakupa','Datum prodaje','Dni','Količina','Nabavna EUR','Prodajna EUR','Dobiček EUR','Davek %','Davek EUR'].map((h) => <Th key={h}>{h}</Th>)}
                </tr>
              </thead>
              <tbody>
                {currentGains.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Td><strong>{g.ticker}</strong></Td>
                    <Td>{g.buyDate}</Td>
                    <Td>{g.sellDate}</Td>
                    <Td>{g.holdingDays}</Td>
                    <Td>{fmtNum(g.quantity)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)' }}>{fmtEur(g.acquisitionValueEur)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)' }}>{fmtEur(g.disposalValueEur)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)', color: gainColor(g.gainEur), fontWeight: 600 }}>{fmtEur(g.gainEur)}</Td>
                    <Td>{(g.taxRate * 100).toFixed(0)}%</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)' }}>{g.taxAmount > 0 ? fmtEur(g.taxAmount) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unrealized */}
          {unrealized.length > 0 && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>Odprte pozicije (nerealizirano)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Ticker','Datum nakupa','Preostala količina','Nabavna cena/enoto EUR','Skupaj EUR'].map((h) => <Th key={h}>{h}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {unrealized.map((l, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <Td><strong>{l.ticker}</strong></Td>
                        <Td>{l.buyDate}</Td>
                        <Td>{fmtNum(l.quantityRemaining)}</Td>
                        <Td style={{ fontFamily: 'var(--font-mono)' }}>{fmtEur(l.costPerUnitEur)}</Td>
                        <Td style={{ fontFamily: 'var(--font-mono)' }}>{fmtEur(l.quantityRemaining * l.costPerUnitEur)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

// ─── EXPORT VIEW ──────────────────────────────────────────────────────────────

function ExportView({ state, dispatch, fifo, selectedYear, years, setSelectedYear, onExportJson, onImportJson, onExportExcel, onExportXml }) {
  const [profile, setProfile] = useState(state.profile);
  const profileChanged = JSON.stringify(profile) !== JSON.stringify(state.profile);

  function saveProfile() {
    dispatch({ type: 'profile/update', profile });
  }

  const allYears = years.length ? years : [new Date().getFullYear()];

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* Year selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Izvozi za leto:</span>
        {allYears.map((y) => (
          <button key={y} onClick={() => setSelectedYear(Number(y))} style={{
            padding: '0.35rem 0.85rem', borderRadius: 4, fontSize: '0.85rem',
            fontWeight: selectedYear === Number(y) ? 600 : 400,
            border: '1px solid ' + (selectedYear === Number(y) ? 'var(--color-accent)' : 'var(--color-border)'),
            background: selectedYear === Number(y) ? 'var(--color-accent-bg)' : 'transparent',
            color: selectedYear === Number(y) ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{y}</button>
        ))}
      </div>

      {/* Export buttons */}
      <Card>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Izvoz podatkov</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Btn onClick={onExportExcel}>
            📊 Prenesi Excel (.xlsx)
          </Btn>
          <Btn onClick={onExportXml} variant="secondary">
            📄 Prenesi Doh-KDVP XML (eDavki)
          </Btn>
        </div>
        <p style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          XML datoteko naloži na <a href="https://edavki.durs.si" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>eDavki.durs.si</a> pod Dohodnina → Doh-KDVP.
          Pred oddajo preveri vsebino — shema se lahko razlikuje od trenutne FURS verzije.
        </p>
      </Card>

      {/* Backup */}
      <Card>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Varnostna kopija</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Btn variant="secondary" onClick={onExportJson}>Izvozi JSON (backup)</Btn>
          <label style={{ ...btnStyle('secondary'), cursor: 'pointer' }}>
            Uvozi JSON (backup)
            <input type="file" accept=".json" onChange={onImportJson} style={{ display: 'none' }} />
          </label>
        </div>
      </Card>

      {/* Profile za eDavki */}
      <Card>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Profil za eDavki XML</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          Podatki se vključijo v XML glavo. Shranjeni so samo lokalno.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { key: 'taxNumber', label: 'Davčna številka', placeholder: '12345678' },
            { key: 'name', label: 'Ime in priimek', placeholder: 'Ime Priimek' },
            { key: 'address', label: 'Naslov', placeholder: 'Ulica 1' },
            { key: 'city', label: 'Kraj', placeholder: 'Ljubljana' },
            { key: 'postCode', label: 'Poštna številka', placeholder: '1000' },
            { key: 'birthDate', label: 'Datum rojstva', placeholder: '1990-01-01', type: 'date' },
            { key: 'email', label: 'E-pošta', placeholder: 'ime@email.com' },
            { key: 'phone', label: 'Telefon', placeholder: '040123456' },
          ].map(({ key, label, placeholder, type }) => (
            <Field key={key} label={label}>
              <input type={type || 'text'} placeholder={placeholder} value={profile[key] || ''}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} style={inputStyle} />
            </Field>
          ))}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Btn onClick={saveProfile} disabled={!profileChanged}>Shrani profil</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

function Card({ children }) {
  return <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '1.25rem' }}>{children}</div>;
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '1.5rem', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{text}</div>;
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{children}</th>;
}

function Td({ children, style }) {
  return <td style={{ padding: '0.6rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap', ...style }}>{children}</td>;
}

function Btn({ children, onClick, variant = 'primary', disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ ...btnStyle(variant), opacity: disabled ? 0.5 : 1 }}>{children}</button>;
}

function BtnSm({ children, onClick, danger }) {
  return <button onClick={onClick} style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', borderRadius: 4, border: '1px solid ' + (danger ? 'rgba(220,38,38,0.3)' : 'var(--color-border)'), background: 'transparent', color: danger ? '#dc2626' : 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{children}</button>;
}

const inputStyle = { width: '100%', padding: '0.5rem 0.7rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text)', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' };

function btnStyle(variant) {
  const base = { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' };
  if (variant === 'primary') return { ...base, background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)' };
  return { ...base, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border-strong)' };
}

import { useEffect, useReducer, useState } from 'react';
import { loadState, saveState, freshState } from './store.js';
import Dashboard from './views/Dashboard.jsx';
import Transactions from './views/Transactions.jsx';
import Accounts from './views/Accounts.jsx';
import Budget from './views/Budget.jsx';
import Goals from './views/Goals.jsx';
import Reports from './views/Reports.jsx';
import Recurring from './views/Recurring.jsx';
import Insights from './views/Insights.jsx';
import Settings from './views/Settings.jsx';

const NAV = [
  { id: 'pregled',     label: 'Pregled',     icon: 'dashboard' },
  { id: 'transakcije', label: 'Transakcije', icon: 'list' },
  { id: 'racuni',      label: 'Računi',      icon: 'card' },
  { id: 'proracun',    label: 'Proračun',    icon: 'budget' },
  { id: 'cilji',       label: 'Cilji',       icon: 'target' },
  { id: 'porocila',    label: 'Poročila',    icon: 'chart' },
  { id: 'ponavljajoce', label: 'Ponavljajoče', icon: 'repeat' },
  { id: 'vpogledi',    label: 'Vpogledi',    icon: 'lightbulb' },
  { id: 'nastavitve',  label: 'Nastavitve',  icon: 'settings' },
];

function reducer(state, action) {
  switch (action.type) {
    case 'state/replace':
      return action.state;

    case 'tx/add':
      return { ...state, transactions: [...state.transactions, action.tx] };
    case 'tx/update':
      return { ...state, transactions: state.transactions.map((t) => t.id === action.tx.id ? action.tx : t) };
    case 'tx/remove':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };

    case 'account/add':
      return { ...state, accounts: [...state.accounts, action.account] };
    case 'account/update':
      return { ...state, accounts: state.accounts.map((a) => a.id === action.account.id ? action.account : a) };
    case 'account/remove':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.id) };

    case 'category/add':
      return { ...state, categories: [...state.categories, action.category] };
    case 'category/update':
      return { ...state, categories: state.categories.map((c) => c.id === action.category.id ? action.category : c) };
    case 'category/remove':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) };

    case 'budget/add':
      return { ...state, budgets: [...state.budgets, action.budget] };
    case 'budget/update':
      return { ...state, budgets: state.budgets.map((b) => b.id === action.budget.id ? action.budget : b) };
    case 'budget/remove':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) };

    case 'goal/add':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'goal/update':
      return { ...state, goals: state.goals.map((g) => g.id === action.goal.id ? action.goal : g) };
    case 'goal/remove':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };

    case 'recurring/add':
      return { ...state, recurring: [...state.recurring, action.rule] };
    case 'recurring/update':
      return { ...state, recurring: state.recurring.map((r) => r.id === action.rule.id ? action.rule : r) };
    case 'recurring/remove':
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.id) };

    default:
      return state;
  }
}

const ICONS = {
  dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
  list:      <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="3.5" cy="6" r="1.5" /><circle cx="3.5" cy="12" r="1.5" /><circle cx="3.5" cy="18" r="1.5" /></>,
  card:      <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  budget:    <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  target:    <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  chart:     <><path d="M3 3v18h18" /><path d="M7 14l3-3 4 4 5-5" /></>,
  repeat:    <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  lightbulb: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7 4 4 0 0 1 1.5 3.3h5a4 4 0 0 1 1.5-3.3A7 7 0 0 0 12 2z" /></>,
  settings:  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

function NavIcon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export default function MoneyTracker() {
  const [state, dispatch] = useReducer(reducer, null, () => loadState());
  const [view, setView] = useState('pregled');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { saveState(state); }, [state]);

  function renderView() {
    switch (view) {
      case 'pregled':      return <Dashboard state={state} onNav={setView} />;
      case 'transakcije':  return <Transactions state={state} dispatch={dispatch} />;
      case 'racuni':       return <Accounts state={state} dispatch={dispatch} />;
      case 'proracun':     return <Budget state={state} dispatch={dispatch} />;
      case 'cilji':        return <Goals state={state} dispatch={dispatch} />;
      case 'porocila':     return <Reports state={state} />;
      case 'ponavljajoce': return <Recurring state={state} dispatch={dispatch} />;
      case 'vpogledi':     return <Insights state={state} />;
      case 'nastavitve':   return <Settings state={state} dispatch={dispatch} />;
      default: return null;
    }
  }

  return (
    <div style={{ minHeight: '85vh', background: 'var(--color-bg)' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 230px) 1fr',
        maxWidth: 1400,
        margin: '0 auto',
        gap: 0,
      }} className="tracker-shell">
        {/* Sidebar */}
        <aside style={{
          padding: '2rem 1rem',
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          minHeight: '85vh',
        }} className="tracker-sidebar">
          <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Sledilnik
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>Osebne finance</div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map((n) => {
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => { setView(n.id); setMobileNavOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0.6rem 0.85rem', borderRadius: 8,
                    fontSize: '0.92rem', fontWeight: 500,
                    background: active ? 'var(--color-accent-bg)' : 'transparent',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'all 0.12s',
                  }}>
                  <NavIcon name={n.icon} />
                  {n.label}
                </button>
              );
            })}
          </nav>
          <div style={{
            marginTop: '2rem',
            padding: '0.85rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Beta</div>
            Vsi podatki so shranjeni lokalno. Prek <button onClick={() => setView('nastavitve')} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Nastavitev</button> redno izvozi varnostno kopijo.
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: '2rem 1.75rem', minWidth: 0 }} className="tracker-main">
          {renderView()}
        </main>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .tracker-shell { grid-template-columns: 1fr !important; }
          .tracker-sidebar {
            min-height: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid var(--color-border);
            padding: 1rem !important;
          }
          .tracker-sidebar nav { flex-direction: row !important; flex-wrap: wrap; }
          .tracker-sidebar nav button { padding: 0.45rem 0.7rem !important; font-size: 0.82rem !important; }
          .tracker-main { padding: 1.25rem 1rem !important; }
        }
      `}</style>
    </div>
  );
}

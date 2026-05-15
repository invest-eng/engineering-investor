/**
 * Money tracker — local storage store, types and helpers.
 * All amounts are EUR, stored as numbers (use cents-precision when needed).
 */

const STORAGE_KEY = 'ei-tracker-v1';

export const ACCOUNT_TYPES = [
  { id: 'checking',   label: 'TRR / tekoči račun' },
  { id: 'savings',    label: 'Varčevalni račun' },
  { id: 'cash',       label: 'Gotovina' },
  { id: 'card',       label: 'Kreditna kartica' },
  { id: 'investment', label: 'Naložbeni račun' },
  { id: 'loan',       label: 'Posojilo / hipoteka' },
];

export const ACCOUNT_TYPE_LABEL = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.id, t.label]));

export const PALETTE = [
  '#2563eb', '#059669', '#d97706', '#db2777', '#a855f7',
  '#0891b2', '#dc2626', '#65a30d', '#ea580c', '#7c3aed',
  '#0d9488', '#ca8a04', '#e11d48', '#16a34a', '#4f46e5',
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Plača', color: '#059669' },
  { name: 'Honorar / s.p.', color: '#16a34a' },
  { name: 'Dividende & obresti', color: '#65a30d' },
  { name: 'Najemnina', color: '#0d9488' },
  { name: 'Drugi prihodki', color: '#0891b2' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Stanovanje',         color: '#2563eb' },
  { name: 'Hrana & gospodinjstvo', color: '#d97706' },
  { name: 'Promet',             color: '#dc2626' },
  { name: 'Računi & naročnine', color: '#7c3aed' },
  { name: 'Zdravje',            color: '#db2777' },
  { name: 'Prosti čas',         color: '#a855f7' },
  { name: 'Oblačila',           color: '#ea580c' },
  { name: 'Izobraževanje',      color: '#4f46e5' },
  { name: 'Davki & prispevki',  color: '#e11d48' },
  { name: 'Naložbe',            color: '#059669' },
  { name: 'Drugo',              color: '#64748b' },
];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function freshState() {
  const today = new Date().toISOString().slice(0, 10);
  const accounts = [
    { id: uid(), name: 'TRR',       type: 'checking', startingBalance: 0, color: '#2563eb', archived: false, createdAt: today },
    { id: uid(), name: 'Varčevanje', type: 'savings',  startingBalance: 0, color: '#059669', archived: false, createdAt: today },
    { id: uid(), name: 'Gotovina',  type: 'cash',     startingBalance: 0, color: '#d97706', archived: false, createdAt: today },
  ];
  const categories = [
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ id: uid(), type: 'income',  archived: false, ...c })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ id: uid(), type: 'expense', archived: false, ...c })),
  ];
  return {
    version: 1,
    accounts,
    categories,
    transactions: [],
    budgets: [],
    goals: [],
    recurring: [],
    settings: {
      currency: 'EUR',
      locale: 'sl-SI',
      firstDayOfMonth: 1,
      onboarded: false,
    },
  };
}

export function loadState() {
  if (typeof window === 'undefined') return freshState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return freshState();
    return {
      ...freshState(),
      ...parsed,
      settings: { ...freshState().settings, ...(parsed.settings || {}) },
    };
  } catch {
    return freshState();
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveState failed', e);
  }
}

export function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sledilnik-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

export function importJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || data.version !== 1) throw new Error('Nezdružljiva datoteka');
        resolve(data);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/* ---------- formatters ---------- */

const eurFmt = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurFmtPrecise = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' });

export function fmtEur(n, precise = false) {
  const v = Number.isFinite(n) ? n : 0;
  return (precise ? eurFmtPrecise : eurFmt).format(v);
}
export function fmtDate(iso) {
  if (!iso) return '';
  try { return dateFmt.format(new Date(iso)); } catch { return iso; }
}
export function fmtMonth(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
}
export function todayIso() { return new Date().toISOString().slice(0, 10); }
export function monthKey(iso) { return iso.slice(0, 7); }

/* ---------- selectors / derived ---------- */

export function accountBalance(state, accountId) {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  let bal = Number(acc.startingBalance) || 0;
  for (const t of state.transactions) {
    if (t.type === 'income' && t.accountId === accountId) bal += Number(t.amount) || 0;
    else if (t.type === 'expense' && t.accountId === accountId) bal -= Number(t.amount) || 0;
    else if (t.type === 'transfer') {
      if (t.accountId === accountId) bal -= Number(t.amount) || 0;
      if (t.transferToAccountId === accountId) bal += Number(t.amount) || 0;
    }
  }
  return bal;
}

export function totalBalance(state) {
  return state.accounts
    .filter((a) => !a.archived && a.type !== 'loan' && a.type !== 'card')
    .reduce((sum, a) => sum + accountBalance(state, a.id), 0);
}

export function totalDebt(state) {
  return state.accounts
    .filter((a) => !a.archived && (a.type === 'loan' || a.type === 'card'))
    .reduce((sum, a) => sum + Math.abs(accountBalance(state, a.id)), 0);
}

export function txInRange(state, fromIso, toIso) {
  return state.transactions.filter((t) => t.date >= fromIso && t.date <= toIso);
}

export function sumByType(transactions, type) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
}

export function sumByCategory(transactions, type) {
  const m = new Map();
  for (const t of transactions) {
    if (t.type !== type) continue;
    const key = t.categoryId || 'unkat';
    m.set(key, (m.get(key) || 0) + (Number(t.amount) || 0));
  }
  return m;
}

export function monthRange(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  const from = `${yyyymm}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${yyyymm}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

export function lastNMonths(n, anchor = todayIso()) {
  const out = [];
  const d = new Date(anchor);
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

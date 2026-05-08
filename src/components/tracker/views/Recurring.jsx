import { useState } from 'react';
import { Card, Button, Input, Select, Field, Modal, SectionHeader, Empty, Tag } from '../ui.jsx';
import { fmtEur, fmtDate, todayIso, uid } from '../store.js';

const FREQS = [
  { id: 'monthly', label: 'Mesečno' },
  { id: 'weekly',  label: 'Tedensko' },
  { id: 'yearly',  label: 'Letno' },
];

function emptyRule() {
  return {
    id: '',
    name: '',
    type: 'expense',
    amount: '',
    accountId: '',
    categoryId: '',
    frequency: 'monthly',
    dayOfMonth: 1,
    nextDate: todayIso(),
    active: true,
    notes: '',
  };
}

function nextDate(rule, fromIso) {
  const d = new Date(fromIso);
  if (rule.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (rule.frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (rule.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Recurring({ state, dispatch }) {
  const [editing, setEditing] = useState(null);
  const accounts = state.accounts.filter((a) => !a.archived);
  const cats = state.categories.filter((c) => !c.archived);

  function save(e) {
    e.preventDefault();
    if (!editing.name || !editing.amount) return;
    const rule = {
      ...editing,
      id: editing.id || uid(),
      amount: Math.abs(Number(editing.amount)) || 0,
    };
    if (editing.id) dispatch({ type: 'recurring/update', rule });
    else dispatch({ type: 'recurring/add', rule });
    setEditing(null);
  }

  function remove(id) {
    if (!confirm('Izbrišem ponavljajoče?')) return;
    dispatch({ type: 'recurring/remove', id });
    setEditing(null);
  }

  function executeNow(rule) {
    const tx = {
      id: uid(),
      date: rule.nextDate,
      type: rule.type,
      amount: rule.amount,
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      payee: rule.name,
      notes: 'Avtomatsko iz ponavljajočih',
      tags: ['recurring'],
    };
    dispatch({ type: 'tx/add', tx });
    dispatch({ type: 'recurring/update', rule: { ...rule, nextDate: nextDate(rule, rule.nextDate) } });
  }

  const due = state.recurring.filter((r) => r.active && r.nextDate <= todayIso());
  const upcoming = state.recurring.filter((r) => r.active && r.nextDate > todayIso());
  const monthlyTotal = state.recurring
    .filter((r) => r.active)
    .reduce((s, r) => {
      const mult = r.frequency === 'monthly' ? 1 : r.frequency === 'weekly' ? 4.33 : 1 / 12;
      return s + (r.type === 'expense' ? r.amount * mult : r.type === 'income' ? -r.amount * mult : 0);
    }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionHeader
        title="Ponavljajoče"
        subtitle={`${state.recurring.length} pravil · mesečno neto: ${fmtEur(-monthlyTotal)}`}
        action={<Button onClick={() => setEditing(emptyRule())}>+ Novo pravilo</Button>}
      />

      {due.length > 0 && (
        <Card style={{ borderLeft: '3px solid #fbbf24' }}>
          <strong style={{ fontSize: '0.95rem' }}>Zapadla pravila ({due.length})</strong>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {due.map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong>{r.name}</strong> · {fmtEur(r.amount)} <span style={{ color: 'var(--color-text-muted)' }}>({fmtDate(r.nextDate)})</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" onClick={() => executeNow(r)}>Knjiži</Button>
                  <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'recurring/update', rule: { ...r, nextDate: nextDate(r, r.nextDate) } })}>Preskoči</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {state.recurring.length === 0 ? (
        <Empty
          title="Še ni ponavljajočih"
          description="Naročnine, plača, najemnina, krediti — vse, kar se ponavlja na rednih intervalih."
          action={<Button onClick={() => setEditing(emptyRule())}>+ Novo pravilo</Button>}
        />
      ) : (
        <Card padding="0">
          {state.recurring.map((r, i) => {
            const acc = state.accounts.find((a) => a.id === r.accountId);
            const cat = state.categories.find((c) => c.id === r.categoryId);
            return (
              <button key={r.id} onClick={() => setEditing({ ...r, amount: String(r.amount) })}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.85rem',
                  padding: '0.85rem 1.25rem',
                  borderBottom: i < state.recurring.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit', alignItems: 'center',
                  opacity: r.active ? 1 : 0.5,
                }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{r.name}</strong>
                    <Tag color={cat?.color}>{FREQS.find((f) => f.id === r.frequency)?.label}</Tag>
                    {!r.active && <Tag>Pavza</Tag>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                    Naslednje: {fmtDate(r.nextDate)} · {acc?.name} {cat ? `· ${cat.name}` : ''}
                  </div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '0.95rem',
                  color: r.type === 'income' ? '#34d399' : '#f87171',
                }}>
                  {r.type === 'income' ? '+' : '−'}{fmtEur(r.amount)}
                </div>
              </button>
            );
          })}
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Uredi pravilo' : 'Novo ponavljajoče'}>
        {editing && (
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="Ime">
              <Input required value={editing.name} placeholder="npr. Najemnina, Plača, Spotify"
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Field label="Vrsta">
                <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="expense">Odhodek</option>
                  <option value="income">Prihodek</option>
                </Select>
              </Field>
              <Field label="Znesek (€)">
                <Input type="number" step="0.01" min="0" required value={editing.amount}
                  onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Field label="Frekvenca">
                <Select value={editing.frequency} onChange={(e) => setEditing({ ...editing, frequency: e.target.value })}>
                  {FREQS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label="Naslednji datum">
                <Input type="date" value={editing.nextDate}
                  onChange={(e) => setEditing({ ...editing, nextDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Račun">
              <Select required value={editing.accountId}
                onChange={(e) => setEditing({ ...editing, accountId: e.target.value })}>
                <option value="">— izberi —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label="Kategorija">
              <Select value={editing.categoryId}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                <option value="">— brez —</option>
                {cats.filter((c) => c.type === editing.type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
              <input type="checkbox" checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Aktivno
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              {editing.id ? (
                <Button type="button" variant="danger" onClick={() => remove(editing.id)}>Izbriši</Button>
              ) : <span />}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Prekliči</Button>
                <Button type="submit">Shrani</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

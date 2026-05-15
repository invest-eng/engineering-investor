import { useMemo } from 'react';
import { Card, KpiCard, SectionHeader, Tag, Empty, Button } from '../ui.jsx';
import { PieChart, BarChart, LineChart, FlowChart, ProgressBar } from '../charts.jsx';
import {
  fmtEur, fmtDate, todayIso, monthRange, lastNMonths, sumByType,
  totalBalance, totalDebt, accountBalance, sumByCategory,
} from '../store.js';

export default function Dashboard({ state, onNav }) {
  const today = todayIso();
  const thisMonth = today.slice(0, 7);
  const { from, to } = monthRange(thisMonth);

  const monthTx = useMemo(
    () => state.transactions.filter((t) => t.date >= from && t.date <= to),
    [state.transactions, from, to],
  );

  const monthIncome = sumByType(monthTx, 'income');
  const monthExpense = sumByType(monthTx, 'expense');
  const netBalance = totalBalance(state);
  const debt = totalDebt(state);
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

  const months = lastNMonths(6);
  const monthSeries = useMemo(() => months.map((mk) => {
    const { from, to } = monthRange(mk);
    const txs = state.transactions.filter((t) => t.date >= from && t.date <= to);
    return {
      label: mk.slice(5) + '.',
      income: sumByType(txs, 'income'),
      expense: sumByType(txs, 'expense'),
    };
  }), [state.transactions, months.join(',')]);

  const balanceTrend = useMemo(() => {
    const accountsAlive = state.accounts.filter((a) => !a.archived && a.type !== 'loan' && a.type !== 'card');
    const startBal = accountsAlive.reduce((s, a) => s + (Number(a.startingBalance) || 0), 0);
    const points = months.map((mk) => {
      const { to } = monthRange(mk);
      let bal = startBal;
      for (const t of state.transactions) {
        if (t.date > to) continue;
        const aliveSrc = accountsAlive.some((a) => a.id === t.accountId);
        const aliveDst = accountsAlive.some((a) => a.id === t.transferToAccountId);
        if (t.type === 'income' && aliveSrc) bal += Number(t.amount) || 0;
        else if (t.type === 'expense' && aliveSrc) bal -= Number(t.amount) || 0;
        else if (t.type === 'transfer') {
          if (aliveSrc) bal -= Number(t.amount) || 0;
          if (aliveDst) bal += Number(t.amount) || 0;
        }
      }
      return { label: mk.slice(5) + '.', y: bal };
    });
    return points;
  }, [state.transactions, state.accounts, months.join(',')]);

  const categorySpend = useMemo(() => {
    const m = sumByCategory(monthTx, 'expense');
    return [...m.entries()]
      .map(([cid, v]) => {
        const cat = state.categories.find((c) => c.id === cid);
        return { id: cid, label: cat?.name || 'Brez kategorije', value: v, color: cat?.color || '#64748b' };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTx, state.categories]);

  const incomesForFlow = useMemo(() => {
    const m = sumByCategory(monthTx, 'income');
    return [...m.entries()]
      .map(([cid, v]) => {
        const cat = state.categories.find((c) => c.id === cid);
        return { id: cid, label: cat?.name || 'Brez kategorije', value: v, color: cat?.color || '#10b981' };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [monthTx, state.categories]);

  const recentTx = useMemo(() => {
    return [...state.transactions]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
  }, [state.transactions]);

  const accountsAlive = state.accounts.filter((a) => !a.archived);
  const txCount = state.transactions.length;

  if (txCount === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Empty
          title="Začni s prvo transakcijo"
          description="Vnesi svoje prihodke in odhodke. Vse podatke hranimo lokalno v tvojem brskalniku — ničesar ne pošiljamo na strežnik."
          action={<Button onClick={() => onNav('transakcije')}>+ Vnesi prvo transakcijo</Button>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <KpiCard label="Stanje" value={fmtEur(netBalance)} sub="Skupno na vseh računih" />
          <KpiCard label="Računi" value={accountsAlive.length} sub="Aktivnih" />
          <KpiCard label="Kategorije" value={state.categories.filter((c) => !c.archived).length} sub="Prihodki + odhodki" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <KpiCard label="Neto stanje" value={fmtEur(netBalance)} sub="Vsi računi skupaj" />
        <KpiCard label="Prihodki ta mesec" value={fmtEur(monthIncome)} color="#059669" sub={`${monthTx.filter((t) => t.type === 'income').length} transakcij`} />
        <KpiCard label="Odhodki ta mesec" value={fmtEur(monthExpense)} color="#dc2626" sub={`${monthTx.filter((t) => t.type === 'expense').length} transakcij`} />
        <KpiCard
          label="Stopnja varčevanja"
          value={`${savingsRate.toFixed(0)}%`}
          color={savingsRate >= 20 ? '#059669' : savingsRate >= 0 ? '#d97706' : '#dc2626'}
          sub={savingsRate >= 20 ? 'Odlično' : savingsRate >= 0 ? 'Pozitivno' : 'Negativno'}
        />
        {debt > 0 && <KpiCard label="Dolg" value={fmtEur(debt)} color="#d97706" sub="Krediti + kartice" />}
      </div>

      {/* Trend grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        <Card>
          <SectionHeader title="Prihodki vs. odhodki" subtitle="Zadnjih 6 mesecev" />
          <BarChart data={monthSeries} height={200} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.8rem', color: 'var(--color-text-muted)', justifyContent: 'center' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#10b981', borderRadius: 2, marginRight: 6 }} />Prihodki</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 6 }} />Odhodki</span>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Trend stanja" subtitle="Zadnjih 6 mesecev" />
          <LineChart series={[{ points: balanceTrend, color: '#3b82f6', fill: true }]} height={200} />
        </Card>
      </div>

      {/* Cash flow */}
      {(incomesForFlow.length > 0 || categorySpend.length > 0) && (
        <Card>
          <SectionHeader title="Denarni tok" subtitle="Ta mesec — od prihodkov do kategorij odhodkov" />
          <FlowChart incomes={incomesForFlow} expenses={categorySpend} height={Math.max(260, Math.max(incomesForFlow.length, categorySpend.length) * 28)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <div>
              <strong style={{ color: '#059669' }}>+ {fmtEur(monthIncome)}</strong> prihodkov
            </div>
            <div>
              <strong style={{ color: '#dc2626' }}>− {fmtEur(monthExpense)}</strong> odhodkov
            </div>
            <div>
              Razlika: <strong style={{ color: monthIncome - monthExpense >= 0 ? '#059669' : '#dc2626' }}>
                {fmtEur(monthIncome - monthExpense)}
              </strong>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom: top categories + recent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        <Card>
          <SectionHeader title="Največji odhodki" subtitle="Ta mesec, po kategorijah" />
          {categorySpend.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>Še ni odhodkov ta mesec.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <PieChart
                data={categorySpend.slice(0, 8).map((c) => ({ value: c.value, color: c.color }))}
                size={170} thickness={28}
                centerValue={fmtEur(monthExpense)}
                centerLabel="skupaj"
              />
              <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categorySpend.slice(0, 6).map((c) => {
                  const pct = monthExpense > 0 ? (c.value / monthExpense) * 100 : 0;
                  return (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                          {c.label}
                        </span>
                        <strong>{fmtEur(c.value)}</strong>
                      </div>
                      <ProgressBar value={c.value} max={categorySpend[0].value} color={c.color} height={4} />
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>{pct.toFixed(0)}% odhodkov</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader title="Nedavne transakcije" subtitle="Zadnjih 8 vnosov" action={<Button variant="ghost" size="sm" onClick={() => onNav('transakcije')}>Vse →</Button>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentTx.map((t) => {
              const cat = state.categories.find((c) => c.id === t.categoryId);
              const acc = state.accounts.find((a) => a.id === t.accountId);
              return (
                <div key={t.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '0.75rem',
                  padding: '0.65rem 0',
                  borderBottom: '1px solid var(--color-border)',
                  alignItems: 'center',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat?.color || 'var(--color-text-muted)' }} />
                      <strong style={{ fontSize: '0.9rem' }}>{t.payee || cat?.name || 'Transakcija'}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                      {fmtDate(t.date)} · {acc?.name || '—'} {cat ? `· ${cat.name}` : ''}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.95rem',
                    color: t.type === 'income' ? '#059669' : t.type === 'expense' ? '#dc2626' : 'var(--color-text)',
                  }}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}{fmtEur(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

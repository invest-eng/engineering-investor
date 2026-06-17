import { useRef, useState } from 'react';
import { Card, Button, Input, Select, Field, Modal, SectionHeader } from '../ui.jsx';
import { fmtEur, exportJson, exportExcel, importJson, freshState, PALETTE, uid } from '../store.js';

function emptyCategory(type = 'expense') {
  return { id: '', name: '', type, color: PALETTE[0], archived: false };
}

export default function Settings({ state, dispatch }) {
  const fileRef = useRef(null);
  const [editingCat, setEditingCat] = useState(null);

  function handleExport() {
    exportJson(state);
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJson(file);
      if (!confirm('Uvoz prepiše vse trenutne podatke. Nadaljujem?')) return;
      dispatch({ type: 'state/replace', state: data });
    } catch (err) {
      alert('Napaka pri uvozu: ' + err.message);
    }
    e.target.value = '';
  }

  function handleReset() {
    if (!confirm('Izbrišem VSE podatke (transakcije, računi, kategorije...)? Tega ni mogoče razveljaviti.')) return;
    if (!confirm('Še enkrat: res želiš ponastaviti vse?')) return;
    dispatch({ type: 'state/replace', state: freshState() });
  }

  function saveCategory(e) {
    e.preventDefault();
    if (!editingCat.name) return;
    const cat = { ...editingCat, id: editingCat.id || uid() };
    if (editingCat.id) dispatch({ type: 'category/update', category: cat });
    else dispatch({ type: 'category/add', category: cat });
    setEditingCat(null);
  }

  function removeCategory(id) {
    const used = state.transactions.some((t) => t.categoryId === id);
    if (used) {
      if (!confirm('Kategorija ima transakcije. Arhiviram (transakcije ostanejo).')) return;
      const cat = state.categories.find((c) => c.id === id);
      dispatch({ type: 'category/update', category: { ...cat, archived: true } });
    } else {
      if (!confirm('Izbrišem kategorijo?')) return;
      dispatch({ type: 'category/remove', id });
    }
    setEditingCat(null);
  }

  const incomeCats = state.categories.filter((c) => c.type === 'income' && !c.archived);
  const expenseCats = state.categories.filter((c) => c.type === 'expense' && !c.archived);
  const archived = state.categories.filter((c) => c.archived);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionHeader title="Nastavitve" subtitle="Kategorije, podatki, izvoz / uvoz" />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong style={{ fontSize: '1rem' }}>Podatki</strong>
            <div style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 480 }}>
              Vsi podatki se shranjujejo lokalno v tvojem brskalniku. Nič ne pošljemo na strežnik.
              Redno izvozi varnostno kopijo, da podatkov ne izgubiš (čiščenje brskalnika, nova naprava...).
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => exportExcel(state)}>Izvozi Excel</Button>
            <Button variant="secondary" onClick={handleExport}>Izvozi JSON</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>Uvozi JSON</Button>
            <input ref={fileRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
            <Button variant="danger" onClick={handleReset}>Ponastavi vse</Button>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <div>Računi: <strong style={{ color: 'var(--color-text)' }}>{state.accounts.length}</strong></div>
          <div>Kategorije: <strong style={{ color: 'var(--color-text)' }}>{state.categories.length}</strong></div>
          <div>Transakcije: <strong style={{ color: 'var(--color-text)' }}>{state.transactions.length}</strong></div>
          <div>Cilji: <strong style={{ color: 'var(--color-text)' }}>{state.goals.length}</strong></div>
          <div>Pravila: <strong style={{ color: 'var(--color-text)' }}>{state.recurring.length}</strong></div>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: '1rem' }}>Kategorije prihodkov ({incomeCats.length})</strong>
          <Button size="sm" variant="secondary" onClick={() => setEditingCat(emptyCategory('income'))}>+ Dodaj</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {incomeCats.map((c) => (
            <button key={c.id} onClick={() => setEditingCat(c)} style={{
              padding: '6px 12px', borderRadius: 999,
              background: `${c.color}22`, border: `1px solid ${c.color}55`, color: c.color,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
            }}>{c.name}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: '1rem' }}>Kategorije odhodkov ({expenseCats.length})</strong>
          <Button size="sm" variant="secondary" onClick={() => setEditingCat(emptyCategory('expense'))}>+ Dodaj</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {expenseCats.map((c) => (
            <button key={c.id} onClick={() => setEditingCat(c)} style={{
              padding: '6px 12px', borderRadius: 999,
              background: `${c.color}22`, border: `1px solid ${c.color}55`, color: c.color,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
            }}>{c.name}</button>
          ))}
        </div>
      </Card>

      {archived.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Arhivirane kategorije ({archived.length})
          </summary>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {archived.map((c) => (
              <button key={c.id} onClick={() => dispatch({ type: 'category/update', category: { ...c, archived: false } })}
                style={{
                  padding: '4px 10px', borderRadius: 999,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer',
                }}>
                {c.name} (obnovi)
              </button>
            ))}
          </div>
        </details>
      )}

      <Modal open={!!editingCat} onClose={() => setEditingCat(null)} title={editingCat?.id ? 'Uredi kategorijo' : 'Nova kategorija'}>
        {editingCat && (
          <form onSubmit={saveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="Ime">
              <Input required value={editingCat.name} autoFocus
                onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} />
            </Field>
            <Field label="Vrsta">
              <Select value={editingCat.type} onChange={(e) => setEditingCat({ ...editingCat, type: e.target.value })}>
                <option value="expense">Odhodek</option>
                <option value="income">Prihodek</option>
              </Select>
            </Field>
            <Field label="Barva">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PALETTE.map((c) => (
                  <button key={c} type="button" onClick={() => setEditingCat({ ...editingCat, color: c })}
                    style={{
                      width: 26, height: 26, borderRadius: 6, background: c,
                      border: editingCat.color === c ? '2px solid var(--color-text)' : '2px solid transparent',
                      cursor: 'pointer',
                    }} />
                ))}
              </div>
            </Field>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              {editingCat.id ? (
                <Button type="button" variant="danger" onClick={() => removeCategory(editingCat.id)}>Izbriši</Button>
              ) : <span />}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setEditingCat(null)}>Prekliči</Button>
                <Button type="submit">Shrani</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

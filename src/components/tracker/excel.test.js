// Preizkus izvoza v Excel (avtor, 3. 10. 2026: "excel izvoz ne deluje"). Poženi: node --test src/components/tracker/

import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { buildWorkbook, excelSheets, freshState } from './store.js';
import { demoData } from './demo.js';

const state = () => {
  const s = freshState();
  const hrana = s.categories.find((c) => c.name.startsWith('Hrana')).id;
  const [trr, varcevanje] = s.accounts;
  return {
    ...s,
    transactions: [
      { id: 'a', date: '2026-10-02', type: 'expense', amount: 23.4, accountId: trr.id, categoryId: hrana, payee: 'Hofer', notes: 'tedenski nakup' },
      { id: 'b', date: '2026-10-03', type: 'income', amount: 2150, accountId: trr.id, categoryId: null, payee: 'Podjetje', notes: '' },
      { id: 'c', date: '2026-10-01', type: 'transfer', amount: 100, accountId: trr.id, transferToAccountId: varcevanje.id, categoryId: null, payee: '', notes: '' },
    ],
    budgets: [{ id: 'm', categoryId: hrana, monthlyLimit: 450, period: 'monthly' }],
    recurring: [{ id: 'r', name: 'Najemnina', type: 'expense', amount: 650, accountId: trr.id, categoryId: null, frequency: 'monthly', nextDate: '2026-11-01', active: true }],
  };
};

test('listi za Excel: trgovina, opomba in meja proračuna so izpolnjeni', () => {
  const sheets = Object.fromEntries(excelSheets(state()).map((s) => [s.name, s.rows]));
  assert.deepEqual(Object.keys(sheets), ['Transakcije', 'Računi', 'Proračun', 'Redni stroški']);
  // Najnovejši vnos je prvi; odhodek je negativen, prihodek pozitiven.
  assert.deepEqual(sheets.Transakcije.map((r) => [r.Datum, r.Vrsta, r['Trgovina ali plačnik'], r['Znesek (EUR)'], r.Opomba]), [
    ['2026-10-03', 'Prihodek', 'Podjetje', 2150, ''],
    ['2026-10-02', 'Odhodek', 'Hofer', -23.4, 'tedenski nakup'],
    ['2026-10-01', 'Prenos', '', 100, ''],
  ]);
  assert.equal(sheets.Transakcije[1].Kategorija, 'Hrana & gospodinjstvo');
  assert.equal(sheets.Transakcije[2].Račun, 'TRR → Varčevanje');
  // Do 3. 10. 2026 je bila meja vedno 0, ker je izvoz bral polje, ki ne obstaja.
  assert.deepEqual(sheets.Proračun, [{ Kategorija: 'Hrana & gospodinjstvo', 'Mesečna meja (EUR)': 450 }]);
  assert.equal(sheets['Redni stroški'][0].Pogostost, 'Mesečno');
  assert.equal(sheets.Računi.find((r) => r.Račun === 'TRR')['Trenutno stanje (EUR)'], 2026.6);
});

test('prazen list se ne izvozi', () => {
  assert.deepEqual(excelSheets({ ...state(), budgets: [], recurring: [] }).map((s) => s.name), ['Transakcije', 'Računi']);
});

test('delovni zvezek se zapiše in prebere nazaj z istimi podatki', () => {
  const s = demoData(state(), '2026-10-03');
  const bytes = XLSX.write(buildWorkbook(XLSX, s), { type: 'buffer', bookType: 'xlsx' });
  assert.ok(bytes.length > 5000, 'datoteka je sumljivo majhna');
  const back = XLSX.read(bytes, { type: 'buffer' });
  assert.deepEqual(back.SheetNames, ['Transakcije', 'Računi', 'Proračun', 'Redni stroški']);
  const rows = XLSX.utils.sheet_to_json(back.Sheets.Transakcije);
  assert.equal(rows.length, s.transactions.length);
  assert.ok(rows.some((r) => r['Trgovina ali plačnik'] === 'Hofer' && r.Opomba === 'tedenski nakup'));
});

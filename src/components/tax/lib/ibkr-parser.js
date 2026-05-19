import { uid } from './store.js';

/**
 * Razčleni IBKR Activity Statement CSV izvoz.
 * Podpira standardni format iz:
 *   Reports → Activity → Activity Statement (CSV)
 *
 * Vrne: { trades: [...], warnings: [...] }
 */
export function parseIbkrCsv(csvText) {
  const lines = csvText.split(/\r?\n/);
  const trades = [];
  const warnings = [];

  // Poišči sekcijo "Trades"
  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols[0] === 'Trades' && cols[1] === 'Header') {
      headers = cols.slice(2); // Preskoči "Trades,Header"
      headerIdx = i;
      continue;
    }
    if (headerIdx === -1) continue;
    if (cols[0] !== 'Trades' || cols[1] !== 'Data') continue;

    const row = {};
    cols.slice(2).forEach((v, j) => { row[headers[j]] = v?.trim() ?? ''; });

    // Preskoči subtotale in vmesne seštevke
    if (row['DataDiscriminator'] === 'SubTotal' || row['DataDiscriminator'] === 'Total') continue;
    // Preskoči Forex in opcije za zdaj
    const cat = row['Asset Category'] || '';
    if (cat === 'Forex' || cat.includes('Option') || cat.includes('Future')) {
      warnings.push(`Preskoček: ${cat} (${row['Symbol']}) — podprti so samo Stocks in Crypto`);
      continue;
    }
    if (cat !== 'Stocks' && cat !== 'Crypto') {
      warnings.push(`Neznana kategorija: ${cat} (${row['Symbol']})`);
      continue;
    }

    const qty = parseFloat(row['Quantity'] || '0');
    if (qty === 0) continue;

    const dateRaw = row['Date/Time'] || row['TradeDate'] || '';
    const date = parseIbkrDate(dateRaw);
    if (!date) { warnings.push(`Neveljavni datum: "${dateRaw}" za ${row['Symbol']}`); continue; }

    const price = Math.abs(parseFloat(row['T. Price'] || row['TradePrice'] || '0'));
    const fees = Math.abs(parseFloat(row['Comm/Fee'] || row['IBCommission'] || '0'));
    const currency = row['Currency'] || 'USD';

    trades.push({
      id: uid(),
      type: qty > 0 ? 'buy' : 'sell',
      assetType: cat === 'Crypto' ? 'crypto' : 'stock',
      ticker: (row['Symbol'] || '').toUpperCase(),
      isin: row['ISIN'] || '',
      name: row['Description'] || row['Symbol'] || '',
      date,
      quantity: Math.abs(qty),
      pricePerUnit: price,
      currency,
      exchangeRateEur: currency === 'EUR' ? 1 : 0, // Uporabnik vnese ročno
      fees,
      broker: 'IBKR',
      notes: 'Uvoženo iz IBKR',
      source: 'ibkr',
    });
  }

  if (trades.length === 0 && headerIdx === -1) {
    warnings.push('Sekcija "Trades" ni bila najdena. Preveri, da si izvozil Activity Statement iz IBKR.');
  }

  return { trades, warnings };
}

/** Razčleni datum iz IBKR formata: "2024-01-15, 09:30:00" ali "20240115" */
function parseIbkrDate(raw) {
  if (!raw) return null;
  // Format "2024-01-15, 09:30:00"
  const m1 = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m1) return m1[1];
  // Format "20240115"
  const m2 = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

/** Razčleni CSV vrstico (upošteva narekovaje in vejice znotraj). */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

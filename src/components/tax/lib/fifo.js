// ZDoh-2 kapitalski dobički — davčne stopnje glede na čas držanja
const TAX_BRACKETS = [
  { days: 7300, rate: 0.00 },  // 20+ let → oproščeno
  { days: 5475, rate: 0.10 },  // 15–20 let
  { days: 3650, rate: 0.15 },  // 10–15 let
  { days: 1825, rate: 0.20 },  // 5–10 let
  { days: 0,    rate: 0.25 },  // 0–5 let
];

export function getTaxRate(holdingDays) {
  for (const b of TAX_BRACKETS) {
    if (holdingDays >= b.days) return b.rate;
  }
  return 0.25;
}

export function daysBetween(dateA, dateB) {
  return Math.floor((new Date(dateB) - new Date(dateA)) / 86400000);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Izračun FIFO kapitalskih dobičkov.
 * Vrne: { realizedGains, unrealizedLots, errors }
 *
 * realizedGains: [{
 *   ticker, isin, assetType, name,
 *   buyDate, sellDate, quantity,
 *   acquisitionValueEur, disposalValueEur, gainEur,
 *   holdingDays, taxRate, taxAmount
 * }]
 *
 * unrealizedLots: [{
 *   ticker, isin, assetType, name,
 *   buyDate, costPerUnitEur, quantityRemaining
 * }]
 */
export function calcFifo(trades) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  // lots[ticker] = [{ buyDate, costPerUnitEur, quantityRemaining, isin, assetType, name }]
  const lots = {};
  const realizedGains = [];
  const errors = [];

  for (const trade of sorted) {
    const key = trade.ticker.toUpperCase().trim();
    if (!key) continue;

    // costPerUnitEur = (cena * tečaj) + (provizija * tečaj / količina)
    const rate = Number(trade.exchangeRateEur) || 1;
    const qty = Number(trade.quantity);
    const price = Number(trade.pricePerUnit);
    const fees = Number(trade.fees) || 0;
    const costPerUnitEur = price * rate + (fees * rate) / qty;

    if (trade.type === 'buy') {
      if (!lots[key]) lots[key] = [];
      lots[key].push({
        buyDate: trade.date,
        costPerUnitEur: round2(costPerUnitEur),
        quantityRemaining: qty,
        isin: trade.isin || '',
        assetType: trade.assetType,
        name: trade.name || trade.ticker,
        ticker: trade.ticker,
      });
    } else if (trade.type === 'sell') {
      const proceedsPerUnitEur = price * rate - (fees * rate) / qty;
      let remaining = qty;

      while (remaining > 1e-9) {
        if (!lots[key] || lots[key].length === 0) {
          errors.push(`Ni kupne pozicije za ${key} na datum ${trade.date}`);
          break;
        }

        const lot = lots[key][0];
        const matched = Math.min(remaining, lot.quantityRemaining);
        const holdingDays = daysBetween(lot.buyDate, trade.date);
        const taxRate = getTaxRate(holdingDays);
        const acquisitionValueEur = round2(lot.costPerUnitEur * matched);
        const disposalValueEur = round2(proceedsPerUnitEur * matched);
        const gainEur = round2(disposalValueEur - acquisitionValueEur);

        realizedGains.push({
          ticker: trade.ticker,
          isin: lot.isin,
          assetType: lot.assetType,
          name: lot.name,
          buyDate: lot.buyDate,
          sellDate: trade.date,
          quantity: round2(matched),
          acquisitionValueEur,
          disposalValueEur,
          gainEur,
          holdingDays,
          taxRate,
          taxAmount: gainEur > 0 ? round2(gainEur * taxRate) : 0,
        });

        lot.quantityRemaining = round2(lot.quantityRemaining - matched);
        remaining = round2(remaining - matched);

        if (lot.quantityRemaining < 1e-9) lots[key].shift();
      }
    }
  }

  const unrealizedLots = Object.values(lots)
    .flat()
    .filter((l) => l.quantityRemaining > 1e-9);

  return { realizedGains, unrealizedLots, errors };
}

/** Razvrsti realizirane dobičke po letu prodaje. */
export function byYear(realizedGains) {
  const map = {};
  for (const g of realizedGains) {
    const yr = g.sellDate.slice(0, 4);
    if (!map[yr]) map[yr] = [];
    map[yr].push(g);
  }
  return map;
}

/** Povzetek po letu: skupni dobički, izgube, davek. */
export function yearSummary(gains) {
  let totalGain = 0, totalLoss = 0, totalTax = 0;
  const byTicker = {};

  for (const g of gains) {
    if (g.gainEur >= 0) totalGain += g.gainEur;
    else totalLoss += g.gainEur;
    totalTax += g.taxAmount;

    const k = g.ticker.toUpperCase();
    if (!byTicker[k]) byTicker[k] = { ticker: g.ticker, name: g.name, isin: g.isin, assetType: g.assetType, gain: 0, tax: 0, rows: [] };
    byTicker[k].gain += g.gainEur;
    byTicker[k].tax += g.taxAmount;
    byTicker[k].rows.push(g);
  }

  const netGain = round2(totalGain + totalLoss);
  return {
    totalGain: round2(totalGain),
    totalLoss: round2(totalLoss),
    netGain,
    totalTax: round2(totalTax),
    byTicker: Object.values(byTicker).sort((a, b) => b.gain - a.gain),
  };
}

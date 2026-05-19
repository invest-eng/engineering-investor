import * as XLSX from 'xlsx';
import { download } from './store.js';

const fmtEur = (n) => Number(n || 0).toFixed(2);
const fmtPct = (r) => `${(r * 100).toFixed(0)}%`;

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

export function exportExcel(trades, realizedGains, unrealizedLots, year) {
  const wb = XLSX.utils.book_new();

  // List 1: Vse transakcije
  const txRows = trades
    .filter((t) => !year || t.date.startsWith(String(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({
      Datum: t.date,
      Tip: t.type === 'buy' ? 'Nakup' : 'Prodaja',
      'Vrsta sredstva': assetLabel(t.assetType),
      Ticker: t.ticker,
      ISIN: t.isin || '',
      Ime: t.name || '',
      Količina: t.quantity,
      'Cena/enoto': t.pricePerUnit,
      Valuta: t.currency,
      'Tečaj EUR': t.exchangeRateEur,
      'Provizija (orig.)': t.fees,
      'Vrednost EUR': fmtEur(t.quantity * t.pricePerUnit * t.exchangeRateEur),
      Broker: t.broker || '',
      Opomba: t.notes || '',
    }));
  const wsTx = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transakcije');

  // List 2: FIFO realizirani dobički
  const gainsFiltered = year
    ? realizedGains.filter((g) => g.sellDate.startsWith(String(year)))
    : realizedGains;
  const gainsRows = gainsFiltered.map((g) => ({
    Ticker: g.ticker,
    ISIN: g.isin || '',
    Ime: g.name || '',
    'Vrsta sredstva': assetLabel(g.assetType),
    'Datum nakupa': g.buyDate,
    'Datum prodaje': g.sellDate,
    'Dni držanja': g.holdingDays,
    Količina: g.quantity,
    'Nabavna vrednost EUR': fmtEur(g.acquisitionValueEur),
    'Prodajna vrednost EUR': fmtEur(g.disposalValueEur),
    'Dobiček/Izguba EUR': fmtEur(g.gainEur),
    'Davčna stopnja': fmtPct(g.taxRate),
    'Davek EUR': fmtEur(g.taxAmount),
  }));
  if (gainsRows.length) {
    // Dodaj skupaj vrstico
    const totGain = gainsFiltered.reduce((s, g) => s + g.gainEur, 0);
    const totTax = gainsFiltered.reduce((s, g) => s + g.taxAmount, 0);
    gainsRows.push({
      Ticker: 'SKUPAJ', ISIN: '', Ime: '', 'Vrsta sredstva': '', 'Datum nakupa': '',
      'Datum prodaje': '', 'Dni držanja': '', Količina: '',
      'Nabavna vrednost EUR': '', 'Prodajna vrednost EUR': '',
      'Dobiček/Izguba EUR': fmtEur(totGain),
      'Davčna stopnja': '', 'Davek EUR': fmtEur(totTax),
    });
  }
  const wsGains = XLSX.utils.json_to_sheet(gainsRows.length ? gainsRows : [{ Opomba: 'Ni realiziranih dobičkov' }]);
  XLSX.utils.book_append_sheet(wb, wsGains, 'FIFO Dobički');

  // List 3: Odprte pozicije (nerealizes)
  const openRows = unrealizedLots.map((l) => ({
    Ticker: l.ticker,
    ISIN: l.isin || '',
    Ime: l.name || '',
    'Vrsta sredstva': assetLabel(l.assetType),
    'Datum nakupa': l.buyDate,
    'Preostala količina': l.quantityRemaining,
    'Nabavna cena/enoto EUR': fmtEur(l.costPerUnitEur),
    'Skupna nabavna vrednost EUR': fmtEur(l.quantityRemaining * l.costPerUnitEur),
  }));
  const wsOpen = XLSX.utils.json_to_sheet(openRows.length ? openRows : [{ Opomba: 'Ni odprtih pozicij' }]);
  XLSX.utils.book_append_sheet(wb, wsOpen, 'Odprte pozicije');

  const filename = `davek-kapitalski-dobicki${year ? '-' + year : ''}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─── eDavki XML EXPORT (Doh-KDVP) ───────────────────────────────────────────

/**
 * Generira XML datoteko za FURS eDavki sistem (obrazec Doh-KDVP).
 * Shema: http://edavki.durs.si/Documents/Schemas/Doh_KDVP_9.xsd
 *
 * OPOZORILO: Pred oddajo na FURS preveri vsebino z računovodjem ali
 * na uradni FURS eDavki strani. Shema se lahko spremeni.
 */
export function exportEdavkiXml(realizedGains, profile, year) {
  const gains = realizedGains.filter((g) => g.sellDate.startsWith(String(year)));
  if (gains.length === 0) {
    alert(`Ni realiziranih dobičkov za leto ${year}.`);
    return;
  }

  // Združi po tickerju
  const byTicker = {};
  for (const g of gains) {
    const k = g.ticker.toUpperCase();
    if (!byTicker[k]) byTicker[k] = { ...g, rows: [] };
    byTicker[k].rows.push(g);
  }

  let rowId = 1;
  const items = Object.values(byTicker).map((item) => {
    const isFund = item.assetType === 'etf' || item.assetType === 'fund';
    const isCrypto = item.assetType === 'crypto';
    const securities = item.rows.map((g) => `
        <row>
          <ID>${rowId++}</ID>
          <Code>${esc(g.ticker)}</Code>
          <ISIN>${esc(g.isin || '')}</ISIN>
          <Name>${esc(g.name || g.ticker)}</Name>
          <IsFond>${isFund}</IsFond>
          <Purchase>
            <F1>${g.buyDate}</F1>
            <F2>0</F2>
            <F3>${g.quantity}</F3>
            <F4>${fmtEur(g.acquisitionValueEur)}</F4>
            <F5>0</F5>
            <F11>${fmtEur(g.acquisitionValueEur)}</F11>
          </Purchase>
          <Sale>
            <F6>${g.sellDate}</F6>
            <F7>${g.quantity}</F7>
            <F9>${fmtEur(g.disposalValueEur)}</F9>
            <F10>${fmtEur(g.gainEur)}</F10>
          </Sale>
        </row>`).join('');

    return `
      <KDVPItem>
        <InventoryListType>${isCrypto ? 'PLVPVK' : 'PLVP'}</InventoryListType>
        <Name>${esc(item.name || item.ticker)}</Name>
        <HasForeignTax>false</HasForeignTax>
        <HasLossTransfer>false</HasLossTransfer>
        <ForeignTransfer>false</ForeignTransfer>
        <TaxDecreaseConf>false</TaxDecreaseConf>
        <Securities>${securities}
        </Securities>
      </KDVPItem>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns="http://edavki.durs.si/Documents/Schemas/Doh_KDVP_9.xsd"
          xmlns:edp="http://edavki.durs.si/Documents/Schemas/EDP-Common-1.xsd"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <edp:Header>
    <edp:taxpayer>
      <edp:taxNumber>${esc(profile.taxNumber)}</edp:taxNumber>
      <edp:taxpayerType>FO</edp:taxpayerType>
      <edp:name>${esc(profile.name)}</edp:name>
      <edp:address1>${esc(profile.address)}</edp:address1>
      <edp:city>${esc(profile.city)}</edp:city>
      <edp:postNumber>${esc(profile.postCode)}</edp:postNumber>
      <edp:birthDate>${esc(profile.birthDate)}</edp:birthDate>
    </edp:taxpayer>
    <edp:Workflow>
      <edp:DocumentWorkflowID>O</edp:DocumentWorkflowID>
    </edp:Workflow>
  </edp:Header>
  <edp:AttachmentList/>
  <edp:Signatures/>
  <body>
    <Doh_KDVP>
      <KDVP>
        <DocumentWorkflowID>O</DocumentWorkflowID>
        <Year>${year}</Year>
        <PeriodStart>${year}-01-01</PeriodStart>
        <PeriodEnd>${year}-12-31</PeriodEnd>
        <IsResident>true</IsResident>
        <TelephoneNumber>${esc(profile.phone)}</TelephoneNumber>
        <Email>${esc(profile.email)}</Email>
      </KDVP>${items}
    </Doh_KDVP>
  </body>
</Envelope>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  download(blob, `Doh-KDVP-${year}.xml`);
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function assetLabel(type) {
  return { stock: 'Delnica', etf: 'ETF', fund: 'Sklad', crypto: 'Kripto', bond: 'Obveznica' }[type] || type;
}

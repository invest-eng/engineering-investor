import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle, BookOpen, Calculator, Settings2, AlertCircle } from 'lucide-react';

const ETF_PROFILES = {
  cspx: { name: 'CSPX', fullName: 'iShares Core S&P 500 UCITS ETF', domicile: 'Irska', market: 'Euronext Amsterdam', isin: 'IE00B5BMR087', type: 'US Stocks', distribution: 'Akumulacijski', isAccumulating: true, grossDividendYield: 1.5, expense: 0.07, historicalReturn: 10.0, riskLevel: 'Srednje', description: '500 največjih US podjetij. Akumulacijski.', pros: ['Najnižji stroški (0,07%)', 'Akumulacijski', 'Najbolj likviden'], cons: ['Samo US trg', 'USD tveganje'] },
  vusa: { name: 'VUSA', fullName: 'Vanguard S&P 500 UCITS ETF', domicile: 'Irska', market: 'LSE', isin: 'IE00B3XXRP09', type: 'US Stocks', distribution: 'Distribucijski', isAccumulating: false, grossDividendYield: 1.5, expense: 0.07, historicalReturn: 10.0, riskLevel: 'Srednje', description: 'Vanguard S&P 500 distribucijski.', pros: ['Nizki stroški', 'Redne dividende'], cons: ['Davek na dividende'] },
  idvy: { name: 'IDVY', fullName: 'iShares Euro Dividend UCITS ETF', domicile: 'Irska', market: 'Euronext Amsterdam', isin: 'IE00B0M62S72', type: 'EU Dividend', distribution: 'Distribucijski', isAccumulating: false, grossDividendYield: 5.5, expense: 0.40, historicalReturn: 6.5, riskLevel: 'Srednje', description: 'Top 30 EU delnic z dividendami.', pros: ['Visok yield 5,5%'], cons: ['Visok TER 0,40%'] },
  ieag: { name: 'IEAG', fullName: 'iShares Euro Aggregate Bond UCITS ETF', domicile: 'Irska', market: 'Euronext Amsterdam', isin: 'IE00B3DKXQ41', type: 'EU Bonds', distribution: 'Akumulacijski', isAccumulating: true, grossDividendYield: 3.2, expense: 0.16, historicalReturn: 2.5, riskLevel: 'Nizko', description: 'EU obveznice.', pros: ['Nizko tveganje'], cons: ['Nizki donosi'] },
  meud: { name: 'MEUD', fullName: 'Lyxor Core EURO STOXX 600 UCITS ETF', domicile: 'Luksemburg', market: 'Euronext Paris', isin: 'LU0908500753', type: 'EU Stocks', distribution: 'Akumulacijski', isAccumulating: true, grossDividendYield: 3.0, expense: 0.07, historicalReturn: 7.5, riskLevel: 'Srednje', description: '600 največjih EU podjetij.', pros: ['Najnižji TER za EU'], cons: ['Niži donos kot ZDA'] },
  eqqq: { name: 'EQQQ', fullName: 'Invesco NASDAQ-100 UCITS ETF', domicile: 'Irska', market: 'LSE', isin: 'IE0032077012', type: 'US Tech', distribution: 'Distribucijski', isAccumulating: false, grossDividendYield: 0.8, expense: 0.30, historicalReturn: 14.5, riskLevel: 'Visoko', description: '100 NASDAQ podjetij.', pros: ['Visok donos ~14%'], cons: ['Visoka volatilnost'] },
  csndx: { name: 'CSNDX', fullName: 'iShares NASDAQ-100 UCITS ETF (Akumulacijski)', domicile: 'Irska', market: 'Xetra', isin: 'IE00B53SZB19', type: 'US Tech', distribution: 'Akumulacijski', isAccumulating: true, grossDividendYield: 0.8, expense: 0.33, historicalReturn: 14.5, riskLevel: 'Visoko', description: 'Akumulacijska NASDAQ-100.', pros: ['Akumulacijski', 'Visoki donosi'], cons: ['Visoka volatilnost'] },
  iusa: { name: 'IUSA', fullName: 'iShares S&P 500 UCITS ETF (Dist)', domicile: 'Irska', market: 'LSE', isin: 'IE0031442068', type: 'US Stocks', distribution: 'Distribucijski', isAccumulating: false, grossDividendYield: 1.5, expense: 0.07, historicalReturn: 10.0, riskLevel: 'Srednje', description: 'iShares S&P 500 distribucijski.', pros: ['Redne dividende'], cons: ['Davek na dividende'] }
};

const SCENARIOS = {
  student: { name: 'Student', age: 22, yearsToInvest: 40, initialCapital: 1000, monthlyContribution: 100, etf: 'cspx' },
  young_prof: { name: 'Mladi prof.', age: 30, yearsToInvest: 35, initialCapital: 5000, monthlyContribution: 500, etf: 'cspx' },
  dividend_focus: { name: 'Dividende', age: 45, yearsToInvest: 25, initialCapital: 20000, monthlyContribution: 300, etf: 'idvy' },
  conservative: { name: 'Konzervativec', age: 55, yearsToInvest: 15, initialCapital: 20000, monthlyContribution: 200, etf: 'ieag' },
  aggressive: { name: 'Tech', age: 28, yearsToInvest: 30, initialCapital: 10000, monthlyContribution: 400, etf: 'csndx' }
};

function getCapitalGainsTaxRate(yearsHeld) {
  if (yearsHeld < 5) return 0.25;
  if (yearsHeld < 10) return 0.20;
  if (yearsHeld < 15) return 0.15;
  return 0.0;
}

function validateINR(initialCapital, monthlyContribution, investmentMode, annualLumpSum) {
  const warnings = [];
  const errors = [];
  let inrBlocked = false;

  if (initialCapital > 20000) {
    errors.push(`Začetni vložek €${initialCapital.toLocaleString()} presega INR limit prvega leta (€20.000). INR izračun blokiran.`);
    inrBlocked = true;
  }
  if (investmentMode === 'dca') {
    if (monthlyContribution * 12 > 20000) {
      errors.push(`Mesečni vložek €${monthlyContribution} × 12 = €${(monthlyContribution * 12).toLocaleString()} presega INR limit. INR izračun blokiran.`);
      inrBlocked = true;
    }
    if (!inrBlocked && initialCapital + monthlyContribution * 12 > 20000) {
      warnings.push(`Začetni vložek + mesečni v prvem letu (€${(initialCapital + monthlyContribution * 12).toLocaleString()}) presega €20.000. INR bo omejil vložke v prvem letu.`);
    }
    if (monthlyContribution * 12 > 5000) {
      warnings.push(`Mesečni vložki €${monthlyContribution}/mes = €${(monthlyContribution * 12).toLocaleString()}/leto presegajo INR letni limit (€5.000) od drugega leta naprej.`);
    }
  }
  if (investmentMode === 'annual') {
    if (annualLumpSum > 20000) {
      errors.push(`Letni vložek €${annualLumpSum.toLocaleString()} presega INR limit prvega leta. INR izračun blokiran.`);
      inrBlocked = true;
    }
    if (!inrBlocked && annualLumpSum > 5000) {
      warnings.push(`Letni vložek €${annualLumpSum.toLocaleString()} presega INR letni limit (€5.000) od drugega leta. V INR se bo vložilo max €5.000/leto.`);
    }
  }
  if (initialCapital === 0 && monthlyContribution === 0 && annualLumpSum === 0) {
    errors.push('Ni vložkov. Dodajte začetni kapital ali mesečne/letne vložke.');
    inrBlocked = true;
  }
  return { warnings, errors, inrBlocked };
}

export default function InrIbkrCalculator() {
  const [age, setAge] = useState(30);
  const [yearsToInvest, setYearsToInvest] = useState(20);
  const [initialCapital, setInitialCapital] = useState(5000);
  const [investmentMode, setInvestmentMode] = useState('dca');
  const [monthlyContribution, setMonthlyContribution] = useState(200);
  const [annualLumpSum, setAnnualLumpSum] = useState(5000);
  const [customIbkr, setCustomIbkr] = useState(false);
  const [ibkrInitialCapital, setIbkrInitialCapital] = useState(5000);
  const [ibkrMonthlyContribution, setIbkrMonthlyContribution] = useState(200);
  const [ibkrAnnualLumpSum, setIbkrAnnualLumpSum] = useState(5000);
  const [selectedEtf, setSelectedEtf] = useState('cspx');
  const [openInr2026, setOpenInr2026] = useState(true);
  const [showEducation, setShowEducation] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  const etf = ETF_PROFILES[selectedEtf];
  const effIbkrInitial = customIbkr ? ibkrInitialCapital : initialCapital;
  const effIbkrMonthly = customIbkr ? ibkrMonthlyContribution : monthlyContribution;
  const effIbkrAnnual = customIbkr ? ibkrAnnualLumpSum : annualLumpSum;

  const validation = useMemo(() => validateINR(initialCapital, monthlyContribution, investmentMode, annualLumpSum), [initialCapital, monthlyContribution, investmentMode, annualLumpSum]);

  const calculations = useMemo(() => {
    const years = yearsToInvest;
    const inrBlocked = validation.inrBlocked;
    let inrLots = [], ibkrLots = [];
    const inrTracking = { ilirikaCustody: 0, ilirikaTradingBuy: 0, ilirikaTradingSell: 0, ilirikaSettlement: 0, ilirikaCurrency: 0, ilirikaSepa: 0, ilirikaDividendPayout: 0, withholdingTaxAtFundLevel: 0, finalTaxAtWithdrawal: 0, grossDividends: 0 };
    const ibkrTracking = { currencyConversion: 0, ibkrTradingBuy: 0, ibkrTradingSell: 0, withholdingTaxAtFundLevel: 0, slovenianDividendTax: 0, slovenianCapitalGainsTax: 0, grossDividends: 0, taxByPeriod: { '0-5': 0, '5-10': 0, '10-15': 0, '15+': 0 } };
    let totalInvestedInr = 0, totalInvestedIbkr = 0, inrCurrentYearContributed = 0, currentYear = -1;
    const monthlyNetReturn = ((etf.historicalReturn - etf.expense) / 100) / 12;
    const fundLevelWHT = etf.type.includes('US') ? 0.15 : 0;
    const monthlyDividend = ((etf.grossDividendYield * (1 - fundLevelWHT)) / 100) / 12;
    const monthlyGrossDividend = (etf.grossDividendYield / 100) / 12;
    const needsFx = etf.market.includes('LSE');
    const inrCommRate = openInr2026 ? 0.0015 : 0.003;
    const inrMinComm = openInr2026 ? 0.50 : 1.00;

    function addInrLot(amount, month) {
      if (inrBlocked || amount <= 0) return 0;
      let net = amount;
      inrTracking.ilirikaSepa += 1.20; net -= 1.20;
      if (needsFx) { const fx = net * 0.0015; inrTracking.ilirikaCurrency += fx; net -= fx; }
      const comm = Math.max(inrMinComm, net * inrCommRate);
      inrTracking.ilirikaTradingBuy += comm; net -= comm;
      if (etf.domicile !== 'Slovenija') { inrTracking.ilirikaSettlement += 6.00; net -= 6.00; }
      if (net <= 0) return 0;
      inrLots.push({ originalAmount: amount, currentValue: net, monthPurchased: month });
      return amount;
    }

    function addIbkrLot(amount, month) {
      if (amount <= 0) return 0;
      let net = amount;
      if (needsFx) { const fx = amount * 0.00002 + 2; ibkrTracking.currencyConversion += fx; net -= fx; }
      const comm = Math.max(1.25, net * 0.0005);
      ibkrTracking.ibkrTradingBuy += comm; net -= comm;
      if (net <= 0) return 0;
      ibkrLots.push({ originalAmount: amount, currentValue: net, monthPurchased: month });
      return amount;
    }

    if (!inrBlocked) {
      const inrInitial = Math.min(initialCapital, 20000);
      const invested = addInrLot(inrInitial, 0);
      totalInvestedInr += invested;
      inrCurrentYearContributed = invested;
      currentYear = 0;
    }
    totalInvestedIbkr += addIbkrLot(effIbkrInitial, 0);

    for (let month = 1; month <= years * 12; month++) {
      const thisYear = Math.floor((month - 1) / 12);
      if (thisYear !== currentYear) { currentYear = thisYear; inrCurrentYearContributed = 0; }

      if (investmentMode === 'annual' && (month - 1) % 12 === 0 && month > 1) {
        const yearlyLimit = currentYear === 0 ? 20000 : 5000;
        const inrCanInvest = Math.max(0, yearlyLimit - inrCurrentYearContributed);
        const inrAmount = Math.min(annualLumpSum, inrCanInvest);
        if (!inrBlocked && inrAmount > 0) { const inv = addInrLot(inrAmount, month); totalInvestedInr += inv; inrCurrentYearContributed += inv; }
        const ibkrAmt = customIbkr ? effIbkrAnnual : annualLumpSum;
        if (ibkrAmt > 0) totalInvestedIbkr += addIbkrLot(ibkrAmt, month);
      }

      if (investmentMode === 'dca' && month > 1) {
        const yearlyLimit = currentYear === 0 ? 20000 : 5000;
        const inrCanInvest = Math.max(0, yearlyLimit - inrCurrentYearContributed);
        const inrAmount = Math.min(monthlyContribution, inrCanInvest);
        if (!inrBlocked && inrAmount > 0) { const inv = addInrLot(inrAmount, month); totalInvestedInr += inv; inrCurrentYearContributed += inv; }
        const ibkrAmt = customIbkr ? effIbkrMonthly : monthlyContribution;
        if (ibkrAmt > 0) totalInvestedIbkr += addIbkrLot(ibkrAmt, month);
      }

      inrLots = inrLots.map(l => ({ ...l, currentValue: l.currentValue * (1 + monthlyNetReturn) }));
      ibkrLots = ibkrLots.map(l => ({ ...l, currentValue: l.currentValue * (1 + monthlyNetReturn) }));

      if (etf.grossDividendYield > 0) {
        const inrTotal = inrLots.reduce((s, l) => s + l.currentValue, 0);
        const ibkrTotal = ibkrLots.reduce((s, l) => s + l.currentValue, 0);
        if (inrTotal > 0) {
          const inrDivNet = inrTotal * monthlyDividend;
          const inrDivGross = inrTotal * monthlyGrossDividend;
          inrTracking.withholdingTaxAtFundLevel += inrDivGross - inrDivNet;
          inrTracking.grossDividends += inrDivNet;
          if (etf.isAccumulating) {
            inrLots = inrLots.map(l => ({ ...l, currentValue: l.currentValue + inrDivNet * l.currentValue / inrTotal }));
          } else {
            const payoutCost = Math.min(10, Math.max(1, inrDivNet * 0.005));
            inrTracking.ilirikaDividendPayout += payoutCost;
            const netDiv = inrDivNet - payoutCost;
            inrLots = inrLots.map(l => ({ ...l, currentValue: l.currentValue + netDiv * l.currentValue / inrTotal }));
          }
        }
        if (ibkrTotal > 0) {
          const ibkrDivNet = ibkrTotal * monthlyDividend;
          const ibkrDivGross = ibkrTotal * monthlyGrossDividend;
          ibkrTracking.withholdingTaxAtFundLevel += ibkrDivGross - ibkrDivNet;
          ibkrTracking.grossDividends += ibkrDivNet;
          if (etf.isAccumulating) {
            ibkrLots = ibkrLots.map(l => ({ ...l, currentValue: l.currentValue + ibkrDivNet * l.currentValue / ibkrTotal }));
          } else {
            const divTax = ibkrDivNet * 0.25;
            ibkrTracking.slovenianDividendTax += divTax;
            ibkrLots = ibkrLots.map(l => ({ ...l, currentValue: l.currentValue + ibkrDivNet * 0.75 * l.currentValue / ibkrTotal }));
          }
        }
      }

      if (month % 12 === 0 && inrLots.length > 0) {
        const inrTotal = inrLots.reduce((s, l) => s + l.currentValue, 0);
        if (inrTotal > 0) {
          const fee = Math.max(8.40, inrTotal * 0.000045);
          inrLots = inrLots.map(l => ({ ...l, currentValue: l.currentValue * (1 - fee / inrTotal) }));
          inrTracking.ilirikaCustody += fee;
        }
      }
    }

    const inrPreSell = inrLots.reduce((s, l) => s + l.currentValue, 0);
    if (inrPreSell > 0) {
      const sellComm = Math.max(inrMinComm, inrPreSell * inrCommRate);
      inrTracking.ilirikaTradingSell = sellComm;
      const settleSell = etf.domicile !== 'Slovenija' ? 6 : 0;
      inrTracking.ilirikaSettlement += settleSell;
      const sepaSell = inrPreSell > 50000 ? 8.50 : 1.20;
      inrTracking.ilirikaSepa += sepaSell;
      const totalSellCost = sellComm + settleSell + sepaSell;
      inrLots = inrLots.map(l => ({ ...l, currentValue: l.currentValue * (1 - totalSellCost / inrPreSell) }));
    }
    const ibkrPreSell = ibkrLots.reduce((s, l) => s + l.currentValue, 0);
    if (ibkrPreSell > 0) {
      const sellComm = Math.max(1.25, ibkrPreSell * 0.0005);
      ibkrTracking.ibkrTradingSell = sellComm;
      ibkrLots = ibkrLots.map(l => ({ ...l, currentValue: l.currentValue * (1 - sellComm / ibkrPreSell) }));
    }

    const totalMonths = years * 12;
    let inrFinalValue = 0, ibkrFinalValue = 0, inrFinalTax = 0, ibkrFinalTax = 0;
    inrLots.forEach(lot => {
      const gain = lot.currentValue - lot.originalAmount;
      const tax = years < 15 ? Math.max(0, gain * 0.15) : 0;
      inrFinalTax += tax;
      inrFinalValue += lot.currentValue - tax;
    });
    inrTracking.finalTaxAtWithdrawal = inrFinalTax;
    ibkrLots.forEach(lot => {
      const yrsHeld = (totalMonths - lot.monthPurchased) / 12;
      const gain = lot.currentValue - lot.originalAmount;
      const rate = getCapitalGainsTaxRate(yrsHeld);
      const tax = Math.max(0, gain * rate);
      ibkrFinalTax += tax;
      ibkrFinalValue += lot.currentValue - tax;
      if (yrsHeld < 5) ibkrTracking.taxByPeriod['0-5'] += tax;
      else if (yrsHeld < 10) ibkrTracking.taxByPeriod['5-10'] += tax;
      else if (yrsHeld < 15) ibkrTracking.taxByPeriod['10-15'] += tax;
      else ibkrTracking.taxByPeriod['15+'] += tax;
    });
    ibkrTracking.slovenianCapitalGainsTax = ibkrFinalTax;
    const ibkrTotalGain = ibkrLots.reduce((s, l) => s + Math.max(0, l.currentValue - l.originalAmount), 0);
    const inrTotalCosts = Object.values(inrTracking).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0) - inrTracking.withholdingTaxAtFundLevel - inrTracking.grossDividends;
    const ibkrTotalCosts = ibkrTracking.currencyConversion + ibkrTracking.ibkrTradingBuy + ibkrTracking.ibkrTradingSell + ibkrTracking.slovenianDividendTax + ibkrTracking.slovenianCapitalGainsTax;

    return {
      inrBlocked, inrFinalValue: Math.round(inrFinalValue), ibkrFinalValue: Math.round(ibkrFinalValue),
      inrTracking, ibkrTracking, totalInvestedInr: Math.round(totalInvestedInr), totalInvestedIbkr: Math.round(totalInvestedIbkr),
      inrTotalCosts: Math.round(inrTotalCosts), ibkrTotalCosts: Math.round(ibkrTotalCosts),
      inrGain: Math.round(inrFinalValue - totalInvestedInr), ibkrGain: Math.round(ibkrFinalValue - totalInvestedIbkr),
      effectiveIbkrTaxRate: ibkrTotalGain > 0 ? ((ibkrFinalTax / ibkrTotalGain) * 100).toFixed(1) : '0.0',
      inrTaxRate: yearsToInvest >= 15 ? 0 : 0.15,
      lotStats: { inrLots: inrLots.length, ibkrLots: ibkrLots.length, avgYears: ibkrLots.length > 0 ? (ibkrLots.reduce((s, l) => s + (years * 12 - l.monthPurchased) / 12, 0) / ibkrLots.length).toFixed(1) : '0' }
    };
  }, [yearsToInvest, initialCapital, monthlyContribution, annualLumpSum, investmentMode, selectedEtf, openInr2026, customIbkr, effIbkrInitial, effIbkrMonthly, effIbkrAnnual, validation.inrBlocked]);

  const advantage = calculations.inrBlocked ? null : calculations.inrFinalValue - calculations.ibkrFinalValue;
  const advantagePercent = advantage !== null && calculations.ibkrFinalValue > 0 ? ((advantage / calculations.ibkrFinalValue) * 100).toFixed(1) : '0';

  const loadScenario = (key) => {
    const s = SCENARIOS[key];
    setAge(s.age); setYearsToInvest(s.yearsToInvest); setInitialCapital(s.initialCapital);
    setMonthlyContribution(s.monthlyContribution); setSelectedEtf(s.etf);
    setInvestmentMode('dca'); setCustomIbkr(false); setActiveScenario(key);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '3.5rem 1.5rem 5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem',
            color: 'var(--color-text)',
          }}>
            INR vs IBKR
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, maxWidth: 680 }}>
            Primerjava stroškov in davkov med Ilirikinim INR računom in Interactive Brokers, z uradnim cenikom Ilirike, FIFO obračunom in validacijo INR limitov.
          </p>
        </header>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div style={{ marginBottom: '1rem', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <AlertCircle size={18} /> INR izračun blokiran
            </div>
            {validation.errors.map((e, i) => <p key={i} style={{ color: '#dc2626', fontSize: '0.75rem', margin: '2px 0' }}>{e}</p>)}
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div style={{ marginBottom: '1rem', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} /> Opozorila
            </div>
            {validation.warnings.map((w, i) => <p key={i} style={{ color: '#92400e', fontSize: '0.75rem', margin: '2px 0' }}>{w}</p>)}
          </div>
        )}

        {/* Education toggle */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowEducation(!showEducation)}
            style={{ padding: '0.5rem 1rem', background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '8px', color: '#d97706', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} />{showEducation ? 'Skrij' : 'Razlaga'} davkov
          </button>
        </div>

        {showEducation && (
          <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ color: 'var(--color-text)', fontWeight: 700, marginTop: 0 }}>Davki in stroški</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--color-bg)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ color: '#059669', marginTop: 0 }}>INR stroški</h4>
                <ul style={{ color: 'var(--color-text)', fontSize: '0.75rem', paddingLeft: '1rem' }}>
                  <li>Provizija: 0,30% (50% popust 2026 = 0,15%), min 1€/0,50€</li>
                  <li>Poravnava: 6€/transakcija (tuji trgi)</li>
                  <li>SEPA: 1,20€/nakazilo</li>
                  <li>FX: 0,15% (če valuta ni EUR)</li>
                  <li>Vzdrževanje: 0,0045% letno, min 8,40€</li>
                  <li>Davek: 15% pred 15 let, <strong>0% po 15 let</strong></li>
                </ul>
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ color: '#2563eb', marginTop: 0 }}>IBKR stroški</h4>
                <ul style={{ color: 'var(--color-text)', fontSize: '0.75rem', paddingLeft: '1rem' }}>
                  <li>Provizija: ~0,05% min 1,25€</li>
                  <li>FX: 0,002% + 2€ min</li>
                  <li>Brez vzdrževanja, SEPA, poravnave</li>
                  <li>Davek kap. dobitki: 25/20/15/0% (FIFO per lot)</li>
                  <li>Davek dividende: <strong>25% fiksno</strong></li>
                </ul>
              </div>
            </div>
            <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '8px', padding: '0.75rem', marginTop: '0.75rem' }}>
              <p style={{ color: '#92400e', fontSize: '0.75rem', margin: 0 }}><strong>INR limiti:</strong> Prvo leto max €20.000, nato €5.000/leto.</p>
            </div>
          </div>
        )}

        {/* Scenarios */}
        <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
          <p style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600, marginTop: 0, marginBottom: '0.75rem' }}>Scenariji</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button key={key} onClick={() => loadScenario(key)}
                style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: activeScenario === key ? '#059669' : 'var(--color-border-strong)', color: activeScenario === key ? 'white' : '#cbd5e1', transition: 'all 0.15s' }}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

            {/* LEFT: Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Osnovni parametri */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600, marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calculator size={16} /> Parametri (INR)
                </h3>

                {[
                  { label: 'Starost', value: age, min: 18, max: 70, step: 1, set: setAge, display: `${age}`, warn: false },
                  { label: 'Obdobje', value: yearsToInvest, min: 1, max: 50, step: 1, set: setYearsToInvest, display: `${yearsToInvest} let${yearsToInvest >= 15 ? ' ✓ 0% davek' : ''}`, warn: false },
                ].map(p => (
                  <div key={p.label} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                      {p.label}: <span style={{ color: '#059669' }}>{p.display}</span>
                    </label>
                    <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={e => p.set(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#059669' }} />
                  </div>
                ))}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                    Začetni kapital: <span style={{ color: initialCapital > 20000 ? '#dc2626' : '#059669' }}>€{initialCapital.toLocaleString()}</span>
                    {initialCapital > 20000 && <span style={{ color: '#dc2626', fontSize: '0.65rem', marginLeft: '0.5rem' }}>nad INR limitom</span>}
                  </label>
                  <input type="range" min={0} max={100000} step={1000} value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} style={{ width: '100%', accentColor: '#059669' }} />
                </div>

                {/* Način vlaganja */}
                <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                  <p style={{ color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Način vlaganja</p>
                  {[
                    { id: 'dca', label: 'Mesečni vložki (DCA)', desc: 'Vsak mesec enak znesek' },
                    { id: 'annual', label: 'Letni enkratni vložek', desc: 'Enkrat letno na začetku leta' },
                    { id: 'none', label: 'Brez dodatnih vložkov', desc: 'Samo začetni kapital' },
                  ].map(opt => (
                    <label key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', marginBottom: '0.25rem' }}>
                      <input type="radio" name="investMode" value={opt.id} checked={investmentMode === opt.id} onChange={e => setInvestmentMode(e.target.value)} style={{ marginTop: '2px', accentColor: '#059669' }} />
                      <div>
                        <p style={{ color: 'var(--color-text)', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>{opt.label}</p>
                        <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.7rem', margin: 0 }}>{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {investmentMode === 'dca' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                      Mesečno: <span style={{ color: monthlyContribution * 12 > 5000 ? '#d97706' : '#059669' }}>€{monthlyContribution}</span>
                      {monthlyContribution * 12 > 5000 && <span style={{ color: '#d97706', fontSize: '0.65rem', marginLeft: '0.5rem' }}>€{(monthlyContribution * 12).toLocaleString()}/leto nad INR limitom</span>}
                    </label>
                    <input type="range" min={0} max={2000} step={50} value={monthlyContribution} onChange={e => setMonthlyContribution(Number(e.target.value))} style={{ width: '100%', accentColor: '#059669' }} />
                  </div>
                )}

                {investmentMode === 'annual' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                      Letni vložek: <span style={{ color: annualLumpSum > 5000 ? '#d97706' : '#059669' }}>€{annualLumpSum.toLocaleString()}</span>
                      {annualLumpSum > 5000 && <span style={{ color: '#d97706', fontSize: '0.65rem', marginLeft: '0.5rem' }}>nad INR limitom €5k/leto</span>}
                    </label>
                    <input type="range" min={1000} max={50000} step={1000} value={annualLumpSum} onChange={e => setAnnualLumpSum(Number(e.target.value))} style={{ width: '100%', accentColor: '#059669' }} />
                  </div>
                )}

                <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={openInr2026} onChange={e => setOpenInr2026(e.target.checked)} style={{ accentColor: '#059669' }} />
                    <span style={{ color: 'var(--color-text)', fontSize: '0.8rem' }}>50% popust (odprtje INR v 2026)</span>
                  </label>
                </div>
              </div>

              {/* IBKR parametri */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={customIbkr} onChange={e => setCustomIbkr(e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  <span style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Settings2 size={16} color="#2563eb" /> Ločeni IBKR parametri
                  </span>
                </label>
                {customIbkr && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
                    <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.7rem', marginTop: 0 }}>IBKR nima limitov.</p>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem' }}>IBKR začetni: <span style={{ color: '#2563eb' }}>€{ibkrInitialCapital.toLocaleString()}</span></label>
                      <input type="range" min={0} max={200000} step={1000} value={ibkrInitialCapital} onChange={e => setIbkrInitialCapital(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb' }} />
                    </div>
                    {investmentMode === 'dca' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem' }}>IBKR mesečno: <span style={{ color: '#2563eb' }}>€{ibkrMonthlyContribution}</span></label>
                        <input type="range" min={0} max={5000} step={50} value={ibkrMonthlyContribution} onChange={e => setIbkrMonthlyContribution(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb' }} />
                      </div>
                    )}
                    {investmentMode === 'annual' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem' }}>IBKR letno: <span style={{ color: '#2563eb' }}>€{ibkrAnnualLumpSum.toLocaleString()}</span></label>
                        <input type="range" min={1000} max={100000} step={1000} value={ibkrAnnualLumpSum} onChange={e => setIbkrAnnualLumpSum(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ETF */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600, marginTop: 0 }}>ETF</h3>
                <select value={selectedEtf} onChange={e => setSelectedEtf(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--color-border-strong)', color: 'var(--color-text)', border: '1px solid #475569', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  {Object.entries(ETF_PROFILES).map(([key, p]) => <option key={key} value={key}>{p.name} - {p.fullName}</option>)}
                </select>
                <div style={{ background: 'var(--color-bg)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem' }}>
                  <p style={{ color: 'var(--color-text)', fontWeight: 600, margin: '0 0 0.25rem' }}>{etf.fullName}</p>
                  <p style={{ color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>{etf.description}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: 0 }}>DIV YIELD</p><p style={{ color: '#059669', fontWeight: 700, margin: 0 }}>{etf.grossDividendYield}%</p></div>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: 0 }}>TIP</p><p style={{ color: 'var(--color-text)', margin: 0 }}>{etf.distribution}</p></div>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: 0 }}>TER</p><p style={{ color: 'var(--color-text)', margin: 0 }}>{etf.expense}%</p></div>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: 0 }}>DONOS</p><p style={{ color: '#2563eb', fontWeight: 700, margin: 0 }}>{etf.historicalReturn}%</p></div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg)', padding: '4px', borderRadius: '6px', overflowX: 'auto' }}>
                {[{ id: 'summary', label: 'Povzetek' }, { id: 'breakdown', label: 'Stroški' }, { id: 'fifo', label: 'FIFO' }, { id: 'transparency', label: 'Izračun' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', background: activeTab === tab.id ? 'var(--color-border-strong)' : 'transparent', color: activeTab === tab.id ? 'white' : '#94a3b8', transition: 'all 0.15s' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SUMMARY */}
              {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: calculations.inrBlocked ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)', border: `1px solid ${calculations.inrBlocked ? 'rgba(220,38,38,0.4)' : 'rgba(5,150,105,0.4)'}`, borderRadius: '8px', padding: '1.25rem' }}>
                      {calculations.inrBlocked ? (
                        <>
                          <p style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.25rem' }}>INR BLOKIRAN</p>
                          <p style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Nemogoče</p>
                          <p style={{ color: '#dc2626', fontSize: '0.7rem', margin: 0 }}>Prilagodi parametre na INR omejitve.</p>
                        </>
                      ) : (
                        <>
                          <p style={{ color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 600, margin: '0 0 0.25rem' }}>INR KONČNA VREDNOST</p>
                          <p style={{ color: '#059669', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem' }}>€{calculations.inrFinalValue.toLocaleString()}</p>
                          <div style={{ fontSize: '0.75rem', color: '#a7f3d0', lineHeight: 1.8 }}>
                            <div>Dobiček: €{calculations.inrGain.toLocaleString()}</div>
                            <div>Stroški: €{calculations.inrTotalCosts.toLocaleString()}</div>
                            <div>Vloženo: €{calculations.totalInvestedInr.toLocaleString()}</div>
                            <div>ROI: {calculations.totalInvestedInr > 0 ? ((calculations.inrGain / calculations.totalInvestedInr) * 100).toFixed(0) : 0}%</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '8px', padding: '1.25rem' }}>
                      <p style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600, margin: '0 0 0.25rem' }}>IBKR KONČNA VREDNOST</p>
                      <p style={{ color: '#2563eb', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem' }}>€{calculations.ibkrFinalValue.toLocaleString()}</p>
                      <div style={{ fontSize: '0.75rem', color: '#bfdbfe', lineHeight: 1.8 }}>
                        <div>Dobiček: €{calculations.ibkrGain.toLocaleString()}</div>
                        <div>Stroški: €{calculations.ibkrTotalCosts.toLocaleString()}</div>
                        <div>Vloženo: €{calculations.totalInvestedIbkr.toLocaleString()}</div>
                        <div>ROI: {calculations.totalInvestedIbkr > 0 ? ((calculations.ibkrGain / calculations.totalInvestedIbkr) * 100).toFixed(0) : 0}%</div>
                      </div>
                    </div>
                  </div>

                  {!calculations.inrBlocked && (
                    <div style={{ background: advantage > 0 ? 'rgba(5,150,105,0.15)' : 'rgba(37,99,235,0.15)', border: `1px solid ${advantage > 0 ? 'rgba(5,150,105,0.5)' : 'rgba(37,99,235,0.5)'}`, borderRadius: '8px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                        <p style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Prednost</p>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: advantage > 0 ? '#059669' : '#2563eb' }}>{advantage > 0 ? 'INR' : 'IBKR'}</span>
                      </div>
                      <p style={{ fontSize: '2.5rem', fontWeight: 800, color: advantage > 0 ? '#059669' : '#2563eb', margin: '0 0 0.25rem' }}>
                        €{Math.abs(advantage).toLocaleString()} <span style={{ fontSize: '1.25rem' }}>({advantage > 0 ? '+' : '-'}{Math.abs(advantagePercent)}%)</span>
                      </p>
                      {customIbkr && calculations.totalInvestedInr !== calculations.totalInvestedIbkr && (
                        <p style={{ color: '#d97706', fontSize: '0.7rem', margin: '0.5rem 0 0' }}>Primerjava ni poštena: različni vložki.</p>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {[
                      { label: 'INR vloženo', value: `€${calculations.totalInvestedInr.toLocaleString()}`, color: 'var(--color-text)' },
                      { label: 'IBKR vloženo', value: `€${calculations.totalInvestedIbkr.toLocaleString()}`, color: 'var(--color-text)' },
                      { label: 'IBKR davek', value: `${calculations.effectiveIbkrTaxRate}%`, color: '#2563eb' },
                      { label: 'INR davek', value: `${(calculations.inrTaxRate * 100).toFixed(0)}%`, color: '#059669' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                        <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.25rem' }}>{s.label}</p>
                        <p style={{ color: s.color, fontSize: '1rem', fontWeight: 700, margin: 0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BREAKDOWN */}
              {activeTab === 'breakdown' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {!calculations.inrBlocked && (
                    <div style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: '8px', padding: '1.25rem' }}>
                      <h4 style={{ color: '#059669', marginTop: 0 }}>INR (Ilirika)</h4>
                      {[
                        { l: `Provizija nakup (${openInr2026 ? '0,15%' : '0,30%'})`, v: calculations.inrTracking.ilirikaTradingBuy },
                        { l: 'Provizija prodaja', v: calculations.inrTracking.ilirikaTradingSell },
                        { l: 'Poravnava 6€/transakcija', v: calculations.inrTracking.ilirikaSettlement },
                        { l: 'SEPA', v: calculations.inrTracking.ilirikaSepa },
                        { l: 'Menjava valut 0,15%', v: calculations.inrTracking.ilirikaCurrency },
                        { l: 'Vzdrževanje 0,0045%', v: calculations.inrTracking.ilirikaCustody },
                        { l: 'Izplačilo dividend', v: calculations.inrTracking.ilirikaDividendPayout },
                        { l: `Davek (${yearsToInvest >= 15 ? '0%' : '15%'})`, v: calculations.inrTracking.finalTaxAtWithdrawal },
                      ].map(i => (
                        <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                          <span>{i.l}</span><span style={{ color: '#dc2626' }}>-€{Math.round(i.v).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', borderTop: '1px solid rgba(5,150,105,0.3)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span>SKUPAJ:</span><span style={{ color: '#dc2626' }}>-€{calculations.inrTotalCosts.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', padding: '1.25rem' }}>
                    <h4 style={{ color: '#2563eb', marginTop: 0 }}>IBKR</h4>
                    {[
                      { l: 'Provizija nakup', v: calculations.ibkrTracking.ibkrTradingBuy },
                      { l: 'Provizija prodaja', v: calculations.ibkrTracking.ibkrTradingSell },
                      { l: 'FX stroški', v: calculations.ibkrTracking.currencyConversion },
                      { l: `Dividendni davek 25%${etf.isAccumulating ? ' [N/A]' : ''}`, v: calculations.ibkrTracking.slovenianDividendTax },
                      { l: `Kap. dobitki FIFO (${calculations.effectiveIbkrTaxRate}%)`, v: calculations.ibkrTracking.slovenianCapitalGainsTax },
                    ].map(i => (
                      <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        <span>{i.l}</span><span style={{ color: '#dc2626' }}>-€{Math.round(i.v).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', borderTop: '1px solid rgba(37,99,235,0.3)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span>SKUPAJ:</span><span style={{ color: '#dc2626' }}>-€{calculations.ibkrTotalCosts.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FIFO */}
              {activeTab === 'fifo' && (
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 style={{ color: 'var(--color-text)', marginTop: 0 }}>FIFO razčlemba (IBKR)</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Vsak lot ima svoj rok lastništva. Davek se računa per lot.</p>
                  {[
                    { period: '15+ let', rate: '0%', color: '#059669', bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.3)', key: '15+' },
                    { period: '10-15 let', rate: '15%', color: '#fde047', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', key: '10-15' },
                    { period: '5-10 let', rate: '20%', color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', key: '5-10' },
                    { period: '0-5 let', rate: '25%', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', key: '0-5' },
                  ].map(p => (
                    <div key={p.period} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <p style={{ color: p.color, fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{p.period}</p>
                        <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: 0 }}>{p.rate} davek</p>
                      </div>
                      <p style={{ color: p.color, fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>€{Math.round(calculations.ibkrTracking.taxByPeriod[p.key]).toLocaleString()}</p>
                    </div>
                  ))}
                  <div style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <p style={{ color: 'var(--color-text)', fontWeight: 600, margin: 0 }}>SKUPAJ:</p>
                    <p style={{ color: 'var(--color-text)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>€{Math.round(calculations.ibkrTracking.slovenianCapitalGainsTax).toLocaleString()}</p>
                  </div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Efektivna stopnja: <strong style={{ color: '#d97706' }}>{calculations.effectiveIbkrTaxRate}%</strong> ({calculations.lotStats.ibkrLots} lotov, avg {calculations.lotStats.avgYears} let)
                  </p>
                </div>
              )}

              {/* TRANSPARENCY */}
              {activeTab === 'transparency' && (
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 style={{ color: 'var(--color-text)', marginTop: 0 }}>Kronološki izračun</h3>
                  {[
                    { color: '#059669', title: 'KORAK 1: Začetek', content: `INR vloženo: €${calculations.totalInvestedInr.toLocaleString()} | IBKR vloženo: €${calculations.totalInvestedIbkr.toLocaleString()}` },
                    { color: '#2563eb', title: 'KORAK 2: Stroški nakupa', content: `INR: SEPA 1,20€ + provizija ${openInr2026 ? '0,15%' : '0,30%'} + 6€ poravnava | IBKR: ~1,25€` },
                    { color: '#a855f7', title: 'KORAK 3: Mesečna rast', content: `Neto donos: ${(etf.historicalReturn - etf.expense).toFixed(2)}%/leto` },
                    { color: '#d97706', title: 'KORAK 4: Dividende', content: etf.isAccumulating ? 'Akumulacijski - brez vmesnih davkov' : 'INR: -0,50% payout | IBKR: -25% davek' },
                    { color: '#ea580c', title: 'KORAK 5: Letno vzdrževanje INR', content: `max(8,40€, vrednost × 0,0045%) = ~€${Math.round(calculations.inrTracking.ilirikaCustody / yearsToInvest)}/leto` },
                    { color: '#dc2626', title: 'KORAK 6: Končni davki', content: `INR: ${yearsToInvest >= 15 ? '0%' : '15%'} = €${Math.round(calculations.inrTracking.finalTaxAtWithdrawal)} | IBKR FIFO: ${calculations.effectiveIbkrTaxRate}% = €${Math.round(calculations.ibkrTracking.slovenianCapitalGainsTax)}` },
                  ].map(step => (
                    <div key={step.title} style={{ background: 'var(--color-bg)', borderRadius: '8px', padding: '0.75rem', borderLeft: `4px solid ${step.color}`, marginBottom: '0.5rem' }}>
                      <p style={{ color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.25rem' }}>{step.title}</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: 0 }}>{step.content}</p>
                    </div>
                  ))}
                  <div style={{ background: 'rgba(5,150,105,0.1)', borderRadius: '8px', padding: '0.75rem', borderLeft: '4px solid #059669' }}>
                    <p style={{ color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.25rem' }}>REZULTAT</p>
                    <p style={{ color: 'var(--color-text)', fontSize: '0.75rem', margin: 0 }}>
                      INR: <strong style={{ color: '#059669' }}>€{calculations.inrFinalValue.toLocaleString()}</strong> | IBKR: <strong style={{ color: '#2563eb' }}>€{calculations.ibkrFinalValue.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Insights */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
                <p style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Ugotovitve</p>
                <ul style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', paddingLeft: '1rem', margin: 0, lineHeight: 2 }}>
                  {calculations.inrBlocked && <li style={{ color: '#dc2626' }}>INR blokiran - prilagodi začetni kapital na max €20.000</li>}
                  {customIbkr && <li style={{ color: '#2563eb' }}>Ločeni IBKR parametri aktivni</li>}
                  {!etf.isAccumulating && <li style={{ color: '#d97706' }}>Distribucijski ETF: INR ima prednost (brez 25% davka na dividende)</li>}
                  {etf.isAccumulating && <li style={{ color: '#3b82f6' }}>Akumulacijski ETF: razlika med INR/IBKR je manjša</li>}
                  {investmentMode === 'dca' && monthlyContribution * 12 > 5000 && <li style={{ color: '#d97706' }}>Presežek nad €5k/leto se NE vloži v INR</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* ETF Library */}
          <div>
            <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>ETF knjižnica</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {Object.entries(ETF_PROFILES).map(([key, p]) => (
                <div key={key} onClick={() => { setSelectedEtf(key); setExpandedDetails(expandedDetails === key ? null : key); }}
                  style={{ background: selectedEtf === key ? 'rgba(5,150,105,0.1)' : 'var(--color-bg)', border: `1px solid ${selectedEtf === key ? 'rgba(5,150,105,0.5)' : 'var(--color-border)'}`, borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <p style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.1rem' }}>{p.name}</p>
                  <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: '0 0 0.5rem' }}>{p.fullName}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem' }}>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.6rem', margin: 0 }}>DIV</p><p style={{ color: '#059669', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>{p.grossDividendYield}%</p></div>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.6rem', margin: 0 }}>DONOS</p><p style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>{p.historicalReturn}%</p></div>
                    <div><p style={{ color: 'var(--color-text-subtle)', fontSize: '0.6rem', margin: 0 }}>TER</p><p style={{ color: '#d97706', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>{p.expense}%</p></div>
                  </div>
                  <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.65rem', margin: '0.4rem 0 0' }}>{p.distribution} | {p.riskLevel}</p>
                  {expandedDetails === key && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #334155', fontSize: '0.7rem' }}>
                      <p style={{ color: 'var(--color-text-muted)', margin: '0 0 0.25rem' }}>{p.description}</p>
                      <p style={{ color: '#059669', margin: '0 0 0.1rem' }}>+ {p.pros.join(', ')}</p>
                      <p style={{ color: '#dc2626', margin: 0 }}>- {p.cons.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: 'var(--color-border-strong)' }}>
          <p style={{ margin: '0 0 0.25rem' }}>Vir: Cenik Ilirike za INR (5.3.2026), ZINR, ZDoh-2 | FIFO per lot | Vsi stroški vključeni</p>
          <p style={{ margin: 0 }}>Ni finančni nasvet. Posvetujte se z davčnim svetovalcem.</p>
        </div>
      </div>
    </div>
  );
}

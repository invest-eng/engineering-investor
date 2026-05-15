import React, { useState, useMemo } from 'react';

// ============================================================
// ASSET DEFINITIONS
// ============================================================

const RISK_COLORS = { 1: '#059669', 2: '#16a34a', 3: '#d97706', 4: '#ea580c', 5: '#dc2626' };
const RISK_LABELS = { 1: 'Zelo nizko', 2: 'Nizko', 3: 'Srednje', 4: 'Visoko', 5: 'Zelo visoko' };
const LIQ_LABELS = { 1: 'Zelo nizka', 2: 'Nizka', 3: 'Srednja', 4: 'Visoka', 5: 'Instant' };

const ASSETS = {
  sp500: {
    id: 'sp500', name: 'S&P 500 ETF', fullName: 'iShares Core S&P 500 UCITS (CSPX)',
    emoji: '🇺🇸', category: 'ETF',
    returnBase: 10.0, returnRange: [7, 12],
    riskLevel: 3, liquidity: 5,
    purchaseCostPct: 0.10, annualCostPct: 0.07, sellCostPct: 0.10,
    taxType: 'cg_si', hasDividend: false,
    description: '500 največjih ameriških podjetij. CAGR ~10% nominalno od leta 1957. Najpriljubljenejša pasivna naložba na svetu.',
    pros: ['Najnižji stroški (0.07% TER)', 'Visoka likvidnost (T+2)', 'Široka diverzifikacija', '0% davek po 15 letih (ZDoh-2)'],
    cons: ['Valutno tveganje USD/EUR', 'Izpostavljenost samo US trgu', 'Kratkoročna volatilnost'],
    taxNote: 'Kapitalski dobiček: 25% (0–5 let) → 20% (5–10) → 15% (10–15) → 0% (15+ let) po ZDoh-2',
    purchaseCostNote: 'Borzni posrednik: ~0.05–0.15% provizija + SEPA nakazilo 1.20€ (Ilirika/INR) ali ~1.25€ (IBKR)',
    liquidityNote: 'Borza T+2 poravnava, visok volumen — instant prodaja med delovnikom',
    riskNote: 'Max drawdown: -56% (2008–09). Dolgoročno (20+ let) historično vedno pozitivno.',
    color: '#2563eb',
  },
  nasdaq: {
    id: 'nasdaq', name: 'NASDAQ-100 ETF', fullName: 'iShares NASDAQ-100 UCITS (CSNDX)',
    emoji: '💻', category: 'ETF',
    returnBase: 14.5, returnRange: [8, 22],
    riskLevel: 4, liquidity: 5,
    purchaseCostPct: 0.10, annualCostPct: 0.33, sellCostPct: 0.10,
    taxType: 'cg_si', hasDividend: false,
    description: '100 največjih tech podjetij (Apple, Nvidia, Microsoft, Meta…). CAGR ~14.5% od 2000. Visok potencial, visoko tveganje.',
    pros: ['Visoki dolgoročni donosi', 'Izpostavljenost AI & tech revoluciji', 'Akumulacijski (brez dividendnega davka)'],
    cons: ['Visoka volatilnost', 'Tech koncentracija (top 10 = 50%)', 'Višji TER 0.33%'],
    taxNote: 'Kapitalski dobiček: 25% → 0% po 15 letih (ZDoh-2)',
    purchaseCostNote: 'Standardne borzne provizije, enako kot S&P 500',
    liquidityNote: 'Borza, visok volumen, instant likvidnost',
    riskNote: 'Crash -83% (2000–2002), -35% (2022). Zahteva dolgo časovno obdobje.',
    color: '#7c3aed',
  },
  euStocks: {
    id: 'euStocks', name: 'EU Delnice ETF', fullName: 'Lyxor Core EURO STOXX 600 (MEUD)',
    emoji: '🇪🇺', category: 'ETF',
    returnBase: 7.5, returnRange: [4, 11],
    riskLevel: 3, liquidity: 5,
    purchaseCostPct: 0.10, annualCostPct: 0.07, sellCostPct: 0.10,
    taxType: 'cg_si', hasDividend: false,
    description: '600 največjih EU podjetij. CAGR ~7.5%. EUR denominacija — brez valutnega tveganja za slovenskega vlagatelja.',
    pros: ['EUR denominacija (ni valutnega tveganja)', 'Nizki stroški 0.07% TER', 'Široka EU diverzifikacija'],
    cons: ['Nižji donosi kot S&P 500 (historično)', 'Starejša industrija, manj tech', 'Regulatorna bremena EU'],
    taxNote: 'Kapitalski dobiček: 25% → 0% po 15 letih (ZDoh-2)',
    purchaseCostNote: 'Standardne borzne provizije',
    liquidityNote: 'Borza, dobra likvidnost',
    riskNote: 'Srednja volatilnost, podobno kot S&P 500 a z manjšim donosom',
    color: '#06b6d4',
  },
  realEstate: {
    id: 'realEstate', name: 'Nepremičnina', fullName: 'Nakup stanovanja/hiše v Sloveniji',
    emoji: '🏠', category: 'Nepremičnina',
    returnBase: 7.5, returnRange: [3, 12],
    riskLevel: 2, liquidity: 1,
    purchaseCostPct: 4.5, annualCostPct: 1.0, sellCostPct: 2.5,
    taxType: 're_si', hasDividend: true, dividendYield: 4.0, dividendTaxPct: 22.5,
    description: 'Stanovanjska nepremičnina v SLO za najem. Rast cen ~3–5% + najemnina ~4% bruto. Skupno ~7.5% letno pred stroški.',
    pros: ['Stabilna vrednost, manj volatilna', 'Pasivni dohodek (najemnina)', 'Hipotekarni vzvod (multiplikacija)', 'Inflacijska zaščita'],
    cons: ['Visoki vstopni stroški ~4.5%', 'Nelikviden (3–12 mesecev za prodajo)', 'Upravljanje, vzdrževanje, najemniki', 'Minimalna naložba 50k+€'],
    taxNote: 'Najemnina: 25% na 90% bruto = 22.5% efektivno. Kapitalski dobiček: 25% → 0% po 20 letih (ZDoh-2)',
    purchaseCostNote: 'DPN 2% + notar ~0.5% + agencija ~2% = skupaj ~4.5% od nakupne cene',
    liquidityNote: 'Prodaja: tipično 3–12 mesecev. Izjemno nelikviden asset.',
    riskNote: 'Nizka cenovana volatilnost, a visoko tveganje likvidnosti, upravljanja in koncentracije',
    color: '#d97706',
  },
  gold: {
    id: 'gold', name: 'Zlato', fullName: 'Investicijsko zlato / Xetra-Gold ETC',
    emoji: '🥇', category: 'Blago',
    returnBase: 8.0, returnRange: [2, 15],
    riskLevel: 3, liquidity: 3,
    purchaseCostPct: 1.0, annualCostPct: 0.15, sellCostPct: 1.0,
    taxType: 'cg_si', hasDividend: false,
    description: 'Investicijsko zlato. Od leta 2000: ~8% letno nominalno. Krizna valuta, hedge proti inflaciji in dolarskemu kolapsu.',
    pros: ['Zaščita pred inflacijo in krizo', 'Brez DDV (investicijsko zlato)', 'Negativna korelacija z delnicami', 'Brezčasna vrednost'],
    cons: ['Ni dividende ali cash flow-a', 'Visoka kratkoročna volatilnost', 'Stroški hrambe (ETC ali sef)', 'USD denominacija'],
    taxNote: 'Kapitalski dobiček: 25% → 0% po 15 letih (ZDoh-2). Fizično zlato: enako.',
    purchaseCostNote: 'ETC (Xetra-Gold): 0.15% TER, spread ~0.5–1%. Fizično zlato: premija do 5% nad spot ceno.',
    liquidityNote: 'ETC: T+2 na borzi. Fizično: dnevi do teden (kovnica, odkup).',
    riskNote: 'Crash -45% (2011–2015). Dobra zaščita v recesiji. Visoka kratkoročna nihajnost.',
    color: '#ea580c',
  },
  btc: {
    id: 'btc', name: 'Bitcoin', fullName: 'Bitcoin (BTC) — digitalno zlato',
    emoji: '₿', category: 'Kripto',
    returnBase: 35.0, returnRange: [-80, 150],
    riskLevel: 5, liquidity: 5,
    purchaseCostPct: 0.5, annualCostPct: 0.0, sellCostPct: 0.5,
    taxType: 'cg_si', hasDividend: false,
    description: 'Bitcoin — omejena ponudba 21M enot. Zgodovinski CAGR ~60%+ od 2010, konzervativno ~35% naprej. Ekstremna volatilnost.',
    pros: ['Ekstremen potencial donosa', 'Decentraliziran, brez counterparty tveganja', 'Likvidnost 24/7/365', 'Hedge proti monetarni inflaciji'],
    cons: ['Crash -85% možen in se je že zgodil', 'Regulatorno tveganje', 'Brez temeljne vrednosti (brez cash flow)', 'Psihološko izjemno zahtevno'],
    taxNote: 'Kapitalski dobiček: 25% → 0% po 15 letih. FURS: vsaka prodaja je davčni dogodek. Vodite evidenco!',
    purchaseCostNote: 'Kripto borza (Bitstamp, Kraken): 0.1–0.5% provizija. Self-custody priporočen za varnost.',
    liquidityNote: '24/7 na borzah. Instant. Self-custody zahteva prenos (ure do dnevi).',
    riskNote: 'Crash -83% (2018), -77% (2022). Priporočeno MAX 5–10% portfelja. Samo za visoko toleranco tveganja.',
    color: '#dc2626',
  },
  bank: {
    id: 'bank', name: 'Varčevanje (banka)', fullName: 'Varčevalni račun / Vezana vloga',
    emoji: '🏦', category: 'Banka',
    returnBase: 2.5, returnRange: [0.5, 4],
    riskLevel: 1, liquidity: 4,
    purchaseCostPct: 0, annualCostPct: 0, sellCostPct: 0,
    taxType: 'interest_si', hasDividend: false,
    description: 'Varčevalni račun ali vezana vloga. Jamstvo DSGK do 100.000€. ~2.5% v 2025. Negativne realne obresti pri višji inflaciji.',
    pros: ['Jamstvo do 100k€ (DSGK)', 'Brez stroškov in provizij', 'Praktično brez tveganja', 'Enostavno in dostopno'],
    cons: ['Negativne realne obresti (inflacija erodira)', 'Meja jamstva 100k€', 'Nizki donosi dolgoročno', 'Ni primerno za bogastvo'],
    taxNote: 'Obresti: 25% davek nad normativno odmero (~1.000€/leto). Pod pragom: ni davka.',
    purchaseCostNote: 'Brez stroškov. Vezava tipično do 12 mesecev.',
    liquidityNote: 'Navadni račun: instant. Vezana vloga: po poteku (kazen pri predčasnem dvigu).',
    riskNote: 'Praktično brez tveganja do 100.000€. Nad tem: sistemsko bančno tveganje.',
    color: '#059669',
  },
  bonds: {
    id: 'bonds', name: 'Državne obveznice', fullName: 'EU državne obveznice ETF (IEAG)',
    emoji: '📄', category: 'Obveznice',
    returnBase: 3.5, returnRange: [1, 6],
    riskLevel: 2, liquidity: 4,
    purchaseCostPct: 0.10, annualCostPct: 0.16, sellCostPct: 0.10,
    taxType: 'cg_si', hasDividend: false,
    description: 'EU državne obveznice prek ETF. Stabilen donos ~3–4%. Nizko tveganje. Klasičen del konzervativnega portfelja.',
    pros: ['Nizko tveganje (EU države)', 'Stabilen, predvidljiv donos', '0% davek po 15 letih', 'Diversifikacija portfelja'],
    cons: ['Nizki donosi (pod inflacijo)', 'Obrestno tveganje (cena pade ko obresti rastejo)', 'Inflacijska erozija kupne moči'],
    taxNote: 'Kapitalski dobiček: 25% → 0% po 15 letih (ZDoh-2)',
    purchaseCostNote: 'Borzna provizija ~0.1–0.3% + TER 0.16%/leto',
    liquidityNote: 'Borza, dobra likvidnost med delovnikom',
    riskNote: 'Nizko kreditno tveganje (EU države), a obrestno tveganje pri dolgih ročnostih',
    color: 'var(--color-text-subtle)',
  },
};

// ============================================================
// HELPERS
// ============================================================

function getTaxRate(taxType, years) {
  if (taxType === 'cg_si') {
    if (years < 5) return 0.25;
    if (years < 10) return 0.20;
    if (years < 15) return 0.15;
    return 0;
  }
  if (taxType === 're_si') {
    if (years < 5) return 0.25;
    if (years < 10) return 0.15;
    if (years < 15) return 0.10;
    if (years < 20) return 0.05;
    return 0;
  }
  return 0.25; // interest_si
}

function simulateAsset(asset, years, mode, monthlyAmt, lumpSum) {
  const r = asset.returnBase / 100;
  const buyFee = asset.purchaseCostPct / 100;
  const annFee = asset.annualCostPct / 100;
  const sellFee = asset.sellCostPct / 100;

  let value = 0;
  let totalInvested = 0;
  const yearlyData = [];

  if (mode === 'lump') {
    totalInvested = lumpSum;
    value = lumpSum * (1 - buyFee);
  }

  yearlyData.push({ year: 0, value: Math.round(value), totalInvested: Math.round(totalInvested) });

  for (let y = 1; y <= years; y++) {
    if (mode === 'dca') {
      const contrib = monthlyAmt * 12;
      value += contrib * (1 - buyFee);
      totalInvested += contrib;
    }

    if (asset.hasDividend) {
      const divGross = value * (asset.dividendYield / 100);
      const divNet = divGross * (1 - asset.dividendTaxPct / 100);
      value = value * (1 + r - asset.dividendYield / 100) + divNet;
    } else {
      value = value * (1 + r);
    }

    value = value * (1 - annFee);
    yearlyData.push({ year: y, value: Math.round(Math.max(0, value)), totalInvested: Math.round(totalInvested) });
  }

  const gross = value;
  const afterSell = gross * (1 - sellFee);
  const gain = afterSell - totalInvested;
  const taxRate = getTaxRate(asset.taxType, years);
  const tax = Math.max(0, gain * taxRate);
  const finalValue = Math.round(afterSell - tax);
  const cagr = totalInvested > 0 && years > 0
    ? ((Math.pow(Math.max(0, finalValue) / Math.max(1, totalInvested), 1 / years) - 1) * 100).toFixed(1)
    : '0.0';

  return {
    yearlyData,
    finalValue,
    grossValue: Math.round(gross),
    totalInvested: Math.round(totalInvested),
    gain: Math.round(gain),
    tax: Math.round(tax),
    taxRate,
    cagr,
    roi: totalInvested > 0 ? (((finalValue - totalInvested) / totalInvested) * 100).toFixed(0) : '0',
  };
}

function calcSuitability(asset, { age, riskTolerance, years, monthlyIncome, monthlyAmt, goal }) {
  let score = 100;
  const factors = [];

  const riskDiff = Math.abs(riskTolerance - asset.riskLevel);
  const riskPenalty = riskDiff * 12;
  score -= riskPenalty;
  if (riskDiff === 0) factors.push({ ok: true, text: 'Tveganje idealno za tvoj profil' });
  else if (riskDiff >= 3) factors.push({ ok: false, text: 'Tveganje se zelo ne ujema s profilom' });

  if (asset.riskLevel >= 4 && years < 10) {
    score -= 25;
    factors.push({ ok: false, text: 'Prekratko obdobje za visoko tveganje' });
  } else if (years >= 15 && asset.taxType !== 'interest_si') {
    factors.push({ ok: true, text: '0% davek dosegljiv (15+ let)' });
  } else if (years >= 15 && asset.taxType === 're_si') {
    factors.push({ ok: true, text: '0% davek na nepremičnino (20+ let)' });
  }

  if (asset.liquidity <= 1 && monthlyAmt / monthlyIncome > 0.3) {
    score -= 15;
    factors.push({ ok: false, text: 'Visok delež dohodka + nizka likvidnost = tveganje' });
  } else if (asset.liquidity >= 4) {
    factors.push({ ok: true, text: 'Visoka likvidnost — enostaven izhod' });
  }

  const yearsToRetirement = Math.max(0, 65 - age);
  if (asset.riskLevel >= 4 && yearsToRetirement < 10) {
    score -= 20;
    factors.push({ ok: false, text: 'Preveč tvegano za bližino upokojitve' });
  } else if (age < 35 && asset.riskLevel >= 3) {
    factors.push({ ok: true, text: 'Mlad vlagatelj — tveganje je primerno' });
  }

  if (goal === 'emergency' && asset.liquidity < 4) {
    score -= 30;
    factors.push({ ok: false, text: 'Ni primerno za urgentni sklad' });
  }
  if (goal === 'income' && asset.hasDividend) factors.push({ ok: true, text: 'Odlično za pasivni dohodek' });
  if (goal === 'income' && !asset.hasDividend && asset.returnBase < 5) score -= 10;
  if (goal === 'retirement' && asset.riskLevel <= 2 && years > 20) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let rating, ratingColor;
  if (score >= 80) { rating = 'Odlično'; ratingColor = '#059669'; }
  else if (score >= 60) { rating = 'Primerno'; ratingColor = '#2563eb'; }
  else if (score >= 40) { rating = 'Sprejemljivo'; ratingColor = '#d97706'; }
  else { rating = 'Neprimerno'; ratingColor = '#dc2626'; }

  return { score, rating, ratingColor, factors };
}

// ============================================================
// SVG LINE CHART
// ============================================================

function LineChart({ data, years }) {
  const W = 700, H = 300;
  const PAD = { top: 16, right: 24, bottom: 44, left: 80 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const allVals = Object.values(data).flatMap(d => d.yearlyData.map(p => p.value));
  const maxVal = Math.max(...allVals, 1);
  const x = yr => PAD.left + (yr / years) * cW;
  const y = v => PAD.top + cH - (v / maxVal) * cH;

  const fmt = v => {
    if (v >= 1000000) return '€' + (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return '€' + (v / 1000).toFixed(0) + 'k';
    return '€' + v;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));
  const xStep = years <= 10 ? 2 : years <= 20 ? 5 : 10;
  const xTicks = [];
  for (let i = 0; i <= years; i += xStep) xTicks.push(i);
  if (xTicks[xTicks.length - 1] !== years) xTicks.push(years);

  const firstResult = Object.values(data)[0];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={y(tick)} x2={W - PAD.right} y2={y(tick)}
            stroke="var(--color-border)" strokeWidth="1" />
          <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end"
            fill="var(--color-text-muted)" fontSize="11" fontFamily="Inter, sans-serif">{fmt(tick)}</text>
        </g>
      ))}
      {xTicks.map((tick, i) => (
        <g key={i}>
          <text x={x(tick)} y={PAD.top + cH + 18} textAnchor="middle"
            fill="var(--color-text-subtle)" fontSize="11" fontFamily="Inter, sans-serif">{tick}L</text>
        </g>
      ))}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH} stroke="var(--color-border)" />
      <line x1={PAD.left} y1={PAD.top + cH} x2={W - PAD.right} y2={PAD.top + cH} stroke="var(--color-border)" />

      {firstResult && (
        <polyline
          points={firstResult.yearlyData.map(p => `${x(p.year)},${y(p.totalInvested)}`).join(' ')}
          fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" strokeDasharray="5,4" />
      )}

      {Object.entries(data).map(([id, result]) => {
        const asset = ASSETS[id];
        const pts = result.yearlyData.map(p => `${x(p.year)},${y(p.value)}`).join(' ');
        const last = result.yearlyData[result.yearlyData.length - 1];
        return (
          <g key={id}>
            <polyline points={pts} fill="none" stroke={asset.color}
              strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(last.year)} cy={y(last.value)} r="5"
              fill={asset.color} stroke="var(--color-surface)" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: '5px', background: 'var(--color-bg)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '3px' }} />
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
      background: color + '20', color, border: `1px solid ${color}40`,
    }}>{children}</span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const S = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  border: 'var(--color-border)',
  muted: 'var(--color-text-muted)',
  subtle: 'var(--color-text-subtle)',
  accent: 'var(--color-accent)',
};

export default function InvestmentCalculator() {
  const [age, setAge] = useState(30);
  const [monthlyIncome, setMonthlyIncome] = useState(2000);
  const [riskTolerance, setRiskTolerance] = useState(3);
  const [goal, setGoal] = useState('retirement');
  const [years, setYears] = useState(20);
  const [mode, setMode] = useState('dca');
  const [monthlyAmt, setMonthlyAmt] = useState(300);
  const [lumpSum, setLumpSum] = useState(10000);
  const [selectedAssets, setSelectedAssets] = useState(new Set(['sp500', 'realEstate', 'gold', 'bank']));
  const [activeTab, setActiveTab] = useState('chart');
  const [expandedAsset, setExpandedAsset] = useState(null);

  const toggleAsset = id => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const calcs = useMemo(() => {
    const out = {};
    for (const id of selectedAssets) out[id] = simulateAsset(ASSETS[id], years, mode, monthlyAmt, lumpSum);
    return out;
  }, [selectedAssets, years, mode, monthlyAmt, lumpSum]);

  const suits = useMemo(() => {
    const out = {};
    for (const id of selectedAssets) {
      out[id] = calcSuitability(ASSETS[id], { age, riskTolerance, years, monthlyIncome, monthlyAmt, goal });
    }
    return out;
  }, [selectedAssets, age, riskTolerance, years, monthlyIncome, monthlyAmt, goal]);

  const sortedIds = [...selectedAssets].sort((a, b) => (calcs[b]?.finalValue || 0) - (calcs[a]?.finalValue || 0));
  const totalInv = mode === 'dca' ? monthlyAmt * 12 * years : lumpSum;

  const RISK_TOL_LABELS = { 1: 'Konzervativec', 2: 'Rahlo konz.', 3: 'Balanced', 4: 'Agresiven', 5: 'Špekulant' };
  const GOAL_LABELS = { retirement: 'Pokojnina', house: 'Nakup nepremičnine', income: 'Pasivni dohodek', wealth: 'Rast premoženja', emergency: 'Urgentni sklad' };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      padding: '3.5rem 1.5rem 5rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'var(--color-text)',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* HEADER */}
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem',
            color: 'var(--color-text)',
          }}>
            Kalkulator investicij
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, maxWidth: 680 }}>
            Primerjaj S&P 500, nepremičnine, zlato, BTC in več — z davki SLO, stroški, grafom rasti in osebno oceno primernosti.
          </p>
        </header>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ===== LEFT PANEL ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Profil */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--color-text)' }}>👤 Profil vlagatelja</div>

              {[
                { label: 'Starost', value: age + ' let', min: 18, max: 70, step: 1, val: age, set: setAge },
                { label: 'Mesečni dohodek', value: '€' + monthlyIncome.toLocaleString(), min: 500, max: 15000, step: 100, val: monthlyIncome, set: setMonthlyIncome },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontSize: '0.75rem', color: S.accent, fontWeight: 700 }}>{f.value}</span>
                  </div>
                  <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                    onChange={e => f.set(+e.target.value)}
                    style={{ width: '100%', accentColor: S.accent }} />
                </div>
              ))}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>Toleranca tveganja</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: RISK_COLORS[riskTolerance] }}>{RISK_TOL_LABELS[riskTolerance]}</span>
                </div>
                <input type="range" min="1" max="5" value={riskTolerance}
                  onChange={e => setRiskTolerance(+e.target.value)}
                  style={{ width: '100%', accentColor: RISK_COLORS[riskTolerance] }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: S.subtle, marginTop: '3px' }}>
                  <span>Konzervativec</span><span>Špekulant</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600, marginBottom: '6px' }}>Investicijski cilj</div>
                <select value={goal} onChange={e => setGoal(e.target.value)} style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem',
                  background: 'var(--color-bg)', border: `1px solid ${S.border}`,
                  color: 'var(--color-text)', outline: 'none',
                }}>
                  {Object.entries(GOAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: 'var(--color-surface)' }}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Naložba */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--color-text)' }}>💰 Naložbeni parametri</div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>Obdobje</span>
                  <span style={{ fontSize: '0.75rem', color: S.accent, fontWeight: 700 }}>
                    {years} let {years >= 15 && <span style={{ color: '#059669', fontSize: '0.65rem' }}>✓ 0% davek</span>}
                  </span>
                </div>
                <input type="range" min="1" max="40" value={years} onChange={e => setYears(+e.target.value)}
                  style={{ width: '100%', accentColor: S.accent }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '1rem' }}>
                {[
                  { id: 'dca', label: '📅 DCA (mesečno)', desc: 'Fiksen mesečni znesek' },
                  { id: 'lump', label: '💸 Enkratni vložek', desc: 'Vse naenkrat' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setMode(opt.id)} style={{
                    padding: '8px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${mode === opt.id ? S.accent : S.border}`,
                    background: mode === opt.id ? 'rgba(217,119,6,0.12)' : 'transparent',
                    color: mode === opt.id ? S.accent : S.muted,
                    fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s',
                  }}>
                    <div>{opt.label}</div>
                    <div style={{ fontWeight: 400, marginTop: '2px', opacity: 0.7 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>

              {mode === 'dca' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>Mesečni DCA</span>
                    <span style={{ fontSize: '0.75rem', color: S.accent, fontWeight: 700 }}>
                      €{monthlyAmt} <span style={{ color: S.subtle, fontWeight: 400 }}>({((monthlyAmt / monthlyIncome) * 100).toFixed(0)}% doh.)</span>
                    </span>
                  </div>
                  <input type="range" min="50" max="5000" step="50" value={monthlyAmt}
                    onChange={e => setMonthlyAmt(+e.target.value)}
                    style={{ width: '100%', accentColor: S.accent }} />
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(217,119,6,0.07)', borderRadius: '8px', fontSize: '0.7rem', color: S.muted }}>
                    Skupaj v {years} let: <strong style={{ color: S.accent }}>€{(monthlyAmt * 12 * years).toLocaleString()}</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>Enkratni vložek</span>
                    <span style={{ fontSize: '0.75rem', color: S.accent, fontWeight: 700 }}>€{lumpSum.toLocaleString()}</span>
                  </div>
                  <input type="range" min="1000" max="300000" step="1000" value={lumpSum}
                    onChange={e => setLumpSum(+e.target.value)}
                    style={{ width: '100%', accentColor: S.accent }} />
                </div>
              )}
            </div>

            {/* Asset izbor */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>🎯 Izbor naložb</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {Object.values(ASSETS).map(asset => {
                  const sel = selectedAssets.has(asset.id);
                  return (
                    <button key={asset.id} onClick={() => toggleAsset(asset.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '6px', cursor: 'pointer',
                      border: `1px solid ${sel ? asset.color : S.border}`,
                      background: sel ? asset.color + '14' : 'transparent',
                      transition: 'all 0.15s', textAlign: 'left', width: '100%',
                    }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0, background: sel ? asset.color : 'rgba(255,255,255,0.18)' }} />
                      <span style={{ fontSize: '1rem' }}>{asset.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: sel ? '#fff' : S.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</div>
                        <div style={{ fontSize: '0.64rem', color: S.subtle }}>{asset.returnBase}%/leto • {RISK_LABELS[asset.riskLevel]}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== RIGHT PANEL ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg)', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'chart', label: '📈 Grafikon' },
                { id: 'compare', label: '🔢 Primerjava' },
                { id: 'costs', label: '💸 Stroški & Davki' },
                { id: 'suitability', label: '⭐ Ocena za tebe' },
                { id: 'details', label: '🔍 Podrobnosti' },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  flex: 1, minWidth: '80px', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: activeTab === t.id ? 'var(--color-surface-hover)' : 'transparent',
                  color: activeTab === t.id ? '#fff' : S.muted,
                  fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{t.label}</button>
              ))}
            </div>

            {/* ===== CHART TAB ===== */}
            {activeTab === 'chart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>Rast naložbe — {years} let</div>
                      <div style={{ fontSize: '0.72rem', color: S.muted, marginTop: '2px' }}>
                        Vložek: <strong style={{ color: 'var(--color-text)' }}>€{totalInv.toLocaleString()}</strong>
                        {' · '}Način: {mode === 'dca' ? `€${monthlyAmt}/mes DCA` : 'Enkratni vložek'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: S.subtle, textAlign: 'right' }}>--- skupaj vloženo</div>
                  </div>
                  <LineChart data={calcs} years={years} />
                  {/* Legend */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '1rem' }}>
                    {sortedIds.map(id => {
                      const a = ASSETS[id];
                      const c = calcs[id];
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{ width: '22px', height: '3px', background: a.color, borderRadius: '2px' }} />
                          <span style={{ fontSize: '0.75rem', color: S.muted }}>{a.emoji} {a.name}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: a.color }}>€{c?.finalValue?.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Result cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {sortedIds.map((id, rank) => {
                    const a = ASSETS[id];
                    const c = calcs[id];
                    return (
                      <div key={id} style={{
                        background: a.color + '10', border: `1px solid ${a.color}35`,
                        borderRadius: '8px', padding: '1.1rem', position: 'relative',
                      }}>
                        {rank === 0 && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                            <Badge color={S.accent}>★ NAJBOLJŠI</Badge>
                          </div>
                        )}
                        <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{a.emoji}</div>
                        <div style={{ fontSize: '0.72rem', color: S.muted }}>{a.name}</div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: a.color, lineHeight: 1.1, margin: '4px 0 10px' }}>
                          €{c?.finalValue?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: S.muted, lineHeight: 1.8 }}>
                          <div>Dobiček: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>€{(c?.finalValue - totalInv).toLocaleString()}</span></div>
                          <div>CAGR neto: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{c?.cagr}%</span></div>
                          <div>Davek: <span style={{ color: '#dc2626' }}>-€{c?.tax?.toLocaleString()}</span></div>
                          <div>ROI: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{c?.roi}%</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== COMPARE TAB ===== */}
            {activeTab === 'compare' && (
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '1.5rem', overflowX: 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Primerjalna tabela</div>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px', fontSize: '0.78rem', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      {['Naložba', 'Končna vrednost', 'Vloženo', 'Neto dobiček', 'CAGR', 'Davek', 'Tveganje', 'Likvidnost'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: S.muted, fontWeight: 600, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIds.map((id, rank) => {
                      const a = ASSETS[id];
                      const c = calcs[id];
                      const tv = c?.totalInvested || 0;
                      return (
                        <tr key={id}>
                          <td style={{ padding: '10px', borderRadius: '10px 0 0 10px', background: rank === 0 ? a.color + '12' : 'transparent', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {a.emoji} {a.name} {rank === 0 && <span style={{ color: S.accent }}>★</span>}
                          </td>
                          <td style={{ padding: '10px', background: rank === 0 ? a.color + '12' : 'transparent', fontWeight: 900, color: a.color }}>€{c?.finalValue?.toLocaleString()}</td>
                          <td style={{ padding: '10px', background: rank === 0 ? a.color + '12' : 'transparent', color: S.muted }}>€{tv.toLocaleString()}</td>
                          <td style={{ padding: '10px', background: rank === 0 ? a.color + '12' : 'transparent', color: (c?.finalValue - tv) >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                            €{(c?.finalValue - tv).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px', background: rank === 0 ? a.color + '12' : 'transparent', fontWeight: 700 }}>{c?.cagr}%</td>
                          <td style={{ padding: '10px', background: rank === 0 ? a.color + '12' : 'transparent', color: '#dc2626' }}>-€{c?.tax?.toLocaleString()}</td>
                          <td style={{ padding: '10px', background: rank === 0 ? a.color + '12' : 'transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MiniBar value={a.riskLevel} max={5} color={RISK_COLORS[a.riskLevel]} />
                              <span style={{ fontSize: '0.65rem', color: RISK_COLORS[a.riskLevel], whiteSpace: 'nowrap' }}>{RISK_LABELS[a.riskLevel]}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px', borderRadius: '0 10px 10px 0', background: rank === 0 ? a.color + '12' : 'transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MiniBar value={a.liquidity} max={5} color="#059669" />
                              <span style={{ fontSize: '0.65rem', color: '#059669', whiteSpace: 'nowrap' }}>{LIQ_LABELS[a.liquidity]}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== COSTS TAB ===== */}
            {activeTab === 'costs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '8px', padding: '1rem', fontSize: '0.8rem' }}>
                  <strong style={{ color: S.accent }}>Davčna politika SLO (ZDoh-2)</strong>
                  <div style={{ color: S.muted, marginTop: '6px', lineHeight: 1.6 }}>
                    Kapitalski dobički: 25% → 20% → 15% → 0% (po 15 letih za ETF/zlato/kripto).
                    Nepremičnine: 0% po 20 letih. Najemnina: 25% na 90% bruto = 22.5%.
                    Obresti: 25% nad ~1.000€/leto.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {sortedIds.map(id => {
                    const a = ASSETS[id];
                    const c = calcs[id];
                    const tv = c?.totalInvested || 0;
                    const entryCost = Math.round(tv * a.purchaseCostPct / 100);
                    const sellCost = Math.round((c?.grossValue || 0) * a.sellCostPct / 100);
                    return (
                      <div key={id} style={{ background: S.surface, border: `1px solid ${a.color}28`, borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{a.emoji}</span>
                          <div style={{ fontWeight: 700 }}>{a.name}</div>
                        </div>

                        {[
                          { label: 'Vstopni strošek', value: a.purchaseCostPct + '%', amount: '−€' + entryCost.toLocaleString() },
                          { label: 'Letni strošek (TER)', value: a.annualCostPct + '%/leto', amount: '' },
                          { label: 'Prodajni strošek', value: a.sellCostPct + '%', amount: '−€' + sellCost.toLocaleString() },
                          { label: 'Davek na prodajo', value: (c?.taxRate * 100).toFixed(0) + '%', amount: '−€' + c?.tax?.toLocaleString() },
                        ].map((row, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-bg)' }}>
                            <span style={{ fontSize: '0.72rem', color: S.muted }}>{row.label}</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text)', fontWeight: 600 }}>{row.value}</span>
                              {row.amount && <span style={{ fontSize: '0.68rem', color: '#dc2626', marginLeft: '8px' }}>{row.amount}</span>}
                            </div>
                          </div>
                        ))}

                        <div style={{ marginTop: '10px', padding: '8px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '0.68rem', color: S.subtle, lineHeight: 1.5 }}>
                          🏛️ {a.taxNote}
                        </div>
                        <div style={{ marginTop: '6px', padding: '8px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '0.68rem', color: S.subtle, lineHeight: 1.5 }}>
                          💰 {a.purchaseCostNote}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== SUITABILITY TAB ===== */}
            {activeTab === 'suitability' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Profile summary */}
                <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '1.1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>Tvoj profil</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      ['Starost', age + ' let'],
                      ['Dohodek', '€' + monthlyIncome + '/mes'],
                      ['Tveganje', RISK_TOL_LABELS[riskTolerance]],
                      ['Cilj', GOAL_LABELS[goal]],
                      ['Obdobje', years + ' let'],
                      ['Vložek', mode === 'dca' ? '€' + monthlyAmt + '/mes' : '€' + lumpSum.toLocaleString()],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: '8px', padding: '3px 10px', fontSize: '0.72rem' }}>
                        <span style={{ color: S.muted }}>{k}: </span>
                        <span style={{ color: S.accent, fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {[...selectedAssets].sort((a, b) => (suits[b]?.score || 0) - (suits[a]?.score || 0)).map(id => {
                    const a = ASSETS[id];
                    const s = suits[id];
                    if (!s) return null;
                    return (
                      <div key={id} style={{ background: S.surface, border: `1px solid ${s.ratingColor}35`, borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.3rem' }}>{a.emoji}</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: s.ratingColor, lineHeight: 1 }}>{s.score}</div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: s.ratingColor }}>{s.rating}</div>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div style={{ height: '6px', background: 'var(--color-bg)', borderRadius: '3px', marginBottom: '1rem', overflow: 'hidden' }}>
                          <div style={{ width: s.score + '%', height: '100%', background: `linear-gradient(90deg, ${s.ratingColor}, ${s.ratingColor}88)`, borderRadius: '3px', transition: 'width 0.5s' }} />
                        </div>

                        {/* Indicators */}
                        {[
                          { label: 'Tveganje', value: a.riskLevel, max: 5, color: RISK_COLORS[a.riskLevel], text: RISK_LABELS[a.riskLevel] },
                          { label: 'Likvidnost', value: a.liquidity, max: 5, color: '#059669', text: LIQ_LABELS[a.liquidity] },
                        ].map(ind => (
                          <div key={ind.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.67rem', color: S.subtle, width: '68px', flexShrink: 0 }}>{ind.label}</span>
                            <MiniBar value={ind.value} max={ind.max} color={ind.color} />
                            <span style={{ fontSize: '0.67rem', color: ind.color, width: '65px', flexShrink: 0 }}>{ind.text}</span>
                          </div>
                        ))}

                        {/* Factors */}
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {s.factors.map((f, i) => (
                            <div key={i} style={{ fontSize: '0.7rem', color: f.ok ? '#059669' : '#dc2626', display: 'flex', gap: '6px' }}>
                              <span style={{ flexShrink: 0 }}>{f.ok ? '✓' : '⚠'}</span>
                              <span>{f.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Donos range */}
                        <div style={{ marginTop: '10px', padding: '8px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '0.68rem', color: S.muted }}>
                          Zgodovinski donos: {a.returnRange[0]}–{a.returnRange[1]}% letno (povp. {a.returnBase}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== DETAILS TAB ===== */}
            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedIds.map(id => {
                  const a = ASSETS[id];
                  const c = calcs[id];
                  const tv = c?.totalInvested || 0;
                  const open = expandedAsset === id;
                  return (
                    <div key={id} style={{ background: S.surface, border: `1px solid ${a.color}28`, borderRadius: '8px', overflow: 'hidden' }}>
                      <button onClick={() => setExpandedAsset(open ? null : id)} style={{
                        width: '100%', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', background: 'none', border: 'none',
                        color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{a.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 700 }}>{a.name}</div>
                            <div style={{ fontSize: '0.7rem', color: S.muted }}>{a.fullName}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: a.color }}>€{c?.finalValue?.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', color: S.muted }}>neto po davkih</div>
                          </div>
                          <span style={{ color: S.muted, fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {open && (
                        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: `1px solid ${S.border}` }}>
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, margin: '1rem 0' }}>{a.description}</p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', color: S.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Prednosti</div>
                              {a.pros.map((p, i) => <div key={i} style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '4px' }}>✓ {p}</div>)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.65rem', color: S.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Slabosti</div>
                              {a.cons.map((c2, i) => <div key={i} style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: '4px' }}>✗ {c2}</div>)}
                            </div>
                          </div>

                          {/* Stats grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' }}>
                            {[
                              { label: 'Povp. donos', value: a.returnBase + '%/leto', sub: a.returnRange[0] + '–' + a.returnRange[1] + '% razpon' },
                              { label: 'Skupaj vloženo', value: '€' + tv.toLocaleString() },
                              { label: 'Bruto vrednost', value: '€' + c?.grossValue?.toLocaleString() },
                              { label: 'Davek', value: '€' + c?.tax?.toLocaleString(), sub: (c?.taxRate * 100).toFixed(0) + '% davčna stopnja' },
                              { label: 'Neto vrednost', value: '€' + c?.finalValue?.toLocaleString() },
                              { label: 'CAGR neto', value: c?.cagr + '%/leto' },
                            ].map((st, i) => (
                              <div key={i} style={{ background: 'var(--color-bg)', borderRadius: '6px', padding: '10px' }}>
                                <div style={{ fontSize: '0.62rem', color: S.subtle, marginBottom: '4px' }}>{st.label}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>{st.value}</div>
                                {st.sub && <div style={{ fontSize: '0.62rem', color: S.subtle, marginTop: '3px' }}>{st.sub}</div>}
                              </div>
                            ))}
                          </div>

                          {/* Info rows */}
                          {[
                            { icon: '🏛️', label: 'Davki (SLO)', text: a.taxNote },
                            { icon: '💰', label: 'Stroški nakupa', text: a.purchaseCostNote },
                            { icon: '💧', label: 'Likvidnost', text: a.liquidityNote },
                            { icon: '⚠️', label: 'Tveganje', text: a.riskNote },
                          ].map((row, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 10px', background: 'transparent', borderRadius: '8px', marginBottom: '5px' }}>
                              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{row.icon}</span>
                              <div>
                                <div style={{ fontSize: '0.62rem', color: S.subtle, fontWeight: 700, marginBottom: '2px' }}>{row.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>{row.text}</div>
                              </div>
                            </div>
                          ))}

                          {/* Transparency */}
                          <div style={{ marginTop: '1rem', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: '8px', padding: '1rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: S.accent, marginBottom: '10px' }}>🔍 Transparentni izračun</div>
                            {[
                              { label: 'Korak 1: Vložite', value: '€' + tv.toLocaleString() + (mode === 'dca' ? ' (€' + monthlyAmt + '/mes × ' + years + ' let)' : ' enkratno') },
                              { label: 'Korak 2: Vstopni stroški −' + a.purchaseCostPct + '%', value: '−€' + Math.round(tv * a.purchaseCostPct / 100).toLocaleString() },
                              { label: 'Korak 3: Letna rast ' + a.returnBase + '%', value: years + ' let složnih obresti' },
                              { label: 'Korak 4: Letni stroški TER −' + a.annualCostPct + '%', value: 'vsako leto' },
                              { label: 'Korak 5: Prodajni stroški −' + a.sellCostPct + '%', value: '−€' + Math.round((c?.grossValue || 0) * a.sellCostPct / 100).toLocaleString() },
                              { label: 'Korak 6: Davek na dobiček ' + (c?.taxRate * 100).toFixed(0) + '%', value: '−€' + c?.tax?.toLocaleString() },
                              { label: '→ Neto vrednost', value: '€' + c?.finalValue?.toLocaleString(), highlight: true },
                            ].map((step, i, arr) => (
                              <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                              }}>
                                <span style={{ fontSize: '0.72rem', color: step.highlight ? S.accent : S.muted }}>{step.label}</span>
                                <span style={{ fontSize: '0.72rem', color: step.highlight ? S.accent : '#fff', fontWeight: step.highlight ? 800 : 400 }}>{step.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DISCLAIMER */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: `1px solid ${S.border}`, fontSize: '0.7rem', color: S.subtle, lineHeight: 1.6 }}>
          <strong style={{ color: S.muted }}>📌 Viri:</strong> Zgodovinski donosi: Morningstar, Bloomberg, MSCI, SURS.
          Davčna zakonodaja: ZDoh-2, FURS.gov.si, Uradni list RS.
          S&P 500 CAGR ~10% (1957–2024), NASDAQ-100 ~14.5% (2000–2024), Zlato ~8% (2000–2024 nominalno).
          {' '}
          <strong style={{ color: S.muted }}>⚠️ Opozorilo:</strong> Pretekla uspešnost ne zagotavlja prihodnjih rezultatov.
          Vsi izračuni so simulacije z zgodovinskimi povprečji. Ni finančni nasvet.
          Posvetujte se s pooblaščenim finančnim svetovalcem in davčnim svetovalcem (FURS).
        </div>
      </div>
    </div>
  );
}

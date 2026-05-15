# Vodnik po Engineering Investor

Ta dokument ti pomaga razumeti, kako je spletna stran zgrajena, kje je kaj, in kako delati spremembe.

---

## 1. Veliki vzorec — kako stvar deluje

Spletna stran je narejena z **Astro** (ogrodje), z **React** komponentami za interaktivne dele.
Stran je **statična**: ko jo zgradimo (`npm run build`), nastane mapa `dist/` z gotovimi HTML/CSS/JS datotekami.
Te datoteke se hostajo na **GitHub Pages** preko brezplačnega `*.github.io` strežnika.

```
Tvoja koda v src/  →  npm run build  →  dist/  →  git push  →  GitHub Actions deploy  →  engineeringinvestor.si
```

### Astro vs React — razlika

- **Astro** (`.astro` datoteke) so HTML strani s podporo za komponente. Tečejo se ob buildu, ne v brskalniku.
  Uporabljamo jih za vse "statične" dele (analize, dnevni pregled, naslovna stran).
- **React** (`.jsx` datoteke) so interaktivne komponente, ki tečejo v brskalniku.
  Uporabljamo jih za kalkulatorje in sledilnik — povsod, kjer uporabnik klika gumbe in se nekaj spreminja.

Astro datoteka lahko **vključi** React komponento takole:
```astro
<MoneyTracker client:only="react" />
```
`client:only="react"` pomeni: zaženi to komponento šele v brskalniku.

---

## 2. Mape — kaj je kje

```
engineering-investor/
├── public/             # Statični viri (datoteke, slike, podatki)
├── src/                # VSA tvoja koda
│   ├── pages/          # Posamezne strani — vsaka datoteka = URL
│   ├── layouts/        # Ovojnice, ki se uporabljajo za več strani
│   ├── components/     # Ponovno uporabne UI gradnike
│   ├── content/        # Markdown članki (Analize)
│   ├── styles/         # Globalni CSS
│   ├── utils/          # Pomožne funkcije
│   ├── config.ts       # Glavna konfiguracija (ime, navigacija, URL)
│   └── content.config.ts # Schema za Markdown članke
├── scripts/            # Skripte, ki tečejo izven brskalnika (Node.js)
├── .github/workflows/  # GitHub Actions (avtomatizacija)
├── astro.config.mjs    # Konfiguracija Astro ogrodja
└── package.json        # Seznam knjižnic + npm ukazi
```

### `src/pages/` — strani

**Vsaka datoteka v tej mapi postane URL na strani.** To se imenuje *file-based routing*.

```
src/pages/index.astro              →  engineeringinvestor.si/
src/pages/o-meni.astro             →  engineeringinvestor.si/o-meni
src/pages/sledilnik.astro          →  engineeringinvestor.si/sledilnik
src/pages/kalkulatorji.astro       →  engineeringinvestor.si/kalkulatorji
src/pages/analize/index.astro      →  engineeringinvestor.si/analize
src/pages/analize/[slug].astro     →  dinamične strani analiz (vsaka analiza)
```

Vsaka stran običajno samo **uvozi** ovojnico in vsebino:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import MoneyTracker from '../components/tracker/MoneyTracker.jsx';
---
<BaseLayout title="Sledilnik">
  <MoneyTracker client:only="react" />
</BaseLayout>
```

Kdaj kaj dodati v `pages/`? **Kadarkoli želiš novo URL pot.**

### `src/layouts/` — ovojnice

V `BaseLayout.astro` je vse, kar se ponavlja na vsaki strani: glava (`<head>`), navigacija, noga, meta tagi.
Posamezne strani (`pages/`) samo "padejo noter" v to ovojnico.

Če bi rad spremenil **navigacijo** (zgornji meni), to NI v `BaseLayout`, ampak v `src/components/layout/` in seznam povezav je v **`src/config.ts`**.

### `src/components/` — komponente

Tu so vsi gradniki UI, razdeljeni po smiselnih podkategorijah:

```
components/
├── articles/      # Komponente za prikaz analiz (kartice, povezave, beri-naslednje)
├── calculators/   # Tvoji 3 kalkulatorji (naložb, INR vs IBKR, neto vrednost)
├── home/          # Naslovna stran sekcije (hero, najnovejše analize)
├── layout/        # Glava in noga strani
├── news/          # Dnevni pregled (MarketBriefing.jsx)
├── premium/       # Premium komponente
├── tracker/       # Sledilnik denarja
└── ui/            # Mali generični gradniki (Badge, Disclaimer)
```

**Komponenta** je samostojen kos UI z lastno logiko.
Princip: **iste stvari pišeš ENKRAT, uporabljaš večkrat.**

Primer: gumb "+" se uporablja v transakcijah, računih, ciljih...
Zato imamo `Button` komponento v `tracker/ui.jsx`, ki jo vsi uvozijo:
```jsx
import { Button } from '../ui.jsx';
<Button onClick={...}>+ Nov račun</Button>
```

### `src/content/` — članki v Markdown

Analize (poglobljene pojasnjevalne objave) niso programirane, ampak **napisane v Markdownu** — to je preprost format brez HTML-ja.

```
content/articles/
├── trump-hormuz-blokada-2026.md
├── fed-obrestne-mere-2025.md
└── ...
```

Vsak `.md` ima na vrhu **frontmatter** (metapodatki) in pod njim besedilo:
```markdown
---
title: 'Trump in Hormuz blokada'
date: 2026-04-15
category: 'Geopolitika'
excerpt: 'Kratek povzetek...'
---

# Glavni naslov

Tu pišeš članek.
```

`src/content.config.ts` določa **schema** — katera polja so obvezna v vsakem članku.
Ko zaženeš build, Astro avtomatsko ustvari URL za vsakega: `/analize/trump-hormuz-blokada-2026`.

### `public/` — statični viri

Vse v `public/` se servira **direktno** brez obdelave. Slike, fonti, podatki.

```
public/
├── data/briefing.json     # Tu se shrani rezultat dnevnega pregleda
├── og-image.png           # Slika za Twitter/Facebook share
└── favicon.svg
```

URL primer: datoteka `public/data/briefing.json` je dosegljiva na `engineeringinvestor.si/data/briefing.json`.

### `scripts/` — Node.js skripte

Skripte, ki **niso** del spletne strani — tečejo na strežniku ali v GitHub Actions.

`scripts/generate-briefing.mjs` se zažene vsak dan ob 06:30 UTC, pokliče NewsAPI in Gemini, in shrani rezultat v `public/data/briefing.json`.

### `.github/workflows/` — avtomatizacije

GitHub Actions = brezplačni roboti, ki jih lahko nastaviš na sprožilce (cron, push, manualno).

`daily-briefing.yml` ima dva dela:
1. **build** — vsak dan ob 06:30 UTC: zaženi skripto, shrani briefing, zgradi stran, naloži artefakt
2. **deploy** — naloži artefakt na GitHub Pages

### `src/config.ts` — glavna konfiguracija

Tu je **ime strani, URL, navigacijski meni**. Če dodaš novo stran in želiš, da je v meniju, dodaj jo tu:

```typescript
export const NAV_LINKS = [
  { label: 'Analize', href: '/analize' },
  { label: 'Kalkulatorji', href: '/kalkulatorji' },
  { label: 'Sledilnik', href: '/sledilnik' },
  ...
];
```

### `astro.config.mjs` — konfiguracija ogrodja

Tu je base path (`/engineering-investor`) in vključeni vtičniki (sitemap, react).
**Tega običajno ne spreminjaš.**

### `package.json` — knjižnice + ukazi

Tu so vse zunanje knjižnice (React, Astro...) in **npm skripte**:

```json
"scripts": {
  "dev": "astro dev",       // razvojni strežnik
  "build": "astro build",   // gradnja produkcijske različice
  "preview": "astro preview" // pregled produkcijske različice
}
```

Zaženeš jih z `npm run dev`, `npm run build`, ipd.

---

## 3. Kje spreminjati kaj — šestnajst tipičnih nalog

| Želim spremeniti...                 | Kje                                                          |
| ----------------------------------- | ------------------------------------------------------------ |
| Naslovno stran                      | `src/pages/index.astro` + komponente v `src/components/home/` |
| Navigacijski meni                   | `src/config.ts` (NAV_LINKS)                                  |
| Glavo / nogo strani                 | `src/components/layout/`                                     |
| Globalne barve / fonte              | `src/styles/global.css`                                      |
| Dodati novo analizo                 | Nov `.md` v `src/content/articles/`                          |
| Spremeniti obstoječo analizo        | Pripadajoči `.md` v `src/content/articles/`                  |
| Dodati nov kalkulator               | Nova `.jsx` v `src/components/calculators/` + nova stran v `src/pages/` + dodati v `src/pages/kalkulatorji.astro` |
| Dodati novo stran (npr. /blog)      | Nova `.astro` v `src/pages/` + dodati v `src/config.ts`      |
| Logiko sledilnika                   | `src/components/tracker/`                                    |
| Skripto za dnevni pregled           | `scripts/generate-briefing.mjs`                              |
| Cron urnik za dnevni pregled        | `.github/workflows/daily-briefing.yml` (vrstica `cron:`)     |
| Domeno / URL                        | `astro.config.mjs` (`site:`) + GitHub Pages nastavitve       |
| Sliko za share na družbenih omrežjih| `public/og-image.png`                                        |
| Favicon                             | `public/favicon.svg`                                         |
| Sitemap                             | Avtomatsko (vtičnik `@astrojs/sitemap`)                      |
| Disclaimer / opozorila              | `src/components/ui/Disclaimer.astro`                         |

---

## 4. Razvojni cikel — kako delaš spremembe

Tipičen tok:

```
1. EDIT     → odpri datoteko v urejevalniku, naredi spremembo
2. PREVIEW  → npm run dev → poglej v brskalniku, da deluje
3. BUILD    → npm run build → preveri, da ni napak
4. COMMIT   → git add + git commit (shranjevanje)
5. PUSH     → git push (objava na GitHub)
6. DEPLOY   → GitHub Actions avtomatsko zgradi in objavi
```

### 4.1. Lokalni razvoj — `npm run dev`

V terminalu (PowerShell/Git Bash), v mapi projekta:
```bash
cd "C:/Users/Jaž/OneDrive/Namizje/PROJEKTI/INVESTING SPLETNA STRAN/engineering-investor"
npm run dev
```

To zažene **lokalni strežnik** na `http://localhost:4321/engineering-investor`.
Spremembe v kodi so vidne **takoj** (hot reload — ni potrebno osveževati ročno).

Ko si končal, v terminalu pritisni `Ctrl+C` da ustaviš strežnik.

### 4.2. Build — preverba pred objavo

```bash
npm run build
```

To naredi produkcijsko različico v mapo `dist/`.
Če koda ni veljavna (sintaktične napake, manjkajoče komponente), bo build **padel** — to je dobro, ker vidi napako PRED objavo.

```bash
npm run preview
```

Servira `dist/` lokalno — vidiš, kako bo stran dejansko zgledala v produkciji.

---

## 5. Git osnove — kako shranjevati in objavljati

**Git** je sistem za vodenje verzij. Vsaka sprememba se shrani kot "commit" z opisom.
**GitHub** je spletni servis, ki hostira tvoj git repozitorij.

### 5.1. Osnovni ukazi

```bash
git status            # Kaj je spremenjeno?
git diff              # Pokaži spremembe
git add <datoteka>    # Pripravi datoteko za commit
git add .             # Pripravi VSE spremembe za commit (previdno!)
git commit -m "opis"  # Shrani spremembe v zgodovino
git push              # Naloži lokalne commite na GitHub
git pull              # Prenesi tuje spremembe iz GitHuba
git log               # Pokaži zgodovino commitov
```

### 5.2. Tipičen tok shranjevanja

```bash
# 1. Preveri stanje
git status

# 2. Izberi datoteke
git add src/components/tracker/views/Transactions.jsx

# 3. Naredi commit z opisom (kratek, opisen)
git commit -m "fix(tracker): clarify search placeholder"

# 4. Pošlji na GitHub
git push
```

**Pravilo dobrega commita:** opis pove **kaj** se je spremenilo in **zakaj**, ne kako.

```
Slabo:  "spremembe"
Slabo:  "popravil sem datoteko Transactions.jsx z dodanim labelom"
Dobro:  "fix(tracker): clarify search placeholder to avoid confusion"
```

### 5.3. Konflikti pri push

Če pushaš in dobiš:
```
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally.
```

Pomeni, da je nekdo drug (ali GitHub Actions bot) pushal pred tabo. Reši takole:
```bash
git pull --rebase
git push
```

`--rebase` "potegne" tuje commite in tvoje postavi na vrh. Brez konfliktov gre samodejno.

### 5.4. Kaj NE delati

- **Nikoli** `git push --force` na main brez razmisleka — prepiše tuje delo.
- **Nikoli** ne commitaj `.env` datotek z gesli ali API ključi.
- **Nikoli** ne commitaj mape `node_modules/` (je v `.gitignore`).
- **Ne** delaj velikih commitov z 50 spremembami — raje več manjših z jasnim opisom.

### 5.5. Skrivnosti / API ključi

API ključi (Gemini, NewsAPI) **niso** v kodi. So shranjeni kot **GitHub Secrets**:
GitHub repo → Settings → Secrets and variables → Actions.

V workflow yaml-u jih dostopaš z `${{ secrets.GEMINI_API_KEY }}`.

---

## 6. Kako razmišljati pri programiranju

Ko pišeš kodo, se sprašuj:

### 6.1. Razdeli problem na dele

Velika naloga ("zgradi sledilnik denarja") = **strašna**.
Razdeljena na korake = **izvedljiva**:
1. Najprej shramba podatkov (kako shranim transakcijo?)
2. Potem prikaz seznama
3. Potem dodajanje
4. Potem urejanje
5. Potem grafi

Začni z **najmanjšim, najpreprostejšim delom, ki dela**, šele potem dodajaj.

### 6.2. DRY — Don't Repeat Yourself

Če pišeš isto kodo 3-krat, naredi **funkcijo** ali **komponento**.

Primer: namesto da v vsaki view-u sledilnika pišeš `<button style={{ padding: '0.5rem'... }}>`,
imamo `<Button>` komponento v `tracker/ui.jsx` — vse views jo uvozijo.

### 6.3. Imenovanja: kratka, jasna, povedna

```
slabo:    var x = data.filter(d => d.t > 0)
dobro:    const positiveTransactions = transactions.filter(t => t.amount > 0)
```

Tudi imena datotek: `Transactions.jsx`, ne `t.jsx` ali `transactions_v2_final.jsx`.

### 6.4. Beri obstoječo kodo, preden pišeš novo

Preden napišeš novo komponento, se vprašaj:
- *Mar že obstaja podobna?* (preglej `components/tracker/ui.jsx`, `components/ui/`)
- *Ali lahko obstoječo razširim?*

Tako se izogneš podvojeni kodi.

### 6.5. Single source of truth

Vsak podatek ima **eno mesto, kjer je shranjen**.
Sledilnik: vse stanje je v `localStorage` pod ključem `ei-tracker-v1`, dostopano preko `loadState()` v `store.js`.
Vsi viewi to stanje **berejo**, ne dvopisujejo lokalno.

### 6.6. Ko obstane, vprašaj "zakaj"

Če koda ne deluje:
1. **Preberi sporočilo o napaki natančno** — pogosto pove točno, kaj je narobe.
2. Vprašaj: *zakaj se to dogaja?*, ne *kako naj to skrijem?*.
3. Dodaj `console.log(...)` za izpis vrednosti, da vidiš, kaj se zgodi.

### 6.7. Ne piši kode "za bodočnost"

Mlade razvijalce mami pisati abstraktno kodo "za bodoče potrebe".
**To je past.** Piši najpreprostejšo kodo, ki reši **trenutni** problem. Refaktoriraš lahko, ko se potreba pojavi.

---

## 7. Dnevni pregled — posebnost

To je **edina avtomatizacija** na strani:

```
Vsak dan 06:30 UTC:
  1. GitHub Actions sproži workflow daily-briefing.yml
  2. Zažene scripts/generate-briefing.mjs
  3. Skripta pokliče NewsAPI (zadnje business novice)
  4. Pošlje seznam Gemini AI z navodili (slovenščina, analiza)
  5. Gemini vrne JSON
  6. Skripta validira URL-je in shrani v public/data/briefing.json
  7. Workflow naredi commit + push
  8. Workflow zgradi stran in jo deploya na GitHub Pages
  9. Komponenta MarketBriefing.jsx ob nalaganju strani fetcha briefing.json in prikaže
```

Če želiš spremeniti **frekvenco**: `cron: '30 6 * * *'` v `.github/workflows/daily-briefing.yml`.
Format: minute, ure, dan v mesecu, mesec, dan v tednu.

Če želiš spremeniti **prompt** za Gemini: `scripts/generate-briefing.mjs`, funkcija `buildUserPrompt`.

Lahko ga **ročno sprožiš**: GitHub repo → Actions → Daily Market Briefing → Run workflow.

---

## 8. Tipičen scenarij — dodajam nov članek

Pretok od ideje do objave:

```bash
# 1. Naredi novo datoteko
src/content/articles/moja-nova-analiza.md
```

```markdown
---
title: 'Moja nova analiza'
date: 2026-05-08
category: 'Trgi'
excerpt: 'Kratek povzetek za seznam.'
---

# Glavni naslov

Tu napišeš članek.
```

```bash
# 2. Lokalno preveri
npm run dev
# Odpri http://localhost:4321/engineering-investor/analize/moja-nova-analiza

# 3. Build preveri (naj ne bo napak)
npm run build

# 4. Shrani in objavi
git add src/content/articles/moja-nova-analiza.md
git commit -m "post: nova analiza o trgih"
git push
```

GitHub Actions bo zgradil in deployal v ~2 min.

---

## 9. Pogosta orodja, ki jih boš srečal

- **VS Code** — urejevalnik kode (priporočam za to delo).
- **Terminal** (PowerShell, Git Bash) — za `npm`, `git` ukaze.
- **Brskalnik DevTools** (F12) — za inšpekcijo HTML/CSS in vidno napak v konzoli.
- **GitHub** — kjer je koda shranjena, kjer se sproži deploy.
- **node_modules/** — mapa s knjižnicami; `npm install` jo ustvari iz `package.json`. Ne commitaj je.

---

## 10. Naprej — kaj se naučiti

Vrstni red, ki priporočam:

1. **HTML osnove** — kaj so tagi, atributi, semantika (`<header>`, `<article>`, `<section>`).
2. **CSS osnove** — selektorji, flexbox, grid, custom properties (`--color-accent`).
3. **JavaScript osnove** — spremenljivke, funkcije, objekti, array metode (`map`, `filter`, `reduce`).
4. **React osnove** — komponente, props, useState, useEffect.
5. **Astro osnove** — frontmatter, file-based routing, integracije.
6. **Git osnove** — commit, push, pull, branch.

Brez znanja vseh detajlov razumeš **strukturo**, in to je dovolj, da lahko spreminjaš stran.

---

## 11. Hitri referenčni listek

```bash
# Razvoj
npm run dev               # zaženi lokalno
npm run build             # zgradi produkcijsko
npm run preview           # pokaži produkcijsko lokalno

# Git
git status                # kaj je spremenjeno
git add <datoteka>        # pripravi za commit
git commit -m "opis"      # shrani v zgodovino
git push                  # naloži na GitHub
git pull --rebase         # prenesi tuje + postavi svoje na vrh

# Cron sprožilec ročno
# GitHub repo → Actions → Daily Market Briefing → Run workflow
```

---

Če se kje obstaneš, vprašaj. Bolje 5 minut vprašanja kot 5 ur ugibanja.

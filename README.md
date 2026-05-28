# Engineering Investor

Finančno-izobraževalna spletna stran za slovensko občinstvo.  
Razlaga trgov skozi aktualne dogodke — brez hypea, brez finančnih nasvetov.

Zgrajena z [Astro](https://astro.build).

**Ziva stran:** https://invest-eng.github.io/engineering-investor

---

## Kako zagnati lokalno

### Zahteve
- [Node.js](https://nodejs.org) verzija 18 ali novejša
- npm (pride skupaj z Node.js)

### Koraki

```bash
# 1. Pojdi v mapo projekta
cd engineering-investor

# 2. Namesti odvisnosti
npm install

# 3. Zaženi razvojni strežnik
npm run dev
```

Stran je dostopna na: http://localhost:4321

---

## Kako dodati nov članek

To je najpogostejša naloga — tukaj je postopek korak za korakom:

### 1. Ustvari novo datoteko

V mapi `src/content/analize/` ustvari novo `.md` datoteko.  
Ime datoteke postane del URL-ja (slug).

Primer: `src/content/analize/moj-novi-clanek.md` → URL: `/analize/moj-novi-clanek`

### 2. Dodaj frontmatter (metapodatke)

Na vrhu datoteke **obvezno** dodaj ta del (med `---`):

```markdown
---
title: "Naslov tvojega članka"
description: "Kratek opis za SEO in kartice (1-2 stavka)"
pubDate: 2025-04-01
category: "Makro"
readingTime: 7
featured: false
premium: false
---
```

**Veljavne vrednosti za `category`:**
- `Makro`
- `Geopolitika`
- `Trgi`
- `Bitcoin`
- `Delnice`

**`readingTime`**: ocena v minutah (groba ocena: 200 besed = 1 minuta)

### 3. Napiši vsebino

Po frontmatterju (po drugem `---`) piši vsebino v Markdown formatu.

Priporočena struktura:

```markdown
## Kaj se je zgodilo

Opis dogodka...

## Zakaj je to pomembno

Kontekst in razlaga...

## Vpliv na trge

### Delnice
...

### Obveznice
...

### Dolar (USD)
...

### Zlato / Bitcoin
...

## Kaj se lahko iz tega naučimo

Ključne ugotovitve...
```

### 4. Preveri rezultat

Zaženi `npm run dev` in obišči `/analize` — tvoj članek se bo samodejno pojavil.

---

## Struktura projekta

```
src/
├── components/
│   ├── layout/     → Navbar, Footer
│   ├── ui/         → Button, Badge, Disclaimer, ThemeToggle
│   ├── home/       → Hero, LatestArticles, HowItWorks, EmailSignup
│   └── articles/   → ArticleCard
├── content/
│   └── analize/    → ← SEM dodajaš nove članke (.md datoteke)
├── layouts/
│   ├── BaseLayout.astro     → Osnova za vse strani
│   └── ArticleLayout.astro  → Layout za posamezen članek
├── pages/
│   ├── index.astro      → Domača stran
│   ├── analize/
│   │   ├── index.astro  → Seznam analiz
│   │   └── [slug].astro → Dinamična stran za vsak članek
│   ├── premium.astro
│   ├── o-meni.astro
│   └── knjiznica.astro
├── styles/
│   └── global.css       → Vse CSS spremenljivke in globalni slogi
└── config.ts            → Ime strani, navigacija, kategorije
```

---

## Kako spremeniti ime strani ali navigacijo

Odpri `src/config.ts` in uredi vrednosti:

```ts
export const SITE = {
  name: 'Engineering Investor',     // Ime branda
  tagline: 'Razlaga trgov ...',     // Podnaslov
  twitterUrl: 'https://x.com/...', // Tvoj X profil
};

export const NAV_LINKS = [
  { label: 'Analize', href: '/analize' },
  // Dodaj ali odstrani navigacijske povezave
];
```

---

## Gradnja za produkcijo

```bash
npm run build
```

Rezultat je v mapi `dist/` — to so statične datoteke, ki jih naložiš na strežnik.

```bash
# Preglej build lokalno
npm run preview
```

---

## Objava na GitHub Pages

### Enkratna nastavitev

1. Naloži projekt na GitHub repozitorij
2. V GitHub repozitoriju pojdi na: **Settings → Pages**
3. Pri **Source** izberi: `GitHub Actions`
4. To je vse — workflow je že pripravljen v `.github/workflows/deploy.yml`

### Samodejno objavljanje

Ob vsakem `git push` na `main` vejo se stran samodejno zgradi in objavi.

```bash
git add .
git commit -m "Nova analiza: naslov članka"
git push origin main
```

### Prilagoditev domene

Dodaj svojo domeno v `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://tvojadomena.si',
});
```

---

## Ukazi

| Ukaz | Akcija |
|---|---|
| `npm install` | Namesti odvisnosti |
| `npm run dev` | Zaženi razvojni strežnik na `localhost:4321` |
| `npm run build` | Zgradi produkcijsko stran v `./dist/` |
| `npm run preview` | Preglej build lokalno |

---

## Zavrnitev odgovornosti

Vsebina na tej strani je namenjena izključno izobraževalnim namenom in ne predstavlja finančnega nasveta, priporočila za nakup ali prodajo finančnih instrumentov.

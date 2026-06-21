---
title: "Obrestne mere: kako centralne banke upravljajo ekonomijo"
description: "Od cene denarja do deflacijske spirale. Vodnik skozi mehanizme obrestnih mer, transmisijske kanale in praktične posledice za kreditojemalce, varčevalce in vlagatelje."
pubDate: 2026-06-21
category: "Makro"
readingTime: 18
featured: true
premium: false
showDescription: false
---

Obrestna mera je cena denarja v času. Ko si izposodiš denar danes, plačaš za privilegij, da ga imaš zdaj in ne čez leto. Centralna banka (CB) z nastavljanjem ključnih obrestnih mer določa, kako draga je ta cena za celotno ekonomijo.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:1.75rem 0;">
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1.1rem;">
    <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Repo rate (MRO)</div>
    <div style="font-size:0.85rem;color:var(--color-text);line-height:1.5;">Po tej stopnji centralna banka posoja denar poslovnim bankam (kratkorocno, cez noc).</div>
  </div>
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1.1rem;">
    <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Deposit facility rate</div>
    <div style="font-size:0.85rem;color:var(--color-text);line-height:1.5;">Po tej stopnji poslovne banke parkirajo presežno likvidnost pri centralni banki.</div>
  </div>
</div>

Razlika med njima ustvarja koridor, znotraj katerega se giblje medbančna obrestna mera (EURIBOR). Vse ostale obrestne mere v ekonomiji, od hipotekarnih kreditov do varčevalnih računov, so nanizane nad tem koridorjem glede na tveganje in ročnost.

## 2. Inflacija: kako vemo, da raste

### 2.1 Dve vrsti inflacije

**CPI (Consumer Price Index)** je tisto, kar mediji imenujejo "inflacija". Meri se kot sprememba cene standardizirane košarice dobrin in storitev, ki jo tipično kupi povprečno gospodinjstvo.

<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden;margin:1.5rem 0;">
  <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);">Sestava CPI košarice (Eurostat, EU metodologija)</div>
  <div style="display:grid;grid-template-columns:1fr auto;gap:0;">
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;color:var(--color-text);">Stanovanje, voda, energija</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~24 %</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;color:var(--color-text);">Hrana in brezalkoholne pijace</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~19 %</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;color:var(--color-text);">Transport</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~13 %</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;color:var(--color-text);">Rekreacija in kultura</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~9 %</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;color:var(--color-text);">Restavracije in hoteli</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~9 %</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;color:var(--color-text);">Oblacila in obutev</div>
    <div style="padding:0.6rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~7 %</div>
    <div style="padding:0.6rem 1rem;font-size:0.85rem;color:var(--color-text);">Ostalo (zdravje, izobrazevanje...)</div>
    <div style="padding:0.6rem 1rem;font-size:0.85rem;font-weight:600;color:var(--color-text);text-align:right;">~19 %</div>
  </div>
</div>

**PPI (Producer Price Index)** meri cene na ravni proizvodnje: surovine, energija, vmesne dobrine, industrijski inputi. PPI je napovedni kazalnik za CPI z zamudo 2-6 mesecev, ker višji stroški proizvodnje sčasoma preidejo na potrošnika. Ko PPI skoči, centralna banka pazi.

### 2.2 Core inflation (jedrna inflacija)

CPI brez hrane in energije. Zakaj? Ker so cene hrane in energije volatilne in odvisne od zunanjih šokov (suša, vojna, OPEC odločitve), ki jih monetarna politika ne more kontrolirati. Centralne banke bolj zaupajo core inflaciji kot dolgoročnemu signalu.

**ECB cilj: 2 % core inflacije na srednji rok.** Če jo vztrajno presegamo, je čas za dvige.

Spodaj je dejanski potek EU inflacije v zadnjih petih letih:

<img src="/engineering-investor/images/articles/obrestne-mere/eu-cpi-inflacija.png" alt="EU CPI inflacija 2021-2026, vrh 9,5 % julij 2022, junij 2026 pri 4,2 %" style="width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--color-border);margin:1rem 0;" />

Za primerjavo: US CPI inflacija, ki jo objavlja U.S. Bureau of Labor Statistics, je sledila podobni poti, a je padla hitreje. Maja 2026 je bila pri 2,9 %:

<img src="/engineering-investor/images/articles/obrestne-mere/us-cpi-inflacija.png" alt="US CPI inflacija 2021-2026, maj 2026 pri 2,9 %" style="width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--color-border);margin:1rem 0;" />

Velika Britanija je poseben primer: s CPI vrhom nad 11 % je imela med razvitimi ekonomijami eno najdlje vztrajajočo inflacijo, ki je bila junija 2026 še vedno pri 6,5 %:

<img src="/engineering-investor/images/articles/obrestne-mere/uk-cpi-inflacija.png" alt="UK CPI inflacija, vrh nad 11 %, junij 2026 pri 6,5 %" style="width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--color-border);margin:1rem 0;" />

### 2.3 Drugi kazalniki, ki jih CB gleda

Centralna banka ne gleda samo CPI. Analizira celoten mozaik ekonomskih podatkov:

<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden;margin:1.5rem 0;">
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;">
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">Kazalnik</div>
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">Kaj nam pove</div>
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">Inflacijski signal</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text);font-weight:500;">Rast BDP</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Ali se ekonomija pregreva?</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Visoka rast → pritisk navzgor</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text);font-weight:500;">Brezposelnost</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Ali je trg dela napet?</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Nizka brezposelnost → placni pritiski</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text);font-weight:500;">Izkoriščenost kapacitet</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Ali so tovarne že na meji?</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Nad 85 % → ozka grla → cenovni pritisk</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text);font-weight:500;">Rast plač</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Ali si delavci priborijo višje plače?</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Da → stroški za podjetja → višje cene</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text);font-weight:500;">Inflacijska pričakovanja</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Kaj trg ceni vnaprej</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Zasidrana pricakovanja = stabilnost</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text);font-weight:500;">Kreditna rast</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text-muted);">Koliko denarja "tece" v ekonomijo</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text-muted);">Hitra rast kreditov → inflacijski pritisk</div>
  </div>
</div>

**Phillips krivulja** (poenostavljena): nižja brezposelnost → višje plače → višja kupna moč → višje cene. Centralne banke jo berejo skupaj z vsemi ostalimi kazalniki.

<img src="/engineering-investor/images/articles/obrestne-mere/phillips-krivulja.jpeg" alt="Phillipsova krivulja: razmerje med inflacijo in brezposelnostjo" style="width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--color-border);margin:1rem 0;" />

## 3. Visoke obrestne mere: mehanizem in učinki

### 3.1 Zakaj CB dvigne obrestne mere

Ko inflacija vztrajno presega cilj (npr. ECB cilj 2 %) in kazalniki kažejo, da gre za strukturni pritisk in ne le zunanji šok, CB dvigne ključno obrestno mero. Namen je znižati povpraševanje v ekonomiji in s tem pritisniti navzdol na cene.

### 3.2 Transmisija: od CB do tvojega kredita

<div style="margin:1.75rem 0;border:1px solid var(--color-border);border-radius:8px;overflow:hidden;">
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);font-weight:600;border-bottom:1px solid var(--color-border);">CB dvigne repo rate (MRO)</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Bankam je dražje sposoditi denar od CB</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Donos na državne obveznice naraste (vezane na pricakovanja OM)</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Bankam se bolj splača kupiti obveznice (nizko tveganje, višji donos) kot kreditirati</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Banke dvignejo obrestne mere kreditov in depozitov</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);font-weight:500;border-top:1px solid var(--color-border);">Posojila so dražja, varčevanje bolj privlačno → manj povpraševanja → nižja inflacija</div>
</div>

### 3.3 Neposredni vpliv na posameznike

**Variabilna obrestna mera (EURIBOR + marža):** Ko EURIBOR naraste za 1 %, se mesečni obrok takoj poveča. Na kredit 150.000 EUR za 20 let je to 70-100 EUR višji mesečni obrok. Ta učinek je takojšen.

**Fiksna obrestna mera:** Kratkoročno zaščiteni, toda ob refinanciranju (izteku fiksnega obdobja) se soočijo z novo, višjo stopnjo. Vpliv je zamaknjen.

**Varčevalci:** Višje OM so za varčevalce dobrodošle. Depoziti, obveznice, denarni trgi začnejo prinašati realen donos. To je bilo posebej opazno v obdobju 2022-2024, ko so depoziti prvič po desetletjih zopet ponujali pozitiven realni donos.

### 3.4 Posredni vpliv: deflacijska spirala

To je mehanizem, ki ga CB najbolj opazuje, da ne gre predaleč:

<div style="margin:1.75rem 0;border:1px solid var(--color-border);border-radius:8px;overflow:hidden;">
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);font-weight:600;border-bottom:1px solid var(--color-border);">Krediti so dragi → manj potrošnje</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Podjetja imajo manj prihodkov</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Podjetja varčujejo → odpušcanja</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);border-top:1px solid var(--color-border);">Manj zaposlenih → še manj potrošnje</div>
  <div style="display:flex;justify-content:center;padding:6px 0;color:var(--color-text-muted);font-size:1rem;background:var(--color-bg);">↓</div>
  <div style="background:var(--color-surface);padding:0.8rem 1.1rem;font-size:0.85rem;color:var(--color-text);font-weight:500;border-top:1px solid var(--color-border);">Podjetja imajo še manj prihodkov → še vec odpušcanj...</div>
</div>

Historičen primer: Velika depresija 1929-1933, kjer je Fed ob napačnem času dvignil OM in poglobil krizo.

### 3.5 Vpliv na podjetja

**Investicije padejo:** Ko je kredit drag, se projekti z manjšo pričakovano donosnostjo ne izplačajo več. Podjetja preložijo ekspanzijo, nakupe opreme, odpiranje novih obratov.

**Refinanciranje dolga je dražje:** Podjetja z obsežnim dolgom pri variabilnih OM občutijo neposreden pritisk na dobiček.

**Vrednotenja padejo:** Višje OM pomenijo višjo diskontno stopnjo, kar matematično znižuje sedanjo vrednost prihodnjih denarnih tokov. To udari po vrednosti delnic, posebej rastnih (growth) podjetij.

## 4. Nizke obrestne mere: mehanizem in tveganja

Ko CB zniža OM, poceni denar spodbudi kreditiranje, potrošnjo in investicije. Toda nizke OM nosijo svoja tveganja.

### 4.1 Sistemska tveganja nizkih OM

**Asset price inflation (inflacija premoženja):** Poceni denar ne gre enakomerno v realno ekonomijo. Gre tja, kjer so pričakovani donosi: delnice, nepremičnine, zasebni kapital, kriptovalute. Primer: 2009-2021, OM blizu nič v EU in ZDA. S&P 500 +400 %, cene nepremičnin v večini zahodnih mest +80-150 %. Realna ekonomija je rasla, toda počasneje.

**Zombie podjetja:** Pri poceni denarju preživijo podjetja, ki bi v normalnih razmerah propadla. Odplačujejo samo obresti, nikoli glavnice. Ko OM narastejo, ta podjetja množično propadejo.

**Misalokacija kapitala:** Ko je denar poceni, se prag donosnosti za investicije zniža. Financirajo se projekti, ki pri normalnih OM ne bi dobili kapitala. Ko OM narastejo, se izkaže, da so ti projekti bili slabi (Hayek: malinvestment).

**Neenakost (Cantillon efekt):** Poceni denar ne pride do vseh enako. Tisti, ki imajo premoženje (delnice, nepremičnine), ga vidijo rasti. Tisti brez premoženja nimajo od nizkih OM nič.

**Izguba monetarnega orodja:** Ko so OM že pri 0 % (ali negativne, kot v Evropi 2014-2022), CB nima več prostora za znižanje ob naslednji krizi.

### 4.2 Likvidnostna past

Skrajni primer nizkih OM. OM so 0 %, CB tiska denar, ampak podjetja in gospodinjstva ne trošijo in ne investirajo, ker so pesimistični glede prihodnosti. Denar se kopiči, transmisijski mehanizem OM preneha delovati.

Japonska je bila v tej pasti od 90. let do nedavnega: ničelne OM, deflacijska pričakovanja, šibka potrošnja. Monetarna politika sama ne zadostuje, potrebna je fiskalna stimulacija.

## 5. Primerjava: previsoke vs. prenizke OM

<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden;margin:1.5rem 0;">
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;">
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">Dimenzija</div>
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#dc2626;">Previsoke OM</div>
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-accent);">Prenizke OM</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Inflacija</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Pada (cilj)</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Raste, asset bubble</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Rast BDP</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Upocasni, recesija</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Pregrevanje, nato krach</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Brezposelnost</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Raste</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Pada (kratkorocno)</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Posameznik</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Varčevalci dobijo donos, kreditojemalci trpijo</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Kreditojemalci dobijo poceni kredit, varčevalci trpijo</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Premoženje</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Delnice in nepremičnine padajo</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Asset bubble, neenakost raste</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;font-weight:500;color:var(--color-text);">CB orodje</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text-muted);">Prostor za znižanje obstaja</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text-muted);">Ni prostora za nujne reze</div>
  </div>
</div>

## 6. Transmisijski kanali: celotna slika

Sprememba OM CB se ne prenaša v ekonomijo po eni poti, ampak po petih vzporednih kanalih:

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:1.75rem 0;">
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1rem;">
    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Kanal 1</div>
    <div style="font-size:0.85rem;font-weight:600;color:var(--color-text);margin-bottom:4px;">Kreditni kanal</div>
    <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">CB rate → EURIBOR → bančni krediti → investicije in potrošnja</div>
  </div>
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1rem;">
    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Kanal 2</div>
    <div style="font-size:0.85rem;font-weight:600;color:var(--color-text);margin-bottom:4px;">Obvezniški kanal</div>
    <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">CB rate → pricakovanja → donosi vzdolž krivulje → stroški financiranja</div>
  </div>
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1rem;">
    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Kanal 3</div>
    <div style="font-size:0.85rem;font-weight:600;color:var(--color-text);margin-bottom:4px;">Devizni kanal</div>
    <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">Višje OM → kapital priteče → valuta se okrepi → dražji izvoz → manj BDP</div>
  </div>
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1rem;">
    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Kanal 4</div>
    <div style="font-size:0.85rem;font-weight:600;color:var(--color-text);margin-bottom:4px;">Premoženjski kanal</div>
    <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">Višje OM → padec delnic in nepremičnin → wealth effect → manj potrošnje</div>
  </div>
  <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1rem;">
    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-accent);margin-bottom:6px;">Kanal 5</div>
    <div style="font-size:0.85rem;font-weight:600;color:var(--color-text);margin-bottom:4px;">Kanal pricakovanj</div>
    <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">Morda najpomembnejši. Credibility CB zniža inflacijska pricakovanja brez dramaticnih sprememb OM.</div>
  </div>
</div>

## 7. ECB vs. Fed

<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden;margin:1.5rem 0;">
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;">
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);"></div>
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:700;color:var(--color-text);text-align:center;">ECB</div>
    <div style="padding:0.6rem 1rem;background:var(--color-bg);border-bottom:1px solid var(--color-border);font-size:0.85rem;font-weight:700;color:var(--color-text);text-align:center;">Fed</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Mandat</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Stabilnost cen (2 % inflacija)</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Dvojni mandat: stabilnost cen + maksimalna zaposlenost</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Pristop</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Konzervativen, fokus na inflacijo</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Pragmaticen, gleda tudi na brezposelnost</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Izziv</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Heterogena ekonomija (19+ držav)</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Enotna ekonomija</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;font-weight:500;color:var(--color-text);">Odziv 2022</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Zamudil začetek dvigov, nato agresivno dvigal</div>
    <div style="padding:0.55rem 1rem;border-bottom:1px solid var(--color-border);font-size:0.82rem;color:var(--color-text-muted);">Hitreje reagiral, bolj agresivni dvigi</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;font-weight:500;color:var(--color-text);">Orodja</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text-muted);">Repo rate, deposit rate, QE, TLTRO</div>
    <div style="padding:0.55rem 1rem;font-size:0.82rem;color:var(--color-text-muted);">Fed funds rate, QE/QT, forward guidance</div>
  </div>
</div>

Fed ima eksplicitno dolžnost gledati tudi na brezposelnost, kar pomeni, da hitreje zniža OM ob grožnji recesije. ECB je formalno bolj fokusirana samo na inflacijo, čeprav v praksi gleda celotno ekonomsko sliko.

## 8. Kaj to pomeni za tebe

**Kot kreditojemalec:**

Pri variabilni OM je tveganje neposredno. Vsak dvig EURIBOR-ja udari takoj po obroku. Pri fiksni OM si kratkoročno zaščiten, toda ob refinanciranju se sooči z realnostjo trga.

**Kot varčevalec in investitor:**

- Visoke OM: obveznice, denarni trgi, depoziti ponujajo realen donos. Delniška vrednotenja so pod pritiskom, posebej growth delnice.
- Nizke OM: delnice in nepremičnine rastejo. Gotovina in depoziti izgubljajo realno vrednost.

**Kot opazovalec makra:**

Inflacija je mozaik: CPI, PPI, core, plačna rast, izkoriščenost kapacitet, kreditna rast, pričakovanja. CB gleda vse. Razumevanje tega mozaika ti da prednost pri interpretaciji CB odločitev, preden jih trg v celoti preceni.

---

*Analiza združuje konceptualni okvir in konkretne mehanizme na osnovi ECB metodologije, akademske literature in empiričnih primerov iz zadnjih dveh desetletij. Ni naložbeno priporočilo.*

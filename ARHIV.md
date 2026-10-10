# Arhiv stare strani

Ta repozitorij je **stara, poskusna stran Engineering Investor**. Od 10. 10. 2026 se ne razvija več.
Prava stran je [engineering-investor.com](https://engineering-investor.com) (repozitorij `Engineering-Investor`),
tedenske analize pa pripravlja agent v zasebnem repozitoriju `engineering-investor-agent`.

Avtorjeva odločitev 10. 10. 2026: stare strani ne potrebuje več, shranjeni pa naj ostanejo deli spodaj,
da jih je mogoče prenesti v novo stran, ko pridejo na vrsto.

## Kaj je vredno prenesti

| Del | Kje je | Opomba |
|---|---|---|
| Davčni tracker | `src/components/tax/`, stran `src/pages/davek.astro` | vodnik za zasebnost: `VODNIK-ZASEBNOST 1.1.html` |
| Kalkulator INR vs IBKR | `src/components/calculators/InrIbkrCalculator.jsx`, stran `kalkulator.astro` | uradni cenik Ilirike, FIFO obračun |
| Kalkulator naložb | `src/components/calculators/InvestmentCalculator.jsx`, stran `kalkulator-nalozb.astro` | nova stran ima drugačen investicijski kalkulator |
| Kalkulator neto vrednosti | `src/components/calculators/NetWorthCalculator.jsx`, stran `kalkulator-neto-vrednosti.astro` | podatki ostanejo v brskalniku |
| Osnova za premium | `src/components/auth/` (prijava, `AccessGate`, `useAuth`), `src/lib/supabase.js`, strani `prijava.astro` in `premium.astro` | računi in zaklepanje vsebin prek Supabase |
| Baza za premium | `SUPABASE-SETUP.md` | ukazi SQL za tabeli `user_profiles` in `user_tracker_data` s pravili dostopa; iz njih se baza postavi znova |
| Sledilnik financ | `src/components/tracker/`, stran `sledilnik.astro` | zadnje delo (hitri vnos, izvoz v Excel, preizkusi) je v veji `arhiv-2026-10-10` |

Plačilnega ponudnika (Stripe ali podobno) v kodi ni: premium je bil zgrajen do računov in zaklepanja vsebin,
nakup sam še ne.

## Kaj je zastarelo

- Dnevni, tržni in premium pregled (`scripts/generate-briefing.mjs`, `scripts/premium/`, `scripts/update-market-data.mjs`):
  to delo opravlja novi agent.
- Domača stran, seznam analiz, koledar in skupne komponente: nova stran ima novejše različice.
- Stari članki v `src/content/analize/` ostanejo kot zapis, na novo stran se ne prenašajo.

## Roboti

Načrtovani zagoni so 10. 10. 2026 izklopljeni (`daily-briefing.yml`, `afternoon-briefing.yml`, `market-data.yml`).
Ročni zagon v zavihku Actions še deluje. Za ponoven vklop se v datoteko vrne razdelek `schedule`.

## Na kaj paziti

- Brezplačen projekt Supabase se po daljšem mirovanju ustavi. Podatki o računih in shranjeni podatki sledilnika
  živijo tam, ne v tem repozitoriju. Tu so samo navodila, kako bazo postaviti znova.
- Ključi niso v repozitoriju (`.env` je izpuščen, `.env.example` je samo predloga).

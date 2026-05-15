# Premium Briefing — navodila za zagon

Premium verzija dnevnega pregleda. Trije AI modeli (Gemini + Claude + ChatGPT) neodvisno izberejo novice in napišejo povzetke, sodnik (Claude) jih združi v finalno verzijo. Master povzetek se predvaja kot naravni slovenski glas (Google Cloud TTS).

Trenutno **ni aktiven** — manjkajo API ključi. Spodaj je vse, kar potrebuješ za zagon.

---

## Kaj že dela (s prosto verzijo)

- `scripts/generate-briefing.mjs` teče 1× dnevno (07:30 SLO), uporablja samo Gemini, brez avdia.
- Premium koda obstaja in se lahko ročno zažene, vendar bo **opozorila**, da manjkajo ključi, in delovala v okrnjenem načinu.

## Kaj se odklene s premium ključi

| Funkcija | Potreben ključ | Strošek (orientacijsko) |
|----------|----------------|-------------------------|
| Claude kot 2. model + sodnik | `ANTHROPIC_API_KEY` | ~$3/1M input, ~$15/1M output |
| OpenAI kot 3. model | `OPENAI_API_KEY` | ~$0,15/1M input pri `gpt-4o-mini` |
| Naravni slovenski TTS | `GOOGLE_TTS_API_KEY` | Brezplačno do 1M znakov/mesec |
| 3× dnevno cron | (samo uncommenta v workflow) | — |

**Skupna ocena** pri 3× dnevno × 3 modeli × ~6 novic: **$3–10/dan** (odvisno od izbire modelov).

---

## Korak za korakom — zagon

### 1. Pridobi API ključe

**Anthropic Claude:**
- Pojdi na https://console.anthropic.com/
- Settings → API Keys → Create Key
- Kopiraj ključ (začne se z `sk-ant-...`)

**OpenAI:**
- Pojdi na https://platform.openai.com/api-keys
- Create new secret key
- Kopiraj ključ (začne se z `sk-...`)

**Google Cloud TTS:**
- Pojdi na https://console.cloud.google.com/
- Ustvari projekt (ali izberi obstoječega)
- APIs & Services → Library → poišči "Cloud Text-to-Speech API" → Enable
- APIs & Services → Credentials → Create Credentials → API key
- Restrict key → izberi "Cloud Text-to-Speech API" (varnostni ukrep)
- Kopiraj ključ

### 2. Dodaj ključe v GitHub Secrets

- GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Dodaj **3 nove secrete**:
| Ime | Vrednost |
|-----|----------|
| `ANTHROPIC_API_KEY` | tvoj Anthropic ključ |
| `OPENAI_API_KEY` | tvoj OpenAI ključ |
| `GOOGLE_TTS_API_KEY` | tvoj Google TTS ključ |

`GEMINI_API_KEY` in `newsapi_org` že obstajata.

### 3. Vklopi 3× dnevni urnik

V datoteki `.github/workflows/premium-briefing.yml` poišči blok:

```yaml
on:
  # --- UNCOMMENT TO ACTIVATE 3x DAILY CRON ---
  # schedule:
  #   - cron: '30 5 * * *'
  ...
```

Odstrani znake `#` pred `schedule:` in posameznimi cron vrsticami. Končno bo:

```yaml
on:
  schedule:
    - cron: '30 5 * * *'    # morning 07:30 SLO
    - cron: '0 11 * * *'    # noon    13:00 SLO
    - cron: '30 17 * * *'   # evening 19:30 SLO
  workflow_dispatch:
    ...
```

### 4. Commit + push

```bash
git add .github/workflows/premium-briefing.yml
git commit -m "feat(premium): activate 3x daily briefing"
git push
```

GitHub bo zaznal cron in začel zaganjati workflow ob predvidenih časih.

### 5. Test pred prvim cron-om (priporočeno)

Preden čakaš jutranji cron, sproži ročno:

- GitHub repo → Actions → **Premium Briefing (3x daily)** → Run workflow
- Izberi edition: `morning`
- Klikni **Run workflow**
- Počakaj ~3-5 minut

Če gre vse v redu:
- `public/data/premium/morning.json` obstaja
- `public/data/premium/audio/YYYY-MM-DD-morning.mp3` obstaja
- V logih vidiš: "active providers: gemini, claude, openai" in "✓" pri vsakem članku

---

## Kako preverim, da premium dela

### V GitHub Actions logu

Iščeš te vrstice:
```
[premium] === MORNING BRIEFING (...) ===
[premium] active providers: gemini, claude, openai
[premium] 50 articles in pool
[premium] running selection (majority vote)...
[premium] 5 articles selected (min agreement: 2)
[premium] generating consensus summaries...
  ✓ ... [consensus]
  ✓ ... [consensus]
  ...
[premium] master summary: 1234 chars
[premium] audio: 187.3 KB -> ...
[premium] === DONE ===
```

### V repozitoriju

Po uspešnem zagonu se commit `chore(premium): update morning briefing` pojavi v zgodovini.

---

## Strošek nadzor

Vsi ponudniki imajo dashboard:
- Anthropic: https://console.anthropic.com/usage
- OpenAI: https://platform.openai.com/usage
- Google Cloud: https://console.cloud.google.com/billing

**Nastavi opozorila** za vse 3 (npr. $30/mesec) — ne potrebuješ presenečenj.

Če stroški rastejo:
- V `scripts/lib/ai-providers.mjs` zamenjaj modele na cenejše (`gemini-2.5-flash-lite`, `claude-haiku`, `gpt-4o-mini`).
- V `.github/workflows/premium-briefing.yml` odstrani enega od cron-ov (npr. obdrži samo jutro + večer).

---

## Kako delegirati, če eden od ključev "umre"

Premium koda **graceful degrades**:
- Če Claude pade → ostane Gemini + OpenAI (2-of-2 consensus, namesto 2-of-3).
- Če OpenAI pade → ostane Gemini + Claude.
- Če padeta 2 → ostane samo Gemini (single-model, brez consensusa, ampak še vedno deluje).
- Če TTS pade → preskoči avdio, JSON še vedno objavljen.

Skript ne pade, dokler je vsaj **1 AI provider** in **NewsAPI** na voljo.

---

## Pomembne lokacije v kodi

| Datoteka | Namen |
|----------|-------|
| `scripts/lib/news-fetcher.mjs` | NewsAPI + stubsi za Reuters/Bloomberg |
| `scripts/lib/ai-providers.mjs` | Gemini (active), Claude/OpenAI (premium) |
| `scripts/lib/consensus.mjs` | 2/3 večinska logika + judge merge |
| `scripts/lib/prompts.mjs` | Vsi system & user promptji |
| `scripts/lib/tts.mjs` | Google Cloud TTS slovenski |
| `scripts/generate-briefing.mjs` | Prosta verzija, 1× dnevno |
| `scripts/premium/generate-premium-briefing.mjs` | Premium, 3× dnevno |
| `.github/workflows/daily-briefing.yml` | Prosta verzija cron |
| `.github/workflows/premium-briefing.yml` | Premium cron (zaenkrat disabled) |

---

## Bodoče nadgradnje

V `scripts/lib/news-fetcher.mjs` so že stubsi za:
- Reuters (`REUTERS_API_KEY`)
- Bloomberg (`BLOOMBERG_API_KEY`)

Ko boš imel ključe, samo doimplementiraš `fetchReuters()` in `fetchBloomberg()` in jih dodaš v `fetchAll()`.

Podobno v `scripts/lib/ai-providers.mjs` lahko dodaš:
- Mistral
- Cohere
- xAI Grok

Vsak nov ponudnik = nova `callXxx()` funkcija + dodaj v `availableProviders()`.

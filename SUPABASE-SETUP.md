# Supabase setup — uporabniški računi

Ta dokument je popoln vodič, kako aktivirati prijavljanje na strani.
Trenutno koda **že obstaja**, manjka samo dostop do Supabase projekta (~15 min dela).

## Kaj dobiš po setupu

- Uporabniki se prijavijo z **emailom in geslom** (Prijava gumb v glavi).
- Sledilnik osebnih financ deluje **sinhronizirano** med računalnikom in telefonom.
- Dostop do sledilnika je **gated** za prijavljene + premium uporabnike.
- Tvoji podatki **ostanejo zasebni** (Row-Level Security: vsak vidi le svoje).

---

## 1. korak — Ustvari Supabase projekt (~5 min)

1. Pojdi na https://supabase.com/dashboard
2. Klikni **Sign in with GitHub** (najlažje), ali ustvari email-račun.
3. Klikni **New project**.
4. Izberi:
   - Organization: tvoja
   - Name: `engineering-investor`
   - Database password: izberi močno geslo, **shrani v password manager** (nikoli ga več ne boš rabil za to funkcionalnost, a Supabase ga zahteva)
   - Region: **Frankfurt (eu-central-1)** — najbližje slovenskim uporabnikom
   - Plan: **Free** (50.000 uporabnikov mesečno brez stroška)
5. Klikni **Create new project** in počakaj 1-2 min.

## 2. korak — Skopiraj ključa

Ko se projekt ustvari:

1. V levem meniju klikni **Project Settings** (⚙ zobnik spodaj).
2. Klikni **API** v podmeniju.
3. Najdi:
   - **Project URL** — npr. `https://abcdefgh.supabase.co`
   - **Project API keys → anon / public** — dolg `eyJhbGc...` niz

Oba sta **javna** (varno v kodi). NE kopiraj `service_role` ključa — ta je tajen.

## 3. korak — Lokalna .env datoteka (~1 min)

V korenu projekta ustvari datoteko `.env` (kopiraj iz `.env.example`):

```
PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

⚠️ `.env` je v `.gitignore` — nikoli ne bo pushana. Edina varnostna preventiva.

Po ustvaritvi `.env` ustavi `npm run dev` (Ctrl+C) in znova zaženi, da Vite naloži nove env vrednosti.

## 4. korak — Ustvari tabele in pravila (~3 min)

V Supabase dashboard:

1. Levi meni → **SQL Editor**.
2. Klikni **New query**.
3. Prilepi vsebino spodaj in klikni **Run** (ali Ctrl+Enter).

```sql
-- ============================================================
-- ENGINEERING INVESTOR — Supabase schema
-- ============================================================

-- 1. Profile (1:1 z auth.users, hrani premium status)
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  full_name text,
  created_at timestamptz not null default now()
);

-- 2. Tracker data (1:1 z auth.users, hrani JSON sledilnika)
create table if not exists public.user_tracker_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Auto-create profile row ob registraciji
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Row-Level Security — vsak uporabnik vidi samo svoje
alter table public.user_profiles enable row level security;
alter table public.user_tracker_data enable row level security;

drop policy if exists "read own profile" on public.user_profiles;
create policy "read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "update own profile" on public.user_profiles;
create policy "update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "read own tracker" on public.user_tracker_data;
create policy "read own tracker"
  on public.user_tracker_data for select
  using (auth.uid() = user_id);

drop policy if exists "insert own tracker" on public.user_tracker_data;
create policy "insert own tracker"
  on public.user_tracker_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own tracker" on public.user_tracker_data;
create policy "update own tracker"
  on public.user_tracker_data for update
  using (auth.uid() = user_id);
```

Po **Run** moraš dobiti `Success. No rows returned.`

## 5. korak — Konfiguriraj email (privzeto deluje, za prod prilagodi)

V Supabase dashboard:

1. **Authentication → Providers → Email**: Enabled ✓ (privzeto)
2. **Authentication → Email Templates**: po želji prilagodi v slovenščino (nujno ni)
3. **Authentication → URL Configuration**:
   - Site URL: `https://invest-eng.github.io/engineering-investor`
   - Redirect URLs: dodaj `https://invest-eng.github.io/engineering-investor/**` in `http://localhost:4321/engineering-investor/**`

## 6. korak — Lokalni test (~3 min)

```bash
npm run dev
```

Na strani klikni **Prijava** → **Ustvari račun** → vpiši email + geslo (vsaj 8 znakov).

- Supabase ti pošlje **potrditveni email**.
- Klikni link v emailu → te preusmeri na localhost (ali invest-eng.github.io na produkciji).
- Po potrditvi se lahko prijaviš.

⚠️ **Privzeto je sledilnik premium-only**. Po prijavi boš videl: *"Premium funkcija — tvoj račun še nima premium statusa."*

Da ti omogočiš dostop:

1. Supabase dashboard → **Table Editor** → `user_profiles`.
2. Najdi svojo vrstico, klikni `is_premium` celico.
3. Spremeni iz `false` v `true` → **Save**.
4. Osveži stran (Ctrl+F5) — sledilnik je odklenjen.

## 7. korak — Produkcija (GitHub Pages)

Da prijava deluje tudi na **invest-eng.github.io**, dodaj env vars v GitHub:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. Klikni **New repository secret** in dodaj:
   - `PUBLIC_SUPABASE_URL` = (tvoja vrednost)
   - `PUBLIC_SUPABASE_ANON_KEY` = (tvoja vrednost)
3. Commit + push (workflowi že berejo te secrete).

V max 2 minutah GitHub Actions zgradi stran z env vars vključenimi v JS bundle.

Preveri produkcijo: https://invest-eng.github.io/engineering-investor/prijava

---

## Pogosti problemi

**"Prijava trenutno ni na voljo"**
→ `.env` ni nastavljen ali env vars manjkajo. Preveri `.env` (lokalno) ali GitHub Secrets (produkcija).

**"Email already in use"**
→ Račun obstaja ampak email ni potrjen. V Supabase dashboard → Authentication → Users → izbriši vrstico, registriraj znova.

**"Email not confirmed"**
→ Klikni link v potrditvenem mailu, ali ga ponovno pošlji.

**Sledilnik kaže "Sinhronizacija neuspešna"**
→ Verjetno SQL skripta ni bila zagnana. Pojdi v SQL Editor, znova zaženi.

**Pozabljeno geslo**
→ Klikni "Pozabljeno geslo?" v prijavnem oknu, vpiši email. Supabase pošlje povezavo za ponastavitev.

---

## Brisanje uporabnika

Kot skrbnik lahko izbrišeš katerikoli račun:

1. Supabase → **Authentication → Users**.
2. Trije pike ob uporabniku → **Delete user**.
3. Cascade izbriše tudi `user_profiles` in `user_tracker_data` (FK z `on delete cascade`).

---

## Pomembni varnostni vidiki

- **Anon key je javen** — gre v JS bundle, vsi ga vidijo. To je **pravilno**.
- **Varnost je v RLS politikah** (4. korak). Brez teh bi vsak uporabnik lahko bral tuje podatke.
- **Service role ključ je TAJEN** — nikoli ga ne dodaj v kodo ali GitHub.
- **Trenutna shema je `public.*`** — če rabiš več privatnosti, lahko spremeniš v `private.*` schemo. Za naš primer ni potrebno.

---

## Cena

Free tier je dovolj za:
- ~50.000 mesečnih aktivnih uporabnikov
- 500 MB baze (vsak uporabnik ~1-2 KB → 250.000+ uporabnikov)
- 5 GB pasovne širine

Realno: **brezplačno za prve mesece/leta**. Plačljiv Pro ($25/mesec) je smiselen šele pri masivnem uspehu.

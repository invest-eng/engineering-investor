# Kako objavim nov članek — moj postopek

Ta dokument povzema **točno tisto**, kar sem naredil prvič, vključno z napakami in rešitvami.

---

## Hitri pregled (kasneje, ko obvladaš)

```
1. VS Code → odpri mapo projekta
2. src/content/analize/ → desni klik → New File → "ime-clanka.md"
3. Prilepi frontmatter + napiši vsebino → Ctrl+S
4. Terminal 1: npm run dev → preveri lokalno
5. Terminal 2: git add <pot> → git commit -m "..." → git push
6. Počakaj 2 min → osveži objavljeno stran
```

---

## Podroben postopek (prvič)

### 1. Odpri projekt v VS Code

- Zaženi VS Code
- **File → Open Folder** (ali Ctrl+K, Ctrl+O)
- Izberi: `C:\Users\Jaž\OneDrive\Namizje\PROJEKTI\INVESTING SPLETNA STRAN\engineering-investor`
- Klikni **Select Folder**

### 2. Ustvari nov članek

V levem **Explorer** stolpcu:
- Razširi `src` → `content` → `analize`
- **Desni klik** na mapo `analize` → **New File...**
- Vpiši ime z malimi črkami in vezaji: `ime-mojega-clanka.md`
- Pritisni Enter

> **Pravilo za ime datoteke:** brez šumnikov (č, š, ž), brez presledkov, brez velikih črk. Samo `a-z`, številke in `-`. Ime datoteke = URL članka.

### 3. Prilepi predlogo in napiši vsebino

V prazno datoteko prilepi:

```markdown
---
title: "Naslov mojega članka"
description: "1-2 stavka povzetka. Pojavi se v seznamu in pri share."
pubDate: 2026-05-08
category: "Makro"
readingTime: 5
featured: false
premium: false
---

## Prvi podnaslov

Tukaj besedilo prvega odseka.

## Drugi podnaslov

Še besedilo. **Krepko**, *poševno*, [povezava](https://example.com).

- Alineja
- Druga alineja
```

**Polja, ki jih lahko menjaš:**

| Polje | Možne vrednosti |
|-------|----------------|
| `category` | `"Makro"`, `"Geopolitika"`, `"Trgi"`, `"Bitcoin"`, `"Delnice"` |
| `readingTime` | število minut (npr. `3`, `5`, `10`) |
| `featured` | `true` (na naslovni strani) ali `false` |
| `premium` | `true` (samo za plačnike) ali `false` |
| `pubDate` | datum v formatu `YYYY-MM-DD` |

Shrani: **Ctrl+S**.

### 4. Zaženi lokalni strežnik

V VS Code odpri terminal: **Terminal → New Terminal** (ali Ctrl+Shift+ö).

Vpiši:

```
npm run dev
```

Po nekaj sekundah piše:
```
Local: http://localhost:4321/engineering-investor
```

Številka porta je lahko **4322, 4323**... če je 4321 zaseden — to je v redu.

### 5. Preveri članek v brskalniku

Odpri (zamenjaj port in ime):
```
http://localhost:4323/engineering-investor/analize/ime-mojega-clanka
```

Ali pojdi na seznam:
```
http://localhost:4323/engineering-investor/analize
```

Spremembe v `.md` datoteki se prikažejo **takoj** ob shranjevanju (Ctrl+S).

### 6. Objavi na GitHub (live stran)

Trenutno članek vidiš samo ti. Da ga vidijo vsi, moraš narediti `git push`.

**Odpri DRUGI terminal** (prvi naj še teče npm run dev):
- V terminal plošči klikni ikono **+** zgoraj desno

V drugem terminalu vpiši (en ukaz naenkrat):

```
git status
```

Vidiš seznam neobjavljenih sprememb. Tvoj članek je pod `Untracked files`.

```
git add src/content/analize/ime-mojega-clanka.md
```

(zamenjaj ime!)

```
git commit -m "post: kratek opis članka"
```

```
git push
```

### 7. Počakaj na deploy

- Pojdi na: https://github.com/invest-eng/engineering-investor/actions
- Vidiš zadnji workflow z oranžnim krogcem (teče) ali zelenim ✓ (končano)
- Ko je ✓, osveži https://invest-eng.github.io/engineering-investor/analize/
- Tvoj članek je objavljen! 🎉

Tipično traja 1-2 minuti.

---

## Napake, ki sem jih srečal — in kako sem jih rešil

### Napaka 1 — `'nmp' is not recognized`

**Simptom:**
```
'nmp' is not recognized as an internal or external command
```

**Vzrok:** Tipkarska napaka. Ukaz je `npm`, ne `nmp` (n-p-m, Node Package Manager).

**Rešitev:** Vpiši pravilno:
```
npm run dev
```

---

### Napaka 2 — PowerShell blokira npm

**Simptom:**
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because
running scripts is disabled on this system.
```

**Vzrok:** Windows privzeto blokira PowerShell skripte iz varnostnih razlogov.

**Rešitev:** V PowerShell terminalu enkrat zaženi:
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Ko vpraša `[Y] Yes [A] Yes to All ...`, vpiši **Y** in Enter.

To je **enkratna nastavitev** — naslednjič ne potrebuješ.

**Alternativa:** V VS Code zamenjaj terminal v **Git Bash** (puščica navzdol poleg + ikone → Git Bash). Tam ni te omejitve.

---

### Napaka 3 — port 4321 zaseden

**Simptom:**
```
[vite] Port 4321 is in use, trying another one...
[vite] Port 4322 is in use, trying another one...
Local: http://localhost:4323/engineering-investor
```

**Vzrok:** Druga (verjetno prejšnja) instanca dev strežnika še teče.

**Rešitev:** Astro samodejno preskoči na naslednji port. **Uporabi tisti port, ki ti ga izpiše** (v primeru zgoraj `4323`, ne 4321).

Če te to moti, lahko v drugem terminalu ubiješ vse Node procese:
```
taskkill /F /IM node.exe
```

Potem ponovno `npm run dev`.

---

### Napaka 4 — članek viden lokalno, a ne na live strani

**Simptom:** Na `localhost:4323` članek vidim, na `invest-eng.github.io` pa ne.

**Vzrok:** Lokalno = samo na mojem računalniku. Live = potrebuje `git push`.

**Rešitev:** Naredi `git add` + `git commit` + `git push` (korak 6 zgoraj).

---

### Napaka 5 — `git push` zavrnjen

**Simptom:**
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs to '...'
hint: Updates were rejected because the remote contains work that you do not have locally.
```

**Vzrok:** Med tem ko sem delal lokalno, je nekdo drug (običajno **daily briefing bot** ob 06:30 UTC) pushal nove commite na GitHub. Moj `git push` bi prepisal njihove.

**Rešitev:**
```
git pull --rebase
git push
```

`git pull --rebase` najprej **potegne tuje commite** k meni in **moje postavi na vrh**. Potem push gre čisto.

> **Zlato pravilo:** Vedno, ko `git push` reče "rejected", najprej zaženi `git pull --rebase`.

---

## Kratek seznam: kaj NE narediti

- ❌ `git add .` — doda **vse** datoteke (vključno z VODNIK.html, .claude/, ipd.). Raje navedi pot do članka.
- ❌ `git push --force` na main — prepiše tuje commite. Ne potrebuješ tega.
- ❌ Brisanje `node_modules/` mape — če slučajno, jo dobiš nazaj z `npm install`.
- ❌ Spreminjanje datuma `pubDate` v prihodnost — članek se ne prikaže do tega datuma.
- ❌ Šumniki ali presledki v imenu datoteke — pokvari URL.

---

## Cheatsheet — vse ukaze na enem mestu

```bash
# Lokalni razvoj
npm run dev                                          # zaženi strežnik

# Git tok
git status                                           # kaj je spremenjeno
git add src/content/analize/IME.md                   # pripravi članek
git commit -m "post: opis"                           # shrani v zgodovino
git push                                             # objavi

# Če push zavrnjen
git pull --rebase                                    # potegni tuje, postavi svoje na vrh
git push                                             # ponovno

# Enkratna nastavitev (samo če PowerShell ne dovoli)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Kaj se naučim iz te izkušnje

1. **VS Code + dva terminala** = osnovno orodje. Prvi za `npm run dev`, drugi za `git`.
2. **Lokalno ≠ objavljeno.** `localhost:4323` je samo zame. Live je `invest-eng.github.io` po push.
3. **Vsako spremembo testiram lokalno** prej, kot jo pusham. Če lokalno ne deluje, na live tudi ne bo.
4. **Git push reject je normalen** — `git pull --rebase` ga reši.
5. **Frontmatter mora biti pravilen** — če manjka polje (npr. `readingTime`), build pade.

Naslednjič bo veliko hitreje. ☕

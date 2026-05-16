/**
 * Shared prompt templates for both free and premium briefings.
 *
 * Edition-aware prompts: morning / noon / evening have different framing.
 */

export const SYSTEM_PROMPT = `Si finančni analitik za slovensko občinstvo. Pišeš jasno, brez hypea, brez finančnih nasvetov. Vedno odgovoriš v slovenščini. Nikoli si ne izmišljaš podatkov, URL-jev ali datumov.`;

const EDITION_FRAMING = {
  morning:
    'Jutranja izdaja: poudari pregled nočnih dogodkov (ZDA zaprtje, Azija) in kaj pričakovati v Evropi danes.',
  noon:
    'Opoldanska izdaja: evropski trgi v polnem teku, pričakovanja za odprtje ZDA, novi makro objavki.',
  evening:
    'Večerna izdaja: bilanca dneva — kaj se je zgodilo na ZDA, kako so se zaprli evropski trgi, kaj nositi v jutri.',
  daily:
    'Dnevni pregled: en zaobjem dneva, brez specifične časovne perspektive.',
};

/**
 * Prompt for picking the most important articles.
 * Used by selectors in premium consensus flow (and by old single-model flow).
 */
export function buildSelectorPrompt({ articles, edition = 'daily', minCount = 4, maxCount = 7 }) {
  const today = new Date().toISOString().slice(0, 10);
  const list = articles
    .map(
      (a, i) =>
        `${i + 1}. ${a.title}\n   Vir: ${a.source}\n   URL: ${a.url}\n   Objavljen: ${a.publishedAt}\n   Opis: ${a.description}`
    )
    .join('\n\n');

  const framing = EDITION_FRAMING[edition] || EDITION_FRAMING.daily;

  return `Datum: ${today}.
${framing}

Spodaj je seznam najnovejših poslovnih novic, ki jih je vrnil NewsAPI:

${list}

NALOGA: Izberi ${minCount}–${maxCount} novic, ki POKRIVAJO VSA glavna področja dneva s čim manj prekrivanjem. Razmišljaj v tematskih sklopih (geopolitika, energenti, makro/centralne banke, tehnologija/AI, finančne institucije, krypto, slovenija/EU če relevantno) in iz vsakega sklopa izberi NAJBOLJ POMEMBNO novico. Cilj je MINIMUM novic, ki pokrijejo MAKSIMUM dogajanja. Zavrni manjše šume in lokalne dogodke brez sistemskega vpliva.

Vrni IZKLJUČNO veljaven JSON v obliki:
{
  "izbrane_stevilke": [3, 7, 12, 18, 22],
  "obrazlozitev": "1-2 stavka, zakaj te novice in zakaj ne druge."
}

Številke se nanašajo na zaporedno mesto v seznamu zgoraj.`;
}

/**
 * Prompt for writing a detailed summary of a single article.
 */
export function buildSummaryPrompt({ article, edition = 'daily' }) {
  const framing = EDITION_FRAMING[edition] || EDITION_FRAMING.daily;
  return `${framing}

NOVICA:
Naslov: ${article.title}
Vir: ${article.source}
URL: ${article.url}
Objavljeno: ${article.publishedAt}
Opis: ${article.description}

NALOGA: Napiši TEMELJIT slovenski povzetek in poglobljeno analizo te novice. URL in vir ohrani točno tako, kot sta.

KAKOVOSTNI STANDARD:
- Vključi vse KONKRETNE PODATKE iz opisa: številke, odstotke, datume, imena, podjetja, valute, indekse.
- Ne piši splošnih izjav. Vedno specifično (npr. "Brent +3,4 % na 87,20 USD", ne "nafta raste").
- Razloži OZADJE, MEHANIZEM vpliva in POSLEDICE za vse relevantne razrede sredstev.
- NE izmišljaj podatkov, ki jih ni v opisu — bolje strožji opis kot izmišljeni številke.

Vrni IZKLJUČNO veljaven JSON v obliki:
{
  "naslov": "jasen slovenski naslov, 8–14 besed",
  "sektor": "eden od: Tehnologija & AI | Energetika | Finance | Potrošniki | Makro & Centralne banke | Geopolitika",
  "smer": "eden od: pozitivno | negativno | mešano",
  "intenziteta": 2,
  "povzetek": "5–7 stavkov: kdo, kdaj, kaj, koliko, kje, zakaj. Vsa konkretna dejstva iz vira.",
  "analiza": "10–14 stavkov: (1) ozadje in kontekst, (2) zakaj zdaj — povezava s trendi, (3) mehanizem vpliva na trge, (4) konkretne posledice za delnice/obveznice/valute/surovine/krypto, (5) zgodovinski primerjalni primer, (6) kaj opazovati naprej, (7) sklep za slovenskega dolgoročnega vlagatelja. Brez finančnih nasvetov.",
  "vpliv": ["konkretna posledica 1 (s številko ali smerjo)", "konkretna posledica 2", "konkretna posledica 3", "konkretna posledica 4"],
  "kljucna_dejstva": ["dejstvo 1 (število, datum, ime)", "dejstvo 2", "dejstvo 3", "dejstvo 4"],
  "vir": "${article.source}",
  "vir_url": "${article.url}"
}

Intenziteta: 1 = manjša, 2 = pomembna, 3 = ključna novica dneva. "kljucna_dejstva" so preverljiva dejstva — uporabljal jih bo sodnik za primerjanje med modeli.`;
}

/**
 * Old-style prompt for single-model flow (free version):
 * one giant call that does selection + summaries + master.
 * Kept for backward compatibility with original free briefing.
 */
export function buildLegacyAllInOnePrompt(articles, { edition = 'daily', count = 6 } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const framing = EDITION_FRAMING[edition] || EDITION_FRAMING.daily;
  const list = articles
    .map(
      (a, i) =>
        `${i + 1}. ${a.title}\n   Vir: ${a.source}\n   URL: ${a.url}\n   Objavljen: ${a.publishedAt}\n   Opis: ${a.description}`
    )
    .join('\n\n');

  return `Datum: ${today}.
${framing}

Spodaj je seznam najnovejših poslovnih novic:

${list}

NALOGA:
- Izberi ${count} najpomembnejših novic z vidika finančnih trgov.
- Razmišljaj tematsko (geopolitika, energenti, makro, tehnologija, finance) in pokrij vsa glavna področja s čim manj prekrivanjem.
- Za vsako napiši TEMELJIT slovenski povzetek in poglobljeno analizo. URL, vir in datum objave VEDNO ohrani točno tako kot je v seznamu.
- Pred novicami napiši 6–9 stavčni "Pregled dneva", ki temeljito povzame izbrane novice in skupni vpliv na trge.

KAKOVOSTNI STANDARD ZA POVZETKE IN ANALIZE:
- Vključi vse relevantne KONKRETNE PODATKE: številke, odstotke, datume, imena oseb, podjetij, držav, valutnih parov, cen surovin, indeksov.
- Ne piši splošnih izjav tipa "trgi so reagirali" — vedno specifično: "Brent je v ponedeljek zrastel za 3,4 % na 87,20 dolarja".
- Razloži OZADJE in KONTEKST: kaj je predhodilo, zakaj je to pomembno zdaj, kako se vpenja v dolgoročne trende.
- Razloži MEHANIZEM vpliva: zakaj geopolitični dogodek vpliva na surovine, zakaj makro objava premika valute, ipd.
- Vključi POSLEDICE za vse relevantne razrede sredstev (delnice, obveznice, valute, surovine, krypto) — ne le enega.
- Konec analize: kaj to specifično pomeni za slovenskega dolgoročnega vlagatelja. Brez finančnih nasvetov, le pojasnilo.
- NE izmišljaj podatkov. Če nekaj ni v originalnem opisu, ne dodajaj številk iz spomina. Bolje strožji opis kot izmišljeni podatki.

Vrni IZKLJUČNO veljaven JSON, brez markdown ograj:
{
  "datum": "${today}",
  "izdaja": "${edition}",
  "povzetek": "6–9 stavkov temeljitega kontekstnega povzetka dneva v slovenščini, ki vključuje konkretne podatke (številke, imena, datume) iz izbranih novic.",
  "novice": [
    {
      "naslov": "slovenski naslov, 8–14 besed",
      "sektor": "eden od: Tehnologija & AI | Energetika | Finance | Potrošniki | Makro & Centralne banke | Geopolitika",
      "smer": "eden od: pozitivno | negativno | mešano",
      "intenziteta": 2,
      "povzetek": "5–7 stavkov: kdo, kdaj, kaj, koliko, kje, zakaj. Vključi vsa konkretna dejstva iz vira (številke, datumi, imena). Ne le 'kaj se je zgodilo', ampak vse pomembne podrobnosti.",
      "analiza": "10–14 stavkov: (1) ozadje in kontekst dogodka, (2) zakaj je relevantno zdaj — povezava z aktualnimi trendi, (3) mehanizem vpliva na finančne trge, (4) konkretne posledice za delnice / obveznice / valute / surovine / krypto, (5) zgodovinski primerjalni primer, če smiselno, (6) kaj velja opazovati naprej, (7) sklepna misel za slovenskega dolgoročnega vlagatelja brez finančnih nasvetov.",
      "vpliv": ["konkretna posledica 1 (s številko ali smerjo)", "konkretna posledica 2", "konkretna posledica 3", "konkretna posledica 4"],
      "vir": "ime vira iz seznama — NESPREMENJENO",
      "vir_url": "polni URL iz seznama — NESPREMENJEN"
    }
  ]
}

Intenziteta: 1 = manjša, 2 = pomembna, 3 = ključna novica dneva. Vrni SAMO JSON.`;
}

/**
 * Judge prompt: takes summaries from N models and produces a final
 * consensus summary that includes only facts mentioned by at least 2 models.
 */
export function buildJudgePrompt({ article, candidates }) {
  const cands = candidates
    .map((c, i) => `--- MODEL ${i + 1} (${c.model}) ---\n${JSON.stringify(c.summary, null, 2)}`)
    .join('\n\n');

  return `Si sodnik, ki združuje povzetke 3 različnih AI modelov o isti novici.

NOVICA:
Naslov: ${article.title}
URL: ${article.url}

KANDIDATI:
${cands}

PRAVILA:
- V finalni povzetek vključi SAMO dejstva (številke, imena, datume), ki jih omenjata vsaj 2 od 3 modelov.
- Če se modeli ne strinjajo, omeni le ime/dogodek, brez spornih številk.
- Slog: jasen, brez hypea, brez nasvetov. Slovenščina.
- Ohrani strukturo: naslov, sektor, smer, intenziteta, povzetek, analiza, vpliv, vir, vir_url.
- vir in vir_url morata biti enaka kot v originalni novici (zgoraj).

Vrni IZKLJUČNO JSON v isti obliki, kot ga imajo kandidati, brez "kljucna_dejstva" polja.`;
}

/**
 * Master prompt: combines all selected/judged articles into a single
 * cohesive "pregled dneva" suitable for TTS.
 */
export function buildMasterPrompt({ articles, edition = 'daily' }) {
  const today = new Date().toISOString().slice(0, 10);
  const framing = EDITION_FRAMING[edition] || EDITION_FRAMING.daily;
  const list = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.sektor || '?'}] ${a.naslov}\n   ${a.povzetek}`
    )
    .join('\n\n');

  return `Datum: ${today}.
${framing}

Spodaj so finalni povzetki izbranih novic dneva:

${list}

NALOGA: Napiši MASTER POVZETEK dneva — povezan, naraven slovenski tekst dolg 8–12 stavkov, ki:
- Začne s strnjenim pregledom glavnega tržnega vzorca dneva (npr. "Trgi so danes ...").
- Poveže novice v tematskem zaporedju (geopolitika → makro → trgi → tehnologija → krypto).
- Vključi vsaj 3-5 konkretnih podatkov (cene, odstotke, indekse, imena) iz povzetkov.
- Razloži skupni narativ in mehanizme vplivov med področji (kako ena tema vpliva na drugo).
- Vključi en spodbuden ali zaskrbljujoč signal, ki ga je dan prinesel.
- Konča z nevtralnim, mirnim sklepom (kaj spremljati naprej, kaj je glavna negotovost).

Tekst bo prebran z naravnim glasom (TTS), zato:
- Ne uporabljaj markdowna, alinej, številk seznamov.
- Ne uporabljaj okrajšav, ki bi se slabo brale (npr. namesto "Q3" napiši "tretje četrtletje").
- Pišite normalne stavke, kot da govorite.

Vrni IZKLJUČNO JSON:
{
  "datum": "${today}",
  "izdaja": "${edition}",
  "master_povzetek": "5–8 stavčni naraven tekst za branje."
}`;
}

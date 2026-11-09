# Builds data/site.json: translations (it/en) of every Swedish data text, plus the "About the data" tab in three languages.
import json, sys, re

out_path = sys.argv[1]
matches = json.load(open(sys.argv[2]))
venues = json.load(open(sys.argv[3]))

T = {}
def add(sv, it, en):
    T[sv] = {"it": it, "en": en}

# ---------- match notes ----------
LND_SV = "Tid = LND:s standardtid; enskilda matcher flyttas ibland (t.ex. Bisceglie–Brindisi spelades 18:00)."
LND_IT = "Orario = orario standard della LND; singole partite vengono talvolta spostate (es. Bisceglie–Brindisi si è giocata alle 18:00)."
LND_EN = "Time = LND standard kick-off; individual matches are sometimes moved (e.g. Bisceglie–Brindisi was played at 18:00)."
add(LND_SV, LND_IT, LND_EN)
add("Helgdag (Trettondagen), onsdag. " + LND_SV, "Festivo (Epifania), mercoledì. " + LND_IT, "Public holiday (Epiphany), Wednesday. " + LND_EN)
add("Torsdag före påsk. " + LND_SV, "Giovedì prima di Pasqua. " + LND_IT, "Thursday before Easter. " + LND_EN)

LP_PUB_IT = "Giorno e orario esatti vengono pubblicati dalla Lega Pro a blocchi di giornate."
LP_PUB_EN = "Lega Pro publishes the exact day and time a few rounds at a time."
add("Datum = omgångens referensdag; matcher spelas normalt fre–mån. Exakt dag/tid publiceras av Lega Pro i omgångar.",
    "Data = giorno di riferimento della giornata; di solito si gioca ven–lun. " + LP_PUB_IT,
    "Date = the round's reference day; matches are normally played Fri–Mon. " + LP_PUB_EN)
add("Mitt-i-veckan-omgång. Exakt dag/tid publiceras av Lega Pro i omgångar.",
    "Turno infrasettimanale. " + LP_PUB_IT, "Midweek round. " + LP_PUB_EN)

LP_MOVE_SV = "Lega Pro kan flytta matcher av TV-/ordningsskäl."
LP_MOVE_IT = "La Lega Pro può spostare le partite per motivi televisivi o di ordine pubblico."
LP_MOVE_EN = "Lega Pro may move matches for TV or public-order reasons."
add(LP_MOVE_SV, LP_MOVE_IT, LP_MOVE_EN)
add("En annan källa (fichajes) anger 15:00 " + LP_MOVE_SV,
    "Un'altra fonte (fichajes) indica le 15:00. " + LP_MOVE_IT,
    "Another source (fichajes) gives 15:00. " + LP_MOVE_EN)
add("TMW:s tidslista skriver 'Bari–Scafatese' – kalendern och Sky anger Bari–Savoia " + LP_MOVE_SV,
    "La lista orari di TMW riporta 'Bari–Scafatese'; il calendario e Sky indicano Bari–Savoia. " + LP_MOVE_IT,
    "TMW's kick-off list says 'Bari–Scafatese'; the fixture list and Sky give Bari–Savoia. " + LP_MOVE_EN)

# Serie A confirmed slots
DAY = {"Måndag": ("Lunedì", "Monday"), "Tisdag": ("Martedì", "Tuesday"), "Onsdag": ("Mercoledì", "Wednesday"),
       "Torsdag": ("Giovedì", "Thursday"), "Fredag": ("Venerdì", "Friday"), "Lördag": ("Sabato", "Saturday"), "Söndag": ("Domenica", "Sunday")}
MON = {"jan": ("gen", "Jan"), "feb": ("feb", "Feb"), "mar": ("mar", "Mar"), "apr": ("apr", "Apr"), "maj": ("mag", "May"),
       "jun": ("giu", "Jun"), "jul": ("lug", "Jul"), "aug": ("ago", "Aug"), "sep": ("set", "Sep"), "okt": ("ott", "Oct"),
       "nov": ("nov", "Nov"), "dec": ("dic", "Dec")}
SA_MOVE_IT = "In casi eccezionali la Lega può spostare le partite (TV/ordine pubblico)."
SA_MOVE_EN = "In exceptional cases the league can move matches (TV/public order)."
SA_SET_IT = "Giorno e orario esatti vengono fissati dalla Lega Serie A qualche settimana prima."
SA_SET_EN = "Lega Serie A sets the exact day and time a few weeks ahead."
TMW_SV = "TMW listar felaktigt Atalanta här; Sportschau, fantacalcio m.fl. anger Lazio."
TMW_IT = "TMW indica per errore l'Atalanta; Sportschau, fantacalcio e altri indicano la Lazio."
TMW_EN = "TMW wrongly lists Atalanta here; Sportschau, fantacalcio and others give Lazio."

rx_slot = re.compile(r"^(\w+) (\d+) (\w+) kl (\d\d:\d\d) \((\w+)\)\. Ligan kan i undantagsfall flytta matcher \(TV/ordning\)\.$")
rx_wk = re.compile(r"^Omgångens helg: (\d+)–(\d+) (\w+)\. Exakt dag/tid sätts av Lega Serie A några veckor före\.( " + re.escape(TMW_SV) + r")?$")

missing = []
for note in sorted({m["note"] for m in matches if m.get("note")}):
    if note in T:
        continue
    s = rx_slot.match(note)
    w = rx_wk.match(note)
    if s:
        d, n, mon, t, tv = s.groups()
        add(note, f"{DAY[d][0]} {n} {MON[mon][0]} ore {t} ({tv}). {SA_MOVE_IT}", f"{DAY[d][1]} {n} {MON[mon][1]}, {t} ({tv}). {SA_MOVE_EN}")
    elif w:
        a, b, mon, extra = w.groups()
        add(note, f"Weekend della giornata: {a}–{b} {MON[mon][0]}. {SA_SET_IT}" + (" " + TMW_IT if extra else ""),
            f"Round weekend: {a}–{b} {MON[mon][1]}. {SA_SET_EN}" + (" " + TMW_EN if extra else ""))
    else:
        missing.append(note)

# ---------- match sources ----------
add("Lega Pro CU 19/DIV (via TMW 18 sep 2026)", "Lega Pro CU 19/DIV (via TMW, 18 set 2026)", "Lega Pro CU 19/DIV (via TMW, 18 Sep 2026)")
add("LND kalender 10 aug 2026 (Antenna Sud, statoquotidiano, notiziariocalcio, bisceglieviva)",
    "Calendario LND del 10 ago 2026 (Antenna Sud, statoquotidiano, notiziariocalcio, bisceglieviva)",
    "LND fixture list of 10 Aug 2026 (Antenna Sud, statoquotidiano, notiziariocalcio, bisceglieviva)")
add("Lega Serie A anticipi/posticipi omg. 13–19 (25 sep 2026), bekräftat av Sportmediaset, Goal.com, PianetaLecce, TRNews, fantacalcio.it",
    "Anticipi e posticipi della Lega Serie A, giornate 13–19 (25 set 2026), confermati da Sportmediaset, Goal.com, PianetaLecce, TRNews, fantacalcio.it",
    "Lega Serie A scheduling for rounds 13–19 (25 Sep 2026), confirmed by Sportmediaset, Goal.com, PianetaLecce, TRNews, fantacalcio.it")
add("Lega Pro kalender (TMW 3 aug 2026, Sky); returomgångar spegelvända – bekräftat av CU 19/DIV för omg. 20",
    "Calendario Lega Pro (TMW 3 ago 2026, Sky); giornate di ritorno speculari all'andata, confermato dal CU 19/DIV per la giornata 20",
    "Lega Pro fixture list (TMW 3 Aug 2026, Sky); second-half rounds mirror the first half, confirmed by CU 19/DIV for round 20")
add("TMW kalender 5 jun 2026 + Sportschau/fantacalcio", "Calendario TMW del 5 giu 2026 + Sportschau/fantacalcio", "TMW fixture list of 5 Jun 2026 + Sportschau/fantacalcio")

# ---------- venues ----------
add("Bekräftad 2026/27", "Confermato per il 2026/27", "Confirmed for 2026/27")
add("Bekräftad 2026/27 (åter på Veneziani sedan 25 okt)", "Confermato per il 2026/27 (di nuovo al Veneziani dal 25 ott)", "Confirmed for 2026/27 (back at the Veneziani since 25 Oct)")
add("Enligt tidigare säsonger – ej separat bekräftad 2026/27", "In base alle stagioni precedenti, non confermato separatamente per il 2026/27", "Based on previous seasons, not separately confirmed for 2026/27")
add("Enligt 2025/26 – ej separat bekräftad 2026/27", "In base al 2025/26, non confermato separatamente per il 2026/27", "Based on 2025/26, not separately confirmed for 2026/27")
add("Bekräftad 2026/27. Lokalmedia 3 nov 2026 rapporterar att kommunens comodato förlängts till säsongens slut (NotiziarioCalcio: 'ufficialmente prorogato'; Antenna Sud, PianetaBari, L'Edicola: kommunen 'sta ultimando il provvedimento'). Inget kommunalt beslut/delibera hittat per 9 nov – fortfarande ej verifierat officiellt.",
    "Confermato per il 2026/27. I media locali (3 nov 2026) riportano che il comodato del Comune è stato prorogato fino a fine stagione (NotiziarioCalcio: 'ufficialmente prorogato'; Antenna Sud, PianetaBari, L'Edicola: il Comune 'sta ultimando il provvedimento'). Nessuna delibera comunale trovata al 9 nov: non ancora verificato ufficialmente.",
    "Confirmed for 2026/27. Local media (3 Nov 2026) report that the city's loan agreement (comodato) has been extended to the end of the season (NotiziarioCalcio: 'ufficialmente prorogato'; Antenna Sud, PianetaBari, L'Edicola: the city 'sta ultimando il provvedimento'). No council decision (delibera) found as of 9 Nov, so not yet officially verified.")
add("Altamura kommun", "Comune di Altamura", "City of Altamura")

CAP = {
 "Lecce": ("31.461 posti omologati (it.wikipedia); stadiumdb indica 31.445. La copertura è in costruzione fino a dic 2026 e i lavori chiudono al massimo 3.500 posti alla volta (stadiumdb, ago 2025).",
           "31,461 approved seats (it.wikipedia); stadiumdb gives 31,445. The roof is being built until Dec 2026 and the works close at most 3,500 seats at a time (stadiumdb, Aug 2025)."),
 "Bari": ("58.270 posti secondo Wikipedia, stadiumdb e Calcio e Finanza (ott 2026).",
          "58,270 seats according to Wikipedia, stadiumdb and Calcio e Finanza (Oct 2026)."),
 "Altamura": ("Massimo 3.000 spettatori secondo il Comune di Altamura; Antenna Sud (nov 2024) indica circa 3.000 posti a sedere. Non è stato possibile verificare una voce di Wikipedia, quindi il link porta al sito del Comune.",
              "Max 3,000 spectators according to the City of Altamura; Antenna Sud (Nov 2024) gives about 3,000 seats. No Wikipedia article could be verified, so the link goes to the city's page."),
 "Audace Cerignola": ("4.500 posti secondo TuttoC (21 giu 2026) e it.wikipedia. L'ampliamento a 5.500 è stato deciso ma non è ancora completato.",
                      "4,500 seats according to TuttoC (21 Jun 2026) and it.wikipedia. Expansion to 5,500 has been approved but is not finished."),
 "Barletta": ("7.499 per il calcio dopo l'autorizzazione della Prefettura (BarlettaViva, 14 dic 2023). Nessun dato più recente trovato.",
              "7,499 for football after the prefecture's approval (BarlettaViva, 14 Dec 2023). No newer figure found."),
 "Casarano": ("4.324 dopo la commissione comunale del 27 set 2025 (sito del club, TuttoCasarano, NotiziarioCalcio). Wikipedia riporta un dato più vecchio (6.500).",
              "4,324 after the municipal commission of 27 Sep 2025 (club website, TuttoCasarano, NotiziarioCalcio). Wikipedia gives an older figure (6,500)."),
 "Foggia": ("11.318 posti omologati (Comune di Foggia, ago 2025); Antenna Sud indica circa 11.400 (giu 2026). È in corso una ristrutturazione verso circa 16.000 posti, quindi alcuni settori possono essere chiusi. Wikipedia riporta un dato più vecchio (25.085).",
            "11,318 approved seats (City of Foggia, Aug 2025); Antenna Sud gives about 11,400 (Jun 2026). A rebuild towards about 16,000 is under way, so some sections may be closed. Wikipedia gives an older figure (25,085)."),
 "Monopoli": ("4.177 posti a sedere secondo il sito del club e stadiumdb. Nuovo terreno di gioco pronto a ott 2026; è prevista la ristrutturazione delle tribune.",
              "4,177 seats according to the club website and stadiumdb. New pitch ready in Oct 2026; renovation of the stands is planned."),
 "Bisceglie": ("Circa 5.000 secondo it.wikipedia (senza anno). Nessuna seconda fonte trovata.",
               "About 5,000 according to it.wikipedia (no year given). No second source found."),
 "Brindisi": ("Massimo 7.325 secondo il Commissario dei Giochi del Mediterraneo (prima della ristrutturazione); Wikipedia indica 7.500. La capienza dopo la ristrutturazione del 2026 non è stata pubblicata.",
              "Max 7,325 according to the Mediterranean Games commissioner (before the rebuild); Wikipedia gives 7,500. Capacity after the 2026 rebuild has not been published."),
 "Fidelis Andria": ("9.140 secondo Wikipedia e Calcio Foggia (nov 2019). Il sito del Comune di Andria indica sia circa 6.500 sia oltre 9.000.",
                    "9,140 according to Wikipedia and Calcio Foggia (Nov 2019). The City of Andria's website gives both about 6,500 and just over 9,000."),
 "Gravina": ("4.000 posti omologati nel 2019 (Foggia Calcio Mania). Da allora lo stadio è stato ristrutturato e a feb 2025 erano ammessi solo circa 1.100 spettatori durante i lavori. Manca un dato aggiornato. Non esiste una voce di Wikipedia.",
             "4,000 approved seats in 2019 (Foggia Calcio Mania). The ground has since been rebuilt, and in Feb 2025 only about 1,100 spectators were allowed during the works. No current figure. There is no Wikipedia article."),
 "Manfredonia": ("4.076 secondo Wikipedia ed europlan-online (senza anno). Nessun dato ufficiale recente trovato.",
                 "4,076 according to Wikipedia and europlan-online (no year given). No recent official figure found."),
 "Martina": ("Stima di 4.900 secondo it.wikipedia ed en.wikipedia. Nessun dato ufficiale trovato.",
             "Estimated 4,900 according to it.wikipedia and en.wikipedia. No official figure found."),
 "Nardò": ("5.000 posti secondo il Comune di Nardò, it.wikipedia e Foggia Calcio Mania (2019).",
           "5,000 seats according to the City of Nardò, it.wikipedia and Foggia Calcio Mania (2019)."),
 "Virtus Francavilla": ("4.764 dopo la ristrutturazione per i Giochi del Mediterraneo (Antenna Sud, 19 ago 2026); Senza Colonne indica circa 4.700. it.wikipedia riporta un dato più vecchio (3.360).",
                        "4,764 after the rebuild for the Mediterranean Games (Antenna Sud, 19 Aug 2026); Senza Colonne gives about 4,700. it.wikipedia gives an older figure (3,360)."),
}
for v in venues:
    if v["team"] in CAP:
        add(v["capacity_note"], *CAP[v["team"]])
    for f in ("venue_status", "capacity_note"):
        if v[f] and v[f] not in T:
            missing.append(v[f])
    if v.get("info_label") and v["info_label"] not in T and not v["info_label"].startswith("Wikipedia"):
        missing.append(v["info_label"])
for m in matches:
    if m.get("source") and m["source"] not in T:
        missing.append(m["source"])

# ---------- About the data ----------
ABOUT = {
 "sv": [
  {"h": "Matchstatus", "items": [
    ["Bekräftad", "Exakt dag och avsparkstid är fastställd av ligan. Ligan kan ändå flytta matcher av TV- eller ordningsskäl."],
    ["Datum fastställt", "Dagen står i den officiella kalendern. Tiden är ligans standardtid (Serie D) eller ännu inte satt (Serie A och C). Enstaka matcher flyttas."],
    ["Preliminär", "Bara omgångens helg är känd. Matchen kan spelas någon dag före eller efter det datum som visas. Exakt dag och tid publiceras några veckor i förväg."]]},
  {"h": "Arenornas kapacitet", "items": [
    ["Säker", "Samma siffra i minst två oberoende källor, eller ett aktuellt officiellt beslut som bekräftas av en annan källa."],
    ["Trolig", "En aktuell officiell källa eller två äldre källor som stämmer, men ingen färsk bekräftelse."],
    ["Osäker", "Källorna skiljer sig åt, siffran är gammal, eller arenan byggs om. Den faktiska gränsen kan vara lägre, och vid många matcher öppnas inte hela arenan."],
    ["Länkar", "Engelska Wikipedia när en artikel finns, annars italienska. För Altamura går länken till kommunens sida eftersom ingen Wikipedia-artikel kunde verifieras. Gravina har ingen länk eftersom det inte finns någon artikel om arenan. Wikipedia har ibland äldre kapacitetssiffror än de som visas här."]]},
  {"h": "Avstånd och källor", "items": [
    ["Avstånd och restid", "Mapbox Directions från Piazza Plebiscito i Ceglie Messapica till arenan, snabbaste rutt med typisk trafik. Ibland är den snabbaste rutten längre i km än den kortaste (till exempel mot Altamura). Kontroll mot andra ruttjänster gav liknande restider. Parkering och gångväg ingår inte."],
    ["Matcher", "Serie A: Lega Serie A:s kalender via TuttoMercatoWeb, korskontrollerad mot Sportschau och fantacalcio.it. Serie C: Lega Pros kalender och officiella beslut om dagar och tider (via TuttoMercatoWeb och Sky Sport). Serie D: LND:s kalender via Antenna Sud, korskontrollerad mot flera lokala medier."],
    ["Arenor", "Arenanamn: lokalmedia och matchrapporter. Kapacitet: kommuner, klubbarnas webbplatser, lokalmedia, stadiumdb och Wikipedia, kontrollerat 8 nov 2026. Regiongränser: ISTAT via openpolis."]]},
  {"h": "Kända osäkerheter", "items": [
    ["Bari", "Avtalet om San Nicola löpte ut i slutet av oktober. Lokalmedia rapporterar en förlängning till säsongens slut, men inget kommunalt beslut var publicerat vid senaste kontrollen."],
    ["Arenor i Serie D", "För flera Serie D-klubbar bygger arenauppgiften på förra säsongen, se respektive arena under fliken Arenor."],
    ["Ombyggnader", "Via del Mare (Lecce) och Zaccheria (Foggia) byggs om under säsongen, och delar av läktarna kan vara stängda. Fanuzzi (Brindisi) och Stefano Vicino (Gravina) har byggts om nyligen utan publicerad ny kapacitet."],
    ["Lecce mot Lazio", "En av källorna listar fel motståndare i den omgången. Flera andra källor anger Lazio, som används här."],
    ["Bortvalda lag", "Francavilla (in Sinni) och Melfi spelar i samma Serie D-grupp men hör till Basilicata och är därför inte med."]]},
  {"h": "Om sidan", "items": [
    ["Uppdatering", "Datan söks igen och korskontrolleras varje måndag morgon. Kontrollera alltid klubbens egen sida före resan."],
    ["Översättning", "Texterna är översatta från svenska. Lag- och arenanamn är oförändrade."],
    ["Färger och logotyp", "Blått och guld kommer från Ceglie Messapicas stadsvapen, ett guldtorn på blått fält. Logotypen är egen: en trullo från Valle d'Itria med en fotboll på toppen."]]},
 ],
 "it": [
  {"h": "Stato delle partite", "items": [
    ["Confermata", "Giorno e orario del calcio d'inizio sono stati fissati dalla lega. La lega può comunque spostare le partite per motivi televisivi o di ordine pubblico."],
    ["Data fissata", "Il giorno è nel calendario ufficiale. L'orario è quello standard della lega (Serie D) oppure non è ancora stato fissato (Serie A e C). Singole partite vengono spostate."],
    ["Provvisoria", "È noto solo il weekend della giornata. La partita può giocarsi qualche giorno prima o dopo la data indicata. Giorno e orario esatti vengono pubblicati alcune settimane prima."]]},
  {"h": "Capienza degli stadi", "items": [
    ["Affidabile", "Lo stesso dato in almeno due fonti indipendenti, oppure un provvedimento ufficiale recente confermato da un'altra fonte."],
    ["Probabile", "Una fonte ufficiale recente o due fonti più vecchie concordanti, ma nessuna conferma recente."],
    ["Incerta", "Le fonti non concordano, il dato è vecchio oppure lo stadio è in ristrutturazione. Il limite reale può essere più basso, e in molte partite non tutto lo stadio è aperto."],
    ["Link", "Wikipedia in inglese quando esiste una voce, altrimenti in italiano. Per Altamura il link porta al sito del Comune, perché non è stato possibile verificare una voce di Wikipedia. Gravina non ha link perché non esiste una voce sullo stadio. Wikipedia a volte riporta capienze più vecchie di quelle indicate qui."]]},
  {"h": "Distanze e fonti", "items": [
    ["Distanza e tempo di viaggio", "Mapbox Directions da Piazza Plebiscito a Ceglie Messapica fino allo stadio, percorso più veloce con traffico tipico. A volte il percorso più veloce è più lungo in km di quello più breve (per esempio verso Altamura). Un controllo con altri servizi ha dato tempi simili. Parcheggio e tragitto a piedi non sono inclusi."],
    ["Partite", "Serie A: calendario della Lega Serie A tramite TuttoMercatoWeb, verificato con Sportschau e fantacalcio.it. Serie C: calendario della Lega Pro e comunicati ufficiali su giorni e orari (tramite TuttoMercatoWeb e Sky Sport). Serie D: calendario LND tramite Antenna Sud, verificato con diversi media locali."],
    ["Stadi", "Nomi degli stadi: media locali e cronache delle partite. Capienza: Comuni, siti dei club, media locali, stadiumdb e Wikipedia, verificata l'8 nov 2026. Confini regionali: ISTAT tramite openpolis."]]},
  {"h": "Incertezze note", "items": [
    ["Bari", "La convenzione per il San Nicola è scaduta a fine ottobre. I media locali riportano una proroga fino a fine stagione, ma all'ultimo controllo non era stata pubblicata alcuna delibera comunale."],
    ["Stadi di Serie D", "Per diversi club di Serie D lo stadio indicato si basa sulla scorsa stagione; vedi il singolo stadio nella scheda Stadi."],
    ["Ristrutturazioni", "Il Via del Mare (Lecce) e lo Zaccheria (Foggia) sono in ristrutturazione durante la stagione e parti delle tribune possono essere chiuse. Il Fanuzzi (Brindisi) e lo Stefano Vicino (Gravina) sono stati ristrutturati di recente senza una nuova capienza pubblicata."],
    ["Lecce–Lazio", "Una delle fonti indica l'avversario sbagliato in quella giornata. Diverse altre fonti indicano la Lazio, che è quella usata qui."],
    ["Squadre escluse", "Francavilla (in Sinni) e Melfi giocano nello stesso girone di Serie D ma appartengono alla Basilicata, quindi non sono incluse."]]},
  {"h": "Il sito", "items": [
    ["Aggiornamento", "I dati vengono ricercati e verificati di nuovo ogni lunedì mattina. Controlla sempre il sito del club prima di partire."],
    ["Traduzione", "I testi sono tradotti dallo svedese. I nomi di squadre e stadi non sono cambiati."],
    ["Colori e logo", "Il blu e l'oro vengono dallo stemma di Ceglie Messapica, una torre d'oro in campo azzurro. Il logo è originale: un trullo della Valle d'Itria con un pallone in cima."]]},
 ],
 "en": [
  {"h": "Match status", "items": [
    ["Confirmed", "The league has fixed the exact day and kick-off time. The league can still move matches for TV or public-order reasons."],
    ["Date set", "The day is in the official fixture list. The time is the league's standard kick-off (Serie D) or not yet set (Serie A and C). Individual matches get moved."],
    ["Provisional", "Only the round's weekend is known. The match may be played a day or so before or after the date shown. The exact day and time are published a few weeks ahead."]]},
  {"h": "Ground capacity", "items": [
    ["Reliable", "The same figure in at least two independent sources, or a recent official decision confirmed by another source."],
    ["Likely", "One recent official source, or two older sources that agree, but no recent confirmation."],
    ["Uncertain", "Sources disagree, the figure is old, or the ground is being rebuilt. The real limit may be lower, and for many matches not the whole ground is open."],
    ["Links", "English Wikipedia when an article exists, otherwise Italian. For Altamura the link goes to the city's page because no Wikipedia article could be verified. Gravina has no link because there is no article about the ground. Wikipedia sometimes has older capacity figures than those shown here."]]},
  {"h": "Distances and sources", "items": [
    ["Distance and drive time", "Mapbox Directions from Piazza Plebiscito in Ceglie Messapica to the ground, fastest route with typical traffic. Sometimes the fastest route is longer in km than the shortest (for example to Altamura). A check against other route planners gave similar times. Parking and walking are not included."],
    ["Matches", "Serie A: Lega Serie A fixture list via TuttoMercatoWeb, cross-checked against Sportschau and fantacalcio.it. Serie C: Lega Pro fixture list and official decisions on days and times (via TuttoMercatoWeb and Sky Sport). Serie D: LND fixture list via Antenna Sud, cross-checked against several local media."],
    ["Grounds", "Ground names: local media and match reports. Capacity: municipalities, club websites, local media, stadiumdb and Wikipedia, checked 8 Nov 2026. Regional borders: ISTAT via openpolis."]]},
  {"h": "Known uncertainties", "items": [
    ["Bari", "The agreement for the San Nicola expired at the end of October. Local media report an extension to the end of the season, but no council decision had been published at the last check."],
    ["Serie D grounds", "For several Serie D clubs the ground is based on last season; see each ground on the Grounds tab."],
    ["Rebuilds", "The Via del Mare (Lecce) and the Zaccheria (Foggia) are being rebuilt during the season, and parts of the stands may be closed. The Fanuzzi (Brindisi) and the Stefano Vicino (Gravina) were recently rebuilt with no new capacity published."],
    ["Lecce v Lazio", "One of the sources lists the wrong opponent for that round. Several other sources give Lazio, which is used here."],
    ["Teams left out", "Francavilla (in Sinni) and Melfi play in the same Serie D group but belong to Basilicata, so they are not included."]]},
  {"h": "About this site", "items": [
    ["Updates", "The data is searched again and cross-checked every Monday morning. Always check the club's own website before travelling."],
    ["Translation", "The texts are translated from Swedish. Team and ground names are unchanged."],
    ["Colours and logo", "The blue and gold come from the coat of arms of Ceglie Messapica, a gold tower on a blue field. The logo is original: a trullo from the Valle d'Itria with a football on top."]]},
 ],
}

site = {
  "updated": sys.argv[4],
  "texts": T,
  "about": ABOUT,
}
json.dump(site, open(out_path, "w"), ensure_ascii=False, indent=1)
print("texts:", len(T), "missing:", len(missing))
for x in missing: print("  MISSING:", x)

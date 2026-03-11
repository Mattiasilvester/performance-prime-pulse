# ANALISI PROFONDA: Flusso send() completo — PrimeChat.tsx
# app-user — Performance Prime

**Data:** 11 Marzo 2026  
**File principale:** `packages/app-user/src/components/PrimeChat.tsx`  
**File correlati:** `primebot-fallback.ts`, `painTrackingService.ts`, `bodyPartExclusions.ts`, `usePainTracking.ts`

---

## 1. Mappa completa delle regex in PrimeChat.tsx

| Riga | Nome variabile | Pattern esatto | Scopo | Falsi positivi |
|------|----------------|----------------|--------|------------------|
| **84** | `actionPattern` | `/\[ACTION:([^:]+):([^:]+):([^\]]+)\]/g` | Estrarre dalla risposta AI i blocchi `[ACTION:tipo:label:payload]` per bottoni/navigazione. | Nessuno rilevante: pattern molto specifico, solo l’AI può emetterlo. |
| **110** | (inline) | `/\n{3,}/g` | Sostituire 3+ newline con `\n\n` nel testo pulito dopo il parsing delle azioni. | Nessuno: solo normalizzazione testo. |
| **1042** | `isPlanRequestForPainCheck` | `/piano|allenamento|workout|scheda|programma|esercizi|allena|creami/i` | Decidere se il messaggio “assomiglia” a una richiesta di piano (per mostrare pain check o riepilogo onboarding). | **Sì.** "Quanti **allenamenti** ho fatto?", "**Creami** una scheda riepilogativa", "parliamo di **programma**" → `true` anche quando l’utente non chiede un piano. Mitigato da `isStatsOrGeneralQuestion` (vedi sotto). |
| **1100** | `isStatsOrGeneralQuestion` | `/streak|quanti|quante|totale|come\s+sto|come\s+va|stato|progressi|fatto\s+in\s+totale|obiettivi|ho\s+fatto|risultati/i` | Escludere dal pain check i messaggi che sembrano domande su statistiche/progressi. | Possibili: "voglio **risultati** veloci" (richiesta piano) → non mostrato pain check. "i miei **obiettivi** sono..." (generale) → escluso. Severità bassa. |

**Problemi identificati**

- **P1 (🟡 Media):** `isPlanRequestForPainCheck` resta troppo generico: qualsiasi frase con "creami"/"scheda"/"programma" viene trattata come richiesta piano; contesti tipo "creami una scheda riepilogativa" o "non voglio un programma" possono ancora attivare pain check o riepilogo.
- **P2 (🟢 Bassa):** `isStatsOrGeneralQuestion` può escludere anche richieste di piano che contengono "obiettivi"/"risultati" (es. "voglio risultati, creami un piano").

---

## 2. Analisi di ogni "early return" in send()

I `return` sono elencati in ordine di esecuzione logica (blocchi dall’inizio di `send()` verso il basso).

| # | Riga ca. | Condizione che causa il return | Cosa vede l’utente | Rischio scatto non voluto |
|---|----------|--------------------------------|---------------------|----------------------------|
| 1 | 428 | `waitingForPainResponse` + utente dice “tutti/tutto” (dolori passati) | Messaggio tipo “tutti i dolori passati” + niente altro | Basso: stato esplicito. |
| 2 | 442 | `waitingForPainResponse` + utente dice dolore passato (singola zona) | Conferma dolore passato + messaggio bot | Basso. |
| 3 | 455 | Come sopra, con `currentPainZone` null ma `pains.length > 0` (usa primo dolore) | Come sopra | Basso. |
| 4 | 568 | `waitingForPainDetails` + salvataggio dolore + `planResponse.type === 'question'` | Domanda limitazioni (testo da piano) | Medio: utente voleva solo rispondere su destro/sinistro e si trova una domanda diversa. |
| 5 | 626 | `waitingForPainDetails` + piano generato con limitazioni | Piano + messaggio “tenuto conto del dolore a X” | Basso. |
| 6 | 635 | `waitingForPainDetails` + errore generazione piano | Messaggio errore tecnico | Basso. |
| 7 | 645 | `waitingForPainDetails` + errore salvataggio dolore | “Procedo comunque con la creazione del piano” | Basso. |
| 8 | 739 | `waitingForPainPlanConfirmation` + utente rifiuta (no/non ora/…) | “Nessun problema! Quando vorrai un piano…” | Basso. |
| 9 | 797 | `waitingForPlanConfirmation` + utente vuole “modifica” | Bot chiede “Cosa vorresti modificare?” (obiettivo, giorni, ecc.) | Basso. |
| 10 | 806 | `waitingForPlanConfirmation` + risposta non chiara | “Non ho capito. Vuoi procedere o modificare?” | Basso. |
| 11 | 816 | `waitingForModifyChoice` + utente dice “procedi”/“va bene” | Nessun return qui; il flusso continua per generare piano | - |
| 12 | 823 | `waitingForModifyChoice` + `parseModifyRequest` non riconosce nulla | “Non ho capito cosa vuoi modificare…” | **🟡 Medio:** frasi di modifica non standard (es. “vorrei 3 giorni”) potrebbero non essere parsate. |
| 13 | 901 | FIX BUG 6: `pains.length > 0` + messaggio tipo “passato”/“ok”/“sì” + dolore passato (tutti) | Messaggio “tutti i dolori passati” | **🟡 Medio:** “ok” o “sì” come risposta a domande generiche potrebbero essere interpretati come “dolore passato”. |
| 14 | 907 | Come 13 ma singolo dolore passato | Messaggio dolore passato | Stesso rischio “ok”/“sì”. |
| 15 | 1011 | `awaitingLimitationsResponse` + piano generato con limitazioni | Disclaimer + piano | Basso. |
| 16 | 1017 | `awaitingLimitationsResponse` + `planResponse.type === 'question'` | Altra domanda limitazioni | Basso. |
| 17 | 1035 | `awaitingLimitationsResponse` + errore | Messaggio errore piano | Basso. |
| 18 | 1095 | Pain check: `isPlanRequestForPainCheck && pains.length > 0 && painCheckMessage && !waitingFor* && !isStatsOrGeneralQuestion` | Pain check (es. “Mi avevi detto che ti faceva male il ginocchio…”) | **🔴 Alta (mitigata):** messaggi tipo “creami una scheda per il mese” senza parole stats → ancora pain check. Fix `isStatsOrGeneralQuestion` riduce solo parte dei casi. |
| 19 | 1141 | Riepilogo onboarding: prima richiesta piano + `generateOnboardingSummaryMessage` ha dati | Riepilogo preferenze + “Vuoi procedere o modificare?” | **🟡 Media:** utente che chiede “voglio un programma” solo informativo può ricevere riepilogo invece di risposta libera. |
| 20 | 1199 | `!trimmed \|\| loading` | Nessun messaggio (send bloccato) | Basso. |
| 21 | 1349 | Preset trovato (`presetResponse`) | Risposta preimpostata (es. “non ho tempo” → Quick Workout) | **🟡 Media:** match solo su messaggio **esatto** (chiave preset); messaggi lunghi con stessa intenzione non matchano → ok. Possibile “furto” se preset troppo generico (es. “risultati” → preset generico invece di AI). |
| 22 | 1402 | Piano generato: `planResponse.type === 'question'` | Domanda limitazioni | Basso. |
| 23 | 1417 | Piano generato: `planResponse.type === 'error'` | Messaggio errore | Basso. |
| 24 | 1486 | Piano generato: `planResponse.success && planResponse.plan` (con disclaimer) | Messaggio + disclaimer + piano | Basso. |
| 25 | 1545 | Piano generato: stesso blocco, altro ramo | Piano senza disclaimer | Basso. |
| 26 | 1583 | Piano: ritorna ancora `question` | Solo domanda, no piano | Basso. |
| 27 | 1608 | Piano: errore/caso non gestito | Messaggio errore generico | Basso. |

**Problemi early return**

- **P3 (🔴 Alta):** Return #18 (pain check): finché la condizione è vera, ogni richiesta “piano-like” con dolori in DB mostra il pain check; senza una nozione di “richiesta esplicita di piano” più stretta, restano casi indesiderati.
- **P4 (🟡 Media):** Return #13/#14 (FIX BUG 6): “sì”/“ok” possono essere interpretati come “dolore passato” anche quando l’utente sta rispondendo ad altro.
- **P5 (🟡 Media):** Return #19 (riepilogo onboarding): ogni primo messaggio che matcha `isPlanRequestForPainCheck` e ha dati onboarding va in riepilogo; non c’è distinzione tra “voglio un piano” e “parliamo di programmi”.

---

## 3. Analisi del sistema waitingFor* (tutti gli stati)

| Stato | Impostato a `true` | Resettato a `false` | Se rimane true (bloccato) | Reset/timeout |
|-------|--------------------|----------------------|----------------------------|----------------|
| **waitingForPainResponse** | Quando si mostra il pain check (blocco “check dolori”), riga ~1115. Oppure in FIX BUG 6 (riga ~1365) se ci sono dolori e messaggio “passato”/“ok”/“sì”. | Quando utente risponde “passato”/“ancora”/“no” (handlePainGone, handlePainStillPresent, handleAllPainsGone), righe 422, 436, 449, 468; o in FIX BUG 6 se non si riconosce risposta dolore, righe 1396, 1411, 1422. | Il bot si aspetta sempre una risposta sul dolore; qualsiasi messaggio viene interpretato come risposta al pain check (passato/ancora). **L’utente non può uscire** se non dice una di quelle parole. | **Nessuno.** Nessun timeout né pulsante “Annulla”. |
| **waitingForPainDetails** | Quando si rileva “dolore nel messaggio + richiesta piano” (riga 1092): chiediamo destro/sinistro o conferma. | Dopo salvataggio dolore (successo o errore), righe 520, 650, 656. | Ogni messaggio successivo viene trattato come risposta “destro/sinistro/entrambi” o conferma dolore; si può salvare un dolore sbagliato o andare in generazione piano. **Nessuna uscita esplicita.** | **Nessuno.** |
| **waitingForPainPlanConfirmation** | Quando il fallback restituisce una risposta con `askForPlanConfirmation: true` (es. solo dolore, senza piano), riga 1460. | Se utente conferma (genera piano), rifiuta (“no”), o risposta non riconosciuta (si passa all’LLM), righe 697, 820, 828. | Bot aspetta “sì”/“no”/“procedi”/…; risposte ambigue fanno andare all’LLM e si resetta (riga 828). Rischio medio. | **Nessuno.** |
| **waitingForPlanConfirmation** | Dopo aver mostrato il riepilogo onboarding (prima richiesta piano con dati), riga 1176. | Se utente conferma (procedi) o chiede modifica (setWaitingForModifyChoice), righe 866, 883-884. | L’utente deve dire “procedi”/“confermo”/“modifica”/…; altrimenti riceve “Non ho capito. Procedere o modificare?”. **Può ripetersi a loop.** | **Nessuno.** |
| **waitingForModifyChoice** | Quando da `waitingForPlanConfirmation` l’utente dice “modifica”/“cambia”/…, riga 884. | Quando dice “procedi”/“va bene” o quando `parseModifyRequest` ha successo e si torna a riepilogo (setWaitingForPlanConfirmation), righe 940-941, 999-1000. | Deve rispondere con una modifica riconosciuta o “procedi”; altrimenti “Non ho capito cosa vuoi modificare”. **Loop possibile.** | **Nessuno.** |
| **waitingForModifyValue** | Dichiarato (riga 187) ma **non usato** in `send()` per condizioni. | - | - | - |
| **skipFallbackCheck** | Quando da `waitingForPainPlanConfirmation` l’utente scrive qualcosa non riconosciuto come sì/no (riga 831). | Reset subito dopo aver saltato il fallback (riga 1355). | No: usato solo per un messaggio. | - |

**Problemi waitingFor***

- **P6 (🔴 Alta):** **Nessun reset globale né timeout.** Se l’utente è in `waitingForPainResponse` o `waitingForPainDetails` e non risponde come previsto (o risponde “voglio un piano” di nuovo), resta nello stato. Non esiste “Annulla” o “Fai qualcos’altro”.
- **P7 (🟡 Media):** **waitingForPlanConfirmation / waitingForModifyChoice:** risposte fuori lista portano a messaggi ripetuti (“Non ho capito…”) senza via d’uscita chiara (es. “annulla” / “torna alla chat”).
- **P8 (🟢 Bassa):** **waitingForModifyValue** non usato; codice morto o funzionalità incompiuta.

---

## 4. Analisi isWorkoutPlanRequest()

**Funzione (righe 59-76):**

```ts
function isWorkoutPlanRequest(text: string): boolean {
  const keywords = [
    'piano', 'programma', 'scheda', 'allenamento per', 'creami', 'fammi', 'genera',
    'crea un piano', 'fammi un piano', 'mi serve un piano', 'voglio un piano',
  ];
  const textLower = text.toLowerCase();
  return keywords.some(keyword => textLower.includes(keyword));
}
```

- **Cosa considera “richiesta piano”:** Qualsiasi messaggio che **contiene** almeno una delle parole/frasi sopra (es. "voglio un piano", "creami una scheda", "allenamento per la schiena", "fammi", "genera").
- **Falsi positivi:**  
  - "Quanti **allenamenti** ho fatto?" → `includes('allenamento per')` è false, ma `includes('allenamento')` no: in realtà la lista ha `'allenamento per'`, non `'allenamento'`, quindi **no**. Però `'piano'`, `'programma'`, `'scheda'`, `'creami'`, `'fammi'`, `'genera'` sono singole parole → "parliamo del **programma**" o "**creami** un riepilogo" → **sì**, falsi positivi.
- **Differenza da isPlanRequestForPainCheck:**  
  - `isPlanRequestForPainCheck`: regex con `piano|allenamento|workout|scheda|programma|esercizi|allena|creami` → più parole (es. "workout", "esercizi", "allena").  
  - `isWorkoutPlanRequest`: lista con anche frasi ("crea un piano", "fammi un piano", …) ma **non** "workout", "esercizi", "allena".  
  Quindi **non sono la stessa cosa**: un messaggio può essere `true` per uno e `false` per l’altro (es. "voglio un workout" → solo regex true). In `send()`:
  - Pain check e riepilogo onboarding usano **isPlanRequestForPainCheck** (regex).
  - Più in basso, per chiamare davvero `getStructuredWorkoutPlan`, si usa **isPlanRequest** = `isWorkoutPlanRequest(trimmed) || pendingPlanRequest !== null`.  
  Quindi si può entrare nel blocco pain check/onboarding con la regex e mai arrivare al piano perché la condizione “è una richiesta piano” per la generazione è più stretta (isWorkoutPlanRequest) o dipende da `pendingPlanRequest`.

**Problemi**

- **P9 (🟡 Media):** Doppia logica “richiesta piano” (regex vs keywords) crea incoerenza: stesso messaggio può attivare pain check/riepilogo ma non generazione piano (o il contrario se si aggiungono keyword).
- **P10 (🟡 Media):** Falsi positivi su “programma”/“scheda”/“creami” in frasi non-piano (es. “non voglio un programma”, “creami un riepilogo”).

---

## 5. Analisi getPrimeBotFallbackResponse()

- **File:** `packages/app-user/src/lib/primebot-fallback.ts`.
- **Flusso:** `getPrimeBotFallbackResponse(message)` → `findPresetResponse(message)`.

**Quando risponde con un preset invece dell’AI:**

1. **Match esatto** con una chiave di `presetResponses` (messaggio lowercase trim): es. "non ho tempo", "quick workout", "risultati", "dolore", "male schiena", "alimentazione", "proteine", "recupero", "plateau", "motivazione", "casa", "principiante", ecc.
2. **Nessun match** per “dolore risolto” (`painResolvedKeywords`: “dolore è passato”, “non ho più dolore”, “sto meglio”, …) → ritorna `null` (va all’AI).
3. **Dolore + piano:** se `hasPainMention && hasPlanRequest` → `null` (va all’AI).
4. **Solo dolore, senza richiesta piano e senza chiave esatta:** ritorna un preset “consulta professionista” + `askForPlanConfirmation: true`.

Quindi: **solo match esatto** sulle chiavi di `presetResponses` attiva un preset; non c’è match parziale.

- **Preset sensati:** Sì per “non ho tempo”, “quick workout”, “dolore”, “infortunio”, “perdere peso”, “recupero”, “casa”, “principiante”. Chiave **"risultati"** → messaggio generico su tempistiche; se l’utente chiede “come ottenere risultati con un piano personalizzato?” il messaggio lungo **non** fa match (non è esatto “risultati”), quindi va all’AI. Ok.
- **Rischi “furto”:**  
  - Se l’utente scrive **esattamente** “risultati” o “dolore” o “alimentazione”, riceve il preset. Frasi più lunghe no.  
  - **"principiante"** da solo → preset; “sono un principiante, creami un piano” non fa match → AI. Accettabile.

**Problemi**

- **P11 (🟢 Bassa):** La chiave `"risultati"` è molto corta; qualcuno che scrive solo “risultati?” prende il preset invece di una risposta contestuale. Impatto limitato.

---

## 6. detectBodyPartFromMessage() e isBodyPartForPain()

**detectBodyPartFromMessage** (`bodyPartExclusions.ts`, righe 22-35):

- Itera su `BODY_PART_SYNONYMS` (spalla, schiena, ginocchio, caviglia, polso, gomito, anca, collo, petto, addome, braccio, coscia).
- Per ogni parte, controlla se il messaggio (lowercase) **include** uno dei sinonimi.
- Restituisce la **prima** parte trovata (ordine oggetto: spalla → schiena → … → coscia).

Esempi sinonimi: "lombare", "menisco", "piede", "mano", "epicondilite", "pubalgia", "cervicale", "sterno", "bicipite", "quadricipite", "stiramento" (sotto coscia), ecc.

**isBodyPartForPain** (PrimeChat, righe 320-371):

- **Dolore:** `painKeywords`: dolore, dolori, male, mal di, fa male, soffro, fastidio, brucia, tira, blocco, ferito, infortunio, limitazione, lesione, distorsione, stiramento, strappo, …
- **Target allenamento:** `targetKeywords`: "piano per", "allenamento per", "workout per", "scheda per", "programma per", "esercizi per", "per il/la/i/le", "allenare", "voglio/vorrei allenare", "creami", "fammi", "genera", "prepara", "voglio", "vorrei", "mi piacerebbe".
- Logica: (1) dolore e non target → DOLORE; (2) target e non dolore → TARGET; (3) entrambi → DOLORE; (4) nessuno → TARGET.

**Falsi positivi / ambiguità:**

- **Parte del corpo:** "Ho un **menisco** da operare" → ginocchio; "**stiramento** al polpaccio" → coscia (perché "stiramento" è in coscia). "Voglio allenare il **petto**" → petto; con "voglio" c’è targetKeyword → TARGET. Ok.
- **"problema"/"problemi":** in painKeywords. "Ho un problema con il programma" → potrebbe avere "problema" + "programma" → entrambi → DOLORE. **Falso positivo possibile** se si parla di “problema con il programma” (software/allenamento).
- **"per il petto":** target ("per il") + eventuale body part → TARGET. Corretto.
- Messaggi **senza** body part: `detectBodyPartFromMessage` ritorna `null` → `isPainContext` = false; non si entra nel ramo “dolore nel messaggio”.

**Problemi**

- **P12 (🟡 Media):** "problema"/"problemi" in contesto non medico (es. “ho un problema con l’app”) può far classificare come DOLORE se c’è anche una zona (rara ma possibile).
- **P13 (🟢 Bassa):** Ordine delle parti in `BODY_PART_SYNONYMS`: messaggi con più zone restituiscono solo la prima; di solito ok per “quale zona ti fa male”.

---

## 7. Sistema messaggi automatici pain check

- **Generazione di painCheckMessage:**  
  In `usePainTracking` → `loadPains()` → `getUserPains(userId)` → se `result.hasPain && result.pains.length > 0` → `generatePainCheckMessage(result)` (painTrackingService, righe 323-374).  
  Il messaggio dipende da: 1 dolore vs più dolori, e da se il dolore è “persistente” (> 14 giorni). Testo tipo: “Mi avevi detto che ti faceva male [zona] [tempo fa]. È passato o c’è ancora?” (+ eventuale consiglio medico se persistente).

- **Frequenza / cooldown:**  
  **Nessun cooldown.** `painCheckMessage` viene impostato a ogni `loadPains()` (mount hook + `refreshPains()`). In `send()`, il pain check viene mostrato **ogni volta** che si verifica la condizione (richiesta piano-like + dolori in DB + non stats + …). Quindi: **stesso dolore può essere richiesto più volte** in una sessione se l’utente continua a scrivere frasi “piano-like” senza aver mai risposto “passato”/“ancora”.

- **2+ dolori:**  
  `generatePainCheckMessage` usa **solo il più vecchio** (primo in lista ordinata per data). Il testo chiede “il dolore è passato o c’è ancora?” riferito a **quella** zona. In PrimeChat, quando l’utente risponde “passato”, si chiama `handlePainGone(currentPainZone)` dove `currentPainZone = pains[0].zona` (solo il primo). Dopo, `refreshPains()` aggiorna la lista; al prossimo pain check il messaggio sarà sul **nuovo** “più vecchio”. Quindi i dolori sono gestiti **in sequenza** (uno per volta), non tutti insieme.

**Problemi**

- **P14 (🟡 Media):** Nessun cooldown: l’utente che chiede più volte “creami un piano” vede ripetere lo stesso pain check finché non risponde sul dolore.
- **P15 (🟢 Bassa):** Con 2+ dolori, il messaggio parla solo del primo; l’utente potrebbe aspettarsi “e il secondo?”. Comportamento coerente ma non esplicitato in UI.

---

## 8. Riepilogo problemi per severità

### 🔴 Alta

| ID | Problema | Proposta fix |
|----|----------|--------------|
| **P3** | Pain check (return #18) scatta per qualsiasi messaggio “piano-like” quando ci sono dolori; fix stats riduce solo parte dei casi. | Usare una condizione “richiesta esplicita di piano” più stretta (es. `isWorkoutPlanRequest` o frase tipo “creami un piano”/“voglio una scheda”) solo per il blocco pain check; oppure richiedere almeno 2 keyword (es. “piano” + “creami”). |
| **P6** | Nessun reset/timeout per `waitingForPainResponse` e `waitingForPainDetails`; utente può restare “bloccato”. | Aggiungere pulsante “Annulla” / “Fai un’altra domanda” che resetta gli stati, oppure timeout (es. dopo N minuti o dopo N messaggi non riconosciuti) con reset. |

### 🟡 Media

| ID | Problema | Proposta fix |
|----|----------|--------------|
| **P1** | `isPlanRequestForPainCheck` troppo generico. | Restringere a frasi più esplicite (es. “creami un piano”, “voglio una scheda”) o riusare/estendere `isWorkoutPlanRequest` in modo coerente. |
| **P4** | FIX BUG 6: “sì”/“ok” interpretati come “dolore passato”. | Intercettare “passato”/“ok”/“sì” solo se **waitingForPainResponse** è già true, oppure richiedere almeno “passato”/“meglio”/“guarito” per evitare “ok” generico. |
| **P5** | Riepilogo onboarding su qualsiasi primo messaggio “piano-like”. | Mostrare riepilogo solo se il messaggio è anche `isWorkoutPlanRequest` (o lista simile), non solo regex generica. |
| **P7** | waitingForPlanConfirmation / waitingForModifyChoice: loop “Non ho capito” senza uscita. | Aggiungere opzione “Annulla” / “Torna alla chat” o comando tipo “annulla” che resetta e risponde con “Torniamo alla chat. Come posso aiutarti?”. |
| **P9** | Doppia logica “richiesta piano” (regex vs isWorkoutPlanRequest). | Unificare: una sola funzione o un solo set di regole per “è richiesta di piano?” usata sia per pain check/onboarding sia per getStructuredWorkoutPlan. |
| **P10** | Falsi positivi isWorkoutPlanRequest (“programma”, “creami” in frasi non-piano). | Escludere contesti negativi (es. “non voglio”, “non creami”) o richiedere pattern più lunghi (es. “creami un piano” invece di “creami”). |
| **P12** | “problema”/“problemi” in isBodyPartForPain può classificare come DOLORE in contesti non medici. | Restringere painKeywords (es. “problema al [corpo]”, “problemi di salute”) o dare priorità a target quando c’è “programma”/“piano”. |
| **P14** | Pain check ripetuto senza cooldown. | Cooldown: non mostrare di nuovo il pain check per lo stesso dolore entro X minuti o fino a risposta esplicita “passato”/“ancora” (es. flag “painCheckShownInSession” per zona). |

### 🟢 Bassa

| ID | Problema | Proposta fix |
|----|----------|--------------|
| **P2** | isStatsOrGeneralQuestion può escludere richieste che contengono “obiettivi”/“risultati”. | Estendere regex o aggiungere eccezione: se il messaggio contiene anche “creami”/“piano”/“scheda”, non considerarlo “solo stats”. |
| **P8** | waitingForModifyValue non usato. | Rimuovere stato o implementare il flusso che lo usa; altrimenti documentare “riservato a uso futuro”. |
| **P11** | Preset “risultati” molto corto. | Opzionale: rimuovere chiave “risultati” o sostituirla con frasi più lunghe; oppure lasciare com’è. |
| **P13** | Ordine BODY_PART_SYNONYMS determina quale zona viene restituita se ce n’è più di una. | Documentare; eventualmente ordinare per “specificità” (es. “menisco” prima di “ginocchio”) se serve. |
| **P15** | Con 2+ dolori si chiede solo del primo. | Opzionale: nel messaggio scrivere “Ho più zone segnate; parliamo prima di [zona]. È passato o c’è ancora?”. |

---

**Fine analisi.** Nessuna modifica al codice è stata applicata; il documento è solo analitico.

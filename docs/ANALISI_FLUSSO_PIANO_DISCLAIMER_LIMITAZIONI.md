# ANALISI INFORMATIVA: Flusso piano + disclaimer + limitazioni
# app-user — Performance Prime

**Data:** 11 Marzo 2026  
**Obiettivo:** Raccogliere dettagli tecnici per ridisegnare il flusso "creami un piano" e fixare l’etichetta limitazioni. Solo analisi, nessuna modifica.

---

## DOMANDA 1 — Flusso attuale "creami un piano" completo

### Ordine delle condizioni in `send()` (PrimeChat.tsx)

Quando l’utente scrive "creami un piano", le condizioni vengono valutate in questo ordine (dopo escape e `waitingFor*` specifici):

1. **Escape universale** (righe ~385-416): se messaggio = "annulla"|"esci"|… → reset stati e return.
2. **waitingForPainResponse** (righe ~419-502): se true, messaggio interpretato come risposta al pain check (passato/ancora); possibile return.
3. **waitingForPainDetails** (righe ~504-691): se true, messaggio = dettaglio dolore (destro/sinistro) → salvataggio dolore + chiamata `getStructuredWorkoutPlan` + return.
4. **waitingForPainPlanConfirmation** (righe ~694-832): se true, messaggio = conferma/rifiuto piano dopo dolore → eventuale `getStructuredWorkoutPlan` + return.
5. **waitingForPlanConfirmation** (righe ~835-1006): se true, messaggio = conferma/modifica riepilogo onboarding → return o continua.
6. **waitingForModifyChoice** (righe ~1009-1039): se true, messaggio = modifica preferenze → return o continua.
7. **Dolore nel messaggio corrente** (righe ~1071-1123): se `isWorkoutPlanRequest(trimmed)` e `isPainContext` (body part + keyword dolore) → chiedi dettagli dolore, `setWaitingForPainDetails(true)`, return.
8. **Pain check (dolori in DB)** (righe ~1128-1179): se `isWorkoutPlanRequest(trimmed)` e `pains.length > 0` e `painCheckMessage` e non stats e zona non già in cooldown → mostra pain check, `setWaitingForPainResponse(true)`, **return**.
9. **Riepilogo onboarding** (righe ~1182-1232): se `isWorkoutPlanRequest(trimmed)` e non in attesa di conferma/dolore → chiamata `generateOnboardingSummaryMessage(userId)`; se c’è riepilogo → `setPendingPlanRequest(trimmed)`, `setWaitingForPlanConfirmation(true)`, **return**.
10. Blocco generale: aggiunta messaggio utente, `setLoading(true)`, poi:
    - **awaitingLimitationsResponse** (righe ~1273-1390): risposta a domanda limitazioni → `parseAndSaveLimitationsFromChat` + `getStructuredWorkoutPlan` + mostra piano o disclaimer → return.
    - **FIX BUG 6** (righe ~1391-1465): dolori in DB + messaggio esplicito risoluzione (passato/guarito/…) → gestione dolore → return o continua.
    - **Fallback preset** (righe ~1467-1525): se preset trovato → messaggio preset → return.
    - **Richiesta piano** (righe ~1527-1615): se `isPlanRequest` (= `isWorkoutPlanRequest(trimmed)` o `pendingPlanRequest`) → **getStructuredWorkoutPlan(planRequestText, userId, sessionId)**; in base a `planResponse` si mostra domanda limitazioni, disclaimer, o piano → return.
    - **Altrimenti** (righe ~1616-1628): **getAIResponse(trimmed, …)**.

### Dove viene mostrato il pain check

- **Blocco 8** (righe 1131-1178): condizione  
  `isWorkoutPlanRequest(trimmed) && pains.length > 0 && painCheckMessage && !waitingForPainResponse && !waitingForPainDetails && !isStatsOrGeneralQuestion`  
  e zona non in `painZonesCheckedInSession`.  
- Messaggio mostrato: `painCheckMessage` (da `usePainTracking` → `generatePainCheckMessage`) + testo fisso con link professionisti.  
- Azione: `setWaitingForPainResponse(true)`, `setCurrentPainZone(pains[0].zona)`, **return**.

### Dove viene mostrato il riepilogo onboarding

- **Blocco 9** (righe 1184-1231): condizione  
  `isWorkoutPlanRequest(trimmed) && !waitingForPlanConfirmation && !waitingForPainResponse && !waitingForPainDetails && !waitingForPainPlanConfirmation`.  
- Se non c’è `pendingPlanRequest`, si chiama `generateOnboardingSummaryMessage(userId)`; se restituisce testo, si mostra con `addBotMessage(summaryMessage)`, si setta `pendingPlanRequest(trimmed)` e `waitingForPlanConfirmation(true)` e **return**.

### Dove viene chiamato getStructuredWorkoutPlan

- In **awaitingLimitationsResponse** (riga ~1307): dopo aver salvato limitazioni con `parseAndSaveLimitationsFromChat`, si chiama `getStructuredWorkoutPlan(workoutRequest, userId, currentSessionId)`.
- In **waitingForPainDetails** (righe ~572, 399-402): dopo aver salvato il dolore con `addPain`, si chiama `getStructuredWorkoutPlan(planRequest, userId, sessionId)`.
- In **waitingForPainPlanConfirmation** (righe ~744, 424-427): dopo conferma utente, si chiama `getStructuredWorkoutPlan(planRequest, userId, sessionId)`.
- Nel blocco **richiesta piano** (riga ~1549): `getStructuredWorkoutPlan(planRequestText, userId, currentSessionId)` con `planRequestText = pendingPlanRequest || trimmed`.

### Come viene mostrato il disclaimer

- Quando `getStructuredWorkoutPlan` ritorna `planResponse.hasExistingLimitations && planResponse.hasAnsweredBefore`, si setta `setPendingPlan({ plan, hasLimitations, actions })` e `setShowPlanDisclaimer(true)` (righe ~1670-1708).
- In render (righe 2078-2103): se `showPlanDisclaimer && pendingPlan`, viene renderizzato il componente **HealthDisclaimer** (vedi Domanda 4).

### Il disclaimer ha checkbox o solo testo + bottone?

- **Ha una checkbox obbligatoria.**  
  File: `packages/app-user/src/components/primebot/HealthDisclaimer.tsx`.  
  Checkbox: "Ho letto e compreso il disclaimer sopra" (righe 204-216). Il bottone "Ho capito, continua" è disabilitato finché `!isAccepted` (riga 239).  
  Quindi: testo + checkbox obbligatoria + bottone "Ho capito, continua" + bottone "Trova un Professionista".

### Codice esatto del disclaimer (componente e uso)

- **Path:** `packages/app-user/src/components/primebot/HealthDisclaimer.tsx` (righe 1-241 per la versione non compatta).
- **Props:** `userId`, `disclaimerType: 'workout_plan' | 'onboarding' | 'primebot_question'`, `onAccept`, `context?`, `userHasLimitations?`, `compact?`.
- **Uso in PrimeChat** (righe 2078-2103):

```tsx
{showPlanDisclaimer && pendingPlan && (
  <div className="max-w-[85%] mr-auto mb-4">
    <HealthDisclaimer
      userId={userId}
      disclaimerType="workout_plan"
      onAccept={() => {
        setShowPlanDisclaimer(false);
        const botMessage: Msg = { ... workoutPlan: pendingPlan.plan, actions: pendingPlan.actions };
        setMsgs(m => [...m, botMessage]);
        setPendingPlan(null);
      }}
      context={{ plan_name: pendingPlan.plan.name, workout_type: pendingPlan.plan.workout_type }}
      userHasLimitations={pendingPlan?.hasLimitations ?? false}
    />
  </div>
)}
```

- **Contenuto:** testo `DISCLAIMER_TEXT` (programmi non sostituiscono professionisti; in caso di dolori/infortuni consultare medico/trainer), checkbox "Ho letto e compreso il disclaimer sopra", bottoni "Trova un Professionista" e "Ho capito, continua".

---

## DOMANDA 2 — Sistema pain check nel flusso piano

### Pain check prima o dopo il riepilogo onboarding?

- **Prima.** In `send()` il blocco **pain check** (8) viene valutato prima del blocco **riepilogo onboarding** (9). Quindi: se l’utente ha dolori in DB e scrive "creami un piano", entra nel blocco 8, mostra il pain check e fa **return**; il blocco 9 non viene mai eseguito in quel messaggio.

### Se l’utente risponde "il dolore è passato", il flusso continua da solo verso la creazione del piano?

- **No.** In `waitingForPainResponse` (righe ~419-502), quando l’utente dice che il dolore è passato si chiama `handlePainGone` (o `handleAllPainsGone`), si aggiunge il messaggio del bot, si fa **return**. Non viene chiamato `getStructuredWorkoutPlan` in automatico. L’utente deve inviare di nuovo un messaggio tipo "creami un piano" per arrivare al blocco richiesta piano e generare il piano.

### Se l’utente risponde "ho ancora dolore", cosa succede?

- **Handler:** righe 489-501 in `PrimeChat.tsx`:

```ts
// Utente dice che il dolore c'è ancora
const isPainStill = userMessageLower.includes('ancora') || 
                    userMessageLower.includes('male') || 
                    userMessageLower.includes('no') || 
                    userMessageLower.includes('persiste') ||
                    userMessageLower.includes('fa male');

if (isPainStill && currentPainZone) {
  const response = handlePainStillPresent(currentPainZone);
  setWaitingForPainResponse(false);
  setCurrentPainZone(null);
  addBotMessage(response);
  // NON return - lascia continuare per generare piano con whitelist
}
```

- **Comportamento:** viene chiamato `handlePainStillPresent(currentPainZone)` (da `usePainTracking` → `generatePainStillPresentResponse` in painTrackingService). Si resettano `waitingForPainResponse` e `currentPainZone`, si mostra la risposta del bot. **Non c’è return**: il flusso prosegue nello stesso `send()`. Però subito dopo c’è solo la chiusura del blocco `if (waitingForPainResponse && trimmed)`; non c’è in quel punto una chiamata a `getStructuredWorkoutPlan`. Quindi si prosegue verso i blocchi successivi (es. riepilogo onboarding, poi più in basso il blocco "richiesta piano"). In teoria, se le condizioni del blocco richiesta piano sono soddisfatte (es. `isPlanRequest` vero perché `trimmed` era "sì ancora" e `isWorkoutPlanRequest("sì ancora")` è false), in quel messaggio non si genera il piano. In pratica, dopo "ancora" l’utente deve scrivere di nuovo "creami un piano" per generare il piano (come per "passato").

---

## DOMANDA 3 — getStructuredWorkoutPlan

### Firma

- **File:** `packages/app-user/src/lib/openai-service.ts` (righe 416-431).

```ts
export const getStructuredWorkoutPlan = async (
  request: string,
  userId: string,
  sessionId?: string
): Promise<{
  success: boolean;
  plan?: StructuredWorkoutPlan;
  message?: string;
  remaining?: number;
  type?: 'plan' | 'question' | 'error';
  question?: string;
  awaitingLimitationsResponse?: boolean;
  hasExistingLimitations?: boolean;
  hasAnsweredBefore?: boolean;
  errorType?: 'json_parse' | 'api_error' | 'validation_error';
}>
```

### Come vengono passate le limitazioni fisiche al piano

- **Non passate esplicitamente come parametri.**  
  Dentro `getStructuredWorkoutPlan`:
  1. Si chiama **getSmartLimitationsCheck(userId)** (riga 449) → legge da DB (onboarding) e ritorna `needsToAsk`, `hasExistingLimitations`, `limitations`, `zones`, `medicalConditions`, `suggestedQuestion`, `hasAnsweredBefore`.
  2. Se `needsToAsk === true` si ritorna la domanda (type `'question'`) senza generare il piano.
  3. Si chiama **getUserContext(userId)** (riga 475) → stesso DB, costruisce il contesto (include limitazioni/zone da onboarding).
  4. La sezione limitazioni nel **system prompt** (righe 491-546) viene costruita da `limitationsCheck.hasExistingLimitations` e `limitationsCheck.limitations` / `limitationsCheck.zones` / `limitationsCheck.medicalConditions`.  
  Quindi le limitazioni arrivano da **getSmartLimitationsCheck** (e indirettamente da **getUserContext** per il contesto generale); entrambi leggono da **user_onboarding_responses** (via `onboardingService.loadOnboardingData`).

### Il piano tiene conto dei dolori salvati in DB (user_pains) o solo onboarding?

- **Non esiste una tabella `user_pains`.** I dolori sono salvati in **user_onboarding_responses**: colonne `zone_dolori_dettagli` (JSON array), `zone_evitare` (array), `limitazioni_fisiche` (string), `ha_limitazioni` (boolean).  
  **getUserPains** (painTrackingService) legge `user_onboarding_responses` (zone_dolori_dettagli, zone_evitare, limitazioni_fisiche, ha_limitazioni). **addPain** / **removePain** aggiornano la stessa tabella.  
  **getSmartLimitationsCheck** usa **loadOnboardingData** che fa `select *` da `user_onboarding_responses`, quindi legge `limitazioni_fisiche`, `zone_evitare`, `ha_limitazioni`, ecc.  
  Quindi il piano **tiene conto sia delle limitazioni “onboarding” sia dei dolori salvati in chat**: tutti finiscono in `user_onboarding_responses` (zone_evitare, zone_dolori_dettagli, limitazioni_fisiche).

### System prompt usato per generare il piano

- **File:** `packages/app-user/src/lib/openai-service.ts` (righe 491-546 per la sezione limitazioni; righe 555-630 ca. per il prompt completo).
- **Sezione limitazioni** (condensato): se `limitationsCheck.hasExistingLimitations && limitationsCheck.limitations` si costruisce `limitationsSection` con:
  - testo tipo: "L'utente ha dichiarato: \"...\"", "Zone del corpo da EVITARE: ...", eventuali condizioni mediche;
  - lista **ESERCIZI ASSOLUTAMENTE VIETATI** (da `getExcludedExercises(limitationsCheck.limitations)`);
  - regole obbligatorie (escludere esercizi, solo esercizi sicuri, ridurre intensità, ecc.);
  - esempi di esercizi sicuri per spalla/schiena/ginocchio.
- **Prompt completo:** inizia con "IMPORTANTE: Rispondi SEMPRE e SOLO in italiano...", poi `${limitationsSection}`, poi regole su variazione set/rep, formato JSON, ecc. (vedi righe 555+).

---

## DOMANDA 4 — Disclaimer attuale

### Componente / codice completo

- **Path:** `packages/app-user/src/components/primebot/HealthDisclaimer.tsx` (righe 1-241 per la versione non compatta).
- **Props:** `userId`, `disclaimerType`, `onAccept`, `context?`, `userHasLimitations?`, `compact?`.
- **Contenuto:** testo disclaimer (`DISCLAIMER_TEXT` o `DISCLAIMER_TEXT_COMPACT`), icona (AlertTriangle se `userHasLimitations`, altrimenti Shield), **checkbox** "Ho letto e compreso il disclaimer sopra", bottone "Trova un Professionista" (navigate `/professionisti`), bottone "Ho capito, continua" (disabled se `!isAccepted`).

### Checkbox

- **Sì:** checkbox obbligatoria; il bottone di conferma è disabilitato finché `isAccepted` non è true (righe 204-216, 239).

### Dopo l’accettazione

- **onAccept** (in PrimeChat): `setShowPlanDisclaimer(false)`, creazione di un messaggio bot con `workoutPlan: pendingPlan.plan` e `actions: pendingPlan.actions`, `setMsgs(m => [...m, botMessage])`, `setPendingPlan(null)`.  
  Quindi **il piano viene mostrato subito** nel thread come messaggio bot; **nessuna seconda chiamata API**. Il piano era già stato generato prima di mostrare il disclaimer (è in `pendingPlan.plan`).

### Tabella DB per l’accettazione

- **Sì:** tabella **health_disclaimer_acknowledgments**.  
  In **HealthDisclaimer** (righe 61-69): alla pressione di "Ho capito, continua" si fa `supabase.from('health_disclaimer_acknowledgments').insert({ user_id, disclaimer_type, acknowledged: true, acknowledged_at, context })`, poi si chiama `onAccept()`.  
  Riferimenti: `packages/app-user/src/integrations/supabase/types.ts` (riga 360), documentazione progetto.

---

## DOMANDA 5 — Label "Limitazioni fisiche" nel prompt

### formatUserContextForPrompt — righe con etichetta limitazioni

- **File:** `packages/app-user/src/services/primebotUserContextService.ts`.
- **Limitazioni nel contesto per il prompt generico** (righe 404-411):  
  - `if (context.ha_limitazioni && context.limitazioni_descrizione)` → `parts.push(\`⚠️ Ha limitazioni fisiche: ${context.limitazioni_descrizione}.\`);`  
  Qui **non** c’è la stringa "Limitazioni fisiche" come label; c’è "Ha limitazioni fisiche: ...".
- **Zone da proteggere** (righe 409-411): `parts.push(\`🚫 Zone da NON sollecitare: **${context.zone_da_proteggere.join(', ')}**.\`);`
- **Dettagli dolori** (righe 425-426): `parts.push(\`📍 Dettagli dolori o zone sensibili: ${context.zone_dolori_dettagli}.\`);`

### Riepilogo onboarding (generateOnboardingSummaryMessage) — etichetta "Limitazioni fisiche"

- **Righe 944-961** in `primebotUserContextService.ts`:

```ts
let limitazioniText = 'Nessuna indicata';
if (data.ha_limitazioni === true && data.limitazioni_fisiche) {
  limitazioniText = data.limitazioni_fisiche;
} else if (data.ha_limitazioni === false) {
  limitazioniText = 'Nessuna';
}
// ...
- **Limitazioni fisiche**: ${limitazioniText}
```

- **Campo usato:** `data.limitazioni_fisiche` e `data.ha_limitazioni`; `data` viene da `loadOnboardingData(userId)` → tabella **user_onboarding_responses** (campi `limitazioni_fisiche`, `ha_limitazioni`).

### Campi separati motorie vs alimentari

- In **user_onboarding_responses** (e nei tipi/servizi):  
  - **Limitazioni/dolori:** `ha_limitazioni`, `limitazioni_fisiche`, `zone_evitare`, `zone_dolori_dettagli`, `condizioni_mediche`.  
  - **Alimentari:** `allergie_alimentari` (es. in UserContext e in `formatUserContextForPrompt`: "Allergie alimentari", righe 419-421).  
  Quindi sì: ci sono campi separati (limitazioni fisiche/dolori vs allergie alimentari); non c’è un unico campo "limitazioni".

---

## DOMANDA 6 — Salvataggio dolori nel flusso piano

### "Mi fa male il ginocchio" durante la richiesta di un piano

- Se il messaggio viene riconosciuto come **dolore nel messaggio + richiesta piano** (blocco 7: `isPainContext` e body part), si entra in **waitingForPainDetails**: si chiede destro/sinistro/entrambi (o conferma). Alla risposta successiva (es. "sinistro") si chiama **addPain(userId, finalZone, descrizione, 'chat')** (riga 384 in PrimeChat).
- **addPain** è in `packages/app-user/src/services/painTrackingService.ts` (righe 123-181): aggiorna **user_onboarding_responses** (upsert su `user_id`) con `zone_dolori_dettagli`, `zone_evitare`, `ha_limitazioni: true`, `limitazioni_fisiche`, `limitazioni_compilato_at`.  
  Quindi **tabella:** `user_onboarding_responses`; **funzione:** `addPain`.

### Se l’utente dice "non ho dolori"

- Nel flusso **waitingForPainResponse**, se l’utente dice che il dolore è passato (es. "tutti passati") si chiama **handleAllPainsGone** → **removeAllPains(userId)** (painTrackingService): aggiorna `user_onboarding_responses` con `zone_dolori_dettagli: []`, `zone_evitare: []`, `ha_limitazioni: false`, `limitazioni_fisiche: null`.  
  Quindi "non ho dolori" (inteso come "tutti passati") **viene salvato** come assenza di limitazioni/dolori nella stessa tabella.
- Nel flusso **domanda limitazioni** (awaitingLimitationsResponse), se l’utente risponde che non ha limitazioni, **parseAndSaveLimitationsFromChat** può settare `ha_limitazioni: false` e campi correlati in `user_onboarding_responses` (primebotUserContextService).

### Funzione esplicita "nessun dolore" / "tutto ok"

- Non esiste una funzione dedicata con nome tipo `saveNoPain`.  
  L’assenza di dolori viene rappresentata con **removeAllPains** (tutti i dolori rimossi) o con **parseAndSaveLimitationsFromChat** quando l’utente risponde alla domanda limitazioni con un “no” (ha_limitazioni: false).

---

## Riepilogo: cosa esiste già vs cosa va costruito

### Esiste già

- Flusso "creami un piano" con ordine: escape → pain response → pain details → pain plan confirmation → plan confirmation → modify choice → dolore nel messaggio → **pain check** → **riepilogo onboarding** → poi in blocco generale: limitazioni → fallback → **getStructuredWorkoutPlan** → AI.
- Pain check mostrato **prima** del riepilogo onboarding quando ci sono dolori in DB; cooldown per zona per sessione.
- **getStructuredWorkoutPlan(request, userId, sessionId)** con limitazioni lette da **getSmartLimitationsCheck(userId)** (user_onboarding_responses); system prompt con sezione limitazioni ed esclusioni esercizi.
- Piano che usa **user_onboarding_responses** (zone_dolori_dettagli, zone_evitare, limitazioni_fisiche, ha_limitazioni); niente tabella `user_pains` separata.
- **HealthDisclaimer**: checkbox obbligatoria, salvataggio in **health_disclaimer_acknowledgments**, onAccept che mostra il piano già in `pendingPlan` (nessuna nuova chiamata API).
- **formatUserContextForPrompt**: "Ha limitazioni fisiche: ...", "Zone da NON sollecitare: ...", "Dettagli dolori ..."; **generateOnboardingSummaryMessage**: label "**Limitazioni fisiche**: ${limitazioniText}" (riga 961).
- Salvataggio dolori: **addPain** / **removePain** / **removeAllPains** su user_onboarding_responses; "nessun dolore" = removeAllPains o risposta limitazioni con ha_limitazioni: false.

### Da costruire / da ridisegnare (per il nuovo flusso)

- **Flusso unificato piano + dolore:** oggi dopo "il dolore è passato" o "ancora" l’utente deve riscrivere "creami un piano"; si può introdurre un flusso che dopo la risposta al pain check generi il piano in automatico (una sola richiesta verbale).
- **Etichetta limitazioni:** oggi in riepilogo è "**Limitazioni fisiche**: Nessuna indicata / Nessuna / testo"; eventuale rinomina o distinzione (es. "Dolori/limitazioni" vs "Allergie") e coerenza con i campi DB.
- **Scelta esplicita "nessun dolore":** non c’è una funzione/UX dedicata tipo "Nessun dolore" / "Tutto ok" che setta solo ha_limitazioni: false senza passare da removeAllPains; si può aggiungere per chiarezza e per il nuovo flusso.
- **Disclaimer e piano:** oggi il piano viene generato prima del disclaimer; il disclaimer serve solo come conferma prima di mostrarlo. Se si vuole un flusso "prima accetti, poi genero", andrebbe spostata la chiamata a getStructuredWorkoutPlan dopo l’accettazione (con possibile loading e seconda chiamata).

---

*Fine analisi. Nessuna modifica al codice.*

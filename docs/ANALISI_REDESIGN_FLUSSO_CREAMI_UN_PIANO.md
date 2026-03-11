# ANALISI INFORMATIVA: Redesign flusso "creami un piano"
# app-user — Performance Prime

**Data:** 11 Marzo 2026  
**Obiettivo:** Raccogliere dettagli tecnici per ridisegnare il flusso "creami un piano" in PrimeChat.tsx. Solo analisi, nessuna modifica.

---

## CONTESTO DEL NUOVO FLUSSO (RICHIESTO)

1. **Rilevamento tipo piano:** "piano allenamento" → flusso allenamento; "piano alimentare/nutrizionale" → flusso nutrizione; "creami un piano" generico → bottoni scelta tipo.
2. **Piano ALLENAMENTO:** se dolori in DB → messaggio + [Aggiorna] [Procedi]; se no dolori → "Hai dolori o limitazioni?"; risposta → genera piano → disclaimer → piano.
3. **Piano NUTRIZIONE:** se allergie in DB → messaggio + [Aggiorna] [Procedi]; se no → "Hai allergie o intolleranze?"; risposta → genera piano nutrizionale → disclaimer → piano.

---

## DOMANDA 1 — Rilevamento tipo piano attuale

### Esiste già logica che distingue "piano allenamento" da "piano nutrizione"?

**No.** In PrimeChat non c’è alcuna distinzione: ogni richiesta di piano viene trattata come piano di **allenamento**. Non esiste un flusso dedicato per piani nutrizionali.

### isWorkoutPlanRequest() — include "alimentare", "nutrizionale", "dieta"?

**No.** La funzione considera solo keyword generiche (piano, programma, scheda, allenamento per, creami, fammi, genera, crea un piano, ecc.). **Nessuna** parola tipo "alimentare", "nutrizionale", "dieta", "alimentazione".

**Path:** `packages/app-user/src/components/PrimeChat.tsx`  
**Righe:** 60-77

```ts
function isWorkoutPlanRequest(text: string): boolean {
  const keywords = [
    'piano',
    'programma',
    'scheda',
    'allenamento per',
    'creami',
    'fammi',
    'genera',
    'crea un piano',
    'fammi un piano',
    'mi serve un piano',
    'voglio un piano',
  ];
  const textLower = text.toLowerCase();
  return keywords.some(keyword => textLower.includes(keyword));
}
```

**Gap:** Per il nuovo flusso servono:
- Una funzione (o estensione) che rilevi "piano alimentare/nutrizionale/dieta" → tipo `nutrition`.
- Una funzione che rilevi "piano allenamento" esplicito → tipo `workout`.
- Messaggio generico "creami un piano" → tipo `generic` (mostra bottoni).

### getStructuredWorkoutPlan può già generare piani nutrizionali?

**No.** Genera **solo** piani di allenamento. Il system prompt è interamente orientato a esercizi, set/rep, limitazioni fisiche, zone da evitare, esclusioni esercizi.

**Path:** `packages/app-user/src/lib/openai-service.ts`  
**Firma:** righe 416-431 (ritorna `plan?: StructuredWorkoutPlan`).  
**Chiamata API:** `fetch('/api/ai-chat', ...)` con `workoutPlanSystemPrompt` (righe 552-704, 716-725, 733-742).

**System prompt (sezioni rilevanti):**
- Righe 552-555: "Sei PrimeBot, esperto di Performance Prime. L'utente ha richiesto un **piano di allenamento**."
- Righe 556-557: `${limitationsSection}` (limitazioni fisiche, zone da evitare, esercizi vietati).
- Righe 558-704: regole variazione set/rep, tipi esercizi (composti, isolamento, a tempo), esempio JSON con `name`, `workout_type`, `exercises` (nome, sets, reps, rest_seconds, notes, exercise_type).
- Nessuna menzione di nutrizione, dieta, pasti, calorie, macronutrienti.

**Gap:** Per piani nutrizionali serve o una **funzione separata** (es. `getStructuredNutritionPlan`) con system prompt dedicato, o un parametro `planType: 'workout' | 'nutrition'` e due prompt diversi nella stessa funzione.

---

## DOMANDA 2 — Stato attuale dei bottoni in chat

### Esistono già bottoni/azioni inline nei messaggi bot?

**Sì.** I messaggi bot possono avere un array `actions` (tipo `ParsedAction[]`). Ogni azione viene renderizzata come bottone tramite il componente **ActionButton**.

### Come vengono renderizzati i bottoni oggi?

**Path:** `packages/app-user/src/components/PrimeChat.tsx`  
**Righe:** 2042-2068

- Se `m.role === 'bot' && m.actions && m.actions.length > 0` viene renderizzato un blocco con `m.actions.map((action, idx) => (...))`.
- Per ogni azione: `<ActionButton actionType={action.type} label={action.label} payload={action.payload} onAction={async () => { const result = await executeAction(...); ... }} />`.
- **ActionButton** (`packages/app-user/src/components/primebot/ActionButton.tsx`): accetta `actionType`, `label`, `payload`, `onAction`; mostra `label` come testo del bottone; in base a `actionType` può applicare stili diversi (es. `getButtonStyles()`).

**Esempio esistente:** messaggio pain check con azione "Contatta un professionista" (righe 1165-1176):

```ts
setMsgs(prev => [...prev, {
  id: crypto.randomUUID(),
  role: 'bot' as const,
  text: painMessageWithAction,
  actions: [
    {
      type: 'navigate' as const,
      label: '👨‍⚕️ Contatta un professionista',
      payload: { path: '/professionals' }
    }
  ]
}]);
```

### Posso aggiungere bottoni [🏋️ Piano Allenamento] [🥗 Piano Nutrizione]?

**Sì.** Basta aggiungere un messaggio bot con `actions` contenenti due azioni con `type: 'navigate'` (o un tipo custom se vuoi gestirli in `executeAction` senza navigare). Il tipo **Msg** e la struttura **actions** lo consentono già.

**Tipo Msg (PrimeChat.tsx, righe 39-51):**

```ts
type Msg = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  navigation?: { path: string; label: string; action: string; };
  isDisclaimer?: boolean;
  actions?: ParsedAction[];
  workoutPlan?: StructuredWorkoutPlan;
};
```

**ParsedAction (righe 33-37, da primebotActionsService ActionType):**

```ts
export interface ParsedAction {
  type: ActionType;  // 'save_workout' | 'add_diary' | 'navigate' | 'start_workout'
  label: string;
  payload: Record<string, unknown>;
}
```

**Nota:** Oggi `executeAction` gestisce `navigate` con `payload.path`. Per "Piano Allenamento" / "Piano Nutrizione" puoi usare `type: 'navigate'` con `payload: { path: '#', planType: 'workout' }` e intercettare in `executeAction`, oppure introdurre un nuovo `ActionType` (es. `'choose_plan_type'`) con `payload: { planType: 'workout' | 'nutrition' }` e gestirlo senza cambiare route.

**Gap:** Definire come gestire il click (es. nuovo ActionType o navigate con state) e aggiornare `primebotActionsService.executeAction` se serve.

---

## DOMANDA 3 — Dati allergie/intolleranze in DB

### Tipo di allergie_alimentari in user_onboarding_responses

**Tipo TypeScript (Supabase):** `string[] | null`  
**Path:** `packages/app-user/src/integrations/supabase/types.ts`  
**Righe:** 1907 (Row), 1933 (Insert).

```ts
// user_onboarding_responses.Row
allergie_alimentari: string[] | null
```

### Come viene letto oggi?

- **getUserContext** (primebotUserContextService): legge `onboardingData` da `onboardingService.loadOnboardingData(userId)` (che fa `select *` da `user_onboarding_responses`). Assegna `allergie_alimentari: onboardingData?.allergie_alimentari ?? null` (righe 221-222).
- **formatUserContextForPrompt**: se `context.allergie_alimentari && context.allergie_alimentari.length > 0` aggiunge al prompt: `🥗 Allergie alimentari: **${context.allergie_alimentari.join(', ')}**. Non suggerire alimenti che le contengono.` (righe 420-421).

Non esiste una funzione dedicata tipo `getUserAllergies(userId)`; le allergie sono lette solo come parte del contesto onboarding.

### Come viene scritto?

- **updateOnboardingPreference** (primebotUserContextService, righe 982-1063) **non** include `allergie_alimentari` tra i `validFields` (solo obiettivo, livello_esperienza, giorni_settimana, luoghi_allenamento, tempo_sessione, attrezzi). Quindi **non** si possono aggiornare le allergie tramite questa funzione.
- Scrittura possibile tramite **onboardingService.saveOnboardingData** (upsert su `user_onboarding_responses` con `allergie_alimentari` nel payload), ma non c’è un wrapper tipo `addAllergia()` o `setAllergies()`.

**Gap:** Serve una funzione dedicata (es. `updateAllergies(userId, allergies: string[])`) o estendere `updateOnboardingPreference` con il campo `allergie_alimentari` (e tipo array).

### Il campo è già nel contesto PrimeBot?

**Sì.** In **getUserContext** (riga 222) e in **formatUserContextForPrompt** (righe 420-421), come sopra.

---

## DOMANDA 4 — getStructuredWorkoutPlan per nutrizione

### Riuso per piani nutrizionali o funzione separata?

**Scelta di design:** La funzione attuale è fortemente specializzata (limitazioni fisiche, esercizi, set/rep, `convertAIResponseToPlan` che si aspetta `StructuredWorkoutPlan`). Per nutrizione serve:
- Un system prompt diverso (pasti, calorie, macronutrienti, allergie, non esercizi).
- Una struttura output diversa (es. `StructuredNutritionPlan`: giorni, pasti, alimenti, porzioni, note).
- Stesso endpoint `/api/ai-chat` può essere riusato (è generico: invii `messages` e ricevi testo); la differenza è solo il contenuto del system prompt e il parsing della risposta.

Quindi: **funzione separata** (es. `getStructuredNutritionPlan`) è più pulita, con proprio prompt e tipo `StructuredNutritionPlan`; oppure una sola funzione `getStructuredPlan(request, userId, planType: 'workout' | 'nutrition', sessionId?)` con due branch (prompt + parsing) interni.

### System prompt attuale e nutrizione

Il system prompt in openai-service (righe 552-704) **non** menziona nutrizione. È solo per piano di allenamento (esercizi, serie, ripetizioni, limitazioni fisiche).

### api/ai-chat e piani nutrizionali

**Path:** La chiamata è `fetch('/api/ai-chat', { method: 'POST', body: JSON.stringify({ messages, model: 'gpt-4o-mini' }) })` (righe 734-742). L’endpoint è generico: riceve messaggi e ritorna la risposta OpenAI. **Nessuna modifica** all’API è necessaria per piani nutrizionali; basta inviare un system prompt diverso (e eventualmente un modello diverso se voluto).

### Esiste già StructuredNutritionPlan?

**No.** In `packages/app-user/src/services/workoutPlanGenerator.ts` è definito solo **StructuredWorkoutPlan** (righe 23-34): name, description, workout_type, duration_minutes, difficulty, exercises, warmup, cooldown, therapeuticAdvice, safetyNotes. Non esiste un tipo `StructuredNutritionPlan` né in openai-service né altrove.

**Gap:** Definire interfaccia `StructuredNutritionPlan` (es. name, tipo, giorni, pasti per giorno, allergie considerate, note) e una funzione di parsing della risposta AI (tipo `convertAIResponseToNutritionPlan`).

---

## DOMANDA 5 — Disclaimer per nutrizione

### HealthDisclaimer — disclaimerType per nutrizione?

**No.** I tipi ammessi sono solo: `'workout_plan' | 'onboarding' | 'primebot_question'`.  
**Path:** `packages/app-user/src/components/primebot/HealthDisclaimer.tsx`  
**Riga:** 11

```ts
disclaimerType: 'workout_plan' | 'onboarding' | 'primebot_question';
```

Non esiste `'nutrition_plan'` o simile.

### Il testo del disclaimer cambia in base al tipo?

**No.** C’è un solo testo per il disclaimer esteso (`DISCLAIMER_TEXT`, righe 18-23) e uno compatto (`DISCLAIMER_TEXT_COMPACT`, riga 25). Entrambi parlano di **programmi di allenamento** e di consultare medico/trainer. La variabile `textToShow` è `compact ? DISCLAIMER_TEXT_COMPACT : DISCLAIMER_TEXT` (riga 89); **non** c’è switch su `disclaimerType` per il testo.

```ts
const DISCLAIMER_TEXT = `I programmi di allenamento generati da PrimeBot sono suggerimenti...
Se hai dolori, infortuni, patologie... consultare un medico, fisioterapista o personal trainer...`;
const DISCLAIMER_TEXT_COMPACT = `I programmi di allenamento sono suggerimenti...`;
```

**Gap:** Per nutrizione servono un nuovo `disclaimerType` (es. `'nutrition_plan'`) e testi dedicati (es. "I piani alimentari sono suggerimenti e non sostituiscono un nutrizionista/dietologo...").

### health_disclaimer_acknowledgments può salvare per tipo nutrizione?

**Sì.** La colonna `disclaimer_type` è di tipo **string** (non enum nel TypeScript Supabase).  
**Path:** `packages/app-user/src/integrations/supabase/types.ts`  
**Righe:** 366 (Row), 375 (Insert), 384 (Update)

```ts
disclaimer_type: string
```

Quindi si può già salvare un valore come `'nutrition_plan'` senza modificare il DB. L’unica cosa da fare è estendere il tipo TypeScript della prop in HealthDisclaimer e aggiungere i testi per quel tipo.

---

## DOMANDA 6 — Stato waitingFor* da aggiungere

### Stati richiesti

- `waitingForPlanTypeChoice` — attesa scelta tipo piano (tap su [Piano Allenamento] o [Piano Nutrizione]).
- `waitingForNutritionLimitations` — attesa risposta allergie/intolleranze.
- `waitingForWorkoutLimitationsConfirm` — attesa conferma dolori già in DB ([Aggiorna] o [Procedi]).
- `waitingForNutritionLimitationsConfirm` — attesa conferma allergie già in DB ([Aggiorna] o [Procedi]).

### Esiste già qualcosa di simile?

- **waitingForPlanTypeChoice:** No. Il più vicino è `waitingForPlanConfirmation` (conferma riepilogo onboarding) o `waitingForModifyChoice` (scelta quale campo modificare). Nessuno gestisce una scelta tra due tipi di piano.
- **waitingForNutritionLimitations:** Simile concettualmente a `awaitingLimitationsResponse` (attesa risposta sulla domanda limitazioni fisiche) e a `waitingForPainDetails` (attesa dettaglio dolore). Si può riusare il pattern: messaggio bot con domanda + stato che viene letto al prossimo messaggio utente.
- **waitingForWorkoutLimitationsConfirm / waitingForNutritionLimitationsConfirm:** Simili a `waitingForPainPlanConfirmation` (attesa conferma dopo dolore: procedi o aggiorna). Pattern: messaggio con due bottoni azione; il click su un bottone potrebbe impostare un payload (es. `{ confirm: 'proceed' }` o `{ confirm: 'update' }`) e essere gestito in un handler dedicato (non come testo in `send()`). Oggi le conferme "procedi/aggiorna" non esistono per i dolori in quel modo (c’è solo testo "passato"/"ancora"); i bottoni per [Aggiorna] [Procedi] andrebbero aggiunti e gestiti con nuovi stati.

### Conflitti con stati esistenti

- Gli stati attuali sono: `waitingForPainResponse`, `waitingForPainDetails`, `waitingForPainPlanConfirmation`, `waitingForPlanConfirmation`, `waitingForModifyChoice`, `waitingForModifyValue`, `awaitingLimitationsResponse`.  
- I nuovi stati non confliggono **di nome**. Attenzione a **mutua esclusione**: quando è attivo `waitingForPlanTypeChoice` non deve essere attivo `waitingForPlanConfirmation` (o altro) per la stessa "sessione" di richiesta piano; stessa cosa per nutrizione vs allenamento. Va definito un ordine chiaro e resettare gli stati non più rilevanti quando si entra in un sotto-flusso (es. quando l’utente sceglie "Piano Nutrizione" si resettano eventuali `waitingForPlanConfirmation` / pain-related).

### Ordine in send() dove inserire i nuovi controlli

Ordine attuale rilevante (dopo escape, righe ~415-1180):

1. Escape universale  
2. `waitingForPainResponse`  
3. `waitingForPainDetails`  
4. `waitingForPainPlanConfirmation`  
5. `waitingForPlanConfirmation`  
6. `waitingForModifyChoice`  
7. Dolore nel messaggio (body part + pain)  
8. Pain check (dolori in DB)  
9. Riepilogo onboarding  

Per il redesign:

- **waitingForPlanTypeChoice:** va valutato **prima** del blocco "pain check" e "riepilogo onboarding", quando la richiesta è generica ("creami un piano" senza "allenamento"/"nutrizione"). Se `isGenericPlanRequest(trimmed)` e non siamo già in un sotto-flusso → mostra bottoni e setta `waitingForPlanTypeChoice`. In `send()`, subito dopo gli stati "conferma" esistenti, aggiungere: se `waitingForPlanTypeChoice && trimmed` → non usare il testo come messaggio libero ma verificare se è una risposta alla scelta (o gestire solo click su bottone, vedi sotto).
- **waitingForWorkoutLimitationsConfirm / waitingForNutritionLimitationsConfirm:** potrebbero essere gestiti **solo da click** su ActionButton (payload `confirm: 'proceed' | 'update'`). In quel caso non servono branch in `send()` per il testo; il click chiama `onAction` che setta stato e chiama la logica (es. getStructuredWorkoutPlan o apertura flusso aggiorna).
- **waitingForNutritionLimitations:** dopo aver scelto "Piano Nutrizione" e (se non ci sono allergie in DB) mostrato "Hai allergie o intolleranze?", il prossimo messaggio utente va interpretato come risposta allergie. Posizione: un blocco **dopo** `waitingForPlanConfirmation` (e dopo i blocchi per pain) ma **prima** del blocco "richiesta piano" generica. Ordine suggerito: dopo `waitingForModifyChoice`, prima del rilevamento "dolore nel messaggio".

Riassunto ordine suggerito per i nuovi controlli:

1. (invariato) Escape  
2. (invariato) waitingForPainResponse, waitingForPainDetails, waitingForPainPlanConfirmation, waitingForPlanConfirmation, waitingForModifyChoice  
3. **Nuovo:** waitingForPlanTypeChoice (solo se il "messaggio" arriva come testo che mappa alla scelta, se invece la scelta è solo da bottone questo può essere solo in onAction)  
4. **Nuovo:** waitingForNutritionLimitations (risposta a "Hai allergie?")  
5. **Nuovo:** waitingForWorkoutLimitationsConfirm / waitingForNutritionLimitationsConfirm (solo da click; in send() eventuale fallback se l’utente scrive "procedi" / "aggiorna")  
6. (invariato) Dolore nel messaggio, pain check, riepilogo onboarding, … resto

---

## DOMANDA 7 — Tabelle DB mancanti

### allergie_alimentari in user_onboarding_responses: sufficiente?

**Sì, per il flusso descritto.** Il campo è `string[] | null`, adatto a una lista di allergie/intolleranze. Non è obbligatoria una tabella separata a meno che non si vogliano storico, date, fonte (chat vs onboarding), ecc. Per "ho già salvato che sei intollerante a X, vuoi aggiornare o procedi?" basta leggere e mostrare `user_onboarding_responses.allergie_alimentari`.

### Dove salvare i piani nutrizionali generati?

- **custom_workouts** (types.ts righe 318-331): è per allenamenti (title, exercises, workout_type, total_duration, completed, scheduled_date). Lo schema non è adatto a pasti/alimenti/macronutrienti.
- **workout_plans** (types.ts 2079+): nome, obiettivo, durata, esercizi (Json), luogo, ecc. Anch’esso orientato ad allenamenti.

**Conclusione:** Non esiste una tabella adatta per "piani nutrizionali" salvati. Opzioni:
- Creare una nuova tabella (es. `nutrition_plans`: user_id, name, plan_type, content Json, created_at, ecc.).
- Oppure riusare una tabella generica "piani" con un campo `plan_type: 'workout' | 'nutrition'` e un JSON `content` che varia per tipo (es. in `workout_plans` aggiungere `plan_type` e usare `esercizi`/metadata per nutrizione come JSON libero). La seconda richiede migrazione (aggiunta colonna e possibili adattamenti).

### Campo per distinguere piano allenamento vs nutrizione nel disclaimer

La tabella **health_disclaimer_acknowledgments** ha `disclaimer_type: string`. Oggi si usa `'workout_plan'`. Per nutrizione basta salvare `'nutrition_plan'` (o `'nutrition_plan'` come nuovo valore). **Nessuna migrazione DB** necessaria per il disclaimer.

### Migrazioni Supabase da considerare

- **Solo se** si vogliono salvare i piani nutrizionali in DB: creare tabella `nutrition_plans` (o equivalente) o estendere `workout_plans` con `plan_type` + uso del JSON per contenuto nutrizione.
- Per allergie e disclaimer: **nessuna migrazione** richiesta.

---

## OUTPUT RIEPILOGATIVO

### Cosa esiste già e si può riusare

| Elemento | Dove | Note |
|----------|------|------|
| Rilevamento richiesta piano | `isWorkoutPlanRequest` | Estendere con keyword nutrizione e logica tipo (workout / nutrition / generic) |
| Bottoni in chat | `Msg.actions`, `ActionButton`, `executeAction` | Aggiungere messaggi con azioni [Piano Allenamento] [Piano Nutrizione] e [Aggiorna] [Procedi] |
| Allergie in contesto | `getUserContext`, `formatUserContextForPrompt` | Già letti e inclusi nel prompt; nessun getter dedicato |
| API generica AI | `fetch('/api/ai-chat')` | Stesso endpoint per piani nutrizione (cambia solo prompt) |
| Disclaimer e salvataggio | `HealthDisclaimer`, `health_disclaimer_acknowledgments` | Estendere `disclaimerType` e testi; DB già accetta qualsiasi string per `disclaimer_type` |
| Pattern stati attesa | `waitingForPlanConfirmation`, `awaitingLimitationsResponse` | Stesso pattern per waitingForNutritionLimitations e conferme |
| Salvataggio limitazioni | `parseAndSaveLimitationsFromChat`, onboarding | Pattern per allergie da replicare (funzione tipo `parseAndSaveAllergiesFromChat` + save) |

### Cosa va costruito da zero

| Elemento | Descrizione |
|----------|-------------|
| Rilevamento tipo piano | Funzione(e) per distinguere "piano allenamento" / "piano nutrizionale" / generico |
| Flusso scelta tipo | Messaggio con due bottoni; stato `waitingForPlanTypeChoice`; gestione click (o risposta testuale) |
| Flusso conferma dolori in DB | Messaggio "Ho già salvato che hai dolore a X..." + [Aggiorna] [Procedi]; stati e handler per procedi/aggiorna |
| Flusso conferma allergie in DB | Messaggio "Ho già salvato che sei intollerante a X..." + [Aggiorna] [Procedi]; stati e handler |
| Domanda allergie se assenti | Messaggio "Hai allergie o intolleranze?" + stato `waitingForNutritionLimitations` |
| getStructuredNutritionPlan (o equivalente) | Nuova funzione + system prompt nutrizione + tipo `StructuredNutritionPlan` + parsing risposta |
| Aggiornamento allergie | Funzione tipo `updateAllergies(userId, allergies)` o estensione `updateOnboardingPreference` |
| HealthDisclaimer nutrizione | Nuovo `disclaimerType: 'nutrition_plan'` e testi DISCLAIMER per nutrizione |
| Salvataggio piani nutrizionali (opzionale) | Tabella `nutrition_plans` o estensione tabella esistente + logica di salvataggio |

### Tabelle DB da creare/modificare

| Tabella | Azione |
|---------|--------|
| user_onboarding_responses | Nessuna modifica; `allergie_alimentari` già presente |
| health_disclaimer_acknowledgments | Nessuna modifica; usare `disclaimer_type = 'nutrition_plan'` |
| nutrition_plans (nuova) | Creare **solo se** si vogliono salvare i piani nutrizionali generati |

### Rischi o problemi da risolvere prima

1. **Ordine e reset stati:** Definire in modo chiaro quando resettare quali `waitingFor*` (es. alla scelta "Piano Nutrizione" resettare stati relativi al piano allenamento e viceversa) per evitare flussi incoerenti.
2. **Click vs testo:** Per [Aggiorna] [Procedi] e [Piano Allenamento] [Piano Nutrizione] decidere se la risposta è solo da click (onAction) o anche da testo ("procedi", "piano allenamento"); se da testo, aggiungere branch in `send()` e normalizzare le stringhe.
3. **ActionType:** Se si usano bottoni con azione custom (es. scelta tipo piano o conferma procedi/aggiorna), estendere `ActionType` e `executeAction` in primebotActionsService per non navigare ma solo chiamare callback/setState (o passare handler da PrimeChat).
4. **Limite mensile AI:** `getStructuredWorkoutPlan` usa `checkMonthlyLimit(userId)`; applicare lo stesso limite a `getStructuredNutritionPlan` (o alla funzione unificata) per coerenza.
5. **UI piano nutrizione:** Oggi i messaggi con `workoutPlan` vengono renderizzati con componente per piano allenamento (esercizi, GIF, ecc.). Per piani nutrizionali servirà un componente di visualizzazione dedicato (es. giorni/pasti/alimenti) o un blocco JSON/testo formattato.

---

*Fine analisi. Nessuna modifica al codice.*

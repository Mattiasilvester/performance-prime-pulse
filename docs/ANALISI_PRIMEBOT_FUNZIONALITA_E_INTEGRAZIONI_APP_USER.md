# Analisi PrimeBot — Funzionalità attuali e punti di integrazione (app-user)

**Data:** 11 Marzo 2026  
**Scope:** `packages/app-user` (Performance Prime — app utente)  
**Tipo:** Solo analisi, nessuna modifica al codice.

---

## 1. Interfaccia chat attuale

### Componente principale
- **File:** `packages/app-user/src/components/PrimeChat.tsx`
- **Wrapper:** `packages/app-user/src/components/ai/AICoachPrime.tsx` (include PrimeChat + Azioni Rapide + modal fullscreen)
- **Pagina:** Route `/ai-coach` → `AICoachWrapper` → `AICoach` → `AICoachPrime` → `PrimeChat`

### Struttura UI
- **Landing PrimeBot (prima di “Inizia Chat”):** Card centrata con icona fulmine, titolo “PrimeBot”, sottotitolo, bottone “Inizia Chat con PrimeBot”, 3 card feature (Allenamenti, Obiettivi, Progressi). **Nessun messaggio** fino al click.
- **Dopo “Inizia Chat”:** Interfaccia **fullscreen** (fixed inset-0, z-9999), header con back, titolo “PrimeBot • Online • Sempre disponibile”, area messaggi scrollabile, input in basso.
- **Modal vs inline:** `PrimeChat` riceve `isModal?: boolean`. Se `isModal=true` (es. da AICoachPrime modal) il layout è dentro un container fullscreen; se `false` è la vista a 2 colonne nella pagina `/ai-coach`. In entrambi i casi la chat è la stessa (fullscreen quando `hasStartedChat`).

### Cronologia messaggi
- **Persistenza:** Sì, in DB. Ogni scambio user/bot viene salvato in `primebot_interactions` tramite `saveInteraction()` (`primebotConversationService.ts`). Campi: `user_id`, `session_id`, `message_content`, `bot_response`, `interaction_type`, `user_context`, `bot_intent`, `timestamp`.
- **Uso della cronologia:** La cronologia **non** viene caricata in UI all’apertura della chat. I messaggi visibili sono solo quelli in stato React `msgs` (sessione corrente in memoria). La cronologia dal DB viene usata **solo** per il contesto inviato a OpenAI: `getSessionHistory(userId, sessionId, 10)` → `formatHistoryForOpenAI` → ultimi 10 messaggi aggiunti ai `messages` per l’API. Quindi: **log/context sì, “storico chat” visibile no**.

### Suggerimenti rapidi / prompt predefiniti
- **Sì.** Due set di domande in `PrimeChat.tsx`:
  - **Nuovo utente** (`isNewUser`): “Mostrami la Dashboard”, “Come creare un allenamento?”, “Spiegami le funzionalità premium”, “Come tracciare i progressi?”, “Quali sono i prossimi passi?”
  - **Utente normale:** “Come posso migliorare la mia resistenza?”, “Quale workout è meglio per oggi?”, “Consigli per la nutrizione pre-allenamento”, “Come posso raggiungere i miei obiettivi?”
- **Rendering:** `questionsToShow.map(q => <button onClick={() => { setInput(q); send(q); }}>...)` — pulsanti sotto l’input (sia in vista landing che in vista chat, dove presenti). Click = imposta input e invia subito.

### Props dal contesto / dati esterni
- **Props dichiarate:** Solo `isModal?: boolean`. Nessun prop per “ultimo allenamento”, dati workout, obiettivi, ecc.
- **Dati utente:** PrimeChat ottiene `userId`, `userName`, `userEmail` da `supabase.auth.getUser()` e `fetchUserProfile()` in un `useEffect` al mount. Il contesto per l’AI (obiettivi, livello, limitazioni, ecc.) viene caricato **dentro** `getAIResponse` / `getStructuredWorkoutPlan` tramite `getUserContext(userId)` che legge **solo** onboarding (`onboardingService.loadOnboardingData`) e profilo (nome). Nessun dato workout/storico passato al prompt.

### Struttura sintetica del componente PrimeChat
- **State:** `msgs`, `input`, `loading`, `scrollRef`, `userId`, `userName`, `userEmail`, `hasStartedChat`, `sessionId`, `pendingPlan`, `showPlanDisclaimer`, `awaitingLimitationsResponse`, `originalWorkoutRequest`, `isNewUser`, stati per pain tracking (`waitingForPainResponse`, `currentPainZone`, ecc.), stati per modifica preferenze e onboarding (`waitingForPlanConfirmation`, `waitingForModifyChoice`, ecc.).
- **Props:** `isModal?: boolean`.
- **Funzioni principali:** `send()` (invio messaggio: fallback → AI o piano strutturato, salvataggio interazione, gestione pain/limitazioni), `addBotMessage()`, `parseActionsFromText()`, `isWorkoutPlanRequest()`, `renderFormattedMessage()`; logica per piano strutturato, disclaimer salute, azioni `[ACTION:...]`, pain detection.
- **Servizi usati:** `getAIResponse`, `getPrimeBotFallbackResponse`, `getOrCreateSessionId`, `saveInteraction`, `executeAction`, `getStructuredWorkoutPlan`, `generateOnboardingSummaryMessage`, `updateOnboardingPreference`, `parseModifyRequest`, `usePainTracking`, `detectBodyPartFromMessage`, `addPain`.

---

## 2. Trigger e punti di accesso

### Da dove si accede a PrimeBot
- **Route dedicata:** `/ai-coach` (pagina “PrimeBot” nel menu).
- **Dashboard:** Quick Actions con card “PrimeBot” / “Chiedi a PrimeBot” → `handlePrimeBotClick` → `navigate('/ai-coach')` (`QuickActions.tsx`).
- **Widget floating:** `PrimeBotWidget.tsx` — bottone fisso in basso a destra (robot SVG). Visibile su tutte le route tranne quelle in `EXCLUDED_PATHS` (landing `/`, onboarding, auth, terms, privacy, `/workout/quick`, `/timer`). Click sul robot apre il **bubble** con 4 azioni; nessun click apre direttamente la chat fullscreen.

### Apertura automatica in contesti specifici
- **No.** Non c’è logica che apre PrimeBot automaticamente dopo un workout completato, dopo l’onboarding o in altri momenti. L’unica “automazione” è il bubble del widget che si apre al primo visit (`isFirstVisit`) dopo 600 ms; le azioni del bubble sono solo navigazione (chat, workout, piano, tour).

### PrimeBotWidget — Le 4 azioni nel bubble
Definite in `PrimeBotWidget.tsx` in un array di oggetti `{ action, icon, label, sub }`:

| # | Action | Label              | Subtitle                 | Comportamento |
|---|--------|--------------------|---------------------------|---------------|
| 1 | `chat` | Chatta con me      | Consigli personalizzati   | `navigate('/ai-coach')` |
| 2 | `workout` | Inizia il tuo allenamento | Piano pronto per oggi | `navigate('/workouts')` |
| 3 | `plan` | Vedi il tuo piano  | Workout personalizzato    | `navigate('/workouts', { state: { openPiano: true } })` |
| 4 | `tour` | Fai il tour dell'app | Ti guido in 5 step     | Se già su `/dashboard`: `window.dispatchEvent(new CustomEvent('primebot:startTour'))`; altrimenti `navigate('/dashboard?startTour=true')` |

Il bubble si chiude dopo la scelta; per “chattare” l’utente deve poi cliccare “Inizia Chat” nella pagina `/ai-coach`.

---

## 3. Dati workout disponibili

### Tabelle e salvataggio
- **`custom_workouts`:** Allenamenti creati/completati (da Workouts, Quick Workout, piani). Colonne rilevanti: `user_id`, `title`, `workout_type`, `exercises` (Json), `total_duration`, `completed`, `completed_at`, `scheduled_date`, `created_at`, `updated_at`. Insert da `ActiveWorkout.tsx`, `QuickWorkout.tsx`, `primebotActionsService` (save_workout).
- **`user_workout_stats`:** Aggregate per utente: `user_id`, `total_workouts`, `total_hours`, `current_streak_days`, `longest_streak_days`, `last_workout_date`, `updated_at`. Aggiornato da `workoutStatsService.updateWorkoutStats()` e da `diaryService` (streak); lettura in `fetchWorkoutStats`, Dashboard, `WeeklyProgress`, `monthlyStatsService`.
- **`workout_diary`:** Entries “diario” (saved/completed). Colonne: `user_id`, `workout_id`, `workout_source`, `workout_name`, `workout_type`, `status`, `duration_minutes`, `exercises_count`, `exercises` (Json), `completed_at`, `saved_at`, `notes`, `photo_urls`. Operazioni in `diaryService.ts` (getDiaryEntries, insert, update, sync streak con `user_workout_stats`).
- **`monthly_workout_stats`:** (in types) `user_id`, `month`, `year`, `total_workouts`, `total_hours`. Nel codice, `getMonthlyStats` è stub che ritorna `[]` (TODO quando la tabella sarà disponibile).

### Metriche salvate
- Per sessione: `total_duration`, `completed`, `completed_at`, lista `exercises` (con nome, serie, ripetizioni, peso, note, ecc. in Json).
- Aggregate: numero totale workout, ore totali, streak (giorni consecutivi), ultima data workout.
- Diario: durata, numero esercizi, note, foto, stato saved/completed.

### Schermata riepilogo post-workout
- **Sì.** In `ActiveWorkout.tsx` e `QuickWorkout.tsx`, quando `workoutState === 'completed'` viene mostrata una schermata di completamento:
  - Messaggio “Complimenti! Workout completato con successo”
  - Due bottoni: “Segna Completato” (termina/sync stats) e “Salva su Diario”
- **Nessun riepilogo dettagliato** (es. esercizi fatti, tempo per esercizio, suggerimenti). **Nessun invito a PrimeBot** (es. “Chiedi a PrimeBot un recap” o “Parla con PrimeBot”).

---

## 4. Dati disponibili ma non usati da PrimeBot

Il contesto utente per PrimeBot è costruito **solo** in `primebotUserContextService.ts`: `getUserContext()` usa `onboardingService.loadOnboardingData(userId)` e `fetchUserProfile()` (nome). Non vengono letti:

- **Storico allenamenti:** `custom_workouts`, `workout_diary` — mai passati al system prompt.
- **Statistiche e streak:** `user_workout_stats` (total_workouts, total_hours, current_streak_days, last_workout_date) — non usate da PrimeBot.
- **Obiettivi con scadenze:** `user_objectives` (title, description, progress, completed, completed_at) — non usati.
- **Statistiche mensili:** `monthly_workout_stats` (e `getMonthlyStats` attualmente stub) — non usate.
- **Note/diario testuale:** `notes` (tabella notes) — non usate.
- **Preferenze post-onboarding:** Aggiornamenti in chat (es. “cambia obiettivo”) vengono scritti su `user_onboarding_responses` tramite `updateOnboardingPreference`; questo sì usato al prossimo `getUserContext`. Altre preferenze salvate altrove (es. impostazioni app) non sono nel contesto PrimeBot.

Quindi: **tutti i dati di attività (workout, diario, obiettivi, streak, mensili) esistono nel DB ma PrimeBot non li sfrutta.**

---

## 5. Sistema messaggi PrimeBot

- **Messaggi/notifiche automatiche di PrimeBot:** Non implementate. Nessuna tabella `primebot_messages` o `ai_messages`; nessun job che invia messaggi tipo “Hai saltato 3 allenamenti questa settimana” o messaggi motivazionali automatici. Il riepilogo mensile in `monthlyStatsService.checkMonthlyReset` mostra un toast e chiama `addMonthlyNotification` che è stub (commentato: notifica persistente/push da implementare).
- **Personalità / tono:** Nel system prompt (`openai-service.ts`) c’è una sezione “PERSONALITÀ” fissa: “Motivante ma professionale, Preciso nei dettagli tecnici, Orientato ai risultati, Supportivo e incoraggiante”. Non esiste configurazione utente o per-sessione del tono (es. più tecnico vs più motivazionale).

---

## 6. openai-service.ts — Funzionalità complete

### Funzioni esportate
- **`checkMonthlyLimit(userId)`** — Verifica limite mensile domande AI (tabella `openai_usage_logs` / funzione DB); ritorna `{ canUse, used, remaining }`.
- **`getAIResponse(message, userId, sessionId?)`** — Chat principale: contesto utente, cronologia sessione (ultimi 10 messaggi), system prompt, chiamata `/api/ai-chat`, salvataggio uso e interazione, ritorno risposta testuale (e gestione fallback/errore).
- **`getStructuredWorkoutPlan(request, userId, sessionId?)`** — Generazione piano allenamento strutturato: check limitazioni (getSmartLimitationsCheck), prompt dedicato, chiamata API, parsing JSON → `StructuredWorkoutPlan`, eventuale retry se risposta non JSON, salvataggio interazione.

Non ci sono altre funzioni esportate per “analizzare workout”, “suggerire esercizi” in modo dedicato, ecc.; la logica “suggerisci esercizi” è affidata al prompt generico in `getAIResponse`.

### Modello e parametri
- **Modello:** `gpt-3.5-turbo` (hardcoded in tutte le chiamate a `/api/ai-chat`: chat, piano strutturato, retry).
- **max_tokens / temperature:** Non impostati nel client; il body inviato è solo `{ messages, model: 'gpt-3.5-turbo' }`. Eventuali `max_tokens` o `temperature` sarebbero sul server (`/api/ai-chat`), non visibili in app-user. Per piani dettagliati lunghi, se il server non alza `max_tokens`, le risposte potrebbero essere troncate.

---

## Tabelle di riepilogo

### Funzionalità PrimeBot oggi

| Funzionalità | Stato | Note |
|--------------|--------|------|
| Chat testuale con AI (OpenAI) | Implementato | getAIResponse + /api/ai-chat |
| Contesto utente (onboarding + profilo) | Implementato | getUserContext, formatUserContextForPrompt |
| Piano allenamento strutturato (JSON) | Implementato | getStructuredWorkoutPlan, card in chat |
| Cronologia per contesto API | Implementato | getSessionHistory, ultimi 10 messaggi |
| Cronologia visibile in UI | Assente | Solo sessione corrente in memoria |
| Suggerimenti rapidi (quick replies) | Implementato | 4–5 domande predefinite per nuovo utente / normale |
| Azioni in chat (navigate, save_workout, add_diary, start_workout) | Implementato | [ACTION:...] + executeAction |
| Pain tracking e limitazioni | Implementato | usePainTracking, getSmartLimitationsCheck, disclaimer |
| Fallback risposte preimpostate | Implementato | getPrimeBotFallbackResponse |
| Widget floating + 4 azioni | Implementato | PrimeBotWidget: chat, workout, piano, tour |
| Apertura automatica post-workout / post-onboarding | Assente | — |
| Messaggi automatici / notifiche PrimeBot | Assente | Nessuna tabella o job |
| Personalità/tono configurabile | Parziale | Solo stringa fissa nel system prompt |
| Uso dati workout/storico/streak/obiettivi | Assente | Contesto solo onboarding + nome |
| Recap post-workout da PrimeBot | Assente | Schermata completamento senza PrimeBot |
| max_tokens esplicito client | Assente | Delegato al server |

### Dati disponibili nel DB (usato da PrimeBot?)

| Dato / Tabella | Usato da PrimeBot |
|----------------|--------------------|
| user_onboarding_responses (obiettivi, livello, limitazioni, allergie, zone_dolori, ecc.) | Sì |
| Profilo (nome da profiles/user) | Sì |
| primebot_preferences | Sì (scrittura da updatePrimeBotPreferences) |
| primebot_interactions | Sì (scrittura + lettura cronologia per API) |
| custom_workouts | No |
| user_workout_stats (totale, streak, last_workout_date) | No |
| workout_diary | No |
| user_objectives | No |
| monthly_workout_stats | No |
| notes | No |
| openai_usage_logs | Sì (lettura per limite mensile) |
| health_disclaimer_acknowledgments | Sì (flusso disclaimer piani) |

---

## Punti di integrazione possibili (priorità)

1. **Post-workout recap (alta)** — Dopo “Segna Completato” o “Salva su Diario”, mostrare CTA “Chiedi a PrimeBot un recap” che apre `/ai-coach` (o un mini recap generato) con contesto “ultimo workout: nome, durata, N esercizi”. PrimeBot potrebbe dare un breve commento e suggerire prossimi passi.
2. **Contesto streak e ultimo workout (alta)** — Inserire in `getUserContext` (o in un blocco aggiuntivo nel prompt) dati da `user_workout_stats`: streak, last_workout_date, total_workouts. Permette risposte tipo “Hai già 3 giorni di streak, continua così” o “È da X giorni che non ti alleni”.
3. **Obiettivi in chat (media)** — Leggere `user_objectives` e includerli nel contesto (titolo, progress, scadenza) così PrimeBot può riferirsi agli obiettivi concreti.
4. **Cronologia chat visibile (media)** — All’apertura di PrimeChat, caricare gli ultimi N messaggi da `getSessionHistory` (o getConversationHistory) e popolare `msgs` per mostrare lo storico della sessione (o ultima sessione).
5. **Suggerimenti motivazionali automatici (media)** — Job (cron o post-login) che, in base a streak / assenza workout, scrive in una tabella `primebot_messages` o notifiche; la UI mostra un badge “Hai un messaggio da PrimeBot” o una card in Dashboard.
6. **Dati ultimo allenamento nel prompt (media)** — Se esiste un “ultimo” custom_workout o diary entry, passarne nome, tipo, durata, numero esercizi nel system prompt per risposte più contestuali (“il tuo ultimo era forza, oggi potresti fare cardio”).
7. **Tono/personalità configurabile (bassa)** — Preferenza utente (es. “più tecnico” vs “più motivazionale”) salvata in profilo o primebot_preferences e iniettata nel system prompt.
8. **Riepilogo mensile da PrimeBot (bassa)** — Quando `checkMonthlyReset` o un cron fa il riepilogo del mese, generare un messaggio PrimeBot (o email) con sintesi allenamenti e un breve commento motivazionale.
9. **Quick action “Piano per oggi” con contesto (alta)** — Nel widget o in Dashboard, azione “Piano per oggi” che apre la chat con messaggio precompilato e, lato backend, contesto arricchito con ultimo workout e streak (senza obbligo di scrivere).
10. **Integrazione Diario–PrimeBot (media)** — In pagina Diario, bottone “Chiedi a PrimeBot” su una entry che apre la chat con contesto “Stai guardando l’allenamento X del giorno Y”; PrimeBot può commentare o suggerire varianti.

---

## Riepilogo: dove PrimeBot può aggiungere più valore con meno sforzo

- **Valore alto / sforzo relativamente basso:**  
  - Inserire **streak + last_workout_date + total_workouts** nel contesto utente (una query in più in `getUserContext` o in openai-service prima di costruire il prompt).  
  - **CTA post-workout:** “Parla con PrimeBot” nella schermata “Complimenti! Workout completato” che apre `/ai-coach` (e opzionalmente passa in state un hint “recap” per precompilare la prima domanda).  
  - **Quick reply “Piano per oggi”** nel widget o in chat che invia un messaggio tipo “Quale workout mi consigli per oggi?” già con contesto utente (già disponibile) e, se si aggiunge, ultimo allenamento/streak.

- **Valore alto / sforzo medio:**  
  - **Recap post-workout generato:** dopo completamento, chiamare una funzione che genera 1–2 frasi di recap (stesso modello, prompt breve) e mostrarle nella schermata completamento + CTA “Chiedi di più a PrimeBot”.

- **Valore medio / sforzo basso:**  
  - **Obiettivi** da `user_objectives` nel blocco contesto.  
  - **Cronologia visibile:** caricare `getSessionHistory` all’apertura e mostrarla in `msgs` (attenzione a non duplicare con messaggi nuovi).

In questo modo PrimeBot resta un unico punto di contatto (chat + piano) ma diventa **consapevole dell’attività reale** (workout, streak, obiettivi) e **presente nei momenti giusti** (dopo il workout, in Dashboard, nel Diario) senza richiedere subito un sistema complesso di messaggistica automatica.

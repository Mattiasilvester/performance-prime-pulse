# Analisi e mappa migrazione ActiveWorkout.tsx al layout di EsecuzioneWorkout.tsx

**Solo analisi — nessuna modifica al codice.**

---

## 1. Fonti dati esercizi e uso

### 1.1 `workoutData` (hardcoded per categoria)

- **Dove:** `ActiveWorkout.tsx` righe 32-77, oggetto `workoutData`.
- **Chiavi:** `cardio`, `strength`, `recommended`, `hiit`, `mobility`.
- **Struttura:** `{ name: string, exercises: Array<{ name, duration, rest }> }`.
- **Uso:** Scelto quando `currentWorkout = customWorkout || generatedWorkout || workoutData[workoutId]` e non c’è né `customWorkout` né `generatedWorkout` (es. `workoutId` = `'cardio'`, `'strength'`, ecc. da WorkoutCategories).
- **Formato esercizi:** `duration` e `rest` in formato stringa (es. `'30s'`, `'15s'`).

### 1.2 `generatedWorkout` (da props)

- **Origine:** `Workouts.tsx` → `handleStartWorkout(workoutId, duration, generatedWorkout)` imposta `generatedWorkout` e `activeWorkout` (es. `'generated'` o `'recommended'`).
- **Struttura:** `GeneratedWorkoutShape`: `name?`, `title?`, `exercises?` (array `WorkoutExerciseShape`), `meta?`, `workout_type?`, `tipo?`, `type?`, `duration?`, `total_duration?`.
- **Uso:** `currentWorkout = customWorkout || generatedWorkout || workoutData[workoutId]`; usato per workout generati da WorkoutCategories (Forza/HIIT con filtri) o recommended.
- **Formato esercizi:** `WorkoutExerciseShape`: `name`, `duration?` (string | number), `rest?`, `instructions?`, `sets?`.

### 1.3 `customWorkout` (da props)

- **Origine:** `Workouts.tsx` quando l’utente carica un workout da file o da piano personalizzato; anche da `personalizedWorkout?.customExercises` (convertito in oggetto con `title`, `workout_type`, `exercises`, `duration`, `meta`).
- **Uso:** Priorità massima: `currentWorkout = customWorkout || generatedWorkout || ...`. Determina anche `workout_source` in `saveToDiary` (`'custom_workouts'`).
- **Formato:** Stesso shape di `generatedWorkout`; esercizi possono avere `duration`/`rest` in vari formati.

**Riepilogo:** Una sola fonte attiva per sessione (`currentWorkout`). Tutte e tre le fonti devono continuare a essere supportate; la logica di fallback `customWorkout || generatedWorkout || workoutData[workoutId]` va preservata.

---

## 2. Logica di salvataggio da preservare

### 2.1 Diario

- **Funzione:** `saveToDiary` (righe 432-478).
- **Chiamata:** Bottone “Salva su Diario” nella schermata `workoutState === 'completed'`.
- **Servizio:** `saveWorkoutToDiary` (alias di `completeWorkout` da `@/services/diaryService`).
- **Dati:** `workoutData` con `workout_source` (`'custom_workouts'` | `'workout_plans'` | `'quick'`), `workout_name`, `workout_type`, `duration_minutes` (da somma `parseTimeToSeconds(exercise.duration)`), `exercises_count`, `exercises` con `completed` per indice, `completed_at`, `saved_at`.
- **Post-azione:** `toast.success`, `navigate('/diary')` dopo 800 ms.
- **Da preservare:** Intera logica e calcolo durata; nel layout nuovo si può mantenere un unico flusso “Completa allenamento” che salva in diary (come QuickWorkout) oppure conservare la schermata di completamento con due bottoni (Segna Completato / Salva su Diario) — vedi decisioni sotto.

### 2.2 Medal / Challenge

- **Import:** `useMedalSystem` (`recordWorkoutCompletion`), `trackWorkoutForChallenge` da `@/utils/challengeTracking`.
- **Uso attuale:** In ActiveWorkout **non** vengono mai chiamati né `recordWorkoutCompletion` né `trackWorkoutForChallenge`.
- **Statistiche:** `updateWorkoutStats(user.id, minutes)` viene chiamato in `nextExercise()` quando si completa l’ultimo esercizio (righe 316-319).
- **Da preservare:** Se in futuro si vuole allineare al QuickWorkout, andrebbe aggiunta la chiamata a `trackWorkoutForChallenge` (e eventualmente `recordWorkoutCompletion`) nel flusso di completamento; oggi non c’è nulla da “sostituire”, solo da eventualmente aggiungere.

### 2.3 Workout stats e custom_workouts

- **In `completeWorkout` (righe 411-429):**
  - Inserimento in `custom_workouts`: `user_id`, `title`, `workout_type`, `scheduled_date`, `exercises`, `total_duration`, `completed`, `completed_at`.
  - `updateWorkoutMetrics(user.id, totalMinutes)` (da `@/services/updateWorkoutMetrics`).
  - `window.dispatchEvent(new CustomEvent('workoutCompleted', { detail: { workoutId: workoutRecord.id } }))`.
  - Toast “Allenamento completato! Statistiche aggiornate.”
- **Chiamata:** “Segna Completato” → `handleTerminateSession` → `completeWorkout()` + `onClose()`.
- **Nota:** `completeWorkout` usa `getPresetWorkoutDuration(workoutName)` per durata (minuti) quando non derivata dagli esercizi; per custom/generated si potrebbe migliorare il calcolo (es. somma durate come in saveToDiary).
- **Da preservare:** Inserimento `custom_workouts`, `updateWorkoutMetrics`, evento `workoutCompleted`, toast e chiusura.

### 2.4 Audio e vibrazione

- **Audio:** `audioContextRef`, `playBeep(frequency, duration)` (righe 156-196), init su click/touchstart (righe 199-223). Usato per: recupero (avvio, tick ultimi secondi, fine) — `playRestStartSound`, `playRestTickSound`, `playRestEndSound` (righe 481-494).
- **Vibrazione:** `handleTerminateSession` → `navigator.vibrate([100, 50, 100])`; non usata altrove nel componente.
- **Da preservare:** Nel layout nuovo (lista + timer recupero in alto) si può mantenere un unico timer di recupero con beep/vibrazione a fine (come EsecuzioneWorkout/QuickWorkout); eventuale vibrazione su “Completa esercizio” o su “Completa allenamento” è da decidere (aggiungere se si vuole parità con EsecuzioneWorkout).

### 2.5 Altri hook/servizi al completamento

- **useAuth:** `user` per `updateWorkoutStats`, `completeWorkout`, `saveToDiary`.
- **supabase:** inserimento `custom_workouts` e `getUser()` in `completeWorkout`.
- **toast (sonner):** success/error in saveToDiary e completeWorkout.
- **navigate:** solo in saveToDiary → `/diary`.
- **onClose:** chiamato in handleTerminateSession e dai bottoni “Torna indietro” / “Torna alla Dashboard”.

---

## 3. Doppia logica “timed” vs “non timed”

### 3.1 Come si determina se un esercizio è timed

- **Funzione:** `isTimedExercise(exercise)` (righe 461-467).
- **Logica:** `duration` in stringa che contiene `'s'` o `'sec'` (case-insensitive) → timed. Es.: `"30s"`, `"45s"` = timed; numero o stringa senza “s”/“sec” (es. “10-12” ripetizioni) = non timed.
- **Uso:** `const isTimed = isTimedExercise(currentExercise);` sulla **sola** esercizio corrente nella vista “uno alla volta”.

### 3.2 Cosa cambia nel comportamento attuale

**Timed:**

- Timer centrale grande con countdown (lavoro) o “RIPOSO”.
- Timer lavoro: `timeLeft`, `startTimer()`, auto passaggio a rest o next exercise.
- Bottoni: “Pausa” / “Riprendi”, “Successivo” (skip).
- Nessun “Avvia Recupero” manuale: il recupero parte dopo il countdown lavoro.

**Non timed:**

- Nessun countdown lavoro; mostra box “Serie / Ripetizioni / Riposo” (sets, duration come reps, rest).
- Bottone “Avvia Recupero”; stato `isRestTimerActive`, `restTimeLeft`, `isRestTimerPaused`; suono beep per inizio/tick/fine recupero.
- Dopo recupero l’utente va “Successivo” manualmente (o si può considerare auto next).
- Bottoni: “Avvia Recupero”, “Pausa”/“Riprendi” recupero, “Salta Recupero”.

### 3.3 Adattamento al layout nuovo (lista come EsecuzioneWorkout/QuickWorkout)

- **Layout nuovo:** Lista di tutti gli esercizi, timer recupero in alto, un bottone “Completato” per esercizio (e un solo “Completa allenamento” in basso).
- **Proposta timed:** Non mostrare più il timer lavoro centrale. Ogni esercizio è una card con nome, eventuale `ExerciseGifLink`, label durata/recupero (es. “30s · 10s recupero”); l’utente segna “Completato” quando ha finito (come QuickWorkout). Il timer in alto è solo per il recupero tra un esercizio e il successivo (avviato dopo “Completato” o opzionalmente auto).
- **Proposta non timed:** Card con nome, Serie × Rip · recupero; per ogni esercizio si può:
  - **Opzione A:** Un solo “Completato” che marca l’esercizio come fatto e avvia il timer recupero in alto (come EsecuzioneWorkout che ha “Completa esercizio” e serie separate).
  - **Opzione B:** Mantenere i “Serie 1”, “Serie 2” in card (come EsecuzioneWorkout) e “Completa esercizio” quando tutte le serie sono segnate; timer recupero in alto dopo ogni esercizio completato.
- **Unificazione:** Nel layout a lista, “timed” e “non timed” possono convivere: card con label diversa (durata vs serie/rip) e stesso pattern “Completato” + timer recupero in alto. La differenza è solo di visualizzazione (testo) e non più di due UI completamente diverse (timer gigante vs box recupero).

---

## 4. ExerciseGifLink

- **Dove:** Usato **una sola volta** in ActiveWorkout, nella vista “running/paused/rest” (righe 612-615), accanto al nome dell’esercizio corrente.
- **Props:** `exerciseName={currentExercise?.name || 'Esercizio'}`, `buttonClassName="bg-pp-gold hover:bg-pp-gold/80 ..."`.
- **Layout nuovo:** In una lista di card (come QuickWorkout), va messo un `ExerciseGifLink` per ogni esercizio, accanto al nome (stile QuickWorkout: `buttonClassName` con colori `#EEBA2B` / testo oro). EsecuzioneWorkout oggi **non** usa ExerciseGifLink; QuickWorkout sì. Per ActiveWorkout si mantiene/estende l’uso come in QuickWorkout.

---

## 5. Stati e funzioni: preservare / sostituire / aggiungere

### 5.1 PRESERVARE (logica business)

- **Dati e derivati:** `currentWorkout`, `personalizedMeta`, `workoutTitle`, `workoutType`, `workoutDuration`, `workoutExerciseCount`; fallback `customWorkout || generatedWorkout || workoutData[workoutId]`.
- **Interfacce e tipi:** `WorkoutExerciseShape`, `GeneratedWorkoutShape`, `CurrentWorkoutDisplay`, `ActiveWorkoutProps`.
- **Utility:** `parseTimeToSeconds`, `parseRestTime` (da workoutUtils); `formatTime` locale (o allineare a `formatTimer` MM:SS).
- **Salvataggio:** `completeWorkout` (custom_workouts + updateWorkoutMetrics + evento + toast), `saveToDiary` (diaryService + navigate), `handleTerminateSession` (vibrazione + completeWorkout + onClose).
- **Determinazione workout_source:** in saveToDiary, `customWorkout` → `'custom_workouts'`, `generatedWorkout` → `'workout_plans'`, altrimenti `'quick'`.
- **updateWorkoutStats:** chiamata quando si completa l’ultimo esercizio (oggi in `nextExercise`); nel nuovo flusso andrà chiamata quando l’utente preme “Completa allenamento” e tutti gli esercizi sono completati.
- **Navigazione e chiusura:** `onClose`, `navigate`; gestione “Allenamento non trovato” (`missingWorkoutContent`).
- **Audio (opzionale):** Init AudioContext e `playBeep`; si può riusare per fine recupero (beep) come in EsecuzioneWorkout/QuickWorkout.
- **isTimedExercise:** utile per mostrare in lista “30s · 10s recupero” vs “4 serie × 10 rip · 60s” senza cambiare flusso “Completato” + timer recupero.

### 5.2 SOSTITUIRE (layout vecchio)

- **Vista “ready” (preparazione):** Oggi fullscreen `fixed inset-0`, header minimo, card circuito, “Inizia Workout” / “Torna indietro”. Sostituire con: stesso contenuto concettuale ma dentro il layout pagina con Header app + area contenuto + BottomNavigation (se la route Workouts/ActiveWorkout verrà wrappata come QuickWorkout), oppure mantenere solo il blocco contenuto senza fullscreen.
- **Vista “running/paused/rest”:** Rimuovere:
  - Container `fixed inset-0` con z-index 99999.
  - Header con “Esercizio X di N”, “Indietro”, icona lista.
  - Barra progresso e dots esercizi.
  - Contenuto centrale: nome esercizio, ExerciseGifLink, istruzioni, **timer gigante** (timed) o **box Serie/Ripetizioni/Riposo + Avvia Recupero** (non timed).
  - Controlli bottom: Pausa/Successivo o solo Successivo.
  - Sidebar lista esercizi (navigateToExercise, getExerciseStatus, getExerciseStatusIcon).
- Sostituire con: **lista** di card esercizi (come EsecuzioneWorkout/QuickWorkout), **timer recupero in alto** (un solo timer), **un bottone “Completato” per card** (e opzionalmente serie per esercizi non timed), **un solo bottone “Completa allenamento”** in basso.
- **Vista “completed”:** Oggi fullscreen con “Complimenti!”, “Segna Completato”, “Salva su Diario”. Sostituire con: o (A) stessa schermata ma non fullscreen (contenuto in pagina), o (B) eliminare schermata e fare un unico flusso “Completa allenamento” che salva in diary + custom_workouts + metriche + evento e chiude/naviga (come QuickWorkout). Decisione da prendere (vedi sotto).
- **Nascondere header/footer/feedback quando completed:** useEffect che imposta `display/visibility/opacity/zIndex` su header, `.bottom-navigation`, `.feedback-widget` (righe 225-284). Con layout in pagina e nessun fullscreen completed, questo effetto può essere rimosso o adattato.
- **Stati da semplificare/rimuovere:** `workoutState` (`'ready' | 'running' | 'paused' | 'rest' | 'completed'`), `currentExerciseIndex`, `timeLeft`, `isRest`, `sidebarOpen`, `isRestTimerActive`, `restTimeLeft`, `isRestTimerPaused`, `exerciseTimers` (Record per timer per esercizio), `timerRef` (countdown lavoro). Nel nuovo layout: basta `completedExercises` (Set o array di indici), `timerSeconds` + `timerRunning` per il timer recupero in alto, eventualmente `currentExerciseIndex` solo se si vuole evidenziare “prossimo” per auto-avvio timer.
- **Funzioni da rimuovere/sostituire:** `startWorkout`, `nextExercise`, `togglePause`, `skipExercise`, `startTimer` (timer lavoro), `toggleSidebar`, `closeSidebar`, `navigateToExercise`, `getExerciseStatus`, `getExerciseStatusIcon`, `startExerciseTimer`, `toggleTimer`, `resetTimer` (timer per esercizio), `handleStartRest`, `toggleRestTimer`, `handleSkipRest`, `formatRestTime`; useEffect del timer lavoro (righe 314-339), useEffect countdown exerciseTimers (righe 357-401).

### 5.3 AGGIUNGERE (layout nuovo)

- **Struttura pagina:** Come QuickWorkout/EsecuzioneWorkout: contenitore con `min-h-screen bg-[#0A0A0C]`, header fisso con titolo workout, sottotitolo, badge “N esercizi”, barra progresso “X di Y completati” + percentuale.
- **Blocco timer recupero:** Card in alto (come QuickWorkout righe 515-538) con “Timer recupero”, `formatTimer(timerSeconds)`, pulsanti Reset e Play/Pause; stesso stile (`#1E1E24`, `#EEBA2B`).
- **Lista esercizi:** Per ogni esercizio: card con bordo, numero/check (completato o no), nome, `ExerciseGifLink`, riga con durata/serie e recupero (da `isTimedExercise` + duration/rest/sets); bottone “Completato” (e se si scelgono le serie: “Serie 1” … “Serie N” come EsecuzioneWorkout).
- **Gestione completamento esercizio:** `handleExerciseComplete(index)`: aggiungere indice a `completedExercises`, vibrazione opzionale, avviare timer recupero (stesso `startRecoveryTimer`/`parseRestTime`); se è l’ultimo esercizio non avviare timer (o avviarlo comunque e alla fine mostrare “Completa allenamento”).
- **Bottone “Completa allenamento”:** Fisso in basso, disabilitato finché `completedExercises.size !== exercises.length`; onClick: salvataggio (diary + custom_workouts + updateWorkoutMetrics + evento + toast) e `onClose()` o `navigate('/diary')` (o schermata completamento con due opzioni, se si mantiene).
- **Allineamento route:** Se si vuole parità con QuickWorkout, la route che mostra ActiveWorkout (oggi dentro Workouts senza Header/BottomNavigation) andrebbe wrappata con Header + `div.min-h-screen.pt-24.pb-20` + BottomNavigation quando si è in “esecuzione” (stessa discussione fatta per QuickWorkout). Oppure lasciare ActiveWorkout dentro Workouts e solo cambiare il layout interno del componente.

---

## 6. Possibili problemi e decisioni

1. **Route e container:** ActiveWorkout è renderizzato dentro `Workouts.tsx` (pagina Allenamento), senza Header/BottomNavigation dedicati. Per avere lo stesso “frame” di EsecuzioneWorkout/QuickWorkout bisogna o (a) creare una route dedicata (es. `/workout/active`) con stesso wrapper App di QuickWorkout e passare state (workoutId, generatedWorkout, customWorkout), o (b) lasciare tutto in Workouts e usare solo lo stesso stile visivo (header locale + timer + lista + bottone), senza Header app.
2. **Schermata completamento:** Mantenere “Segna Completato” vs “Salva su Diario” (due azioni distinte) o un solo “Completa allenamento” che fa diary + custom_workouts + metriche + evento (come QuickWorkout)? La prima preserva il comportamento attuale; la seconda semplifica e allinea a QuickWorkout/EsecuzioneWorkout.
3. **Medal/Challenge:** Aggiungere `trackWorkoutForChallenge` (e eventualmente `recordWorkoutCompletion`) nel flusso “Completa allenamento” per coerenza con QuickWorkout.
4. **Esercizi “non timed” con serie:** Decidere se in lista mostrare solo “Completato” per esercizio o anche “Serie 1”, “Serie 2” … con completamento per serie (come EsecuzioneWorkout). La seconda opzione richiede stato `completedSets` e più UI.
5. **Durata in completeWorkout:** Oggi si usa `getPresetWorkoutDuration(workoutName)`; per generated/custom sarebbe più corretto calcolare la durata dalla somma delle durate degli esercizi (come in saveToDiary) per `total_duration` e `updateWorkoutMetrics`.
6. **Header/footer nascosti in completed:** Con layout in pagina e nessun fullscreen, l’useEffect che nasconde header/footer/feedback può essere rimosso.
7. **Viewport height e --vh:** ActiveWorkout ha `viewportHeight` e useEffect che imposta `--vh`; nel layout a lista può essere ridondante se la pagina non è fullscreen; valutare rimozione.

---

## 7. Riepilogo mappa

| Area | Preservare | Sostituire | Aggiungere |
|------|------------|------------|------------|
| **Dati** | currentWorkout, fallback 3 fonti, meta, title, type, duration, count | — | — |
| **Salvataggio** | completeWorkout, saveToDiary, handleTerminateSession, workout_source, updateWorkoutStats (al completamento) | — | Eventuale trackWorkoutForChallenge / recordWorkoutCompletion |
| **Audio/Vibrazione** | playBeep, init AudioContext; vibrazione su terminazione | — | Vibrazione su “Completato”/“Completa allenamento” (opzionale) |
| **Timed vs non timed** | isTimedExercise, parseTimeToSeconds, parseRestTime | Timer lavoro centrale, box recupero in-page, Pausa/Successivo/Avvia Recupero | Label in lista (durata vs serie/rip), stesso flusso “Completato” + timer in alto |
| **ExerciseGifLink** | Uso per ogni esercizio | Posizionamento (da “solo esercizio corrente” a “in ogni card”) | — |
| **UI** | Messaggio “Allenamento non trovato”, onClose | Vista ready fullscreen, vista running fullscreen (timer + sidebar), vista completed fullscreen, nascondi header/footer | Header pagina, timer recupero in alto, lista card, “Completato” per card, “Completa allenamento” in basso |
| **Stati** | completedExercises (forma da definire: Set come ora) | workoutState, currentExerciseIndex, timeLeft, isRest, sidebarOpen, rest timer states, exerciseTimers | timerSeconds, timerRunning per timer in alto; eventualmente completedSets se si fanno le serie |
| **Route** | — | — | Opzionale: route dedicata con Header + pt-24 pb-20 + BottomNavigation (come QuickWorkout) |

---

*Documento di analisi — nessuna modifica applicata. Ultimo aggiornamento: 2026-03-13.*

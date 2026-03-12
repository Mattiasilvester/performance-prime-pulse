# Report analisi — Collegamento "Completa allenamento" → Diario + Stats
## Solo analisi, nessuna implementazione (packages/app-user)

---

## 1. TABELLE DB — lista con colonne e file di utilizzo

### Tabelle legate al diario e ai workout completati

| Tabella | Colonne usate nel codice | File che la usano |
|--------|--------------------------|-------------------|
| **workout_diary** | id, user_id, workout_id, workout_source, workout_name, workout_type, status, duration_minutes, exercises_count, exercises, completed_at, saved_at, notes, photo_urls, created_at, updated_at | diaryService.ts (getDiaryEntries, getDiaryEntry, saveWorkoutToDiary, completeWorkout, updateDiaryEntry, deleteDiaryEntry, getWeeklyStats, updateWorkoutMetrics), DiaryPage.tsx |
| **user_workout_stats** | id, user_id, total_workouts, total_hours, current_streak_days, longest_streak_days, last_workout_date, created_at, updated_at | diaryService.ts (getUserMetrics, updateWorkoutMetrics), workoutStatsService.ts (fetchWorkoutStats, updateWorkoutStats, resetWorkoutStats), updateWorkoutMetrics.ts, monthlyStatsService.ts, WeeklyProgress.tsx, primebotUserContextService.ts |
| **custom_workouts** | id, user_id, title, workout_type, scheduled_date, exercises (Json), total_duration, completed, completed_at, created_at, updated_at | ActiveWorkout.tsx, QuickWorkout.tsx, primebotActionsService.ts, workoutStatsService.ts, statsService.ts, WeeklyProgress.tsx, RecentActivity.tsx, Workouts.tsx, CustomWorkoutDisplay.tsx, WorkoutViewModal.tsx, AppointmentCalendar.tsx, WorkoutCreationModal.tsx, StartTodayButton.tsx, WorkoutAttachments.tsx |

### Altre tabelle rilevanti (obiettivi, piani)

| Tabella | Uso | File |
|--------|-----|------|
| **workout_plans** | Piani creati (onboarding, PrimeBot); non usata per “completa” in ActiveWorkout attuale | planService.ts, QuickActions.tsx, CompletionScreen.tsx, PlaniPage, ActivePlansPage |
| **user_objectives** | Obiettivi utente, completamenti | StatsOverview.tsx, RecentActivity.tsx, ObjectiveModal.tsx |
| **notes** | Note PrimeBot (add_diary) | primebotActionsService.ts, useNotes.tsx |

---

## 2. HOOK / SERVICE — path, funzioni, fonte dati

| File | Funzioni esportate rilevanti | Fonte dati | Restituisce |
|------|------------------------------|------------|-------------|
| **services/diaryService.ts** | getDiaryEntries, getDiaryEntry, saveWorkoutToDiary, completeWorkout, updateDiaryEntry, deleteDiaryEntry, getUserMetrics, updateWorkoutMetrics (interna), getWeeklyStats, groupEntriesByDate, formatDuration, formatDateShort | Supabase: workout_diary, user_workout_stats | WorkoutDiary[], WorkoutDiary, UserWorkoutStats, void |
| **services/workoutStatsService.ts** | fetchWorkoutStats, updateWorkoutStats, resetWorkoutStats | Supabase: custom_workouts (fonte primaria), user_workout_stats (upsert sync) | WorkoutStats { total_workouts, total_hours, total_minutes } |
| **services/updateWorkoutMetrics.ts** | updateWorkoutMetrics(userId, workoutDuration) | Supabase: user_workout_stats (select + update/insert) | void |
| **services/statsService.ts** | fetchProgressStats(period) | Supabase: custom_workouts (completed, scheduled_date, total_duration) | ProgressData[] { date, workouts, hours } |
| **services/monthlyStatsService.ts** | checkMonthlyReset, lettura/update user_workout_stats | Supabase: user_workout_stats | - |
| **hooks/useMedalSystem.tsx** | Sistema medaglie/sfida 7 giorni | localStorage + challengeTracking | medalSystem, getMedalCardData, … |
| **lib/diaryNotesStorage.ts** | getDiaryNotes, saveDiaryNote, … | localStorage (STORAGE_KEY) | DiaryNote[] (note testuali, non workout) |

- **Dashboard KPI**: dati da **workoutStatsService.fetchWorkoutStats** (legge da **custom_workouts**).
- **Diario + metriche (streak/totali)**: **diaryService** (workout_diary + user_workout_stats).
- **Profilo storico progressi**: **statsService.fetchProgressStats** (legge da **custom_workouts**).

---

## 3. DASHBOARD — come si aggiornano le KPI cards

- **Componente**: `Dashboard.tsx` → sezione stats in `StatsOverview` (lazy).
- **Popolamento**: `StatsOverview` in `useEffect` chiama:
  - **fetchWorkoutStats()** (workoutStatsService) → legge da **custom_workouts** (`.eq('completed', true)`), calcola total_workouts e total_minutes, formatta total_hours; opzionalmente fa upsert su **user_workout_stats** per sincronizzare.
  - Query **user_objectives** per “Obiettivi raggiunti”.
- **Fonte dati**: KPI “Allenamenti completati” e “Tempo totale” sono quindi **solo da custom_workouts**, non da workout_diary né direttamente da user_workout_stats.
- **Refresh**: `StatsOverview` ascolta l’evento **window 'workoutCompleted'** e richiama `loadStats()`. Stesso evento è usato da **WeeklyProgress** per rilanciare `loadWeeklyData()`.
- **WeeklyProgress**: legge da **custom_workouts** (e user_workout_stats per confronto); grafico settimanale basato su `custom_workouts` completati.
- **RecentActivity**: legge da **custom_workouts** (completed) e **user_objectives** (completed); nessun uso di workout_diary.

Quindi: le KPI e le attività recenti si aggiornano quando viene emesso **workoutCompleted** e quando esiste una riga in **custom_workouts** con `completed: true`. Se si salva solo in **workout_diary** (senza scrivere in custom_workouts), le KPI della dashboard **non** cambiano finché non viene inserito/aggiornato qualcosa in custom_workouts.

---

## 4. PROFILO — storico e statistiche

- **ProgressHistory**: usa **statsService.fetchProgressStats(period)** (week/month). fetchProgressStats legge da **custom_workouts** (user_id, completed=true, scheduled_date nel periodo), aggrega per data (workouts, hours) e restituisce `ProgressData[]`. Quindi lo “storico progressi” è basato solo su **custom_workouts**.
- **AchievementsBoard**: UI statica “in arrivo”, nessun dato reale.
- **Storico allenamenti completati**: non c’è una lista dedicata “ultimi allenamenti” nel Profilo; la “recent activity” è in Dashboard (RecentActivity, da custom_workouts + user_objectives). Il diario (workout_diary) è la lista “allenamenti salvati/completati” ma è in `/diary`, non nel Profilo.

Riassunto: profilo “storico” = custom_workouts via statsService; nessuna lettura diretta di workout_diary nel Profilo.

---

## 5. DIARIO — struttura attuale e tabella

- **Pagina**: `DiaryPage.tsx` (route `/diary`). Mostra solo **workout** (niente nutrizione in lista principale); filtri per stato; modal note e dettaglio entry.
- **Lettura**: `getDiaryEntries()` da **diaryService** → Supabase **workout_diary** (user_id, order completed_at/saved_at, filtro status opzionale).
- **Struttura entry (WorkoutDiary)**: id, user_id, workout_id, workout_source ('custom_workouts' | 'workout_plans' | 'quick'), workout_name, workout_type, status ('saved' | 'completed'), duration_minutes, exercises_count, exercises (array JSON), completed_at, saved_at, notes, photo_urls, created_at, updated_at.
- **Scrittura “completa”**: `diaryService.completeWorkout(workoutData)` → INSERT in workout_diary (status 'completed', completed_at, saved_at) + chiamata a `updateWorkoutMetrics(workout)` che aggiorna **user_workout_stats** (total_workouts, total_hours, streak, last_workout_date).
- **DiaryNotesPage** (`/diary/notes`): note testuali da **diaryNotesStorage** (localStorage), non da Supabase.

Quindi: il diario “workout” è interamente su **workout_diary**; il completamento da UI passa da diaryService e aggiorna anche user_workout_stats, ma **non** custom_workouts.

---

## 6. TIMER — rest_seconds: strutturato o testo?

- **custom_workouts**: colonna **exercises** è `Json`; nello schema Supabase non c’è un campo `rest_seconds` a livello tabella. Nel codice, gli esercizi hanno forma tipo `WorkoutExerciseShape`: **rest** è stringa (es. `'90s'`, `'60s'`, `'2 min'`). Non esiste in DB un campo numerico `rest_seconds` per esercizio.
- **workout_plans**: stesso concetto; gli esercizi sono in strutture (es. `esercizi`) con campi tipo nome, serie, ripetizioni, **recupero/rest** come testo (es. “90s”, “60s”).
- **ActiveWorkout**: usa **parseRestTime** / **parseTimeToSeconds** per convertire `exercise.rest` (stringa) in secondi (es. "90s" → 90, "2 min" → 120). Il timer di recupero usa questo valore derivato a runtime.
- **Conclusione**: il recupero è **solo in forma testo** dentro il JSON degli esercizi (es. `rest: '90s'`). Non c’è `rest_seconds` strutturato in DB; per il timer si può continuare a parsare la stringa o, in fase di implementazione, aggiungere un campo numerico (es. `rest_seconds`) quando si salva il piano, mantenendo `rest` per display.

---

## 7. RACCOMANDAZIONE — collegare "Completa allenamento" senza duplicare logica

### Situazione attuale

- **Due flussi distinti in ActiveWorkout**:
  1. **“Segna Completato”** (handleTerminateSession → completeWorkout): INSERT **custom_workouts** + **updateWorkoutMetrics(userId, minuti)** (updateWorkoutMetrics.ts) + dispatch **workoutCompleted**. Non scrive in workout_diary.
  2. **“Salva su Diario”** (saveToDiary): **diaryService.completeWorkout(workoutData)** → INSERT **workout_diary** + **diaryService.updateWorkoutMetrics(workout)** (user_workout_stats). Non scrive in custom_workouts.

- **Effetto**: se l’utente clicca solo “Salva su Diario”, il diario e user_workout_stats sono aggiornati, ma **StatsOverview**, **WeeklyProgress** e **RecentActivity** restano basati su **custom_workouts**, quindi le KPI e le attività recenti non includono quel workout fino a un eventuale inserimento in custom_workouts.

### Raccomandazione per “Completa allenamento” (un solo bottone che fa tutto)

- **Obiettivo**: un’azione “Completa allenamento” che (1) salvi la sessione nel diario, (2) aggiorni le statistiche dashboard, (3) aggiorni le statistiche profilo.
- **Modo più pulito**:
  1. **Un solo flusso “completa”** che:
     - Inserisce in **workout_diary** (come oggi con diaryService.completeWorkout) per avere tutto lo storico nel diario.
     - Inserisce (o aggiorna) in **custom_workouts** un record “completato” (stesso pattern già usato in completeWorkout in ActiveWorkout: title, total_duration, completed, completed_at, exercises, ecc.), così Dashboard e Profilo continuano a leggere da custom_workouts senza cambiare hook/servizi.
     - Mantiene l’aggiornamento di **user_workout_stats** (già fatto da diaryService.updateWorkoutMetrics dopo l’insert in workout_diary) per streak e totali; evitare di aggiornare due volte (es. non chiamare anche updateWorkoutMetrics.ts con i minuti se già si passa da diaryService).
  2. **Evento workoutCompleted**: emetterlo dopo il salvataggio (diario + custom_workouts) così StatsOverview e WeeklyProgress si aggiornano subito.
  3. **Riutilizzare**:
     - **diaryService.completeWorkout(workoutData)** per workout_diary + user_workout_stats (e quindi una sola fonte di verità per streak/totali via diaryService.updateWorkoutMetrics).
     - La logica esistente di INSERT in **custom_workouts** (come in completeWorkout in ActiveWorkout) da eseguire **dopo** o **in parallelo** al salvataggio diario, con gli stessi dati (title, duration, exercises, workout_source, ecc.).
  4. **Evitare**: due INSERT separati che aggiornino user_workout_stats in modo indipendente (rischio doppio conteggio); preferire un solo punto di aggiornamento (diaryService.updateWorkoutMetrics dopo insert workout_diary) e considerare custom_workouts come “copia” per dashboard/profilo.
  5. **Timer recupero**: lasciare il recupero come stringa negli esercizi (es. `rest: '90s'`) e continuare a usare **parseRestTime** / **parseTimeToSeconds**; opzionalmente in futuro aggiungere `rest_seconds` nel JSON al salvataggio per evitare parsing a runtime.

In sintesi: un unico “Completa allenamento” che scriva sia in **workout_diary** (con diaryService) sia in **custom_workouts** (come oggi in completeWorkout), emetta **workoutCompleted** e lasci a **diaryService** l’aggiornamento di **user_workout_stats**, così Diario, Dashboard e Profilo restano allineati senza duplicare la logica di conteggio e senza rompere i flussi esistenti.

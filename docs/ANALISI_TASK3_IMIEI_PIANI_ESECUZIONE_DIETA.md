# Analisi TASK 3 — Pagina "I miei piani" + Esecuzione Workout + Dieta del Giorno
## Solo analisi e consigli, nessuna implementazione

---

## 1. ALLINEAMENTO NOMI E CODICE ESISTENTE

### 1.1 WorkoutPlan (planService / types/plan.ts)
- Il tipo **WorkoutPlan** usa **`name`** (non `title`) e **`workouts`** (array di “giorni”, non `exercises` a livello piano).
- Nel DB **workout_plans** le colonne sono **`nome`**, **`esercizi`** (JSONB), non `title`/`exercises`.
- **Consiglio**: In tutta l’implementazione usare **`plan.name`** e **`plan.workouts`**. Per il giorno selezionato: **`plan.workouts[dayIndex]`**; gli esercizi del giorno sono in **`plan.workouts[dayIndex].exercises`** (o chiave analoga, vedi sotto). Per l’update del nome in A2 usare **`planService.updatePlan(plan.id, { name: newName })`** invece di un `.update({ title })` raw su Supabase (così si rispettano i mapping e i vincoli).

### 1.2 Struttura di `plan.workouts[]`
- **PlanWorkoutItem** (types/plan.ts): `exercises?`, `name?`, `nome?`, `duration?`, `durata?`, `[key: string]: unknown`.
- Gli elementi possono avere **`exercises`** (o in alcuni casi **`esercizi`**). Gli esercizi possono avere **`name`/`nome`**, **`rest`/`riposo`**, **`sets`/`serie`**, **`reps`/`ripetizioni`**.
- **Consiglio**: In IMieiPiani e EsecuzioneWorkout normalizzare l’accesso (es. helper `getDayExercises(plan, dayIndex)` che restituisce `(plan.workouts[dayIndex]?.exercises ?? plan.workouts[dayIndex]?.esercizi ?? [])` e per ogni esercizio usare `ex.name ?? ex.nome`, `ex.rest ?? ex.riposo`, ecc.) così funziona sia per piani da onboarding che da PrimeBot.

### 1.3 PDF workout (downloadWorkoutPlanPDF)
- **downloadWorkoutPlanPDF** si aspetta **StructuredWorkoutPlan** (workoutPlanGenerator): `name`, `workout_type`, `duration_minutes`, `difficulty`, **`exercises: StructuredExercise[]`** (con `name`, `sets`, `reps`, `rest_seconds`, `exercise_type`).
- I piani da **workout_plans** sono **WorkoutPlan** con **workouts[]** (un elemento per giorno), non un singolo `exercises` piatto.
- **Consiglio**: Non cambiare la firma di `downloadWorkoutPlanPDF`. Creare una funzione di mapping **`workoutPlanDayToStructuredPlan(plan: WorkoutPlan, dayIndex: number): StructuredWorkoutPlan`** che:
  - prende `plan.workouts[dayIndex]` e i suoi esercizi,
  - normalizza gli esercizi (nome, sets, reps, rest → rest_seconds con parseRestTime),
  - costruisce un oggetto con `name: plan.name`, `workout_type` derivato da `plan.plan_type`, `exercises`, ecc.
  - e lo passa a `downloadWorkoutPlanPDF`. Chiamare questa mapper dalla card “PDF” in IMieiPiani (tab Allenamento) quando si esporta il giorno selezionato.

### 1.4 Eliminazione piano allenamento
- **Consiglio**: Usare **`planService.deletePlan(plan.id)`** invece di una DELETE Supabase diretta, per restare coerenti con RLS e logica esistente.

---

## 2. PARTE A — PAGINA /i-miei-piani

### A1. Route e layout
- **Path file**: `src/pages/IMieiPiani.tsx` (o `src/pages/piani/IMieiPiani.tsx` se si vuole tenere le pagine piani insieme). Il prompt dice `src/pages/IMieiPiani.tsx`.
- In **App.tsx** il pattern usato per le altre pagine protette è: stesso blocco di **ProtectedRoute** + **Header** + `div` con **pt-24 pb-20** + **Suspense** + componente + **BottomNavigation** + **ConditionalFeedbackWidget**. Replicare lo stesso per `/i-miei-piani` (come da prompt).
- **QuickActions**: Oggi la card “Piano Personalizzato” chiama **handlePlanCardClick** → **navigate('/piani-attivi')**. Sostituire con navigate a **'/i-miei-piani'** e, se si vuole mantenere il testo, usare label “I miei piani” (il prompt chiede di sostituire con “I miei piani”). Attenzione: la card attuale mostra anche “X piani attivi”; si può lasciare un sottotitolo simile “Allenamento e nutrizione” o simile, senza dipendere da due fonti (workout_plans + nutrition_plans) per il conteggio, per evitare due fetch solo per un numero sulla card.

### A2. Tab Allenamento — fetch e card
- **fetchUserPlans(userId)** (planService) è già definita; restituisce **WorkoutPlan[]**. Usarla così com’è.
- **Rename inline**: come sopra, usare **updatePlan(plan.id, { name: value })**. Il DB ha **nome**; planService fa già il mapping.
- **Elimina**: doppio click → **deletePlan(plan.id)** + rimozione dalla lista con animazione (Framer Motion). Non usare `confirm()` se si vuole UX “Conferma eliminazione” al primo click; gestire stato locale “conferma in attesa” per quella card.

### A3. Tab Nutrizione — fetch
- **Consiglio**: Creare **`services/nutritionPlanService.ts`** (nuovo file) con **fetchUserNutritionPlans(userId)** che fa la query su **nutrition_plans** e restituisce un tipo **NutritionPlanRecord[]** (o un tipo che espone almeno `id`, `user_id`, `name`, `contenuto`, `created_at`). Tenere il “diario” (workout_diary) separato dalla “lista piani nutrizione” evita di sovraccaricare diaryService.
- I giorni nel piano nutrizione sono in **`contenuto.giorni`** (array **NutritionDay[]**: `giorno`, `pasti`, `calorie_totali`). Il carosello può mostrare **`giorno.giorno`** (es. "Lunedì") o "Giorno 1", "Giorno 2" in base a preferenza UX.
- **Elimina**: DELETE su **nutrition_plans** con **supabase.from('nutrition_plans').delete().eq('id', id).eq('user_id', userId)** (RLS già presente). Stessa logica doppio click della tab Allenamento.

### A4. Empty state
- Come da prompt: icona, titolo, descrizione, bottone “Apri PrimeBot” → **navigate('/ai-coach')**.

### A5. Animazioni
- Framer Motion: **AnimatePresence** per il pannello espanso (un solo aperto) e per la lista card (exit con opacity + scale prima di rimuovere dal DOM). Stagger sulle card in ingresso (delay 0.07s) come indicato.

---

## 3. PARTE B — SCHERMATA /esecuzione-workout

### B1. Route e state
- **useLocation().state**: `{ plan: WorkoutPlan, dayIndex: number }`. Se **state** è null/undefined → **navigate('/i-miei-piani')**.
- **Layout**: come da prompt (Header con back, pt-16 pb-24, BottomNavigation). Back → **navigate('/i-miei-piani')**.

### B2. Dati del giorno
- Esercizi del giorno: **`plan.workouts[dayIndex]`** (e da lì `.exercises` o `.esercizi`). Normalizzare con helper per nome/rest/sets/reps.
- **Titolo giorno**: se il “giorno” ha un nome (es. `plan.workouts[dayIndex].name`), usare quello; altrimenti "Giorno 1", "Giorno 2" in base a `dayIndex`.

### B3. Timer recupero
- **Consiglio**: Estrarre **parseRestTime** (e se serve **parseTimeToSeconds**) da **ActiveWorkout.tsx** in **utils/workoutUtils.ts** e importarla sia in ActiveWorkout sia in EsecuzioneWorkout. Il prompt vieta di duplicare; quindi o si sposta in utils e si aggiorna solo l’import in ActiveWorkout, oppure si importa da un modulo condiviso.
- **Comportamento**: come descritto nel prompt (serie → timer parte con rest dell’esercizio; completamento esercizio → timer con rest; ultimo esercizio → nessun timer, sblocco “Completa allenamento”). **navigator.vibrate**: sempre **if ('vibrate' in navigator)** prima di chiamare.

### B4. Struttura esercizi in EsecuzioneWorkout
- Gli esercizi nel piano possono avere **sets**/serie e **reps**/ripetizioni in formati vari (stringhe tipo "10-12"). Le “chips” sono una per serie; il numero di serie può venire da **exercise.sets** (o **exercise.serie**). Normalizzare con un helper (es. `getSetsCount(exercise)` che fa fallback a 3 o 4 se assente).

### B5. completeWorkoutFlow() — allineamento con analisi Diario/Stats
- **STEP 1** — **diaryService.completeWorkout(workoutData)**:
  - **workoutData** deve rispettare **WorkoutDiaryInsert**: non serve passare **user_id** (il service lo imposta con **getUser()**). Passare: **workout_id: plan.id**, **workout_source: 'workout_plans'** (per piani da IMieiPiani che vengono da workout_plans), **workout_name: plan.name**, **workout_type**: da **plan.plan_type** (string); **duration_minutes**, **exercises_count**, **exercises** (array del giorno), **completed_at**, **saved_at**. **status: 'completed'** è impostato dentro completeWorkout.
  - **Nota**: **WorkoutDiaryInsert** non ha **workout_type** obbligatorio; il DB **workout_diary** ha **workout_type**. Verificare che il tipo in diaryService accetti `workout_type` (già presente in WorkoutDiaryInsert come opzionale). Così **user_workout_stats** viene aggiornato da **updateWorkoutMetrics** interno a completeWorkout (niente doppio conteggio).
- **STEP 2** — INSERT **custom_workouts**: come da prompt. **Non** chiamare di nuovo updateWorkoutMetrics o updateWorkoutStats (evitare doppio conteggio).
- **STEP 3** — Evento: usare **CustomEvent** per coerenza con i listener esistenti: **`window.dispatchEvent(new CustomEvent('workoutCompleted', { detail: { workoutId: ... } }))`**. StatsOverview e WeeklyProgress si aggiornano già così.
- **STEP 4** — **navigate('/diary', { state: { justCompleted: true, workoutName: plan.name } })** (usare **plan.name**).

### B6. Esercizi passati a workout_diary e custom_workouts
- **exercises** in WorkoutDiaryInsert è **unknown[]**; in **custom_workouts** la colonna **exercises** è Json. Passare l’array degli esercizi del giorno già normalizzato (stesso formato usato in lettura: nome, rest, sets, reps, ecc.) così il diario e la dashboard mostrano dati coerenti.

---

## 4. PARTE C — SCHERMATA /dieta-del-giorno

### C1. State
- **useLocation().state**: `{ plan: StructuredNutritionPlan | NutritionPlanRecord, dayIndex: number }`. Se si passa da IMieiPiani il “plan” può essere il **contenuto** (StructuredNutritionPlan) o il record con **contenuto** dentro; in pagina usare **plan.giorni** (se plan è StructuredNutritionPlan) o **plan.contenuto.giorni** (se è NutritionPlanRecord). Normalizzare in una variabile **giorni** e usare **giorni[dayIndex]**.
- Se **state** è null → **navigate('/i-miei-piani')**.

### C2. Macro
- **StructuredNutritionPlan** ha **calorie_giornaliere** e **macronutrienti** (proteine/carboidrati/grassi %). **NutritionDay** ha **calorie_totali** e i singoli pasti. Per la strip si possono usare **calorie_totali** del giorno e, se disponibili, macro del giorno o del piano; altrimenti omettere la strip o mostrare solo kcal come da prompt.

### C3. Solo lettura
- Nessun INSERT/UPDATE; solo visualizzazione. OK.

---

## 5. PARTE D — PRIMEBOT CTA

### D1/D2. Dove aggiungere il bottone “Vai a I miei piani”
- Il messaggio bot con il piano (workout o nutrizione) viene creato in **HealthDisclaimer** **onAccept** (PrimeChat.tsx): si costruisce **botMessage** con **workoutPlan** o **nutritionPlan** e si fa **setMsgs(m => [...m, botMessage])**.
- **Consiglio**: Aggiungere **actions** a quel **botMessage** quando è di tipo workout e quando è di tipo nutrition:  
  **`actions: [{ type: 'navigate', label: '📋 Vai a I miei piani', payload: { path: '/i-miei-piani' } }]`**  
  così il bottone appare sotto la card del piano (workout o nutrizione) senza un secondo messaggio. Il tipo **ParsedAction** e **executeAction** già gestiscono **type: 'navigate'** e **payload.path**.
- **Modifica**: Solo nel blocco **onAccept** dove si costruisce **botMessage** (due rami: workout e nutrition), aggiungere la proprietà **actions** come sopra. Nessun altro punto di PrimeChat da toccare oltre a questo (e eventuali tipi se servissero).

---

## 6. VINCOLI E RISCHI

### 6.1 Non toccare
- **diaryService.ts**: non modificare; solo chiamare **completeWorkout** con il payload corretto.
- **ActiveWorkout.tsx**: toccare solo per **estrarre** parseRestTime (e parseTimeToSeconds se usata per il rest) in **utils/workoutUtils.ts** e aggiornare l’import. Nessun cambiamento di logica.
- **openai-service.ts**: non toccare.

### 6.2 TypeScript
- Definire tipi espliciti per: stato location (es. **EsecuzioneWorkoutLocationState**, **DietaDelGiornoLocationState**), per giorno piano (es. **WorkoutPlanDay** che estende PlanWorkoutItem se serve), e per gli esercizi normalizzati. Evitare **any**.
- **WorkoutPlan** è da **@/types/plan**; **StructuredNutritionPlan** / **NutritionDay** da **@/types/nutritionPlan**; **NutritionPlanRecord** può essere definito in **nutritionPlanService** o in types se già presente.

### 6.3 Build
- Dopo ogni step: **pnpm build:user** con exit 0 e 0 errori TypeScript.

### 6.4 Possibili conflitti
- **Route**: verificare che **/i-miei-piani**, **/esecuzione-workout**, **/dieta-del-giorno** non siano già usate (grep in App.tsx e router). Se esistono route simili, adattare i path o la posizione delle nuove route.
- **QuickActions**: sostituire la card “Piano Personalizzato” senza rimuovere altre azioni (Timer, Calendario, PrimeBot). Mantenere la griglia a 4 elementi se quella è la UI attuale.

---

## 7. RIEPILOGO CONSIGLI OPERATIVI

| Punto | Consiglio |
|-------|-----------|
| Nomi piano | Usare **plan.name** e **planService.updatePlan(plan.id, { name })** per rename. |
| Giorni / esercizi | **plan.workouts[dayIndex]** e normalizzare **exercises**/esercizi e campi **name**/nome, **rest**/riposo. |
| PDF allenamento | Creare **workoutPlanDayToStructuredPlan(plan, dayIndex)** e passarne il risultato a **downloadWorkoutPlanPDF**. |
| Elimina piano | **planService.deletePlan(plan.id)** per workout; DELETE diretto su **nutrition_plans** per nutrizione (con user_id). |
| Nutrizione fetch | Nuovo **nutritionPlanService.ts** con **fetchUserNutritionPlans(userId)**. |
| Timer rest | Estrarre **parseRestTime** (e se necessario parseTimeToSeconds) in **utils/workoutUtils.ts**; import in ActiveWorkout e EsecuzioneWorkout. |
| completeWorkoutFlow | STEP 1 diaryService.completeWorkout (workout_source: 'workout_plans'); STEP 2 insert custom_workouts; STEP 3 **CustomEvent** 'workoutCompleted'; STEP 4 navigate('/diary', state). |
| CTA PrimeBot | Aggiungere **actions: [{ type: 'navigate', label: '📋 Vai a I miei piani', payload: { path: '/i-miei-piani' } }]** al messaggio bot in **onAccept** (sia per workout che per nutrition). |
| Evento | **CustomEvent('workoutCompleted', { detail: ... })** per coerenza con StatsOverview/WeeklyProgress. |

Implementando in questo modo si evita di rompere flussi esistenti, si riusa al massimo codice e servizi, e Diario, Dashboard e Profilo restano allineati (come nell’analisi Collegamento Completa allenamento → Diario + Stats).

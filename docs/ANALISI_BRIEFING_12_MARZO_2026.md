# Analisi briefing sessione — 12 Marzo 2026
## Performance Prime (packages/app-user) — Solo analisi, nessuna implementazione

---

## TASK 1 — Fix planId in NutritionPlanCard

### Problema confermato
- `getStructuredNutritionPlan()` in `openai-service.ts` fa `.insert()` su `nutrition_plans` **senza** `.select()`: non legge l’`id` del record inserito.
- Il tipo di ritorno è `Promise<{ plan?: StructuredNutritionPlan; message: string; limitReached?: boolean }>` — **manca `planId`**.
- In `PrimeChat.tsx` il messaggio bot con il piano nutrizionale viene creato in due punti:
  1. **HealthDisclaimer onAccept** (righe ~2496–2511): crea `Msg` con `nutritionPlan: pendingPlan.nutritionPlan` e **nessun `planId`**.
  2. **Render messaggi** (righe ~2443–2449): `<NutritionPlanCard planId={undefined} ... />` — esplicitamente `undefined`.
- In `NutritionPlanCard.tsx`, `handleDelete` (righe 31–48):
  - Se `planId && userId` fa `supabase.from('nutrition_plans').delete().eq('id', planId).eq('user_id', userId)`.
  - Poi chiama sempre `onDelete?.()` (rimuove la card dalla UI).
  - Con `planId === undefined` la DELETE non viene eseguita; il piano resta in DB.

### File da modificare (TASK 1)
| File | Modifica |
|------|----------|
| `packages/app-user/src/lib/openai-service.ts` | Dopo l’`insert`, usare `.insert({...}).select('id').single()` (o equivalente), leggere `data.id`, e restituire `planId: string` nel return type e nell’oggetto restituito. |
| `packages/app-user/src/components/PrimeChat.tsx` | (1) Tipo `Msg`: aggiungere `nutritionPlanId?: string`. (2) Tipo `PendingPlanResponse`: aggiungere `nutritionPlanId?: string`. (3) In `generateNutritionPlanFromChat`: quando `result.plan` e `result.planId`, fare `setPendingPlan({ ..., nutritionPlan: result.plan, nutritionPlanId: result.planId })`. (4) In HealthDisclaimer `onAccept`, nel messaggio bot per nutrition includere `nutritionPlanId: pendingPlan.nutritionPlanId`. (5) Nel render dove si usa `NutritionPlanCard`, passare `planId={m.nutritionPlanId ?? undefined}` (o da `m.nutritionPlanId` se il tipo è opzionale). |
| `packages/app-user/src/components/primebot/NutritionPlanCard.tsx` | Comportamento attuale: se `planId` c’è fa DELETE poi `onDelete()`. Da confermare: chiamare `onDelete()` **solo dopo** DELETE riuscita (o gestire errore e non rimuovere la card in caso di fallimento). |

### Dettaglio tecnico Supabase
- Insert attuale (openai-service.ts ~1196):  
  `await supabase.from('nutrition_plans').insert({...});`  
  Nessun ritorno.
- Per avere l’id:  
  `const { data, error } = await supabase.from('nutrition_plans').insert({...}).select('id').single();`  
  poi `planId = data?.id` (e gestire `error`).

---

## TASK 2 — Scelta durata piano nutrizionale

### Flusso attuale
- **startNutritionPlanFlow** (righe 492–515): imposta allergie (conferma o aggiornamento), poi messaggio “hai allergie?” oppure bottoni “Aggiorna” / “Procedi”.
- Quando l’utente risponde:
  - **waitingForNutritionLimitations** (righe 1374–1386): testo → parse allergie, poi **subito** `generateNutritionPlanFromChat(savedPlanRequest || trimmed)`.
  - **waitingForNutritionLimitationsUpdate** (righe 1405–1418): stesso, aggiorna allergie e poi `generateNutritionPlanFromChat(trimmed)`.
- Non esiste uno stato “durata”; il prompt in `getStructuredNutritionPlan` dice “3 giorni rappresentativi” e usa `max_tokens: 6000` fisso.

### Ordine stati in `send()` (PrimeChat.tsx)
1. Escape universale  
2. Pain (waitingForPainResponse, waitingForPainDetails, waitingForPainPlanConfirmation)  
3. Plan confirmation / modify (waitingForPlanConfirmation, waitingForModifyChoice, waitingForModifyValue)  
4. **waitingForPlanTypeChoice**  
5. **waitingForWorkoutLimitations**  
6. **waitingForNutritionLimitations**  
7. **waitingForWorkoutLimitationsUpdate**  
8. **waitingForNutritionLimitationsUpdate**  
9. Rilevamento tipo piano (workout/nutrition/generic)  
10. … resto chat  

### Implementazione da fare (TASK 2)
- Aggiungere stato `waitingForNutritionDuration` (e setter).
- **Dopo** aver gestito allergie (sia nel ramo “no allergie” che “procedi”/“aggiorna”): invece di chiamare subito `generateNutritionPlanFromChat`, mostrare bottoni durata e impostare `waitingForNutritionDuration = true`.
- Inserire in `send()` il blocco per `waitingForNutritionDuration`: se trimmed è una scelta durata (o bottone con payload), mappare a `durationDays` (3, 7, 14, 30), poi chiamare `generateNutritionPlanFromChat(..., durationDays)`.
- **getStructuredNutritionPlan**: aggiungere parametro `durationDays: number`; nel system prompt usare “Crea un piano da X giorni”; impostare `max_tokens` in base a durata (es. 3→4000, 7→6000, 14→10000, 30→16000).
- **generateNutritionPlanFromChat**: accettare un secondo argomento opzionale `durationDays` e passarlo a `getStructuredNutritionPlan`.

### Punto di inserimento nel flusso
- Dopo `setWaitingForNutritionLimitations(false)` (e eventuale update allergie): invece di `await generateNutritionPlanFromChat(...)`, aggiungere messaggio bot con bottoni `[3 giorni] [1 settimana] [2 settimane] [1 mese]` e `setWaitingForNutritionDuration(true)`.
- Stesso per il ramo `waitingForNutritionLimitationsUpdate`: dopo aggiornamento allergie, mostrare bottoni durata e impostare `waitingForNutritionDuration(true)`.
- In `handlePlanFlowAction` non serve un nuovo case se la durata viene scelta con testo; se si usano bottoni con `plan_flow`, aggiungere un case che imposta la durata e chiama `generateNutritionPlanFromChat(request, durationDays)`.

---

## TASK 3 — Pagina /i-miei-piani

### Routing (App.tsx)
- Route attuali rilevanti: `/dashboard`, `/piani` (PlansPage), `/piani/nuovo` (PlanCreationPage), `/piani-attivi` (ActivePlansPage), `/profile`, `/ai-coach`, ecc.
- **Nuova route da aggiungere**: `/i-miei-piani` con stesso pattern delle altre pagine protette: `ProtectedRoute`, `Header`, `min-h-screen pt-24 pb-20`, `Suspense` + lazy component, `BottomNavigation`, `ConditionalFeedbackWidget`.
- **Componente lazy**: es. `const IMieiPianiPage = lazy(() => import('@/pages/piani/IMieiPianiPage'));` (o nome scelto).

### Pagine esistenti (packages/app-user/src/pages/)
- `piani/PlansPage.tsx` — “I tuoi piani”, usa `fetchUserPlans` (workout_plans), `PlanCard`, `CreatePlanCard`, `deletePlan`.
- `piani/PlanCreationPage.tsx` — creazione piano.
- `piani/ActivePlansPage.tsx` — piani attivi (workout), stesso stile delete/load.
- Altre: `dashboard`, `auth`, `landing`, `onboarding`, `diary`, `settings`, ecc.

### Dashboard e link
- **QuickActions.tsx**: griglia con “Piano Personalizzato” (card che va a `/piani-attivi`), Timer, Calendario, PrimeBot. Per “I miei piani” si può: aggiungere una nuova QuickAction “I miei piani” che fa `navigate('/i-miei-piani')`, oppure far sì che la card “Piano Personalizzato” vada a `/i-miei-piani` (così la pagina unifica piani workout e nutrizione). Decisione da allineare con il briefing (link in Dashboard: QuickActions o dopo generazione piano).
- **Profile.tsx**: due colonne; a sinistra `UserProfile`, `AchievementsBoard`, `ProgressHistory`; a destra `Settings`. Il link “I miei piani” può andare in `Settings` (aggiungendo una voce alla lista come “I miei piani” con icona FileText/ClipboardList che punta a `/i-miei-piani`) oppure come piccola card/link sopra o sotto Settings. **Settings.tsx** ha `settingsItems` array di `{ icon, label, action }`; si può aggiungere `{ icon: FileText, label: 'I miei piani', action: '/i-miei-piani' }`.

### PrimeBot — link dopo generazione piano
- Dopo aver mostrato il piano (workout o nutrizione), il messaggio di conferma può includere un’azione “Vai a I miei piani” (navigazione a `/i-miei-piani`). In PrimeChat i messaggi bot possono avere `actions: ParsedAction[]` con `type: 'navigate'` e `payload: { path: '/i-miei-piani', label: '...' }`. Quindi aggiungere un messaggio successivo (o un’azione sul messaggio del piano) con bottone “Vai a I miei piani” che esegue `navigate('/i-miei-piani')`.

### Tabelle DB
- **Allenamento**: in `PlansPage` / `ActivePlansPage` e `planService` si usa **workout_plans** (non `custom_workouts` per la lista piani “creati”). `fetchUserPlans` in planService legge da `workout_plans` con `is_active: true`. Per la nuova pagina tab “Allenamento” si può riusare `fetchUserPlans(userId)` e la stessa lista.
- **Nutrizione**: tabella **nutrition_plans** (user_id, name, description, goal, contenuto JSONB, created_at, ecc.). Servirà una funzione tipo `fetchUserNutritionPlans(userId)` che fa `supabase.from('nutrition_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false })`.

### NutritionPlanCard e PDF
- **NutritionPlanCard.tsx**: accetta `plan: StructuredNutritionPlan`, `planId?`, `userId`, `onDelete?`. Per la pagina “I miei piani” si possono mostrare card compatte (nome, data, anteprima) con azioni [Scarica PDF] [Elimina]; il PDF si può generare da `contenuto` (JSONB) già salvato in `nutrition_plans`, mappato a `StructuredNutritionPlan` per `downloadNutritionPlanPDF`.
- **pdfExport.ts**: esporta `downloadNutritionPlanPDF(plan: StructuredNutritionPlan)` e `downloadWorkoutPlanPDF` (per piani allenamento). Entrambe riutilizzabili dalla nuova pagina.

### Design system (da briefing)
- Background: `#0A0A0C`
- Card: `#16161A`
- Oro: `#EEBA2B`
- Font: Outfit
- Coerenza con altre pagine: padding, border-radius, stile come PlansPage/ActivePlansPage (gradient, Loader2, toast, conferma eliminazione).

### Riepilogo implementazione TASK 3
1. Creare `pages/piani/IMieiPianiPage.tsx` (o `IMieiPiani.tsx`): due tab “Allenamento” / “Nutrizione”, liste da `workout_plans` e `nutrition_plans`, per ogni piano nome/data/anteprima e pulsanti [Scarica PDF] [Elimina], stato vuoto per tab senza piani.
2. In **App.tsx**: aggiungere route `/i-miei-piani` con lazy + layout standard.
3. **Dashboard**: aggiungere link a “I miei piani” (QuickActions o card “Piano Personalizzato” → `/i-miei-piani`).
4. **Profilo**: in Settings aggiungere voce “I miei piani” → `/i-miei-piani`.
5. **PrimeChat**: dopo generazione piano (workout o nutrizione), mostrare messaggio/bottone “Vai a I miei piani” che naviga a `/i-miei-piani`.

---

## Riepilogo file coinvolti per tutti i task

| Task | File |
|------|------|
| 1 | `lib/openai-service.ts`, `components/PrimeChat.tsx`, `components/primebot/NutritionPlanCard.tsx` |
| 2 | `components/PrimeChat.tsx`, `lib/openai-service.ts` |
| 3 | `App.tsx`, `pages/piani/IMieiPianiPage.tsx` (nuovo), `components/dashboard/QuickActions.tsx`, `components/profile/Settings.tsx`, `components/PrimeChat.tsx`, servizio fetch piani nutrizione (nuovo o in planService), `utils/pdfExport.ts` (riuso) |

---

## Note tecniche (dal briefing)
- jsPDF: niente emoji/Unicode con Helvetica; testo plain.
- `import autoTable from 'jspdf-autotable'` come side-effect dove serve.
- pain tracking: `usePainTracking` (non `getUserPainZones`).
- ActionType: `'save_workout' | 'add_diary' | 'navigate' | 'start_workout' | 'plan_flow'`.

Fine analisi. Implementazione da eseguire solo dopo conferma; iniziare dal TASK 1.

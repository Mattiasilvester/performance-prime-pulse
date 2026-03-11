# Analisi PrimeBot Fase A + B — Dettaglio tecnico (app-user)

**Data:** 11 Marzo 2026  
**Scope:** `packages/app-user` (Performance Prime)  
**Tipo:** Solo analisi, nessuna modifica al codice.

---

## 1. user_workout_stats — Struttura esatta

### Tipo TypeScript completo

**Path:** `packages/app-user/src/integrations/supabase/types.ts` (righe 1986-2020)

```ts
user_workout_stats: {
  Row: {
    created_at: string
    current_streak_days: number | null
    id: string
    last_workout_date: string | null
    longest_streak_days: number | null
    total_hours: number | null
    total_workouts: number | null
    updated_at: string
    user_id: string
  }
  Insert: { ... }
  Update: { ... }
}
```

Estensione locale in `packages/app-user/src/services/diaryService.ts` (righe 52-62):

```ts
export interface UserWorkoutStats {
  id: string;
  user_id: string;
  total_workouts: number;
  total_hours: number;
  current_streak_days?: number | null;
  longest_streak_days?: number | null;
  last_workout_date?: string | null;
  created_at: string;
  updated_at: string;
}
```

**Nota:** Non esiste `packages/shared/src/types/database.ts` nel repo; i tipi sono solo in `packages/app-user/src/integrations/supabase/types.ts`.

### Query esistenti su user_workout_stats

| File | Uso | Snippet |
|------|-----|--------|
| `workoutStatsService.ts` | fetchWorkoutStats: upsert dopo calcolo da custom_workouts | `.from('user_workout_stats').upsert({ user_id, total_workouts, total_hours, updated_at })` |
| `workoutStatsService.ts` | updateWorkoutStats: incrementa total_workouts e total_hours | `.select('total_workouts, total_hours').eq('user_id', userId).maybeSingle()` poi `.update(...)` o `.insert(...)` — **non tocca streak né last_workout_date** |
| `workoutStatsService.ts` | resetWorkoutStats | `.delete().eq('user_id', userId)` |
| `diaryService.ts` | getUserMetrics | `.select('*').eq('user_id', user.id).maybeSingle()` |
| `diaryService.ts` | updateWorkoutMetrics (dopo save su workout_diary) | Calcola streak e last_workout_date, poi `.upsert(metricsData, { onConflict: 'user_id' })` con current_streak_days, longest_streak_days, last_workout_date |
| `updateWorkoutMetrics.ts` | updateWorkoutMetrics (chiamato da ActiveWorkout/QuickWorkout "Segna Completato") | `.select('total_workouts, total_hours').maybeSingle()` poi `.update({ total_workouts, total_hours, updated_at })` o `.insert(...)` — **non aggiorna current_streak_days né last_workout_date** |
| `monthlyStatsService.ts` | checkMonthlyReset | `.select('*').eq('user_id', userId).maybeSingle()` e `.update({ total_workouts: 0, total_hours: 0 })` |
| `WeeklyProgress.tsx` | Lettura stats per grafico | `.select('total_workouts, total_hours').eq('user_id', user.id)` |

### last_workout_date — Formato

- In **types**: `string | null` (Supabase restituisce stringhe per timestamp/date).
- In **diaryService.updateWorkoutMetrics**: viene impostato come **data in formato ISO date-only**: `todayStr = today.toISOString().split('T')[0]` (es. `"2026-03-11"`). Quindi è una **stringa tipo "YYYY-MM-DD"**, non un timestamp con ora.

### current_streak_days — Aggiornamento in tempo reale?

- **No, non sempre.**  
  - **Aggiornato** quando l’utente fa **"Salva su Diario"** (workout_diary): `diaryService.updateWorkoutMetrics(workout)` calcola streak e fa upsert su `user_workout_stats` (current_streak_days, longest_streak_days, last_workout_date).  
  - **Non aggiornato** quando l’utente fa solo **"Segna Completato"** (senza Salva su Diario): viene chiamato `updateWorkoutMetrics.ts` che aggiorna solo `total_workouts` e `total_hours`. Quindi in quel flusso `current_streak_days` e `last_workout_date` restano invariati (o null).  
- Per Fase A/B: se PrimeBot legge streak/last_workout da `user_workout_stats`, bisogna essere consapevoli che dopo un solo "Segna Completato" questi campi possono essere obsoleti fino a un successivo "Salva su Diario" o a un altro percorso che chiama `diaryService.updateWorkoutMetrics`.

---

## 2. custom_workouts — Ultimo allenamento

### Tipo TypeScript completo

**Path:** `packages/app-user/src/integrations/supabase/types.ts` (righe 318-358)

```ts
custom_workouts: {
  Row: {
    completed: boolean | null
    completed_at: string | null
    created_at: string
    exercises: Json
    id: string
    scheduled_date: string
    title: string
    total_duration: number | null
    updated_at: string
    user_id: string
    workout_type: string
  }
  Insert: { ... }
  Update: { ... }
}
```

### Recupero ultimo workout completato

- **Non esiste** una funzione dedicata che fa esplicitamente `.order('completed_at', { ascending: false }).limit(1)` per l’ultimo workout completato.
- Query simili:
  - **RecentActivity.tsx**:  
    `.from('custom_workouts').select('title, total_duration, completed_at, workout_type').eq('user_id', user.id).eq('completed', true).order('completed_at', { ascending: false })`  
    (nessun `.limit(1)`; prende tutti i completati per la lista attività).
  - **WeeklyProgress.tsx**:  
    `.from('custom_workouts').select('...').eq('user_id', user.id).eq('completed', true).order('created_at', { ascending: false })` e un’altra con `.order('created_at', { ascending: false })`.

Per implementare “ultimo workout completato” si può riusare la stessa query di RecentActivity aggiungendo `.limit(1)` e, se serve, `.select('id, title, workout_type, total_duration, completed_at, exercises, ...')`.

### Campo exercises — Struttura

- Tipo in DB: **Json** (array di oggetti).
- Nel codice, gli oggetti esercizio usati in insert/map hanno forma tipo:
  - **ActiveWorkout / WorkoutExerciseShape**: `{ name, duration?, rest?, instructions?, sets? }`.
  - **Salvataggio da ActiveWorkout** (custom_workouts insert): `exercises: currentWorkout.exercises` (stessa forma).
  - **Salvataggio su workout_diary** (diaryService): `exercises: currentWorkout.exercises?.map(ex => ({ name, duration, rest, completed }))`.
  - **QuickWorkout** insert: `exercises: WORKOUT_CIRCUIT` (oggetti con `id, name, instructions, duration, rest, category`).
  - **primebotActionsService.saveWorkoutPlan**: `exercises: payload.exercises` (array da piano AI).

Quindi la struttura è **variabile** (nome, serie/ripetizioni/durata, riposo, note, ecc.). Un tipo minimo sicuro per “ultimo workout” è: `{ name: string; duration?: string | number; rest?: string | number; [key: string]: unknown }[]`.

### workout_type — Valori

- In **types**: `string` (nessun enum in DB).
- Valori usati nel codice:
  - **ActiveWorkout** insert: `'personalizzato'`.
  - **QuickWorkout** insert: `'cardio'`.
  - **WorkoutAttachments** (import PDF): `'pdf_import'`.
  - **primebotActionsService**: `'cardio' | 'forza' | 'hiit' | 'mobilita' | 'personalizzato'` per save_workout; `'quick' | 'custom'` per start_workout.
  - **WorkoutCreationModal / Workouts**: `'personalizzato'`, e da piani `workoutType`/`tipo` (es. `'forza'`, `'giornaliero'`).
- In sintesi: **forza, cardio, hiit, mobilita, personalizzato, pdf_import, quick** (e varianti come da piani).

---

## 3. user_objectives — Struttura esatta

### Esistenza e tipo TypeScript

**Path:** `packages/app-user/src/integrations/supabase/types.ts` (righe 1869-1903)

```ts
user_objectives: {
  Row: {
    completed: boolean
    completed_at: string | null
    created_at: string
    description: string
    id: string
    progress: number
    title: string
    updated_at: string
    user_id: string
  }
  Insert: { ... }
  Update: { ... }
}
```

- **Non** c’è colonna `due_date`, `target_date` o simile: **nessuna scadenza** in tabella.

### Creazione / lettura

- **Creazione:** `ObjectiveModal.tsx` — insert con `user_id, title, description, completed: false, progress: 0` (created_at/updated_at default).
- **Lettura:**  
  - **RecentActivity.tsx**: `.from('user_objectives').select('title, completed_at').eq('user_id', user.id).eq('completed', true).order('completed_at', { ascending: false })`.  
  - **StatsOverview.tsx**: `.from('user_objectives').select('completed').eq('user_id', user.id)` (conteggio totali/completati).

Non c’è in codice una query che aggiorna `progress`; l’interfaccia TypeScript ammette `progress: number`. Per Fase A/B si può assumere **progress 0–100** se si vuole usarlo nel prompt (da confermare con eventuale UI che lo imposta).

---

## 4. getUserContext() — Struttura attuale completa

### Path

`packages/app-user/src/services/primebotUserContextService.ts`

### Tipo UserContext completo (attuale)

```ts
export interface UserContext {
  nome: string;
  eta?: number | null;
  peso?: number | null;
  altezza?: number | null;
  obiettivi: string[];
  livello_fitness: 'beginner' | 'intermediate' | 'advanced' | null;
  livello_fitness_it: string;
  attrezzatura_disponibile: string[];
  tempo_allenamento: number | null;
  luoghi_allenamento: string[];
  giorni_settimana?: number | null;
  consigli_nutrizionali?: boolean | null;
  onboarding_completed: boolean;
  ha_limitazioni?: boolean | null;
  limitazioni_descrizione?: string | null;
  zone_da_proteggere?: string[] | null;
  note_mediche?: string | null;
  allergie_alimentari?: string[] | null;
  zone_dolori_dettagli?: string | null;
}
```

### getUserContext() — Contenuto attuale (dopo modifiche sessione precedente)

```ts
export async function getUserContext(userId: string): Promise<UserContext> {
  try {
    const onboardingData = await onboardingService.loadOnboardingData(userId);
    const userProfile = await fetchUserProfile();
    const nome = onboardingData?.nome || userProfile?.name || 'Utente';

    const context: UserContext = {
      nome,
      eta: onboardingData?.eta || null,
      peso: onboardingData?.peso || null,
      altezza: onboardingData?.altezza || null,
      obiettivi: onboardingData?.obiettivo ? [mapGoalToLabel(onboardingData.obiettivo)] : ['fitness generale'],
      livello_fitness: mapFitnessLevel(onboardingData?.livello_esperienza),
      livello_fitness_it: onboardingData?.livello_esperienza || 'principiante',
      attrezzatura_disponibile: buildEquipmentList(onboardingData || {} as OnboardingResponse),
      tempo_allenamento: onboardingData?.tempo_sessione || null,
      luoghi_allenamento: onboardingData?.luoghi_allenamento || [],
      giorni_settimana: onboardingData?.giorni_settimana || null,
      consigli_nutrizionali: onboardingData?.consigli_nutrizionali || false,
      onboarding_completed: !!onboardingData?.onboarding_completed_at,
      ha_limitazioni: onboardingData?.ha_limitazioni ?? null,
      limitazioni_descrizione: onboardingData?.limitazioni_fisiche ?? null,
      zone_da_proteggere: onboardingData?.zone_evitare ?? null,
      note_mediche: onboardingData?.condizioni_mediche ?? null,
      allergie_alimentari: onboardingData?.allergie_alimentari ?? null,
      zone_dolori_dettagli: formatZoneDoloriDettagli((onboardingData as unknown as Record<string, unknown>)?.zone_dolori_dettagli),
    };
    return context;
  } catch (error) {
    // ... return default context con tutti i campi incluso allergie_alimentari: null, zone_dolori_dettagli: null
  }
}
```

### formatUserContextForPrompt() — Contenuto attuale

- Nome, obiettivi, livello fitness.
- **Età, peso, altezza** (solo se presenti).
- Attrezzatura, tempo allenamento, luoghi, giorni_settimana, consigli_nutrizionali.
- Limitazioni (ha_limitazioni + limitazioni_descrizione), zone_da_proteggere, note_mediche.
- **Allergie alimentari** (join array), **Dettagli dolori/zone sensibili** (zone_dolori_dettagli).

Righe ~309–389 in `primebotUserContextService.ts`.

---

## 5. ActiveWorkout.tsx — Schermata post-workout

### Codice schermata "workout completato"

**Path:** `packages/app-user/src/components/workouts/ActiveWorkout.tsx` (righe 1185–1232)

```tsx
if (workoutState === 'completed') {
  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
      <div className="flex-shrink-0 p-4">
        <button onClick={onClose} className="text-pp-gold/80 hover:text-pp-gold text-sm">
          ← Torna alla Dashboard
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="text-center space-y-8 max-w-md w-full">
          <div className="flex justify-center">...</div>
          <div>
            <h1 className="text-4xl font-bold text-pp-gold mb-2">Complimenti!</h1>
            <p className="text-xl text-pp-gold/80">Workout completato con successo</p>
          </div>
          <div className="space-y-4">
            <button onClick={handleTerminateSession}>Segna Completato</button>
            <button onClick={saveToDiary}>Salva su Diario</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Dati disponibili in quel momento

- **currentWorkout**: da `customWorkout || generatedWorkout || workoutData[workoutId]` (contiene `exercises`, nome/title, tipo, durata, meta).
- **workoutTitle**: `personalizedMeta?.workoutTitle || currentDisplay?.title || currentDisplay?.name || 'Workout personalizzato'`.
- **workoutType**: da meta o display (es. `'Allenamento personalizzato'`, `'forza'`).
- **workoutDuration**: da meta o display (minuti).
- **workoutExerciseCount**: `currentWorkout?.exercises?.length || 0`.
- **completedExercises**: array di indici degli esercizi completati.
- **user**: da `useAuth()`.

Non viene mostrato un riepilogo testuale (nome workout, durata, numero esercizi) nella schermata; sono solo “Complimenti!” e i due bottoni.

### Navigazione dopo "Segna Completato"

- **handleTerminateSession** chiama `completeWorkout()` e poi **onClose()**.
- **onClose** è una prop: in `Workouts.tsx` è `handleCloseWorkout` che fa `setActiveWorkout(null)` (e set di custom/generated a null). Quindi **non** c’è `navigate()`: si resta sulla stessa route `/workouts` e si torna alla lista workout. L’utente può poi navigare da lì (es. menu a Dashboard o altro).

### Props e state principali

- **Props:** `workoutId: string`, `generatedWorkout?: GeneratedWorkoutShape | null`, `customWorkout?: GeneratedWorkoutShape | null`, `onClose: () => void`.
- **State rilevante:** `workoutState`, `completedExercises`, `currentExerciseIndex`, `workoutStarted`, `exerciseTimers`, ecc. In stato `completed` i dati workout sono ancora disponibili come sopra.

---

## 6. QuickWorkout.tsx — Schermata post-workout

### Codice schermata completamento

**Path:** `packages/app-user/src/pages/QuickWorkout.tsx` (righe 664–711)

- Stessa struttura di ActiveWorkout: “Complimenti!”, “Segna Completato”, “Salva su Diario”.
- Header: bottone “← Torna alla Dashboard” che fa `navigate('/dashboard')`.

### Dati disponibili al completamento

- **WORKOUT_CIRCUIT**: array fisso di esercizi (id, name, instructions, duration, rest, category).
- Titolo fisso: `'Allenamento Rapido 10 minuti'`, tipo `'cardio'`, durata 10 minuti.
- **markCompleted**: inserisce su `custom_workouts` con `title: 'Allenamento Rapido 10 minuti', workout_type: 'cardio', total_duration: 10, exercises: WORKOUT_CIRCUIT`, poi chiama `updateWorkoutMetrics(user.id, 10)` (solo total_workouts/total_hours), poi `navigate('/dashboard')`.
- **saveToDiary**: costruisce entry workout_diary e chiama `saveWorkoutToDiary` (che a sua volta chiama `diaryService.updateWorkoutMetrics` → aggiorna anche streak e last_workout_date); **non** fa navigate automatico in quel blocco (il flusso dopo Salva su Diario dipende da eventuale altro codice nella pagina).

### Navigazione post-completamento

- **Segna Completato:** dopo insert e updateWorkoutMetrics, eventuale notifica sfida, poi **navigate('/dashboard')**.
- **Salva su Diario:** nessun navigate mostrato nel snippet; l’utente resta sulla schermata a meno di altro handler.

---

## 7. PrimeChat.tsx — Apertura con state

### Lettura di location.state

- **PrimeChat.tsx**: **nessun** `useLocation()` né `location.state`.
- **AICoachPrime.tsx**: **nessun** `useLocation()` né `location.state`.

Quindi **non** esiste logica che legge `navigate('/ai-coach', { state: { ... } })` in PrimeChat o nel wrapper.

### Dove aggiungere initialMessage / messaggio precompilato

- **Opzione 1 (consigliata):** in **PrimeChat.tsx**  
  - Aggiungere `const location = useLocation();` e in un `useEffect` (o al primo render) leggere `location.state?.initialMessage` (o `location.state?.primebotContext`).  
  - Se presente: impostare `hasStartedChat` a true, eventualmente inserire un messaggio bot di benvenuto e un messaggio user con quel testo, poi chiamare `send(initialMessage)` (o simulare l’invio) dopo un breve delay per evitare doppio invio se si precompila anche l’input).  
  - Pulire lo state dopo averlo usato (es. `navigate(location.pathname, { replace: true, state: {} })`) per evitare di rieseguire al refresh.
- **Opzione 2:** in **AICoachPrime**  
  - Leggere `location.state` e passare a PrimeChat una prop tipo `initialMessage?: string`; PrimeChat la usa al mount per aprire la chat e inviare il messaggio.  
  - Richiede che PrimeChat accetti la prop e la gestisca (stesso tipo di logica di cui sopra, ma prop invece di location).

---

## 8. openai-service.ts — Chiamata API completa

### Body inviato a `/api/ai-chat` in getAIResponse

**Path:** `packages/app-user/src/lib/openai-service.ts` (righe 299–310)

```ts
body: JSON.stringify({
  messages,
  model: 'gpt-3.5-turbo'
})
```

- **messages**: array di oggetti `{ role: 'system' | 'user' | 'assistant', content: string }`: 1 system (systemPrompt), N da conversationHistory (ultimi 10), 1 user (messaggio corrente).
- **model**: stringa fissa **`'gpt-3.5-turbo'`** (hardcoded nel client). Nessun `max_tokens`, `temperature`, `stream` nel body client.

### api/ai-chat.ts (Vercel) — Parametri verso OpenAI

**Path:** `api/ai-chat.ts` (root del repo)

- Input: `const { messages, model = 'gpt-3.5-turbo' } = req.body;`
- Chiamata OpenAI:

```ts
body: JSON.stringify({
  model,
  messages,
  temperature: 0.7,
  max_tokens: 500
})
```

- **max_tokens: 500** — può essere poco per piani dettagliati (testo lungo); per Fase B potrebbe servire aumentare (es. 1000–1500) o passarlo dal client.
- **temperature: 0.7** — fisso lato server.
- **Modello:** ricevuto dal client, default `'gpt-3.5-turbo'`; quindi il modello è **passato dal client** (che attualmente invia sempre quella stringa).

---

## 9. primebotConversationService.ts — getSessionHistory e cronologia

### getSessionHistory completa

**Path:** `packages/app-user/src/services/primebotConversationService.ts` (righe 213–259)

```ts
export async function getSessionHistory(
  userId: string,
  sessionId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from('primebot_interactions')
      .select('message_content, bot_response, timestamp')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) return [];
    if (!data || data.length === 0) return [];

    const messages: ConversationMessage[] = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const interaction = data[i];
      messages.push({ role: 'user', content: interaction.message_content, timestamp: interaction.timestamp || undefined });
      messages.push({ role: 'assistant', content: interaction.bot_response, timestamp: interaction.timestamp || undefined });
    }
    return messages;
  } catch (error) {
    return [];
  }
}
```

### formatHistoryForOpenAI

```ts
export function formatHistoryForOpenAI(
  history: ConversationMessage[]
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  return history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
```

### Struttura record primebot_interactions

**Path:** `packages/app-user/src/integrations/supabase/types.ts` (righe 654–695)

- **Row:** id, user_id, session_id, message_content, bot_response, interaction_type, user_context (Json), bot_intent, timestamp, response_time_ms, tokens_used.
- Per la cronologia si usano: **message_content**, **bot_response**, **timestamp** (e user_id, session_id per filtrare).

### Funzione per caricare cronologia in formato UI

- **Non esiste** una funzione dedicata che “carica la cronologia e la restituisce in formato UI” (es. per popolare `msgs` in PrimeChat).
- **getSessionHistory** restituisce già `ConversationMessage[]` con `{ role, content, timestamp }`. Per mostrarla in chat basta mappare in oggetti tipo `{ id, role: 'user'|'bot', text }` (e opzionalmente timestamp). Quindi si può:
  - usare **getSessionHistory** nel mount di PrimeChat e mappare il risultato in `Msg[]` per `setMsgs`, oppure
  - aggiungere una funzione helper tipo `getSessionHistoryForUI(userId, sessionId, limit)` che ritorna `Promise<Msg[]>` (stessa query, mapping diverso). La struttura dati è già compatibile; manca solo la chiamata e il mapping in PrimeChat.

---

## Riepilogo finale

### Tutto pronto per implementare

- **user_workout_stats**: tipo e query chiari; attenzione al doppio flusso (solo total_workouts/total_hours vs streak/last_workout_date).
- **custom_workouts**: tipo e valori workout_type chiari; nessuna funzione “ultimo workout” ma facile da aggiungere (query esistente + limit(1)).
- **user_objectives**: tipo e query chiari; nessuna scadenza in DB; progress presente ma non aggiornato in codice visto.
- **getUserContext / formatUserContextForPrompt**: già aggiornati con eta, peso, altezza, allergie, zone_dolori; punto naturale per aggiungere streak, last_workout, ultimo workout, obiettivi.
- **ActiveWorkout / QuickWorkout**: schermate completamento e dati disponibili chiari; dove inserire CTA “Chiedi a PrimeBot” e eventuale `navigate('/ai-coach', { state: { initialMessage: '...' } })`.
- **PrimeChat**: nessun uso di location.state; punto di ingresso per `initialMessage` (o prop da AICoachPrime) identificato.
- **openai-service e api/ai-chat**: body e parametri OpenAI chiari; max_tokens 500 potrebbe essere aumentato per piani lunghi.
- **primebotConversationService**: getSessionHistory e formatHistoryForOpenAI pronte; nessun caricamento cronologia in UI ma struttura già adatta.

### Problemi / attenzioni da risolvere prima (o durante)

1. **Streak e last_workout_date** non aggiornati su “Segna Completato” (solo “Salva su Diario” li aggiorna). Per Fase A/B: decidere se unificare l’aggiornamento (es. chiamare anche diaryService.updateWorkoutMetrics quando si fa “Segna Completato”) o documentare che PrimeBot potrebbe vedere dati non aggiornati.
2. **max_tokens: 500** in api/ai-chat può troncare risposte lunghe; considerare aumento o parametro da client.
3. **user_objectives.progress**: nessun update nel codice; se usato da PrimeBot, definire semantica (0–100) e eventuale UI per aggiornarlo.
4. **Esercizi in custom_workouts.exercises**: formato Json variabile; per “ultimo workout” nel prompt usare un’estratta (es. titolo, tipo, durata, numero esercizi) per evitare token eccessivi e parsing fragile.

Con queste note, l’implementazione Fase A e B può procedere con modifiche mirate ai file indicati.

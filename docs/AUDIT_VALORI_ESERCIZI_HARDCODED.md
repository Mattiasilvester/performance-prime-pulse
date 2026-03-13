# Audit valori esercizi hardcoded — solo analisi, nessuna modifica

**Criteri di valutazione:**
- **OK:** durata 20s–60s cardio/HIIT; 30s–90s forza; rest coerente
- **TROPPO LUNGO:** >120s per singolo esercizio
- **TROPPO CORTO:** sotto i range minimi ragionevoli
- **RECUPERO MANCANTE:** rest = 0 su esercizi main (warmup/cooldown possono avere rest = 0)
- **NOME IN INGLESE:** nome esercizio non in italiano

---

## 1. QuickWorkout.tsx — WORKOUT_CIRCUIT (13 esercizi)

| Nome esercizio        | Durata attuale | Recupero attuale | Category  | Valutazione      |
|-----------------------|----------------|------------------|-----------|------------------|
| Jumping Jacks         | 30s            | 0s               | warmup    | NOME IN INGLESE   |
| Marcia sul posto      | 30s            | 0s               | warmup    | OK               |
| Rotazioni braccia     | 30s            | 0s               | warmup    | OK               |
| Stretch dinamico      | 30s            | 0s               | warmup    | OK               |
| Push-up               | 45s            | 15s              | main      | NOME IN INGLESE   |
| Squat                 | 45s            | 15s              | main      | NOME IN INGLESE   |
| Plank                 | 30s            | 30s              | main      | NOME IN INGLESE   |
| Mountain Climbers     | 45s            | 15s              | main      | NOME IN INGLESE   |
| Burpees Modificati    | 30s            | 30s              | main      | OK               |
| Affondi Alternati     | 45s            | 15s              | main      | OK               |
| Stretch Quadricipiti  | 60s            | 0s               | cooldown  | OK               |
| Stretch Polpacci      | 60s            | 0s               | cooldown  | OK               |
| Respirazione Profonda | 60s            | 0s               | cooldown  | OK               |

**Note QuickWorkout:**  
- Warmup e cooldown con rest 0 sono coerenti.  
- Tutti i main hanno rest > 0.  
- Durate nel range 30–60s.  
- Diversi nomi in inglese (Jumping Jacks, Push-up, Squat, Plank, Mountain Climbers).

---

## 2. ActiveWorkout.tsx — workoutData (preset per categoria)

### 2.1 cardio — Cardio Brucia Grassi

| Nome esercizio   | Durata attuale | Recupero attuale | Valutazione |
|------------------|----------------|------------------|-------------|
| Jumping Jacks    | 30s            | 10s              | NOME IN INGLESE |
| Saltelli Laterali| 30s            | 10s              | OK         |
| Burpees          | 30s            | 15s              | NOME IN INGLESE |
| Scalatori        | 30s            | 10s              | OK         |

### 2.2 strength — Forza Upper Body

| Nome esercizio  | Durata attuale | Recupero attuale | Valutazione |
|-----------------|----------------|------------------|-------------|
| Flessioni      | 45s            | 15s              | OK         |
| Plank          | 60s            | 20s              | NOME IN INGLESE |
| Pike Flessioni | 45s            | 15s              | OK         |
| Tricep Dips    | 45s            | 15s              | NOME IN INGLESE |

### 2.3 recommended — HIIT Total Body

| Nome esercizio    | Durata attuale | Recupero attuale | Valutazione |
|-------------------|----------------|------------------|-------------|
| Squat Jumps       | 45s            | 15s              | NOME IN INGLESE |
| Push-up to T      | 45s            | 15s              | NOME IN INGLESE |
| Saltelli in Plank | 45s            | 15s              | OK         |
| Affondi Saltati   | 45s            | 15s              | OK         |

### 2.4 hiit — HIIT Intenso

| Nome esercizio    | Durata attuale | Recupero attuale | Valutazione |
|-------------------|----------------|------------------|-------------|
| Sprint sul posto  | 30s            | 10s              | OK         |
| Jump Squats       | 30s            | 10s              | NOME IN INGLESE |
| Burpees esplosivi | 30s            | 15s              | OK         |
| Saltelli Laterali | 30s            | 10s              | OK         |

### 2.5 mobility — Mobilità e Stretching

| Nome esercizio           | Durata attuale | Recupero attuale | Valutazione |
|--------------------------|----------------|------------------|-------------|
| Gatto e Mucca            | 60s            | 10s              | OK         |
| Cerchi con i Fianchi     | 45s            | 10s              | OK         |
| Rotazioni delle Spalle   | 45s            | 10s              | OK         |
| Oscillazioni delle Gambe | 60s            | 15s              | OK         |

**Note ActiveWorkout workoutData:**  
- Nessuna durata >120s.  
- Tutti gli esercizi hanno rest > 0.  
- Valori realistici; unici flag sono i nomi in inglese dove presenti.

---

## 3. workoutGenerator.ts — regole e database

**Percorso file:** `packages/app-user/src/services/workoutGenerator.ts`  
*(Il task citava `src/lib/workoutGenerator.ts`; nel progetto il file è in `src/services/workoutGenerator.ts`.)*

### 3.1 WORKOUT_RULES — exerciseDuration (secondi) e restBetweenExercises

Qui le durate sono in **secondi** e vengono usate per generare gli allenamenti (es. `duration: \`${duration}s\``). Sono quindi la causa di eventuali “240s per Saltelli Laterali” quando si genera un workout CARDIO.

| Categoria | Livello     | exerciseDuration | restBetweenExercises | Valutazione |
|-----------|-------------|------------------|----------------------|-------------|
| FORZA     | PRINCIPIANTE| 45s              | 60s                  | OK          |
| FORZA     | INTERMEDIO  | 60s              | 45s                  | OK          |
| FORZA     | AVANZATO    | 75s              | 30s                  | OK          |
| HIIT      | PRINCIPIANTE| 30s              | 60s                  | OK          |
| HIIT      | INTERMEDIO  | 45s              | 45s                  | OK          |
| HIIT      | AVANZATO    | 60s              | 30s                  | OK          |
| **CARDIO**| **PRINCIPIANTE** | **180s**  | 60s                  | **TROPPO LUNGO** |
| **CARDIO**| **INTERMEDIO**   | **240s**  | 45s                  | **TROPPO LUNGO** |
| **CARDIO**| **AVANZATO**     | **300s**  | 30s                  | **TROPPO LUNGO** |
| MOBILITA  | PRINCIPIANTE| 30s              | 15s                  | OK          |
| MOBILITA  | INTERMEDIO  | 45s              | 10s                  | OK          |
| MOBILITA  | AVANZATO    | 60s              | 10s                  | OK          |

**Nota critica:**  
In CARDIO, `exerciseDuration` è 180 / 240 / 300 **secondi** (3–5 minuti per esercizio). Usato così nel generatore produce durate assurde per un singolo esercizio in un circuito (es. 240s = 4 min per “Saltelli Laterali”). È la principale fonte dei valori “troppo lunghi” segnalati.

### 3.2 QUICK_MODE_RULES (secondi per lavoro/recupero)

| Categoria | duration (lavoro) | rest (recupero) | Valutazione |
|-----------|--------------------|-----------------|-------------|
| FORZA     | 40s                | 20s             | OK          |
| HIIT      | 30s                | 20s             | OK          |
| CARDIO    | 90s                | 30s             | OK          |
| MOBILITA  | 40s                | 15s             | OK          |

### 3.3 exerciseDatabase — durate per intensità (short / medium / long)

Non c’è una durata “per ogni esercizio”: ogni categoria ha una lista di nomi e un oggetto `durations` con work/rest per intensità.

| Categoria | Intensità | work | rest | Valutazione |
|-----------|-----------|------|------|-------------|
| cardio    | short     | 20s  | 10s  | OK          |
| cardio    | medium    | 30s  | 10s  | OK          |
| cardio    | long      | 45s  | 15s  | OK          |
| strength  | short     | 30s  | 15s  | OK          |
| strength  | medium    | 45s  | 15s  | OK          |
| strength  | long      | 60s  | 20s  | OK          |
| hiit      | short     | 20s  | 10s  | OK          |
| hiit      | medium    | 30s  | 10s  | OK          |
| hiit      | long      | 40s  | 15s  | OK          |
| mobility  | short     | 45s  | 10s  | OK          |
| mobility  | medium    | 60s  | 10s  | OK          |
| mobility  | long      | 90s  | 15s  | OK          |

### 3.4 detailedExerciseDatabase

- **detailedExerciseDatabase.strength**  
  Contiene solo `name`, `muscleGroup`, `equipment`, `level`. **Nessun campo duration/rest**; le durate arrivano da WORKOUT_RULES o da exerciseDatabase.durations in base al flusso di generazione.

- **detailedExerciseDatabase.hiit**  
  Ogni entry ha un campo `duration` che rappresenta la **durata della sessione** (es. '5-10 min', '15-20 min', '25-30 min'), non la durata del singolo esercizio. Non è quindi confrontabile con i criteri “20s–60s per esercizio”.

| Nome (esempio)   | duration (campo) | Note                    |
|------------------|------------------|-------------------------|
| Jumping Jacks    | '5-10 min'       | Durata sessione         |
| Saltelli Laterali| '5-10 min'       | Durata sessione         |
| …                | …                | …                       |
| Burpees Esplosivi| '25-30 min'      | Durata sessione         |

Per un audit “valore per esercizio” qui non si applicano le etichette OK/TROPPO LUNGO; va solo riportato che il campo è a livello sessione.

---

## 4. Riepilogo problemi

| Fonte                    | Problema                                                                 | Azione suggerita (solo analisi, non applicata) |
|--------------------------|---------------------------------------------------------------------------|-----------------------------------------------|
| workoutGenerator.ts      | CARDIO: exerciseDuration 180s / 240s / 300s → singolo esercizio 3–5 min | Portare a range tipo 30–90s per esercizio     |
| QuickWorkout.tsx         | Diversi nomi in inglese (Jumping Jacks, Push-up, Squat, Plank, Mountain Climbers) | Eventuale traduzione nomi in italiano   |
| ActiveWorkout.tsx        | Nomi in inglese in preset (Jumping Jacks, Burpees, Plank, Tricep Dips, Squat Jumps, Push-up to T, Jump Squats) | Eventuale traduzione per coerenza UI    |
| workoutData (ActiveWorkout) | Nessun rest = 0 su main; nessuna durata >120s                         | Nessuna modifica necessaria per criteri audit |
| WORKOUT_CIRCUIT (QuickWorkout) | Rest 0 solo su warmup/cooldown; durate 30–60s                         | Nessuna modifica necessaria per criteri audit |

---

*Audit completato senza modifiche al codice. File analizzati: QuickWorkout.tsx, ActiveWorkout.tsx, services/workoutGenerator.ts.*

# TIME PARSING TEST - 8 AGOSTO 2025

## 📋 **Test Sistema Parsing con Tempi**

### 🎯 **Obiettivo**
Verificare che il sistema riconosca correttamente tempi, note tra parentesi e formati specifici.

### 🔧 **Miglioramenti Implementati**

#### **1. Nuovi Campi Supportati**
```typescript
export interface ExtractedExercise {
  name: string;
  sets?: string;
  reps?: string;
  repeats?: string; // Per ripetute (es. 6x400m)
  time?: string; // Per tempi (es. 30 sec, 5 min)
  rest?: string;
  notes?: string;
}

export interface WorkoutSection {
  title: string;
  exercises: ExtractedExercise[];
  type: 'warmup' | 'workout' | 'cooldown' | 'other';
  time?: string; // Per sezioni con tempo (es. "Riscaldamento (10 minuti)")
}
```

#### **2. Formati Tempo Supportati**
- ✅ **Tempo esercizi:** "3x30 sec", "3x5 min"
- ✅ **Tempo sezioni:** "Riscaldamento (10 minuti)", "Stretching finale (5-10 minuti)"
- ✅ **Note tra parentesi:** "(per gamba)", "(assistite o libere)"
- ✅ **Range ripetizioni:** "8-10", "max reps"
- ✅ **Distanze:** "(100m)", "(5km)"

#### **3. Pattern Avanzati**
```typescript
const EXERCISE_PATTERNS = [
  // Formato con tempo: "Nome: 3x30 sec" o "Nome: 3x5 min"
  /^(\d+\.\s*)?(.+?):\s*(\d+)\s*[xX]\s*(\d+)\s*(sec|min)$/i,
  
  // Formato con note tra parentesi: "Nome: 3x12 (per gamba)"
  /^(\d+\.\s*)?(.+?):\s*(\d+)\s*[xX]\s*(\d+)\s*\(([^)]+)\)$/i,
  
  // Formato con max reps: "Nome: 4x max reps"
  /^(\d+\.\s*)?(.+?):\s*(\d+)\s*[xX]\s*(max\s+reps?)$/i,
];
```

### 📊 **Test Case 1: Formati con Tempi**

#### **Input File:**
```
Riscaldamento (10 minuti):
- Corsa leggera: Serie: 1 Ripetizioni: 1 Riposo: 5 min
- Skip alto: 3x20
- Plank: 3x30 sec

Giorno 1 (Forza):
1. Squat: 4x8-10
2. Panca piana: 4x8 (2 min)
3. Rematore: 4x10 2 min
4. Affondi con manubri: 3x12 (per gamba)
5. Plank: 3x30 sec
6. Interval training: 8x30 sec - Alta intensità

Giorno 2 (Cardio):
1. Corsa: 3x(5km) rec. 3'
2. Cyclette: 4x10 min
3. Sprint: Ripetute: 6x400m

Stretching finale (5-10 minuti):
- Stretching leggero
- Respirazione profonda
```

#### **Output Atteso:**
```typescript
{
  sections: [
    {
      title: "Riscaldamento (10 minuti)",
      type: "warmup",
      time: "10 min",
      exercises: [
        { name: "Corsa leggera", sets: "1", reps: "1", rest: "5 min" },
        { name: "Skip alto", sets: "3", reps: "20", rest: "2 min" },
        { name: "Plank", sets: "3", time: "30 sec", rest: "2 min" }
      ]
    },
    {
      title: "Giorno 1 (Forza)",
      type: "workout",
      exercises: [
        { name: "Squat", sets: "4", reps: "8-10", rest: "2 min" },
        { name: "Panca piana", sets: "4", reps: "8", rest: "2 min" },
        { name: "Rematore", sets: "4", reps: "10", rest: "2 min" },
        { name: "Affondi con manubri", sets: "3", reps: "12", notes: "per gamba", rest: "2 min" },
        { name: "Plank", sets: "3", time: "30 sec", rest: "2 min" },
        { name: "Interval training", sets: "8", time: "30 sec", notes: "Alta intensità", rest: "2 min" }
      ]
    },
    {
      title: "Giorno 2 (Cardio)",
      type: "workout",
      exercises: [
        { name: "Corsa", sets: "3", reps: "5km", rest: "3 min" },
        { name: "Cyclette", sets: "4", time: "10 min", rest: "2 min" },
        { name: "Sprint", repeats: "6x400m", rest: "2 min" }
      ]
    },
    {
      title: "Stretching finale (5-10 minuti)",
      type: "cooldown",
      time: "5-10 min",
      exercises: []
    }
  ]
}
```

### 📊 **Test Case 2: Formati Specifici**

#### **Input File:**
```
Allenamento Completo:

1. Push-up: 3x12
2. Pull-up: 3x8 (1 min)
3. Dip: 3x10 2 min
4. Plank: 3x30 sec
5. Bicep Curl: 3x12 - Controllato
6. Tricep Extension: 3x12 (assistite o libere)
7. Squat: 4x max reps
8. Deadlift: 3x8 (per gamba)

Riposo: 2 minuti tra le serie
Durata: 45 minuti
```

#### **Output Atteso:**
```typescript
{
  sections: [
    {
      title: "Allenamento",
      type: "workout",
      exercises: [
        { name: "Push-up", sets: "3", reps: "12", rest: "2 min" },
        { name: "Pull-up", sets: "3", reps: "8", rest: "1 min" },
        { name: "Dip", sets: "3", reps: "10", rest: "2 min" },
        { name: "Plank", sets: "3", time: "30 sec", rest: "2 min" },
        { name: "Bicep Curl", sets: "3", reps: "12", notes: "Controllato", rest: "2 min" },
        { name: "Tricep Extension", sets: "3", reps: "12", notes: "assistite o libere", rest: "2 min" },
        { name: "Squat", sets: "4", reps: "max reps", rest: "2 min" },
        { name: "Deadlift", sets: "3", reps: "8", notes: "per gamba", rest: "2 min" }
      ]
    }
  ],
  workoutTitle: "Allenamento Completo",
  duration: "45"
}
```

### 🔍 **Debug Output**

#### **Console Log Atteso:**
```
=== DEBUG ANALISI FILE ===
File: allenamento_completo.pdf
Tipo: application/pdf
Testo estratto: [contenuto del file]
Sezioni trovate: [
  { title: "Riscaldamento (10 minuti)", type: "warmup", time: "10 min", exercises: [...] },
  { title: "Giorno 1 (Forza)", type: "workout", exercises: [...] },
  { title: "Giorno 2 (Cardio)", type: "workout", exercises: [...] },
  { title: "Stretching finale (5-10 minuti)", type: "cooldown", time: "5-10 min", exercises: [] }
]
Titolo: undefined
Durata: undefined
=== FINE DEBUG ===
```

### ✅ **Criteri di Successo**

#### **1. Riconoscimento Tempi**
- ✅ **Tempo sezioni:** "Riscaldamento (10 minuti)" → time: "10 min"
- ✅ **Range tempo sezioni:** "Stretching finale (5-10 minuti)" → time: "5-10 min"
- ✅ **Tempo esercizi:** "3x30 sec" → time: "30 sec"
- ✅ **Tempo esercizi:** "4x10 min" → time: "10 min"

#### **2. Riconoscimento Note**
- ✅ **Note tra parentesi:** "(per gamba)" → notes: "per gamba"
- ✅ **Note con trattino:** "- Alta intensità" → notes: "Alta intensità"
- ✅ **Note multiple:** "(assistite o libere)" → notes: "assistite o libere"

#### **3. Riconoscimento Formati Speciali**
- ✅ **Max reps:** "4x max reps" → reps: "max reps"
- ✅ **Range ripetizioni:** "8-10" → reps: "8-10"
- ✅ **Distanze:** "(5km)" → reps: "5km"
- ✅ **Ripetute:** "6x400m" → repeats: "6x400m"

#### **4. UI Visualizzazione**
- ✅ **Tempo sezioni:** Mostrato con icona arancione
- ✅ **Tempo esercizi:** Mostrato come campo separato
- ✅ **Note:** Mostrate come campo separato
- ✅ **Formato chiaro:** Visualizzazione ordinata

### 🚀 **Prossimi Test**

#### **Test da Eseguire:**
1. **Carica PDF con tempi sezioni** → Verifica riconoscimento tempo sezioni
2. **Carica PDF con tempi esercizi** → Verifica riconoscimento tempo esercizi
3. **Carica PDF con note parentesi** → Verifica riconoscimento note
4. **Carica PDF con max reps** → Verifica riconoscimento max reps
5. **Carica PDF con range** → Verifica riconoscimento range

#### **Metriche da Verificare:**
- **Accuratezza tempi:** 90%+ tempi riconosciuti correttamente
- **Accuratezza note:** 90%+ note estratte correttamente
- **Accuratezza formati:** 90%+ formati speciali riconosciuti
- **Performance:** < 2 secondi per file < 1MB
- **Robustezza:** Gestione errori senza crash
- **UX:** Feedback chiaro all'utente

---

**Stato Test: 🔄 IN CORSO**
**Risultato Atteso: ✅ TEMPI E NOTE RICONOSCIUTI CORRETTAMENTE**
**Prossimo Passo: 🧪 TEST CON FILE REALI**

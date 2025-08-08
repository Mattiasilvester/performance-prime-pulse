# ADVANCED PARSING TEST - 8 AGOSTO 2025

## 📋 **Test Sistema Parsing Avanzato**

### 🎯 **Obiettivo**
Verificare che il sistema riconosca correttamente formati complessi di esercizi inclusi ripetute, note e formati diversi.

### 🔧 **Miglioramenti Implementati**

#### **1. Formati Supportati**
- ✅ **Formato lungo:** "Nome: Serie: 3 Ripetizioni: 10 Riposo: 2 min"
- ✅ **Formato standard:** "Nome: 3x10" o "Nome 3x10"
- ✅ **Formato con range:** "Nome: 3x8-10"
- ✅ **Formato con riposo:** "Nome: 3x10 2 min" o "Nome: 3x10 (2 min)"
- ✅ **Formato ripetute:** "Nome: Ripetute: 6x400m"
- ✅ **Formato con distanza:** "Nome: 4x(100m) rec. 2'"
- ✅ **Formato con note:** "Nome: 3x10 - Note"

#### **2. Nuovi Campi**
```typescript
export interface ExtractedExercise {
  name: string;
  sets?: string;
  reps?: string;
  repeats?: string; // Per ripetute (es. 6x400m)
  rest?: string;
  notes?: string;
}
```

#### **3. Pattern Avanzati**
```typescript
const EXERCISE_PATTERNS = [
  // Formato lungo: "Nome: Serie: 3 Ripetizioni: 10 Riposo: 2 min"
  /^(.+?)\s*[:\-]\s*Serie\s*:?\s*(\d+).*?Ripetizioni\s*:?\s*(\d+).*?Riposo\s*:?\s*([\w\s\.'']+)/i,
  
  // Formato ripetute: "Nome: Ripetute: 6x400m"
  /^(.+?)\s*[:\-]\s*Ripetute\s*:?\s*(\d+)\s*[xX]\s*([\w\d]+)/i,
  
  // Formato con distanza: "Nome: 4x(100m) rec. 2'"
  /^(.+?)\s*[:\-]\s*(\d+)\s*[xX]\s*\(([\w\d]+)\)\s*rec\.?\s*(\d+)\s*['']/i,
];
```

### 📊 **Test Case 1: Formati Complessi**

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
4. Sprint: Ripetute: 6x400m
5. Nuoto: 4x(100m) rec. 2'
6. Interval training: 8x30 sec - Alta intensità

Giorno 2 (Cardio):
1. Corsa: 3x(5km) rec. 3'
2. Cyclette: 4x10 min
3. Fartlek: Ripetute: 10x2 min
```

#### **Output Atteso:**
```typescript
{
  sections: [
    {
      title: "Riscaldamento (10 minuti)",
      type: "warmup",
      exercises: [
        { name: "Corsa leggera", sets: "1", reps: "1", rest: "5 min" },
        { name: "Skip alto", sets: "3", reps: "20", rest: "2 min" },
        { name: "Plank", sets: "3", reps: "30 sec", rest: "2 min" }
      ]
    },
    {
      title: "Giorno 1 (Forza)",
      type: "workout",
      exercises: [
        { name: "Squat", sets: "4", reps: "8-10", rest: "2 min" },
        { name: "Panca piana", sets: "4", reps: "8", rest: "2 min" },
        { name: "Rematore", sets: "4", reps: "10", rest: "2 min" },
        { name: "Sprint", repeats: "6x400m", rest: "2 min" },
        { name: "Nuoto", sets: "4", reps: "100m", rest: "2 min" },
        { name: "Interval training", sets: "8", reps: "30 sec", notes: "Alta intensità", rest: "2 min" }
      ]
    },
    {
      title: "Giorno 2 (Cardio)",
      type: "workout",
      exercises: [
        { name: "Corsa", sets: "3", reps: "5km", rest: "3 min" },
        { name: "Cyclette", sets: "4", reps: "10 min", rest: "2 min" },
        { name: "Fartlek", repeats: "10x2 min", rest: "2 min" }
      ]
    }
  ]
}
```

### 📊 **Test Case 2: Formati Misti**

#### **Input File:**
```
Allenamento Completo:

1. Push-up: 3x12
2. Pull-up: 3x8 (1 min)
3. Dip: 3x10 2 min
4. Shoulder Press: Serie: 3 Ripetizioni: 10 Riposo: 2 min
5. Bicep Curl: 3x12 - Controllato
6. Tricep Extension: 3x12

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
        { name: "Shoulder Press", sets: "3", reps: "10", rest: "2 min" },
        { name: "Bicep Curl", sets: "3", reps: "12", notes: "Controllato", rest: "2 min" },
        { name: "Tricep Extension", sets: "3", reps: "12", rest: "2 min" }
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
  { title: "Riscaldamento (10 minuti)", type: "warmup", exercises: [...] },
  { title: "Giorno 1 (Forza)", type: "workout", exercises: [...] },
  { title: "Giorno 2 (Cardio)", type: "workout", exercises: [...] }
]
Titolo: undefined
Durata: undefined
=== FINE DEBUG ===
```

### ✅ **Criteri di Successo**

#### **1. Riconoscimento Formati**
- ✅ **Formato lungo:** "Serie: 3 Ripetizioni: 10 Riposo: 2 min"
- ✅ **Formato standard:** "3x10" o "3 x 10"
- ✅ **Formato con range:** "8-10"
- ✅ **Formato con riposo:** "2 min" o "(2 min)"
- ✅ **Formato ripetute:** "6x400m"
- ✅ **Formato con distanza:** "(100m) rec. 2'"
- ✅ **Formato con note:** "- Alta intensità"

#### **2. Campi Estratti**
- ✅ **Nome esercizio:** Estrazione corretta
- ✅ **Serie:** Riconosce numeri di serie
- ✅ **Ripetizioni:** Riconosce numeri di ripetizioni
- ✅ **Ripetute:** Riconosce formato "6x400m"
- ✅ **Riposo:** Riconosce tempo di recupero
- ✅ **Note:** Estrae note aggiuntive

#### **3. UI Visualizzazione**
- ✅ **Campi completi:** Mostra tutti i campi estratti
- ✅ **Formato chiaro:** Visualizzazione ordinata
- ✅ **Campi opzionali:** Mostra solo se presenti
- ✅ **Struttura gerarchica:** Sezioni → Esercizi → Dettagli

### 🚀 **Prossimi Test**

#### **Test da Eseguire:**
1. **Carica PDF con formati complessi** → Verifica riconoscimento
2. **Carica PDF con ripetute** → Verifica campo repeats
3. **Carica PDF con note** → Verifica campo notes
4. **Carica PDF con distanze** → Verifica formato distanza
5. **Carica PDF con range** → Verifica formato range

#### **Metriche da Verificare:**
- **Accuratezza formati:** 90%+ formati riconosciuti correttamente
- **Accuratezza campi:** 90%+ campi estratti correttamente
- **Performance:** < 2 secondi per file < 1MB
- **Robustezza:** Gestione errori senza crash
- **UX:** Feedback chiaro all'utente

---

**Stato Test: 🔄 IN CORSO**
**Risultato Atteso: ✅ FORMATI COMPLESSI RICONOSCIUTI CORRETTAMENTE**
**Prossimo Passo: 🧪 TEST CON FILE REALI**

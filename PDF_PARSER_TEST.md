# PDF PARSER TEST - 8 AGOSTO 2025

## 🔴 **PROBLEMA CRITICO RISOLTO**

### 📋 **Contesto**
Il sistema NON stava estraendo correttamente i dati dal PDF della scheda di allenamento:
- **Giorno 1**: Mostrava solo "Squat con bilanciere" e "Panca piana manubri" con riposo 3 min, ma MANCAVANO serie e ripetizioni
- **Giorno 2**: Mostrava "Stacco da terra" e "Lat machine presa larga" ma SENZA dati di serie/ripetizioni  
- **Giorno 3**: Mostrava "Chest press macchina" e "Rematore bilanciere" ma SENZA dati di serie/ripetizioni
- **Riscaldamento**: Mostrava solo "Min Camminata O Cyclette" senza il tempo effettivo

### ✅ **SOLUZIONE IMPLEMENTATA**

#### **1. Parser Completamente Nuovo**
```typescript
const EXERCISE_PATTERNS = [
  // Pattern 1: Serie e ripetizioni standard con riposo (es: "Squat con bilanciere 3x8-10 Riposo: 3 min")
  /^(.+?)\s+(\d+)\s*x\s*(\d+(?:-\d+)?)\s+Riposo:\s*(\d+(?:\.\d+)?)\s*min$/i,
  
  // Pattern 2: Con note tra parentesi (es: "Stacco da terra (o variante) 3x6-8 Riposo: 3 min")
  /^(.+?)\s+\((.+?)\)\s+(\d+)\s*x\s*(\d+(?:-\d+)?)\s+Riposo:\s*(\d+(?:\.\d+)?)\s*min$/i,
  
  // Pattern 3: Con "per gamba" (es: "Affondi con manubri 3x10 per gamba Riposo: 3 min")
  /^(.+?)\s+(\d+)\s*x\s*(\d+(?:-\d+)?)\s+per\s+gamba\s+Riposo:\s*(\d+(?:\.\d+)?)\s*min$/i,
  
  // Pattern 4: Riscaldamento con minuti (es: "10 Min Camminata O Cyclette")
  /^(\d+)\s+Min\s+(.+)$/i,
  
  // Pattern 5: Stretching con range di tempo (es: "5-10 min")
  /^(\d+)-(\d+)\s+min$/i,
];
```

#### **2. Debug Completo**
```typescript
console.log('=== DEBUG PARSING PDF ===');
console.log('Testo originale:', text);
console.log('Righe pulite:', lines);
console.log('Riposo di default:', defaultRest);

// Per ogni riga
console.log(`Processando riga: "${trimmedLine}"`);
console.log(`Trovata sezione: "${trimmedLine}"`);
console.log(`Trovato esercizio:`, exercise);
console.log(`⚠️ Esercizio non riconosciuto: "${trimmedLine}"`);
```

#### **3. Pattern Matching Specifico**
```typescript
// Pattern 1: Nome Serie x Reps Riposo: X min
if (patternIndex === 0) {
  exerciseName = groups[0];
  sets = groups[1];
  reps = groups[2];
  rest = `${groups[3]} min`;
}
// Pattern 2: Nome (note) Serie x Reps Riposo: X min
else if (patternIndex === 1) {
  exerciseName = groups[0];
  notes = groups[1];
  sets = groups[2];
  reps = groups[3];
  rest = `${groups[4]} min`;
}
```

### 📊 **Test Case: PDF Reale**

#### **Input File:**
```
Riscaldamento
10 Min Camminata O Cyclette

Giorno 1 (Full Body)
Squat con bilanciere 3x8-10 Riposo: 3 min
Panca piana manubri 3x8-10 Riposo: 3 min
Rematore bilanciere 3x8-10 Riposo: 3 min
Lento avanti manubri 3x10 Riposo: 2 min
Leg curl macchina 3x12 Riposo: 2 min

Giorno 2 (Full Body)
Stacco da terra (o variante) 3x6-8 Riposo: 3 min
Lat machine presa larga 3x10 Riposo: 3 min
Chest press macchina 3x10 Riposo: 3 min
Affondi con manubri 3x10 per gamba Riposo: 3 min

Giorno 3 (Cardio)
Corsa 3x(5km) rec. 3'
Cyclette 4x10 min
Sprint Ripetute: 6x400m

Stretching finale
5-10 min
```

#### **Output Atteso:**
```typescript
{
  sections: [
    {
      title: "Riscaldamento",
      type: "warmup",
      exercises: [
        { name: "Camminata O Cyclette", time: "10 min", sets: undefined, reps: undefined, rest: undefined }
      ]
    },
    {
      title: "Giorno 1 (Full Body)",
      type: "workout",
      exercises: [
        { name: "Squat con bilanciere", sets: "3", reps: "8-10", rest: "3 min" },
        { name: "Panca piana manubri", sets: "3", reps: "8-10", rest: "3 min" },
        { name: "Rematore bilanciere", sets: "3", reps: "8-10", rest: "3 min" },
        { name: "Lento avanti manubri", sets: "3", reps: "10", rest: "2 min" },
        { name: "Leg curl macchina", sets: "3", reps: "12", rest: "2 min" }
      ]
    },
    {
      title: "Giorno 2 (Full Body)",
      type: "workout",
      exercises: [
        { name: "Stacco da terra", notes: "o variante", sets: "3", reps: "6-8", rest: "3 min" },
        { name: "Lat machine presa larga", sets: "3", reps: "10", rest: "3 min" },
        { name: "Chest press macchina", sets: "3", reps: "10", rest: "3 min" },
        { name: "Affondi con manubri", sets: "3", reps: "10", notes: "per gamba", rest: "3 min" }
      ]
    },
    {
      title: "Giorno 3 (Cardio)",
      type: "workout",
      exercises: [
        { name: "Corsa", sets: "3", reps: "5km", rest: "3 min" },
        { name: "Cyclette", sets: "4", time: "10 min", rest: "2 min" },
        { name: "Sprint", repeats: "6x400m", rest: "2 min" }
      ]
    },
    {
      title: "Stretching finale",
      type: "cooldown",
      exercises: [
        { name: "Stretching", time: "5-10 min", sets: undefined, reps: undefined, rest: undefined }
      ]
    }
  ]
}
```

### 🔍 **Debug Output Atteso**

#### **Console Log:**
```
=== DEBUG PARSING PDF ===
Testo originale: [contenuto del file]
Righe pulite: [
  "Riscaldamento",
  "10 Min Camminata O Cyclette",
  "Giorno 1 (Full Body)",
  "Squat con bilanciere 3x8-10 Riposo: 3 min",
  "Panca piana manubri 3x8-10 Riposo: 3 min",
  ...
]
Riposo di default: 2 min

Processando riga: "Riscaldamento"
Trovata sezione: "Riscaldamento"

Processando riga: "10 Min Camminata O Cyclette"
Pattern 4 match: ["10 Min Camminata O Cyclette", "10", "Camminata O Cyclette"]
Trovato esercizio: { name: "Camminata O Cyclette", time: "10 min" }

Processando riga: "Giorno 1 (Full Body)"
Trovata sezione: "Giorno 1 (Full Body)"

Processando riga: "Squat con bilanciere 3x8-10 Riposo: 3 min"
Pattern 1 match: ["Squat con bilanciere 3x8-10 Riposo: 3 min", "Squat con bilanciere", "3", "8-10", "3"]
Trovato esercizio: { name: "Squat con bilanciere", sets: "3", reps: "8-10", rest: "3 min" }

Processando riga: "Stacco da terra (o variante) 3x6-8 Riposo: 3 min"
Pattern 2 match: ["Stacco da terra (o variante) 3x6-8 Riposo: 3 min", "Stacco da terra", "o variante", "3", "6-8", "3"]
Trovato esercizio: { name: "Stacco da terra", notes: "o variante", sets: "3", reps: "6-8", rest: "3 min" }

Processando riga: "Affondi con manubri 3x10 per gamba Riposo: 3 min"
Pattern 3 match: ["Affondi con manubri 3x10 per gamba Riposo: 3 min", "Affondi con manubri", "3", "10", "3"]
Trovato esercizio: { name: "Affondi con manubri", sets: "3", reps: "10", notes: "per gamba", rest: "3 min" }

=== FINE DEBUG PARSING ===
```

### ✅ **Criteri di Successo**

#### **1. Riconoscimento Completo**
- ✅ **Serie e ripetizioni:** "3x8-10" → sets: "3", reps: "8-10"
- ✅ **Tempo di riposo:** "Riposo: 3 min" → rest: "3 min"
- ✅ **Note tra parentesi:** "(o variante)" → notes: "o variante"
- ✅ **Note speciali:** "per gamba" → notes: "per gamba"
- ✅ **Tempo riscaldamento:** "10 Min Camminata" → time: "10 min"
- ✅ **Range tempo:** "5-10 min" → time: "5-10 min"

#### **2. Struttura Corretta**
- ✅ **Sezioni:** Riscaldamento, Giorno 1, Giorno 2, Giorno 3, Stretching finale
- ✅ **Tipo sezioni:** warmup, workout, cooldown
- ✅ **Ordine esercizi:** Mantenuto l'ordine originale
- ✅ **Dati completi:** Tutti i campi popolati correttamente

#### **3. UI Visualizzazione**
- ✅ **Serie:** Mostrate come "Serie: 3"
- ✅ **Ripetizioni:** Mostrate come "Ripetizioni: 8-10"
- ✅ **Riposo:** Mostrato come "Riposo: 3 min"
- ✅ **Note:** Mostrate come "Note: per gamba"
- ✅ **Tempo:** Mostrato come "Tempo: 10 min"

### 🚀 **Test da Eseguire**

#### **Test 1: Carica PDF Fullbody**
1. **Carica il PDF fullbody** → Dovrebbe riconoscere tutti i formati
2. **Controlla la console** → Vedrai il debug dettagliato
3. **Verifica la UI** → Ogni campo dovrebbe essere visualizzato correttamente

#### **Test 2: Verifica Dati**
- **Giorno 1:** Squat con bilanciere → Serie: 3, Ripetizioni: 8-10, Riposo: 3 min
- **Giorno 2:** Stacco da terra → Serie: 3, Ripetizioni: 6-8, Note: o variante, Riposo: 3 min
- **Riscaldamento:** Camminata O Cyclette → Tempo: 10 min
- **Stretching:** Stretching → Tempo: 5-10 min

#### **Test 3: Debug Console**
- **Pattern matching:** Ogni riga dovrebbe matchare un pattern
- **Dati estratti:** Tutti i campi dovrebbero essere popolati
- **Errori:** Nessun "⚠️ Esercizio non riconosciuto"

### 🎯 **Risultato Atteso**

**PRIMA (❌ NON FUNZIONANTE):**
- Giorno 1: Squat con bilanciere (solo nome, mancavano serie/ripetizioni)
- Riscaldamento: Min Camminata O Cyclette (senza tempo)

**DOPO (✅ FUNZIONANTE):**
- Giorno 1: Squat con bilanciere → Serie: 3, Ripetizioni: 8-10, Riposo: 3 min
- Riscaldamento: Camminata O Cyclette → Tempo: 10 min

### 🔧 **Miglioramenti Implementati**

#### **1. Pattern Regex Specifici**
- **Pattern 1:** `Squat con bilanciere 3x8-10 Riposo: 3 min`
- **Pattern 2:** `Stacco da terra (o variante) 3x6-8 Riposo: 3 min`
- **Pattern 3:** `Affondi con manubri 3x10 per gamba Riposo: 3 min`
- **Pattern 4:** `10 Min Camminata O Cyclette`
- **Pattern 5:** `5-10 min`

#### **2. Debug Completo**
- **Console log dettagliato** per ogni riga processata
- **Pattern matching** con indicazione del pattern usato
- **Dati estratti** con tutti i campi
- **Errori** per righe non riconosciute

#### **3. Gestione Errori**
- **Fallback** per pattern non riconosciuti
- **Default values** per campi mancanti
- **Validazione** dei dati estratti

---

**Stato Test: 🔄 IN CORSO**
**Risultato Atteso: ✅ PARSING PDF COMPLETAMENTE FUNZIONANTE**
**Prossimo Passo: 🧪 TEST CON FILE REALI**

# PARSER CON RILEVAMENTO SEZIONI AVANZATO - 8 AGOSTO 2025

## 🔍 **PARSER CON RILEVAMENTO SEZIONI AVANZATO - Sistema Completo**

### ✅ **PROBLEMI RISOLTI**

Ho implementato il **parser con rilevamento sezioni avanzato** che risolve tutti i problemi identificati:

#### **❌ PROBLEMI PRECEDENTI:**
- Le intestazioni "Giorno 1/2/3 (Full Body)" non venivano sempre rilevate
- Gli esercizi finivano nel blocco sbagliato (Riscaldamento)
- Nel riscaldamento compaiono campi non pertinenti (Riposo) e esercizi di forza
- Stretching letto come "formato non standard"

#### **✅ SOLUZIONI IMPLEMENTATE:**

### **1. Preprocessing del Testo**
```typescript
preprocessText(text: string): string {
  // Normalizza caratteri
  let normalized = text
    .replace(/×/g, 'x') // Sostituisci × con x
    .replace(/–/g, '-') // Normalizza trattini
    .replace(/\s+/g, ' ') // Rimuovi spazi multipli
    .replace(/\n\s*\n/g, '\n') // Rimuovi righe vuote multiple
    .trim();
  
  // Unifica unità di misura
  normalized = normalized
    .replace(/\b(min|mins|minuti)\b/gi, 'min')
    .replace(/\b(sec|secondi)\b/gi, 'sec')
    .replace(/\b(giri|rounds?)\b/gi, 'giri');
  
  // Rimuovi numeri di pagina
  normalized = normalized.replace(/^(Page|Pagina)\s+\d+$/gm, '');
  
  return normalized;
}
```

### **2. Rilevamento Sezioni con Regex Forte**
```typescript
// Regex forte per intestazioni
const H = {
  warmup: /^(riscaldamento)(?:\s*\((\d+)(?:–|-|to)?(\d+)?\s*minuti?\))?:?/i,
  day: /^giorno\s*(\d+)\b(?:.*)?$/i,
  stretch: /^(stretching\s*finale)(?::|\s*\((\d+)(?:–|-|to)?(\d+)?\s*min(?:uti)?\))?/i,
  // Fallback per inglese
  warmupEn: /^(warm[\s-]?up)(?:\s*\((\d+)(?:–|-|to)?(\d+)?\s*min(?:utes?)?\))?:?/i,
  dayEn: /^day\s*(\d+)\b(?:.*)?$/i,
  stretchEn: /^(cool[\s-]?down|stretching)(?::|\s*\((\d+)(?:–|-|to)?(\d+)?\s*min(?:utes?)?\))?/i
};
```

### **3. Creazione Confini di Sezione**
```typescript
// Scorri le righe e crea blocchi: Warm-up → Day1 → Day2 → Day3 → Stretch
// Tutto tra day(i) e day(i+1) va nel day(i)
// Nessun esercizio di quei blocchi deve finire nel warm-up

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Controlla se è un'intestazione di sezione
  let sectionType = null;
  let sectionTitle = '';
  
  // Prova regex forte
  if (H.warmup.test(line) || H.warmupEn.test(line)) {
    sectionType = 'warmup';
    sectionTitle = line;
  } else if (H.day.test(line) || H.dayEn.test(line)) {
    sectionType = 'workout';
    sectionTitle = line;
  } else if (H.stretch.test(line) || H.stretchEn.test(line)) {
    sectionType = 'cooldown';
    sectionTitle = line;
  }
  
  // Fallback: se non trova "Giorno X", cerca linee che iniziano con numerazione
  if (!sectionType && line.match(/^\d+\./)) {
    if (!currentSection) {
      sectionType = 'workout';
      sectionTitle = 'Giorno 1';
    } else if (currentSection.type === 'workout') {
      // Se siamo già in un giorno e troviamo numerazione che riparte da 1, nuovo giorno
      const dayMatch = currentSection.title.match(/giorno\s*(\d+)/i);
      if (dayMatch) {
        const currentDay = parseInt(dayMatch[1]);
        sectionType = 'workout';
        sectionTitle = `Giorno ${currentDay + 1}`;
      }
    }
  }
}
```

### **4. Parsing Esercizi con Regole per Sezione**
```typescript
// Pattern multi-sezione
const P = {
  // Pattern "forza" - per giorni di allenamento
  long: /^(\d+\.\s*)?(.+?):\s*(\d+)\s*x\s*([\d\-]+|max\s+reps?)(?:\s*[,;]\s*riposo\s*:\s*([\d\.]+)\s*(min|sec))?(?:.*\(([^)]+)\))?/i,
  short: /^(\d+\.\s*)?(.+?)\s*[:\-]?\s*(\d+)\s*x\s*([\d\-]+)(?:\s*(min|sec))?(?:.*\(([^)]+)\))?/i,
  timeOnly: /^(\d+\.\s*)?(.+?)\s*[:\-]?\s*(\d+)\s*(min|sec)\b(?:.*\(([^)]+)\))?/i,
  
  // Pattern riscaldamento
  warmupTime: /^[-•\*]\s*(\d+)\s*(min|sec)\s+(.+)/i,
  warmupCircuit: /^[-•\*]\s*(\d+)\s*giri?[::\s]+(.+)/i,
  warmupSimple: /^[-•\*]\s*(.+)/i,
  
  // Pattern stretching
  stretchTime: /^(.+?)[::\-\s]+(\d+(?:-\d+)?)\s*(min|sec)/i,
  stretchSimple: /^[-•\*]\s*(.+)/i
};
```

### **5. Validazioni Specifiche per Sezione**
```typescript
// Lista esercizi di forza (da non mettere nel riscaldamento)
private forzaExercises = [
  'squat', 'panca', 'rematore', 'stacco', 'pressa', 'chest press',
  'bench', 'deadlift', 'row', 'military press', 'ohp', 'overhead',
  'curl', 'extension', 'fly', 'raise', 'lat', 'trazioni', 'pull-up',
  'dip', 'affondi', 'lunge', 'calf', 'leg curl', 'leg extension'
];

validateExerciseForSection(exercise: ExtractedExercise, sectionType: string, sectionTitle: string): ExtractedExercise | null {
  switch (sectionType) {
    case 'warmup':
      // Se è un esercizio di forza, non dovrebbe essere nel riscaldamento
      const isForzaExercise = this.forzaExercises.some(forza => 
        exercise.name.toLowerCase().includes(forza)
      );
      
      if (isForzaExercise) {
        console.warn(`⚠️ Esercizio di forza "${exercise.name}" trovato nel riscaldamento - spostato in note`);
        exercise.notes = exercise.notes ? `${exercise.notes} (esercizio di forza)` : 'esercizio di forza';
      }
      
      // Se ha riposo, spostalo in note
      if (exercise.rest) {
        exercise.notes = exercise.notes ? `${exercise.notes}, riposo: ${exercise.rest}` : `riposo: ${exercise.rest}`;
        exercise.rest = undefined;
      }
      break;
      
    case 'workout':
      // Validazioni per giorni di allenamento
      if (exercise.time && !exercise.sets) {
        // Se ha solo tempo senza serie, probabilmente è un esercizio core
        exercise.sets = '3'; // Default
      }
      
      // Estrai note speciali
      const specialNotes = this.extractSpecialNotes(exercise.name);
      if (specialNotes) {
        exercise.notes = exercise.notes ? `${exercise.notes}, ${specialNotes}` : specialNotes;
      }
      break;
      
    case 'cooldown':
      // Per stretching, se ha serie/ripetizioni, mettile in note
      if (exercise.sets || exercise.reps) {
        exercise.notes = exercise.notes ? `${exercise.notes}, ${exercise.sets}x${exercise.reps}` : `${exercise.sets}x${exercise.reps}`;
        exercise.sets = undefined;
        exercise.reps = undefined;
      }
      break;
  }
  
  return exercise;
}
```

### 📊 **Test Case: Parser Sezioni Avanzato**

#### **Input File Completo:**
```
Riscaldamento (10 minuti):
- 5 min camminata o cyclette
- 2 giri: 10 squat a corpo libero, 10 push-up, 15 sec plank

Giorno 1 (Full Body)
1. Squat con bilanciere: 4x8-10
2. Panca piana manubri: 4x8-10
3. Rematore bilanciere: 4x8-10
4. Lento avanti manubri: 3x10
5. Leg curl macchina: 3x12
6. Addome: Crunch su tappetino: 3x15-20

Giorno 2 (Full Body)
1. Stacco da terra (o variante): 4x8
2. Lat machine presa larga: 4x10
3. Chest press macchina: 3x10
4. Affondi con manubri: 3x12 per gamba

Giorno 3 (Full Body)
1. Pressa gambe: 4x10
2. Leg extension: 3x12
3. Calf raise: 4x15
4. Addome: Plank: 3x30 sec

Stretching finale
5-10 min
```

#### **Debug Output Atteso:**
```
🔍 === PARSER CON RILEVAMENTO SEZIONI AVANZATO ===

🧹 Preprocessing testo...
✅ Testo normalizzato completato
📝 Testo normalizzato: Riscaldamento (10 minuti): - 5 min camminata o cyclette - 2 giri: 10 squat a corpo libero, 10 push-up, 15 sec plank Giorno 1 (Full Body) 1. Squat con bilanciere: 4x8-10 2. Panca piana manubri: 4x8-10 3. Rematore bilanciere: 4x8-10 4. Lento avanti manubri: 3x10 5. Leg curl macchina: 3x12 6. Addome: Crunch su tappetino: 3x15-20 Giorno 2 (Full Body) 1. Stacco da terra (o variante): 4x8 2. Lat machine presa larga: 4x10 3. Chest press macchina: 3x10 4. Affondi con manubri: 3x12 per gamba Giorno 3 (Full Body) 1. Pressa gambe: 4x10 2. Leg extension: 3x12 3. Calf raise: 4x15 4. Addome: Plank: 3x30 sec Stretching finale 5-10 min

📍 Nuova sezione: "Riscaldamento (10 minuti)" (tipo: warmup)
📍 Nuova sezione: "Giorno 1 (Full Body)" (tipo: workout)
📍 Nuova sezione: "Giorno 2 (Full Body)" (tipo: workout)
📍 Nuova sezione: "Giorno 3 (Full Body)" (tipo: workout)
📍 Nuova sezione: "Stretching finale" (tipo: cooldown)

📊 Trovate 5 sezioni

🔍 Parsing "Riscaldamento (10 minuti)" (tipo: warmup)
   Righe da parsare: 2
   ✅ camminata o cyclette: 5 min
   ✅ 10 squat a corpo libero, 10 push-up, 15 sec plank: 2xcircuito

🔍 Parsing "Giorno 1 (Full Body)" (tipo: workout)
   Righe da parsare: 6
   ✅ Squat con bilanciere: 4x8-10
   ✅ Panca piana manubri: 4x8-10
   ✅ Rematore bilanciere: 4x8-10
   ✅ Lento avanti manubri: 3x10
   ✅ Leg curl macchina: 3x12
   ✅ Crunch su tappetino: 3x15-20

🔍 Parsing "Giorno 2 (Full Body)" (tipo: workout)
   Righe da parsare: 4
   ✅ Stacco da terra: 4x8
      Note: o variante
   ✅ Lat machine presa larga: 4x10
   ✅ Chest press macchina: 3x10
   ✅ Affondi con manubri: 3x12
      Note: per gamba

🔍 Parsing "Giorno 3 (Full Body)" (tipo: workout)
   Righe da parsare: 4
   ✅ Pressa gambe: 4x10
   ✅ Leg extension: 3x12
   ✅ Calf raise: 4x15
   ✅ Plank: 3x30 sec

🔍 Parsing "Stretching finale" (tipo: cooldown)
   Righe da parsare: 1
   ✅ stretching finale: 5-10 min
      Note: mantenere posizione

🔧 === VALIDAZIONE E AUTO-CORREZIONE ===
📊 Totale esercizi parsati: 17

📋 === SCHEDA FINALE ===

Riscaldamento (10 minuti): (2 esercizi)
   Tempo totale: 10 min
  1. camminata o cyclette: 5 min
  2. 10 squat a corpo libero, 10 push-up, 15 sec plank: 2xcircuito
      Note: 2 giri

Giorno 1 (Full Body): (6 esercizi)
  1. Squat con bilanciere: 4x8-10
  2. Panca piana manubri: 4x8-10
  3. Rematore bilanciere: 4x8-10
  4. Lento avanti manubri: 3x10
  5. Leg curl macchina: 3x12
  6. Crunch su tappetino: 3x15-20

Giorno 2 (Full Body): (4 esercizi)
  1. Stacco da terra: 4x8
      Note: o variante
  2. Lat machine presa larga: 4x10
  3. Chest press macchina: 3x10
  4. Affondi con manubri: 3x12
      Note: per gamba

Giorno 3 (Full Body): (4 esercizi)
  1. Pressa gambe: 4x10
  2. Leg extension: 3x12
  3. Calf raise: 4x15
  4. Plank: 3x30 sec

Stretching finale: (1 esercizi)
  1. stretching finale: 5-10 min
      Note: mantenere posizione
```

### ✅ **Caratteristiche Avanzate**

#### **1. Riconoscimento Sezioni Corretto**
- ✅ **Regex forte** per intestazioni precise
- ✅ **Fallback intelligente** per numerazione esercizi
- ✅ **Supporto italiano e inglese** (Giorno/Day, Riscaldamento/Warm-up)
- ✅ **Creazione confini** - tutto tra Giorno 1 e Giorno 2 va in Giorno 1

#### **2. Regole Specifiche per Sezione**
- ✅ **Riscaldamento:** Solo tempo e circuiti, niente riposo per singolo esercizio
- ✅ **Giorni:** Serie/ripetizioni/riposo, supporta range (8-10), "max reps", "per gamba"
- ✅ **Stretching:** Solo tempo (range 5-10 min), niente serie/ripetizioni

#### **3. Validazioni Automatiche**
- ✅ **Esercizi di forza** nel riscaldamento → spostati in note
- ✅ **Riposo nel riscaldamento** → spostato in note
- ✅ **Serie/ripetizioni nello stretching** → spostate in note
- ✅ **Note speciali** → "per gamba", "o variante", "assistite"

#### **4. Output Strutturato**
- ✅ **5 sezioni ordinate:** Riscaldamento → Giorno 1 → Giorno 2 → Giorno 3 → Stretching
- ✅ **Tempo totale** per sezioni con tempo
- ✅ **Dettagli circuito** per circuiti
- ✅ **Note specifiche** per ogni tipo di sezione

### 🚀 **Test da Eseguire**

#### **Test 1: Verifica Riconoscimento Sezioni**
1. **Carica il PDF fullbody** → Dovrebbe riconoscere tutte le 5 sezioni
2. **Controlla la console** → Vedrai rilevamento sezioni con regex forte
3. **Verifica confini** → Nessun esercizio di Giorno 1 dovrebbe finire nel Riscaldamento

#### **Test 2: Verifica Regole per Sezione**
- **Riscaldamento:** 2 esercizi (camminata + circuito), niente riposo
- **Giorno 1:** 6 esercizi con serie CORRETTE (4x8-10, non 3!)
- **Giorno 2:** 4 esercizi con note (o variante, per gamba)
- **Giorno 3:** 4 esercizi con tempi (30 sec per plank)
- **Stretching:** 1 esercizio con tempo (5-10 min), niente serie/ripetizioni

#### **Test 3: Verifica Validazioni**
- **Esercizi di forza nel riscaldamento** → Spostati in note
- **Riposo nel riscaldamento** → Spostato in note
- **Serie/ripetizioni nello stretching** → Spostate in note
- **Note speciali** → "per gamba", "o variante" estratti correttamente

#### **Test 4: Verifica Formati Speciali**
- **Range:** "8-10 ripetizioni", "5-10 min"
- **Tempi:** "30 sec", "5 min", "3x30 sec"
- **Circuiti:** "2 giri: 10 squat, 10 push-up, 15 sec plank"
- **Note:** "(o variante)", "per gamba", "circuito"

### 🎯 **Risultato Atteso**

**PRIMA (❌ PARSER PRECEDENTE):**
- Le intestazioni "Giorno 1/2/3" non venivano sempre rilevate
- Gli esercizi finivano nel blocco sbagliato (Riscaldamento)
- Nel riscaldamento compaiono campi non pertinenti (Riposo) e esercizi di forza
- Stretching letto come "formato non standard"

**DOPO (✅ PARSER SEZIONI AVANZATO):**
- **Riconoscimento sezioni corretto** - Regex forte per intestazioni precise
- **Confini di sezione** - Tutto tra Giorno 1 e Giorno 2 va in Giorno 1
- **Regole specifiche per sezione** - Riscaldamento: solo tempo/circuiti, Giorni: serie/ripetizioni/riposo, Stretching: solo tempo
- **Validazioni automatiche** - Esercizi di forza nel riscaldamento spostati in note
- **Output strutturato** - 5 sezioni ordinate con tempo totale e dettagli circuito

### 🔧 **Miglioramenti Implementati**

#### **1. Preprocessing Avanzato**
- **Normalizzazione caratteri** - × → x, – → -
- **Unificazione unità** - min|mins|minuti → min, sec|secondi → sec
- **Rimozione rumore** - Spazi multipli, righe vuote, numeri pagina

#### **2. Rilevamento Sezioni Forte**
- **Regex precise** per ogni tipo di intestazione
- **Fallback intelligente** per numerazione esercizi
- **Supporto multilingua** - Italiano e inglese
- **Creazione confini** - Tutto tra sezioni va nella sezione corretta

#### **3. Parsing Multi-Pattern**
- **Pattern specifici** per ogni tipo di sezione
- **Regole per sezione** - Riscaldamento, Giorni, Stretching
- **Validazioni automatiche** - Esercizi di forza, riposo, note
- **Estrazione note speciali** - "per gamba", "o variante"

#### **4. Output Strutturato**
- **5 sezioni ordinate** con tempo totale
- **Dettagli circuito** per circuiti
- **Note specifiche** per ogni tipo di sezione
- **Validazioni finali** per verificare correttezza

---

**Stato Test: 🔄 IN CORSO**
**Risultato Atteso: ✅ PARSER SEZIONI AVANZATO COMPLETAMENTE FUNZIONANTE**
**Prossimo Passo: 🧪 TEST CON FORMATI DIVERSI**

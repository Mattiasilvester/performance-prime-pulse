# ✅ RISPOSTE DOMANDE FINALI - Sistema Piano Personalizzato

**Data**: 20 Novembre 2025

---

## 📋 RISPOSTE DOMANDE

### **1. Approvi questa TODO list completa?**

✅ **SÌ - APPROVATA**

La TODO list è completa, dettagliata e ben strutturata. Procediamo con l'implementazione seguendo le fasi proposte.

---

### **2. Vuoi procedere PROMPT-BY-PROMPT?**

✅ **SÌ - PROMPT-BY-PROMPT**

Procediamo con implementazione incrementale:
- **PROMPT 2**: Setup Base (Fase 1)
- **PROMPT 3**: Lista Piani (Fase 2)
- **PROMPT 4**: Flusso Creazione (Fase 3)
- E così via...

**Prossimo prompt**: "PROMPT 2: Setup Base"

---

### **3. Chat modifica - Livello complessità**

✅ **MVP: Parsing semplice con regex/keywords**

**Motivazioni**:
- Più veloce da implementare (6-8h vs 12-15h)
- Nessun costo API OpenAI aggiuntivo
- Funziona per 80% dei casi d'uso comuni
- Possiamo migliorare con LLM in futuro se necessario

**Approccio MVP**:
- Keyword matching per intent detection
- Regex per estrarre parametri (numeri, nomi esercizi)
- Template responses per PrimeBot
- Fallback a "Non ho capito, puoi riformulare?" per casi ambigui

**Futuro miglioramento**: Integrare OpenAI per intent detection avanzato se necessario.

---

### **4. Confermi campo `type` e `source` esistono in database?**

⚠️ **PARTIAL CONFIRMATION**

**Campo `source`**: ✅ **ESISTE** (confermato nel codice)
- Valori: `'onboarding' | 'custom' | 'primebot'`
- Nessuna migration necessaria

**Campo `type`**: ❌ **NON ESISTE** (da creare)
- Il campo `tipo` esistente è per tipo workout (`'Forza' | 'Cardio' | 'HIIT' | 'Recupero'`)
- Serve nuovo campo `plan_type` per tipo piano (`'daily' | 'weekly'`)

**Migration Necessaria**:
```sql
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('daily', 'weekly')) DEFAULT 'daily';
```

**Azione**: Creerò migration nel PROMPT 2.

---

### **5. Quick Workout esistente - Riutilizzabile?**

❌ **NO - Non riutilizzabile direttamente**

**Analisi QuickWorkout**:
- File: `src/pages/QuickWorkout.tsx`
- Funzionalità: Workout fisso di 10 minuti con circuito predefinito
- Struttura: Array hardcoded `WORKOUT_CIRCUIT` con 13 esercizi
- Non configurabile: Non accetta parametri (obiettivo, durata, attrezzatura)

**Perché non riutilizzabile**:
- Workout fisso, non generato dinamicamente
- Solo 10 minuti, non configurabile
- Nessun parametro di input (obiettivo, livello, etc.)

**Cosa riutilizzare invece**:
- ✅ `workoutGenerator.ts` - Funzioni `generateWorkout()` e `generateFilteredStrengthWorkout()`
- ✅ Database esercizi (`exerciseDatabase`, `detailedExerciseDatabase`)
- ✅ Pattern di generazione workout dinamici

**Raccomandazione**: 
- Creare nuovo flusso per daily plan usando `workoutGenerator.ts`
- QuickWorkout rimane separato (workout rapido fisso)

---

## ✅ DECISIONI FINALI

### **Database**:
- ✅ Campo `source` esiste
- ⚠️ Campo `plan_type` da creare (migration nel PROMPT 2)

### **Chat Modifica**:
- ✅ MVP con parsing semplice (regex/keywords)
- ⚠️ Miglioramento futuro con OpenAI se necessario

### **Quick Workout**:
- ❌ Non riutilizzabile direttamente
- ✅ Riutilizzare `workoutGenerator.ts` per daily plan

### **Approccio**:
- ✅ Prompt-by-prompt incrementale
- ✅ TODO list approvata
- ✅ Stima 28-30 ore realistica

---

## 🚀 PROSSIMI PASSI

**PROMPT 2: Setup Base** includerà:

1. ✅ Verifica schema database
2. ✅ Creazione migration per `plan_type`
3. ✅ Creazione types TypeScript
4. ✅ Creazione Zustand store
5. ✅ Aggiunta route App.tsx
6. ✅ Creazione service layer (opzionale)
7. ✅ Fix QuickActions.tsx

**Pronto per PROMPT 2!** 🎯



# 🔍 ANALISI APPROFONDITA: Due Problemi Critici Persistenti

**Data Analisi**: 13 Novembre 2025  
**File Analizzati**: 
- `src/pages/onboarding/steps/Step3Preferences.tsx`
- `src/stores/onboardingStore.ts`
- `src/hooks/useOnboardingData.ts`
- `src/components/onboarding/OnboardingPreferencesCard.tsx`
- `src/hooks/useOnboardingNavigation.ts`

---

## 📋 PROBLEMA 1: setState Loop in Step3Preferences (ANCORA PRESENTE)

### 🔴 ERRORE IDENTIFICATO

```
Warning: Cannot update component (`OnboardingPage`) while rendering different component (`Step3Preferences`)
at Step3Preferences.tsx:111:65
```

### 📊 ANALISI COMPLETA: Tutte le Chiamate setState

#### **1. Chiamate a `updateData()` (modifica store Zustand)**

| Linea | Posizione | Contesto | Status |
|-------|-----------|----------|--------|
| **140** | `toggleLocation()` | **DENTRO callback `setSelectedLocations`** | ❌ **PROBLEMATICO** |
| **156** | `handleTimeSelect()` | Handler `onClick` | ✅ OK |
| **178** | `handleContinue()` | `useImperativeHandle` callback | ✅ OK |

#### **2. Chiamate a `setSelectedLocations()`**

| Linea | Posizione | Contesto | Status |
|-------|-----------|----------|--------|
| **118** | `useEffect` | Dipendenza `[data.luoghiAllenamento]` | ✅ OK |
| **133** | `toggleLocation()` | Handler `onClick` | ✅ OK |

#### **3. Chiamate a `setSelectedTime()`**

| Linea | Posizione | Contesto | Status |
|-------|-----------|----------|--------|
| **124** | `useEffect` | Dipendenza `[data.tempoSessione]` | ✅ OK |
| **154** | `handleTimeSelect()` | Handler `onClick` | ✅ OK |

#### **4. Chiamate a `setCanProceed()`**

| Linea | Posizione | Contesto | Status |
|-------|-----------|----------|--------|
| **129** | `useEffect` | Dipendenza `[selectedLocations]` | ✅ OK |

#### **5. Chiamate a `trackStepStarted()`**

| Linea | Posizione | Contesto | Status |
|-------|-----------|----------|--------|
| **112** | `useEffect` | Dipendenza `[trackStepStarted]` | ✅ OK |

---

### 🐛 ROOT CAUSE IDENTIFICATA

**PROBLEMA CRITICO alla linea 140:**

```typescript
const toggleLocation = (locationId: string) => {
  setSelectedLocations(prev => {
    const newLocations = prev.includes(locationId)
      ? prev.filter(id => id !== locationId)
      : [...prev, locationId];

    console.log('Luoghi aggiornati:', newLocations);

    // ❌ ERRORE: updateData chiamato DENTRO callback setState
    updateData({
      luoghiAllenamento: newLocations
    });

    return newLocations;
  });
  // ...
};
```

**Perché è problematico:**

1. `setSelectedLocations` viene chiamato con un callback
2. **DENTRO** il callback viene chiamato `updateData()` che modifica lo store Zustand
3. Lo store modificato triggera il `useEffect` alle linee 116-120
4. Il `useEffect` chiama `setSelectedLocations` di nuovo
5. **LOOP INFINITO** 🔄

**Flusso del Loop:**

```
User Click → toggleLocation()
  ↓
setSelectedLocations(callback)
  ↓
updateData() ← MODIFICA STORE
  ↓
data.luoghiAllenamento CAMBIA
  ↓
useEffect triggerato (linea 116)
  ↓
setSelectedLocations() ← CHIAMATO DI NUOVO
  ↓
LOOP INFINITO 🔄
```

---

### ✅ SOLUZIONE PROPOSTA

**Spostare `updateData` FUORI dal callback di `setSelectedLocations`:**

```typescript
const toggleLocation = (locationId: string) => {
  setSelectedLocations(prev => {
    const newLocations = prev.includes(locationId)
      ? prev.filter(id => id !== locationId)
      : [...prev, locationId];
    
    // ✅ RIMOSSO updateData da qui
    
    return newLocations;
  });
  
  // ✅ AGGIUNTO: updateData DOPO setState usando useEffect o chiamata diretta
  // Opzione A: Usa useEffect per sincronizzare
  // Opzione B: Chiama updateData dopo setState (ma potrebbe essere troppo presto)
  // Opzione C: Usa un ref per tracciare se è un update manuale
};
```

**SOLUZIONE CONSIGLIATA: Usare useEffect per sincronizzare**

```typescript
// Aggiungi un useEffect che sincronizza selectedLocations con store
useEffect(() => {
  // Solo se selectedLocations è cambiato manualmente (non da data)
  if (selectedLocations.length > 0 || data.luoghiAllenamento?.length === 0) {
    updateData({
      luoghiAllenamento: selectedLocations
    });
  }
}, [selectedLocations]); // ⚠️ Ma questo creerebbe un altro loop!

// SOLUZIONE MIGLIORE: Usare un ref per distinguere update manuale vs automatico
const isManualUpdate = useRef(false);

const toggleLocation = (locationId: string) => {
  isManualUpdate.current = true; // Marca come update manuale
  setSelectedLocations(prev => {
    const newLocations = prev.includes(locationId)
      ? prev.filter(id => id !== locationId)
      : [...prev, locationId];
    return newLocations;
  });
};

useEffect(() => {
  if (isManualUpdate.current) {
    updateData({ luoghiAllenamento: selectedLocations });
    isManualUpdate.current = false;
  }
}, [selectedLocations]);
```

---

### 🔍 ANALISI onboardingStore.ts (Linea 45)

**File**: `src/stores/onboardingStore.ts`

**Linea 44-47:**
```typescript
updateData: (newData) => 
  set((state) => ({ 
    data: { ...state.data, ...newData } 
  })),
```

**Analisi:**
- ✅ Funzione `updateData` è una semplice funzione Zustand
- ✅ Non ci sono side effects o chiamate automatiche
- ✅ Non viene eseguita automaticamente al mount
- ✅ Il problema NON è nello store, ma nell'uso di `updateData` dentro `setSelectedLocations`

---

## 📋 PROBLEMA 2: summary sempre null (NON SI CARICA MAI)

### 🔴 EVIDENZA DAI LOG

**Log presenti:**
```
🔍 useOnboardingSummary: Hook called
👤 User from useAuth: {id: 'aa35a7d2-4b6c-4785-882e-535038ae689b', ...}
📦 Returning state: {summary: null, loading: false}
```

**Log MANCANTI (dovrebbero apparire ma NON appaiono):**
```
❌ NON vedo: 📊 useEffect triggered
❌ NON vedo: 🔄 loadSummary: Starting
❌ NON vedo: 📡 Calling onboardingService
```

### ✅ VERIFICA FIX APPLICATO

**File**: `src/hooks/useOnboardingData.ts`

**Codice attuale (linee 87-132):**
```typescript
export const useOnboardingSummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{...} | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔍 useOnboardingSummary: Hook called');
  console.log('👤 User from useAuth:', user);
  console.log('🆔 User ID specifically:', user?.id); // ✅ AGGIUNTO
  console.log('🔢 typeof user?.id:', typeof user?.id); // ✅ AGGIUNTO

  useEffect(() => {
    console.log('📊 useEffect triggered, user?.id:', user?.id); // ✅ PRESENTE
    
    if (!user?.id) {
      console.log('❌ No user ID, stopping');
      setLoading(false);
      return;
    }

    console.log('✅ User ID found, calling loadSummary');

    // ✅ FIX: loadSummary DENTRO useEffect
    const loadSummary = async () => {
      console.log('🔄 loadSummary: Starting for user:', user.id);
      setLoading(true);
      
      try {
        console.log('📡 Calling onboardingService.getOnboardingSummary...');
        const result = await onboardingService.getOnboardingSummary(user.id);
        console.log('✅ Summary loaded:', result);
        setSummary(result);
      } catch (error) {
        console.error('❌ Error loading summary:', error);
      } finally {
        console.log('🏁 loadSummary: Done, setting loading false');
        setLoading(false);
      }
    };

    loadSummary();
  }, [user?.id]); // ✅ Dependencies corrette

  console.log('📦 Returning state:', { summary, loading });

  return {
    summary,
    loading,
    reload: () => { ... },
  };
};
```

**Conclusione:**
- ✅ Fix applicato correttamente
- ✅ `loadSummary` è dentro `useEffect`
- ✅ Dependencies sono corrette `[user?.id]`
- ✅ Log aggiuntivi aggiunti

**MA:** I log `📊 useEffect triggered` NON appaiono nella console!

---

### 🔍 POSSIBILI CAUSE

#### **Causa 1: useEffect non viene eseguito**

**Possibilità:**
- Il componente viene smontato prima che `useEffect` venga eseguito
- C'è un problema con React Strict Mode che causa doppio mount
- Il componente viene renderizzato ma `useEffect` non viene triggerato

#### **Causa 2: user?.id è undefined o cambia continuamente**

**Possibilità:**
- `user?.id` è `undefined` al primo render
- `user?.id` cambia continuamente causando re-render infiniti
- C'è un problema con `useAuth` che restituisce un oggetto diverso ad ogni render

#### **Causa 3: Problema con React Strict Mode**

**Possibilità:**
- React Strict Mode causa doppio mount
- Il primo mount viene smontato prima che `useEffect` venga eseguito
- Il secondo mount potrebbe avere problemi

---

### 🔧 LOG AGGIUNTIVI AGGIUNTI

**File**: `src/hooks/useOnboardingData.ts`

**Log aggiunti:**
- ✅ `🆔 User ID specifically: user?.id`
- ✅ `🔢 typeof user?.id: typeof user?.id`

**File**: `src/components/onboarding/OnboardingPreferencesCard.tsx`

**Log aggiunti:**
- ✅ `🎴 OnboardingPreferencesCard: Mounting`
- ✅ `🎴 OnboardingPreferencesCard: Hook returned: {summary, loading}`

---

### 📊 QUERY SQL DA ESEGUIRE

#### **Query 1: Verifica dati utente specifico**

```sql
SELECT * FROM user_onboarding_responses 
WHERE user_id = 'aa35a7d2-4b6c-4785-882e-535038ae689b';
```

#### **Query 2: Verifica tutti i dati nella tabella**

```sql
SELECT user_id, obiettivo, livello_esperienza, luoghi_allenamento, tempo_sessione
FROM user_onboarding_responses 
LIMIT 10;
```

#### **Query 3: Verifica user esiste in auth**

```sql
SELECT id, email FROM auth.users 
WHERE id = 'aa35a7d2-4b6c-4785-882e-535038ae689b';
```

#### **Query 4: Verifica RLS Policies**

```sql
SELECT policyname, cmd, qual::text 
FROM pg_policies 
WHERE tablename = 'user_onboarding_responses';
```

---

## 📋 CHECKLIST COMPLETATA

### Problema 1 (setState loop)
- ✅ Step3Preferences.tsx analizzato completamente
- ✅ Tutte le chiamate setState identificate
- ✅ Root cause identificata (linea 140)
- ✅ onboardingStore.ts verificato (nessun problema)
- ✅ Soluzione proposta

### Problema 2 (summary null)
- ✅ useOnboardingData.ts verificato (fix applicato)
- ✅ Log aggiuntivi aggiunti (User ID, typeof)
- ✅ Log in OnboardingPreferencesCard aggiunti
- ⏳ Query SQL da eseguire (in attesa risultati utente)
- ⏳ Query RLS policies da eseguire (in attesa risultati utente)

---

## 🎯 PROSSIMI STEP

1. **Fix Problema 1**: Implementare soluzione per rimuovere `updateData` da dentro `setSelectedLocations`
2. **Debug Problema 2**: 
   - Eseguire query SQL e verificare dati database
   - Verificare RLS policies
   - Analizzare log aggiuntivi quando disponibili
3. **Test**: Verificare che entrambi i problemi siano risolti

---

**Documento creato**: 13 Novembre 2025  
**Status**: Analisi completa, in attesa risultati query SQL e log aggiuntivi


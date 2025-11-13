# 🔍 DEBUG: Card Preferenze Non Si Carica

**Data:** 12 Novembre 2025  
**Problema:** La card OnboardingPreferencesCard non mostra le preferenze in CompletionScreen

---

## ✅ LOG DI DEBUG AGGIUNTI

Ho aggiunto log di debug dettagliati in:

1. ✅ `src/hooks/useOnboardingData.ts` - Hook `useOnboardingSummary`
2. ✅ `src/services/onboardingService.ts` - Funzioni `loadOnboardingData` e `getOnboardingSummary`
3. ✅ `src/components/onboarding/OnboardingPreferencesCard.tsx` - Component rendering

---

## 📋 STEP DI DEBUG

### **STEP 1: Verifica Console Browser**

1. Apri l'app in browser (`npm run dev`)
2. Vai su `/onboarding` e completa fino a CompletionScreen
3. Apri DevTools (F12) → Console tab
4. Cerca questi log:

```
🎴 OnboardingPreferencesCard: Component rendered
✅ useOnboardingSummary: User ID found: [user-id]
🔄 Loading summary for user: [user-id]
🔍 getOnboardingSummary: Loading data for user: [user-id]
🔍 loadOnboardingData: Querying for user: [user-id]
```

**Copia TUTTI i log dalla console e mandameli.**

---

### **STEP 2: Verifica Errori Console**

Cerca errori tipo:
- `❌ Error loading onboarding data:` → Errore Supabase
- `❌ useOnboardingSummary: No user ID` → Utente non autenticato
- `⚠️ getOnboardingSummary: No data found for user` → Dati non presenti nel database
- Errori di tipo: `Cannot read property 'luoghi' of null`

**Copia TUTTI gli errori e mandameli.**

---

### **STEP 3: Verifica Dati Database**

Vai su Supabase Dashboard → SQL Editor ed esegui:

```sql
-- Verifica se la tabella esiste
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_onboarding_responses'
);

-- Verifica se il TUO utente ha dati
SELECT * FROM user_onboarding_responses 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'LA_TUA_EMAIL_QUI');

-- Sostituisci LA_TUA_EMAIL_QUI con la tua email di login
```

**Copia il risultato e mandamelo.**

---

### **STEP 4: Verifica RLS Policies**

Nel SQL Editor:

```sql
-- Verifica policies attive
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_onboarding_responses';
```

**Dovrebbero esserci 4 policies:**
- `Users can view their own onboarding responses` (SELECT)
- `Users can update their own onboarding responses` (UPDATE)
- `Users can insert their own onboarding responses` (INSERT)
- `Users can delete their own onboarding responses` (DELETE)

**Copia il risultato e mandamelo.**

---

### **STEP 5: Verifica Dati Tabelle Esistenti**

Se la tabella `user_onboarding_responses` è vuota, verifica se ci sono dati nelle tabelle originali:

```sql
-- Verifica dati nelle tabelle originali
SELECT 
  ob.user_id,
  ob.obiettivo,
  es.livello_esperienza,
  es.giorni_settimana,
  pr.luoghi_allenamento,
  pr.tempo_sessione
FROM onboarding_obiettivo_principale ob
LEFT JOIN onboarding_esperienza es ON ob.user_id = es.user_id
LEFT JOIN onboarding_preferenze pr ON ob.user_id = pr.user_id
WHERE ob.user_id = (SELECT id FROM auth.users WHERE email = 'LA_TUA_EMAIL_QUI');
```

**Copia il risultato e mandamelo.**

---

### **STEP 6: Test Diretto Service (Opzionale)**

Nella console browser (DevTools → Console), dopo aver fatto login:

```javascript
// Test 1: Verifica user ID
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);

// Test 2: Importa service (se possibile)
// Nota: Questo potrebbe non funzionare direttamente nella console
// Meglio usare i log già aggiunti nel codice
```

---

## 🔍 POSSIBILI CAUSE

### **1. Tabella Non Esiste**
**Sintomo:** Errore `relation "user_onboarding_responses" does not exist`  
**Soluzione:** Applicare migration SQL manualmente nel dashboard Supabase

### **2. Dati Non Migrati**
**Sintomo:** Tabella esiste ma è vuota  
**Soluzione:** Eseguire manualmente `SELECT migrate_existing_onboarding_data();`

### **3. RLS Policies Mancanti**
**Sintomo:** Errore `permission denied`  
**Soluzione:** Verificare che le 4 policies siano create

### **4. Utente Non Autenticato**
**Sintomo:** Log `❌ useOnboardingSummary: No user ID`  
**Soluzione:** Verificare che l'utente sia loggato in CompletionScreen

### **5. Dati Non Presenti**
**Sintomo:** Log `⚠️ getOnboardingSummary: No data found for user`  
**Soluzione:** L'utente non ha completato l'onboarding o i dati non sono stati salvati

---

## 📊 RISULTATI ATTESI

Dopo aver eseguito tutti gli step, dovresti avere:

1. ✅ Log console completi del flusso di caricamento
2. ✅ Eventuali errori identificati
3. ✅ Stato database verificato
4. ✅ RLS policies verificate
5. ✅ Dati tabelle originali verificati

**Copia TUTTI i risultati e mandameli per risolvere il problema.**

---

## 🛠️ FIX RAPIDO (Se Tabella Non Esiste)

Se la tabella non esiste ancora, applica la migration manualmente:

1. Vai su Supabase Dashboard → SQL Editor
2. Copia tutto il contenuto di `supabase/migrations/20251113000000_create_user_onboarding_responses.sql`
3. Incolla e clicca RUN
4. Verifica con: `SELECT COUNT(*) FROM user_onboarding_responses;`

---

**File con log di debug:**  
- `src/hooks/useOnboardingData.ts`  
- `src/services/onboardingService.ts`  
- `src/components/onboarding/OnboardingPreferencesCard.tsx`

**Status:** ✅ Log di debug aggiunti, pronto per test


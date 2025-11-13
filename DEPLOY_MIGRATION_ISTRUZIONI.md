# 🚀 ISTRUZIONI DEPLOY MIGRATION

**Migration:** `20251113000000_create_user_onboarding_responses.sql`  
**Data:** 12 Novembre 2025

---

## ⚠️ PROBLEMA IDENTIFICATO

Il comando `supabase db push` fallisce perché alcune migration esistenti hanno formato non standard.  
**Soluzione:** Applicare la migration manualmente tramite SQL Editor di Supabase.

---

## 📋 METODO 1: SQL Editor Supabase (CONSIGLIATO)

### Step 1: Accedi al Dashboard Supabase
1. Vai su https://supabase.com/dashboard
2. Seleziona il progetto: `kfxoyucatvvcgmqalxsg`
3. Vai su **SQL Editor** nel menu laterale

### Step 2: Copia e Incolla la Migration
1. Apri il file: `supabase/migrations/20251113000000_create_user_onboarding_responses.sql`
2. Copia **TUTTO** il contenuto
3. Incolla nel SQL Editor di Supabase
4. Clicca **RUN** o premi `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### Step 3: Verifica Successo
Dovresti vedere:
- ✅ Messaggio "Success. No rows returned"
- ✅ Tabella `user_onboarding_responses` creata
- ✅ Dati esistenti migrati automaticamente

---

## 📋 METODO 2: Supabase CLI (ALTERNATIVO)

Se vuoi provare a sistemare le migration esistenti:

```bash
# 1. Ripara migration history (se necessario)
supabase migration repair --status reverted <migration_ids>

# 2. Prova push di nuovo
supabase db push
```

**Nota:** Questo metodo richiede di sistemare tutte le migration con formato non standard.

---

## ✅ VERIFICA POST-DEPLOY

Dopo aver applicato la migration, verifica:

```sql
-- 1. Verifica tabella creata
SELECT * FROM user_onboarding_responses LIMIT 5;

-- 2. Verifica migrazione dati
SELECT COUNT(*) FROM user_onboarding_responses;

-- 3. Verifica indici
SELECT indexname FROM pg_indexes 
WHERE tablename = 'user_onboarding_responses';

-- 4. Verifica RLS policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'user_onboarding_responses';
```

---

## 🎯 RISULTATO ATTESO

Dopo il deploy dovresti avere:
- ✅ Tabella `user_onboarding_responses` creata
- ✅ Tutti i dati esistenti migrati
- ✅ Indici creati
- ✅ RLS policies attive
- ✅ Trigger per `last_modified_at` funzionante

---

**File Migration:** `supabase/migrations/20251113000000_create_user_onboarding_responses.sql`  
**Status:** ✅ PRONTA PER DEPLOY


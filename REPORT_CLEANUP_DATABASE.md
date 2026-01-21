# 🧹 REPORT CLEANUP DATABASE - 23 Gennaio 2025

**Scopo:** Analisi completa dello schema database per identificare tabelle/colonne da aggiornare, rimuovere o documentare.

---

## ✅ TABELLE DA AGGIORNARE NELLA DOCUMENTAZIONE

### 1. `professional_blocked_periods` ⚠️ **MANCANTE**
**Stato:** Tabella creata ma NON documentata in `DATABASE_SCHEMA.md`

**Dettagli:**
- Creata: `20250121_professional_blocked_periods.sql`
- Scopo: Gestione giorni/settimane bloccati dai professionisti
- Colonne: `id`, `professional_id`, `start_date`, `end_date`, `block_type`, `reason`, `created_at`, `updated_at`
- Indici: 3 indici per performance
- RLS: Abilitata con 5 policies

**Azione:** ✅ **AGGIUNGERE** sezione in `DATABASE_SCHEMA.md` nella sezione "Tabelle Professional System"

---

### 2. `professional_services` ⚠️ **DA VERIFICARE**
**Stato:** Tabella creata (`20250121_fase2_professional_services.sql`) ma da verificare se documentata

**Azione:** ✅ **VERIFICARE** se presente in `DATABASE_SCHEMA.md`, altrimenti aggiungere

---

### 3. `subscription_invoices` ⚠️ **DA VERIFICARE**
**Stato:** Tabella creata (`20250122000002_subscription_payments.sql`) ma da verificare se documentata

**Azione:** ✅ **VERIFICARE** se presente in `DATABASE_SCHEMA.md`, altrimenti aggiungere

---

## 🗑️ TABELLE/COLONNE OBSOLETE (DA VERIFICARE SE GIÀ RIMOSSE)

### 1. Tabella `users` (LEGACY)
**Stato:** Migrazione cleanup esiste (`20250121_cleanup_fase1.sql`) ma **NON VERIFICATA se eseguita**

**Azione:** 
- ⚠️ **VERIFICARE** se la tabella esiste ancora nel database
- Se esiste: ✅ **ESEGUIRE** migrazione `20250121_cleanup_fase1.sql`
- Se non esiste: ✅ **AGGIORNARE** `DATABASE_SCHEMA.md` rimuovendo la sezione `users`

---

### 2. Campi deprecati in `professionals`
**Stato:** Migrazione cleanup esiste ma **NON VERIFICATA se eseguita**

**Campi da rimuovere:**
- `password_hash` (deprecato, usa Supabase Auth)
- `password_salt` (deprecato, usa Supabase Auth)
- `reset_token` (deprecato)
- `reset_requested_at` (deprecato)

**Azione:**
- ⚠️ **VERIFICARE** se questi campi esistono ancora
- Se esistono: ✅ **ESEGUIRE** migrazione `20250121_cleanup_fase1.sql`
- Se non esistono: ✅ **AGGIORNARE** `DATABASE_SCHEMA.md` rimuovendo questi campi

---

## 📋 TABELLE DA VERIFICARE NEL DATABASE

### Tabelle che DOVREBBERO esistere:
1. ✅ `professional_blocked_periods` - **CREATA** (23 Gen 2025)
2. ✅ `professional_services` - **CREATA** (21 Gen 2025)
3. ✅ `subscription_invoices` - **CREATA** (22 Gen 2025)
4. ✅ `professional_settings` - **ESISTE** (documentata)
5. ✅ `bookings` - **ESISTE** (documentata)

### Tabelle che NON DOVREBBERO esistere:
1. ❌ `users` - **LEGACY** (dovrebbe essere rimossa)

---

## 🎯 PIANO DI AZIONE RACCOMANDATO

### **FASE 1: VERIFICA STATO ATTUALE** 🔍

**Query SQL da eseguire in Supabase:**

```sql
-- 1. Verifica se tabella users esiste ancora
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS users_table_exists;

-- 2. Verifica campi deprecati in professionals
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at');

-- 3. Verifica se professional_blocked_periods esiste
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_blocked_periods'
) AS blocked_periods_exists;

-- 4. Verifica se professional_services esiste
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_services'
) AS services_exists;

-- 5. Verifica se subscription_invoices esiste
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_invoices'
) AS invoices_exists;
```

---

### **FASE 2: ESECUZIONE CLEANUP (se necessario)** 🧹

**Se la tabella `users` esiste ancora:**
```sql
-- Esegui migrazione cleanup
-- File: supabase/migrations/20250121_cleanup_fase1.sql
```

**Se i campi deprecati in `professionals` esistono ancora:**
```sql
-- Esegui migrazione cleanup (stesso file)
-- File: supabase/migrations/20250121_cleanup_fase1.sql
```

---

### **FASE 3: AGGIORNAMENTO DOCUMENTAZIONE** 📝

**File da aggiornare:** `DATABASE_SCHEMA.md`

**Azioni:**
1. ✅ Aggiungere sezione `professional_blocked_periods` nella sezione "Tabelle Professional System"
2. ✅ Aggiungere sezione `professional_services` (se mancante)
3. ✅ Aggiungere sezione `subscription_invoices` (se mancante)
4. ✅ Rimuovere sezione `users` (se tabella è stata rimossa)
5. ✅ Rimuovere campi deprecati da `professionals` (se rimossi)

---

## 📊 RIEPILOGO PRIORITÀ

| # | Azione | Priorità | Stato |
|---|--------|----------|-------|
| 1 | Verificare stato database (query SQL) | 🔴 **ALTA** | ⏳ **DA FARE** |
| 2 | Eseguire cleanup se necessario | 🔴 **ALTA** | ⏳ **DA FARE** |
| 3 | Aggiornare DATABASE_SCHEMA.md | 🟡 **MEDIA** | ⏳ **DA FARE** |

---

## ✅ RISULTATO ATTESO

Dopo il cleanup:
- ✅ Schema database pulito e aggiornato
- ✅ Documentazione completa e sincronizzata
- ✅ Nessuna tabella/colonna obsoleta
- ✅ Tutte le nuove tabelle documentate

---

**Prossimo passo:** Eseguire le query di verifica per capire lo stato attuale del database.

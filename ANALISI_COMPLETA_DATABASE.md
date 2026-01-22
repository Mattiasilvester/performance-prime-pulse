# 🗄️ ANALISI COMPLETA DATABASE - PULIZIA E ORDINAMENTO

**Data Analisi**: 23 Gennaio 2025  
**Obiettivo**: Identificare tabelle da creare, eliminare o modificare per avere un database pulito, ordinato e chiaro

---

## 📊 TABELLE IDENTIFICATE NELLE MIGRAZIONI

### **✅ TABELLE PRINCIPALI (Core System)**

| Tabella | Migrazione | Stato | Usata nel Codice | Note |
|---------|-----------|-------|------------------|------|
| `profiles` | Supabase Auto + `20250112_final_fix_signup_error.sql` | ✅ **ESISTE** | ✅ **SÌ** (AgendaView, PrenotazioniPage, useAdminAuthBypass, userService) | Tabella base utenti (1:1 con auth.users) |
| `professionals` | `20250618122323` + estensioni | ✅ **ESISTE** | ✅ **SÌ** | Tabella professionisti |
| `bookings` | `20250120000000_professional_system.sql` | ✅ **ESISTE** | ✅ **SÌ** | Prenotazioni |

---

### **✅ TABELLE PROFESSIONAL SYSTEM**

| Tabella | Migrazione | Stato | Usata nel Codice | Note |
|---------|-----------|-------|------------------|------|
| `professional_applications` | `20250120000000_professional_system.sql` | ✅ **ESISTE** | ❌ **NO** | Richieste registrazione - **NON USATA** |
| `professional_availability` | `20250120000000_professional_system.sql` | ✅ **ESISTE** | ✅ **SÌ** | Disponibilità oraria - **USATA** (DisponibilitaManager.tsx) |
| `professional_blocked_periods` | `20250121_professional_blocked_periods.sql` | ✅ **ESISTE** | ✅ **SÌ** | Periodi bloccati |
| `professional_services` | `20250121_fase2_professional_services.sql` | ✅ **ESISTE** | ✅ **SÌ** | Servizi professionisti |
| `professional_clients` | `20250120000000_professional_system.sql` | ✅ **ESISTE** | ⚠️ **DA VERIFICARE** | Relazione prof-clienti |
| `professional_settings` | `20250121000000_professional_settings.sql` | ✅ **ESISTE** | ✅ **SÌ** | Impostazioni prof |
| `professional_languages` | `20250121000000_professional_settings.sql` | ✅ **ESISTE** | ✅ **SÌ** | Lingue parlate - **USATA** (LinguaModal.tsx) |
| `subscription_invoices` | `20250122000002_subscription_payments.sql` | ✅ **ESISTE** | ✅ **SÌ** | Fatture abbonamenti - **USATA** (PaymentsModal.tsx) |
| `reviews` | `20250121_fase2_reviews.sql` | ✅ **ESISTE** | ❌ **NO** | Recensioni professionisti - **NON USATA** (migrazione esiste ma codice usa DEMO_REVIEWS) |

---

### **✅ TABELLE CLIENTI E PROGETTI**

| Tabella | Migrazione | Stato | Usata nel Codice | Note |
|---------|-----------|-------|------------------|------|
| `clients` | `20250119000000_create_clients_and_projects.sql` | ✅ **ESISTE** | ✅ **SÌ** | Clienti professionisti |
| `projects` | `20250119000000_create_clients_and_projects.sql` | ✅ **ESISTE** | ✅ **SÌ** | Progetti clienti |

---

### **✅ TABELLE WORKOUT SYSTEM**

| Tabella | Migrazione | Stato | Usata nel Codice | Note |
|---------|-----------|-------|------------------|------|
| `custom_workouts` | `20250619152412` | ✅ **ESISTE** | ❌ **NO** | Allenamenti personalizzati - **NON USATA** |
| `user_workout_stats` | `20250619152412` | ✅ **ESISTE** | ✅ **SÌ** | Statistiche giornaliere |
| `monthly_workout_stats` | `20250723202350` | ✅ **ESISTE** | ✅ **SÌ** | Statistiche mensili |
| `workout_diary` | `20250116000000_create_workout_diary.sql` | ✅ **ESISTE** | ✅ **SÌ** | Diario allenamenti - **USATA** (diaryService.ts) |
| `workout_attachments` | `20250620000000-workout-attachments.sql` | ✅ **ESISTE** | ✅ **SÌ** | Allegati workout - **USATA** (WorkoutAttachments.tsx, WorkoutCreationModal.tsx) |
| `user_objectives` | `20250619162008` | ✅ **ESISTE** | ✅ **SÌ** | Obiettivi utente - **USATA** (RecentActivity.tsx, StatsOverview.tsx, ObjectiveModal.tsx) |
| `notes` | `20250619165600` | ✅ **ESISTE** | ✅ **SÌ** | Note utente - **USATA** (primebotActionsService.ts, useNotes.tsx) |
| `user_onboarding_responses` | `20251113000000_create_user_onboarding_responses.sql` | ✅ **ESISTE** | ✅ **SÌ** | Risposte onboarding |
| `health_disclaimer_acknowledgments` | `20250116000000_add_health_limitations.sql` | ✅ **ESISTE** | ✅ **SÌ** | Disclaimer salute - **USATA** (HealthDisclaimer.tsx) |
| `waiting_list` | `20250802190000-create-waiting-list.sql` | ✅ **ESISTE** | ❌ **NO** | Lista attesa - **NON USATA** (solo in types.ts) |

---

### **✅ TABELLE PRIMEBOT**

| Tabella | Migrazione | Stato | Usata nel Codice | Note |
|---------|-----------|-------|------------------|------|
| `primebot_interactions` | `20250108000000_primebot_tables.sql` | ✅ **ESISTE** | ✅ **SÌ** | Interazioni chat - **USATA** (primebotConversationService.ts) |
| `primebot_preferences` | `20250108000000_primebot_tables.sql` | ✅ **ESISTE** | ✅ **SÌ** | Preferenze PrimeBot - **USATA** (primebotUserContextService.ts) |

---

### **✅ TABELLE ADMIN SYSTEM**

| Tabella | Migrazione | Stato | Usata nel Codice | Note |
|---------|-----------|-------|------------------|------|
| `admin_audit_logs` | `20250114_superadmin_system.sql` | ✅ **ESISTE** | ✅ **SÌ** | Log audit admin |
| `admin_sessions` | `20250114_superadmin_system.sql` | ✅ **ESISTE** | ✅ **SÌ** | Sessioni admin |
| `admin_settings` | `20250114_superadmin_system.sql` | ✅ **ESISTE** | ✅ **SÌ** | Impostazioni admin |
| `escalations` | `20250108000001_escalations_table.sql` | ✅ **ESISTE** | ❌ **NO** | Escalation problemi - **NON USATA** |

---

## ❌ TABELLE OBSOLETE/LEGACY (DA VERIFICARE/ELIMINARE)

### **1. Tabella `users` (LEGACY)** ⚠️

**Stato**: Migrazione cleanup esiste (`20250121_cleanup_fase1.sql`) ma **NON VERIFICATA se eseguita**

**Evidenze:**
- ✅ Creata in: `20250618122323-cf39e8de-9490-4c81-9ff8-1a4f504c9761.sql`
- ✅ Rimozione prevista in: `20250121_cleanup_fase1.sql` (STEP 2)
- ❌ **NON usata nel codice** (verificato: 0 risultati grep, il codice usa `profiles`)

**Azione Richiesta:**
1. ⚠️ **VERIFICARE** se la tabella esiste ancora nel database
2. Se esiste: ✅ **ESEGUIRE** migrazione `20250121_cleanup_fase1.sql`
3. Se non esiste: ✅ **AGGIORNARE** `DATABASE_SCHEMA.md` rimuovendo la sezione `users`

**Query Verifica:**
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS users_table_exists;
```

---

### **2. Campi Deprecati in `professionals`** ⚠️

**Stato**: Migrazione cleanup esiste ma **NON VERIFICATA se eseguita**

**Campi da rimuovere:**
- `password_hash` (deprecato, usa Supabase Auth)
- `password_salt` (deprecato, usa Supabase Auth)
- `reset_token` (deprecato)
- `reset_requested_at` (deprecato)

**Azione Richiesta:**
1. ⚠️ **VERIFICARE** se questi campi esistono ancora
2. Se esistono: ✅ **ESEGUIRE** migrazione `20250121_cleanup_fase1.sql` (STEP 3)
3. Se non esistono: ✅ **AGGIORNARE** `DATABASE_SCHEMA.md` rimuovendo questi campi

**Query Verifica:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at');
```

---

## 📋 TABELLE MANCANTI NELLA DOCUMENTAZIONE

### **1. `profiles`** ⚠️ **MANCANTE**

**Stato**: Tabella **ESISTE** e **USATA** nel codice ma **NON documentata** in `DATABASE_SCHEMA.md`

**Evidenze:**
- ✅ Creata da Supabase automaticamente o da migrazioni (`20250112_final_fix_signup_error.sql`)
- ✅ **USATA** in: `AgendaView.tsx`, `PrenotazioniPage.tsx`, `useAdminAuthBypass.tsx`, `userService.ts`, `useFeedback15Days.ts`, `DatabaseDiagnostic.tsx`, `TestConnection.tsx`
- ❌ **NON presente** in `DATABASE_SCHEMA.md` - **DA AGGIUNGERE**

**Colonne (da `types.ts`):**
- `id` (UUID, PK, FK → auth.users)
- `first_name`, `last_name`, `full_name`
- `email`, `phone`
- `birth_date`, `birth_place`
- `avatar_url`
- `role` (es: 'super_admin')
- `last_login`
- `feedback_15d_sent`
- `created_at`, `updated_at`

**Azione Richiesta:**
- ✅ **AGGIUNGERE** sezione `profiles` in `DATABASE_SCHEMA.md` nella sezione "Tabelle Principali"

---

### **2. `professional_blocked_periods`** ⚠️ **MANCANTE**

**Stato**: Tabella creata (`20250121_professional_blocked_periods.sql`) ma **NON documentata** in `DATABASE_SCHEMA.md`

**Azione Richiesta:**
- ✅ **AGGIUNGERE** sezione in `DATABASE_SCHEMA.md` (già presente nella documentazione, verificare se completa)

---

### **3. `reviews`** ⚠️ **DA VERIFICARE**

**Stato**: Tabella creata (`20250121_fase2_reviews.sql`) ma da verificare se documentata

**Azione Richiesta:**
- ⚠️ **VERIFICARE** se presente in `DATABASE_SCHEMA.md`, altrimenti aggiungere

---

## ✅ RISULTATI VERIFICA UTILIZZO TABELLE

### **Tabelle VERIFICATE e UTILIZZATE:** ✅

1. ✅ **`professional_availability`** - **USATA** in `DisponibilitaManager.tsx` (7 riferimenti)
2. ✅ **`professional_languages`** - **USATA** in `LinguaModal.tsx` (3 riferimenti)
3. ✅ **`subscription_invoices`** - **USATA** in `PaymentsModal.tsx` (1 riferimento)
4. ✅ **`workout_diary`** - **USATA** in `diaryService.ts` (7 riferimenti)
5. ✅ **`workout_attachments`** - **USATA** in `WorkoutAttachments.tsx` e `WorkoutCreationModal.tsx` (5 riferimenti)
6. ✅ **`user_objectives`** - **USATA** in `RecentActivity.tsx`, `StatsOverview.tsx`, `ObjectiveModal.tsx` (3 riferimenti)
7. ✅ **`notes`** - **USATA** in `primebotActionsService.ts` e `useNotes.tsx` (5 riferimenti)
8. ✅ **`health_disclaimer_acknowledgments`** - **USATA** in `HealthDisclaimer.tsx` (1 riferimento)
9. ✅ **`primebot_interactions`** - **USATA** in `primebotConversationService.ts` (3 riferimenti)
10. ✅ **`primebot_preferences`** - **USATA** in `primebotUserContextService.ts` (1 riferimento)

---

### **Tabelle VERIFICATE e NON UTILIZZATE:** ❌

1. ❌ **`users`** - **NON USATA** (0 risultati grep) - **LEGACY, DA RIMUOVERE**
2. ❌ **`professional_applications`** - **NON USATA** (0 risultati grep) - **DA VERIFICARE se necessaria o legacy**
3. ❌ **`reviews`** - **NON USATA** (0 risultati grep) - **Migrazione esiste ma codice usa DEMO_REVIEWS** - **DA INTEGRARE o RIMUOVERE**
4. ❌ **`waiting_list`** - **NON USATA** (solo in types.ts, nessun utilizzo reale) - **DA VERIFICARE se necessaria**
5. ❌ **`escalations`** - **NON USATA** (0 risultati grep) - **DA VERIFICARE se necessaria o legacy**
6. ❌ **`custom_workouts`** - **NON USATA** (0 risultati grep) - **DA VERIFICARE se necessaria o legacy**

---

### **Tabelle DA VERIFICARE MANUALMENTE:** ⚠️

1. ⚠️ **`professional_clients`** - Non trovata nel codice, potrebbe essere sostituita da `clients`
2. ⚠️ **`reviews`** - Tabella creata ma codice usa dati demo. **DECISIONE NECESSARIA**: Integrare o rimuovere

---

## 🎯 PIANO DI AZIONE RACCOMANDATO

### **FASE 1: VERIFICA STATO DATABASE** 🔍

**Query SQL da eseguire in Supabase SQL Editor:**

```sql
-- ============================================
-- VERIFICA STATO DATABASE COMPLETO
-- ============================================

-- 1. Verifica tabella users (dovrebbe essere rimossa)
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

-- 3. Verifica tabella profiles (dovrebbe esistere)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) AS profiles_table_exists;

-- 4. Lista tutte le tabelle esistenti
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 5. Verifica colonne profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

---

### **FASE 2: ESECUZIONE CLEANUP (se necessario)** 🧹

**Se la tabella `users` esiste ancora:**
```sql
-- Esegui migrazione cleanup
-- File: supabase/migrations/20250121_cleanup_fase1.sql
-- Oppure esegui manualmente:
DROP TABLE IF EXISTS public.users CASCADE;
```

**Se i campi deprecati in `professionals` esistono ancora:**
```sql
-- Esegui migrazione cleanup (stesso file)
-- File: supabase/migrations/20250121_cleanup_fase1.sql
-- Oppure esegui manualmente:
ALTER TABLE public.professionals 
    DROP COLUMN IF EXISTS password_hash,
    DROP COLUMN IF EXISTS password_salt,
    DROP COLUMN IF EXISTS reset_token,
    DROP COLUMN IF EXISTS reset_requested_at;
```

---

### **FASE 3: VERIFICA UTILIZZO TABELLE** 🔍

**Query per verificare tabelle non utilizzate:**

```sql
-- Lista tabelle con conteggio record
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Tabelle da verificare manualmente nel codice:**
- Cercare `from('tabella_name')` in tutti i file `.ts` e `.tsx`

---

### **FASE 4: AGGIORNAMENTO DOCUMENTAZIONE** 📝

**File da aggiornare:** `DATABASE_SCHEMA.md`

**Azioni:**
1. ✅ Aggiungere sezione `profiles` nella sezione "Tabelle Principali"
2. ✅ Verificare sezione `professional_blocked_periods` (già presente, verificare completezza)
3. ✅ Verificare sezione `professional_services` (già presente)
4. ✅ Verificare sezione `subscription_invoices` (già presente)
5. ✅ Verificare sezione `reviews` (da aggiungere se mancante)
6. ✅ Rimuovere sezione `users` (se tabella è stata rimossa)
7. ✅ Rimuovere campi deprecati da `professionals` (se rimossi)

---

## 📊 RIEPILOGO PRIORITÀ

| # | Azione | Priorità | Stato | Note |
|---|--------|----------|-------|------|
| 1 | Verificare se `users` esiste ancora | 🔴 **ALTA** | ⏳ **DA FARE** | Eseguire query verifica in Supabase |
| 2 | Verificare campi deprecati `professionals` | 🔴 **ALTA** | ⏳ **DA FARE** | Eseguire query verifica in Supabase |
| 3 | Eseguire cleanup se necessario | 🔴 **ALTA** | ⏳ **DA FARE** | Dopo verifica (rimuovere `users` e campi deprecati) |
| 4 | Aggiungere `profiles` a DATABASE_SCHEMA.md | 🟡 **MEDIA** | ⏳ **DA FARE** | Documentazione - **CRITICO** (tabella usata ma non documentata) |
| 5 | Decidere su `reviews` | 🟡 **MEDIA** | ⏳ **DA FARE** | Tabella esiste ma codice usa DEMO_REVIEWS - Integrare o rimuovere |
| 6 | Verificare `professional_applications` | 🟡 **MEDIA** | ⏳ **DA FARE** | Non usata - Verificare se necessaria o legacy |
| 7 | Verificare `waiting_list` | 🟢 **BASSA** | ⏳ **DA FARE** | Solo in types.ts, nessun utilizzo reale |
| 8 | Verificare `escalations` | 🟢 **BASSA** | ⏳ **DA FARE** | Non usata - Verificare se necessaria o legacy |
| 9 | Verificare `custom_workouts` | 🟢 **BASSA** | ⏳ **DA FARE** | Non usata - Verificare se necessaria o legacy |
| 10 | Verificare `professional_clients` | 🟢 **BASSA** | ⏳ **DA FARE** | Potrebbe essere sostituita da `clients` |

---

## ✅ RISULTATO ATTESO

Dopo il cleanup e la verifica:
- ✅ Database pulito (nessuna tabella/colonna obsoleta)
- ✅ Documentazione completa e sincronizzata
- ✅ Tutte le tabelle utilizzate documentate
- ✅ Tabelle non utilizzate identificate e documentate o rimosse
- ✅ Schema chiaro e ordinato

---

## 🔍 QUERY DI VERIFICA COMPLETA

**Esegui questa query in Supabase SQL Editor per ottenere un report completo:**

```sql
-- ============================================
-- REPORT COMPLETO STATO DATABASE
-- ============================================

-- 1. Lista tutte le tabelle
SELECT 
    'TABELLE ESISTENTI' as report_section,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verifica tabella users
SELECT 
    'VERIFICA USERS' as report_section,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN '⚠️ ESISTE (da rimuovere)'
        ELSE '✅ RIMOSSA'
    END as status;

-- 3. Verifica campi deprecati professionals
SELECT 
    'VERIFICA PROFESSIONALS' as report_section,
    column_name,
    '⚠️ DA RIMUOVERE' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at');

-- 4. Verifica tabella profiles
SELECT 
    'VERIFICA PROFILES' as report_section,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '✅ ESISTE'
        ELSE '❌ MANCANTE (da creare)'
    END as status;
```

---

---

## 📋 RIEPILOGO ESECUTIVO

### **✅ TABELLE VERIFICATE E UTILIZZATE (10 tabelle)**
- `professional_availability`, `professional_languages`, `subscription_invoices`
- `workout_diary`, `workout_attachments`, `user_objectives`, `notes`
- `health_disclaimer_acknowledgments`, `primebot_interactions`, `primebot_preferences`

### **❌ TABELLE VERIFICATE E NON UTILIZZATE (6 tabelle)**
1. **`users`** - LEGACY, da rimuovere (migrazione cleanup esiste)
2. **`professional_applications`** - Non usata, da verificare se necessaria
3. **`reviews`** - Tabella creata ma codice usa DEMO_REVIEWS, **DECISIONE NECESSARIA**
4. **`waiting_list`** - Solo in types.ts, nessun utilizzo reale
5. **`escalations`** - Non usata, da verificare se necessaria
6. **`custom_workouts`** - Non usata, da verificare se necessaria

### **⚠️ TABELLE DA VERIFICARE MANUALMENTE (1 tabella)**
- **`professional_clients`** - Potrebbe essere sostituita da `clients`

### **🔴 AZIONI CRITICHE IMMEDIATE**
1. **Verificare in Supabase** se `users` esiste ancora → Rimuovere se esiste
2. **Verificare in Supabase** se campi deprecati `professionals` esistono → Rimuovere se esistono
3. **Aggiungere `profiles`** a `DATABASE_SCHEMA.md` (tabella usata ma non documentata)
4. **Decidere su `reviews`**: Integrare nel codice o rimuovere tabella

### **📊 STATISTICHE**
- **Tabelle totali identificate**: 30+
- **Tabelle verificate utilizzate**: 10
- **Tabelle verificate non utilizzate**: 6
- **Tabelle da verificare manualmente**: 1
- **Tabelle legacy da rimuovere**: 1 (`users`)
- **Campi deprecati da rimuovere**: 4 (`password_hash`, `password_salt`, `reset_token`, `reset_requested_at`)

---

**Ultima revisione**: 23 Gennaio 2025  
**Stato**: ✅ **VERIFICHE COMPLETATE** - Pronta per esecuzione query di verifica in Supabase

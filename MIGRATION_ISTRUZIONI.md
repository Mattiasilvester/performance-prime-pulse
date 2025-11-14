# 🔴 MIGRATION URGENTE: Colonne Attrezzi

## 📋 CONTENUTO MIGRATION

### Migration 1: `possiede_attrezzatura`
**File**: `supabase/migrations/20251113100000_add_possiede_attrezzatura.sql`

Aggiunge colonna `possiede_attrezzatura BOOLEAN` per domanda "Possiedi attrezzatura?".

### Migration 2: `attrezzi` e `altri_attrezzi`
**File**: `supabase/migrations/20251114120000_add_attrezzi_columns.sql`

Aggiunge colonne:
- `attrezzi TEXT[]` - Array attrezzi selezionati
- `altri_attrezzi TEXT` - Attrezzi custom inseriti dall'utente

### Migration Unificata (SICURA)
**File**: `supabase/migrations/20251114130000_complete_attrezzi_migration.sql`

**✅ USA QUESTA**: Verifica esistenza colonne prima di aggiungere, evita errori duplicati.

---

## 🎯 COLONNE DA CREARE

### Tabella: `user_onboarding_responses`
- ✅ `possiede_attrezzatura` BOOLEAN DEFAULT NULL
- ✅ `attrezzi` TEXT[] DEFAULT ARRAY[]::TEXT[]
- ✅ `altri_attrezzi` TEXT DEFAULT NULL

### Tabella: `onboarding_preferenze` (se esiste)
- ✅ `possiede_attrezzatura` BOOLEAN DEFAULT NULL
- ✅ `attrezzi` TEXT[] DEFAULT ARRAY[]::TEXT[]
- ✅ `altri_attrezzi` TEXT DEFAULT NULL

---

## 📝 ISTRUZIONI ESECUZIONE SU SUPABASE

### METODO 1: SQL Editor (Consigliato)

1. **Accedi a Supabase Dashboard**
   - Vai su: https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Apri SQL Editor**
   - Menu laterale → **SQL Editor**
   - Click **"New query"**

3. **Copia e Incolla SQL**
   - Apri file: `supabase/migrations/20251114130000_complete_attrezzi_migration.sql`
   - **COPIA TUTTO IL CONTENUTO**
   - Incolla nell'editor SQL

4. **Esegui Migration**
   - Click **"Run"** (o `Cmd/Ctrl + Enter`)
   - Attendi completamento

5. **Verifica Risultato**
   - Controlla messaggi nella console:
     - ✅ `SUCCESSO: Tutte e 3 le colonne esistono`
     - ⚠️ Se vedi warning, controlla quali colonne mancano

6. **Verifica Manuale (Opzionale)**
   ```sql
   -- Verifica colonne in user_onboarding_responses
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'user_onboarding_responses'
   AND column_name IN ('possiede_attrezzatura', 'attrezzi', 'altri_attrezzi');
   ```

### METODO 2: Table Editor (Alternativo)

1. **Accedi a Table Editor**
   - Menu laterale → **Table Editor**
   - Seleziona tabella `user_onboarding_responses`

2. **Aggiungi Colonne Manualmente**
   - Click **"Add Column"** per ogni colonna:
   
   **Colonna 1:**
   - Name: `possiede_attrezzatura`
   - Type: `boolean`
   - Default: `NULL`
   - Nullable: ✅ Yes
   
   **Colonna 2:**
   - Name: `attrezzi`
   - Type: `text[]` (array)
   - Default: `{}`
   - Nullable: ✅ Yes
   
   **Colonna 3:**
   - Name: `altri_attrezzi`
   - Type: `text`
   - Default: `NULL`
   - Nullable: ✅ Yes

3. **Ripeti per `onboarding_preferenze`** (se esiste)

---

## ✅ VERIFICA POST-MIGRATION

### Test 1: Verifica Colonne Esistono
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_onboarding_responses'
AND column_name IN ('possiede_attrezzatura', 'attrezzi', 'altri_attrezzi')
ORDER BY column_name;
```

**Output Atteso:**
```
column_name           | data_type | is_nullable | column_default
---------------------+-----------+-------------+----------------
altri_attrezzi       | text      | YES         | NULL
attrezzi             | ARRAY     | YES         | ARRAY[]::text[]
possiede_attrezzatura| boolean   | YES         | NULL
```

### Test 2: Test Inserimento Dati
```sql
-- Test inserimento (usa un user_id esistente)
UPDATE user_onboarding_responses
SET 
    possiede_attrezzatura = true,
    attrezzi = ARRAY['manubri', 'bilanciere'],
    altri_attrezzi = 'TRX, Corda per saltare'
WHERE user_id = 'TUO_USER_ID_QUI'
LIMIT 1;

-- Verifica
SELECT possiede_attrezzatura, attrezzi, altri_attrezzi
FROM user_onboarding_responses
WHERE user_id = 'TUO_USER_ID_QUI';
```

---

## 🐛 RISOLUZIONE PROBLEMI

### Errore: "column already exists"
**Causa**: Colonne già esistenti
**Soluzione**: ✅ La migration unificata gestisce questo automaticamente, ignora l'errore

### Errore: "relation does not exist"
**Causa**: Tabella `user_onboarding_responses` non esiste
**Soluzione**: Esegui prima la migration base: `20251113000000_create_user_onboarding_responses.sql`

### Errore: "permission denied"
**Causa**: Permessi insufficienti
**Soluzione**: Usa account con privilegi di amministratore o Service Role Key

### Errore: "syntax error"
**Causa**: SQL malformato
**Soluzione**: 
- Verifica di aver copiato tutto il contenuto del file
- Controlla che non ci siano caratteri speciali aggiunti
- Usa SQL Editor invece di altri tool

---

## 📊 STATO MIGRATION

- [ ] Migration eseguita su Supabase
- [ ] Colonne verificate con query SQL
- [ ] Test inserimento dati eseguito
- [ ] Bottone "Conferma attrezzi" testato nell'app

---

## 📞 SUPPORTO

Se incontri problemi:
1. Controlla messaggi nella console SQL Editor
2. Esegui query di verifica sopra
3. Controlla log Supabase per errori dettagliati


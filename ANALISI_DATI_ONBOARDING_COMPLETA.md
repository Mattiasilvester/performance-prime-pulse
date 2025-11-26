# 📊 ANALISI COMPLETA DATI ONBOARDING - PERFORMANCE PRIME PULSE

**Data Analisi**: 16 Gennaio 2025  
**Scopo**: Identificare tutti i dati raccolti durante onboarding e verificare presenza campi per limitazioni fisiche/dolori/infortuni

---

## 🗄️ 1️⃣ TABELLE ONBOARDING ESISTENTI

### **A) Tabella Unificata (ATTIVA)**

#### **`user_onboarding_responses`** ✅ TABELLA PRINCIPALE
**Stato**: Tabella unificata che sostituisce le 4 tabelle legacy  
**Migrazione**: `20251113000000_create_user_onboarding_responses.sql`

**Colonne Complete**:

| Colonna | Tipo | Valori Possibili | Step | Descrizione |
|---------|------|------------------|------|-------------|
| `user_id` | UUID (PK) | UUID | - | Chiave primaria, FK auth.users |
| **Step 1: Obiettivo** |
| `obiettivo` | TEXT | `'massa'`, `'dimagrire'`, `'resistenza'`, `'tonificare'` | Step 1 | Obiettivo principale allenamento |
| **Step 2: Esperienza** |
| `livello_esperienza` | TEXT | `'principiante'`, `'intermedio'`, `'avanzato'` | Step 2 | Livello fitness utente |
| `giorni_settimana` | INTEGER | `1-7` | Step 2 | Frequenza allenamento settimanale |
| **Step 3: Preferenze** |
| `luoghi_allenamento` | TEXT[] | `['casa']`, `['palestra']`, `['outdoor']`, combinazioni | Step 3 | Luoghi preferiti per allenarsi |
| `tempo_sessione` | INTEGER | `15`, `30`, `45`, `60` | Step 3 | Durata sessione in minuti |
| `possiede_attrezzatura` | BOOLEAN | `true`, `false`, `NULL` | Step 3 | Possiede attrezzatura (solo Casa/Outdoor) |
| `attrezzi` | TEXT[] | `['manubri']`, `['bilanciere']`, `['kettlebell']`, `['elastici']`, `['panca']`, `['altro']` | Step 3 | Lista attrezzi posseduti |
| `altri_attrezzi` | TEXT | Testo libero | Step 3 | Attrezzi custom quando seleziona "Altro" |
| **Step 4: Personalizzazione** |
| `nome` | TEXT | Testo libero | Step 4 | Nome utente |
| `eta` | INTEGER | `1-150` | Step 4 | Età utente |
| `peso` | INTEGER | `1-500` (kg) | Step 4 | Peso in chilogrammi |
| `altezza` | INTEGER | `50-250` (cm) | Step 4 | Altezza in centimetri |
| `consigli_nutrizionali` | BOOLEAN | `true`, `false` | Step 4 | Interesse a consigli nutrizionali |
| **Metadata** |
| `onboarding_completed_at` | TIMESTAMPTZ | Timestamp | - | Data completamento onboarding |
| `last_modified_at` | TIMESTAMPTZ | Timestamp | - | Ultima modifica (auto-aggiornato) |
| `created_at` | TIMESTAMPTZ | Timestamp | - | Data creazione record |

**Indici**:
- `idx_user_onboarding_responses_user_id` (user_id)
- `idx_user_onboarding_responses_completed` (onboarding_completed_at WHERE NOT NULL)
- `idx_user_onboarding_responses_modified` (last_modified_at DESC)

**RLS Policies**:
- SELECT: Utenti vedono solo i propri dati
- INSERT: Utenti inseriscono solo i propri dati
- UPDATE: Utenti aggiornano solo i propri dati
- DELETE: Utenti eliminano solo i propri dati

---

### **B) Tabelle Legacy (MIGRATE)**

Queste tabelle esistono ancora nel database ma i dati sono stati migrati in `user_onboarding_responses`:

#### **1. `onboarding_obiettivo_principale`** (Legacy)
- `user_id` UUID (PK)
- `obiettivo` TEXT ('massa', 'dimagrire', 'resistenza', 'tonificare')
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

#### **2. `onboarding_esperienza`** (Legacy)
- `user_id` UUID (PK)
- `livello_esperienza` TEXT ('principiante', 'intermedio', 'avanzato')
- `giorni_settimana` INTEGER
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

#### **3. `onboarding_preferenze`** (Legacy)
- `user_id` UUID (PK)
- `luoghi_allenamento` TEXT[]
- `tempo_sessione` INTEGER (15, 30, 45, 60)
- `possiede_attrezzatura` BOOLEAN (aggiunta successivamente)
- `attrezzi` TEXT[] (aggiunta successivamente)
- `altri_attrezzi` TEXT (aggiunta successivamente)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

#### **4. `onboarding_personalizzazione`** (Legacy)
- `user_id` UUID (PK)
- `nome` TEXT
- `eta` INTEGER
- `peso` INTEGER
- `altezza` INTEGER
- `consigli_nutrizionali` BOOLEAN
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

---

### **C) Tabelle Correlate**

#### **`user_objectives`** (Obiettivi Utente)
**Scopo**: Obiettivi personalizzati dell'utente (diversi da onboarding)

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | UUID (PK) | ID obiettivo |
| `user_id` | UUID (FK) | Riferimento utente |
| `title` | TEXT | Titolo obiettivo |
| `description` | TEXT | Descrizione obiettivo |
| `completed` | BOOLEAN | Stato completamento |
| `progress` | INTEGER | Progresso (0-100) |
| `completed_at` | TIMESTAMPTZ | Data completamento |
| `created_at` | TIMESTAMPTZ | Data creazione |
| `updated_at` | TIMESTAMPTZ | Ultima modifica |

**Nota**: Questa tabella NON contiene dati di onboarding, ma obiettivi personalizzati aggiunti successivamente.

#### **`profiles`** (Profilo Utente Base)
**Scopo**: Dati profilo base utente (non onboarding)

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | UUID (PK) | ID profilo |
| `first_name` | TEXT | Nome |
| `last_name` | TEXT | Cognome |
| `email` | TEXT | Email |
| `phone` | TEXT | Telefono |
| `birth_date` | DATE | Data di nascita |
| `birth_place` | TEXT | Luogo di nascita |
| `avatar_url` | TEXT | URL avatar |
| `role` | TEXT | Ruolo utente |
| `last_login` | TIMESTAMPTZ | Ultimo accesso |
| `feedback_15d_sent` | BOOLEAN | Flag feedback 15 giorni |
| `created_at` | TIMESTAMPTZ | Data creazione |
| `updated_at` | TIMESTAMPTZ | Ultima modifica |

**Nota**: Questa tabella contiene dati profilo base, NON dati onboarding specifici.

---

## 📋 2️⃣ FLUSSO ONBOARDING REACT

### **Componenti Onboarding**

#### **Step 0: Registration** (`Step0Registration.tsx`)
- **Domanda**: Registrazione account
- **Dati raccolti**: Email, password (gestiti da Supabase Auth)
- **Salvataggio**: Tabella `auth.users`

#### **Step 1: Goals** (`Step1Goals.tsx`)
- **Domanda**: "Qual è il tuo obiettivo principale?"
- **Opzioni**: 
  - Aumentare massa muscolare (massa)
  - Dimagrire e definirmi (dimagrire)
  - Migliorare resistenza (resistenza)
  - Tonificare il corpo (tonificare)
- **Dati salvati**: `obiettivo` → `user_onboarding_responses.obiettivo`

#### **Step 2: Experience** (`Step2Experience.tsx`)
- **Domande**:
  1. "Qual è il tuo livello di esperienza?"
     - Principiante (0-6 mesi)
     - Intermedio (6 mesi - 2 anni)
     - Avanzato (2+ anni)
  2. "Quanti giorni a settimana vuoi allenarti?"
     - Slider 1-7 giorni
- **Dati salvati**: 
  - `livello_esperienza` → `user_onboarding_responses.livello_esperienza`
  - `giorni_settimana` → `user_onboarding_responses.giorni_settimana`

#### **Step 3: Preferences** (`Step3Preferences.tsx`)
- **Domande**:
  1. "Dove preferisci allenarti?" (Multi-select)
     - Casa
     - Palestra
     - Outdoor
  2. "Quanto tempo hai per ogni sessione?"
     - 15 min (Express)
     - 30 min (Standard)
     - 45 min (Completo)
     - 60+ min (Intensivo)
  3. "Possiedi attrezzatura?" (Condizionale, solo se Casa/Outdoor)
     - Sì / No
  4. "Quali attrezzi possiedi?" (Condizionale, solo se Sì)
     - Manubri
     - Bilanciere
     - Kettlebell
     - Elastici di resistenza
     - Panca
     - Altro (campo testo libero)
- **Dati salvati**:
  - `luoghi_allenamento` → `user_onboarding_responses.luoghi_allenamento`
  - `tempo_sessione` → `user_onboarding_responses.tempo_sessione`
  - `possiede_attrezzatura` → `user_onboarding_responses.possiede_attrezzatura`
  - `attrezzi` → `user_onboarding_responses.attrezzi`
  - `altri_attrezzi` → `user_onboarding_responses.altri_attrezzi`

#### **Step 4: Personalization** (`Step4Personalization.tsx`)
- **Domande**:
  1. "Come ti chiami?" (Campo testo)
  2. "Quanti anni hai?" (Slider 1-150)
  3. "Quanto pesi?" (Slider 1-500 kg)
  4. "Quanto sei alto?" (Slider 50-250 cm)
  5. "Vuoi ricevere consigli nutrizionali?" (Checkbox)
- **Dati salvati**:
  - `nome` → `user_onboarding_responses.nome`
  - `eta` → `user_onboarding_responses.eta`
  - `peso` → `user_onboarding_responses.peso`
  - `altezza` → `user_onboarding_responses.altezza`
  - `consigli_nutrizionali` → `user_onboarding_responses.consigli_nutrizionali`

---

## ❌ 3️⃣ CAMPI MANCANTI - ANALISI CRITICA

### **⚠️ CAMPI NON PRESENTI NEL DATABASE**

#### **A) Limitazioni Fisiche / Dolori / Infortuni** ❌
**Stato**: **NON ESISTONO**

**Campi suggeriti da aggiungere**:
```sql
-- Limitazioni fisiche
limitazioni_fisiche TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esempi: ['schiena', 'ginocchio', 'spalla', 'collo']

dolori_cronici TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esempi: ['lombare', 'cervicale', 'sciatica']

infortuni_pregressi TEXT,
  -- Testo libero per descrivere infortuni passati

zone_da_evitare TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Zone del corpo da evitare negli esercizi
```

#### **B) Condizioni Mediche** ❌
**Stato**: **NON ESISTONO**

**Campi suggeriti da aggiungere**:
```sql
condizioni_mediche TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esempi: ['ipertensione', 'diabete', 'asma', 'problemi cardiaci']

ha_consenso_medico BOOLEAN DEFAULT FALSE,
  -- Ha ottenuto consenso medico per attività fisica

medicazioni_attuali TEXT,
  -- Testo libero per farmaci in uso
```

#### **C) Allergie Alimentari** ❌
**Stato**: **NON ESISTONO** (anche se `consigli_nutrizionali` esiste)

**Campi suggeriti da aggiungere**:
```sql
allergie_alimentari TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esempi: ['glutine', 'lattosio', 'noci', 'frutti di mare']

intolleranze TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esempi: ['lattosio', 'fruttosio']

dieta_seguita TEXT,
  -- Esempi: 'vegetariana', 'vegana', 'keto', 'mediterranea', NULL
```

#### **D) Esperienza Pregressa Dettagliata** ⚠️
**Stato**: **PARZIALE** (solo livello base)

**Campi esistenti**:
- ✅ `livello_esperienza` (principiante/intermedio/avanzato)
- ✅ `giorni_settimana` (frequenza)

**Campi suggeriti da aggiungere**:
```sql
anni_esperienza INTEGER,
  -- Anni totali di esperienza fitness

sport_praticati TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esempi: ['calcio', 'nuoto', 'corsa', 'palestra']

esercizi_preferiti TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esercizi che l'utente preferisce

esercizi_da_evitare TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Esercizi che l'utente vuole evitare
```

#### **E) Preferenze Specifiche** ⚠️
**Stato**: **PARZIALE** (solo luoghi e tempo)

**Campi suggeriti da aggiungere**:
```sql
preferenza_intensita TEXT CHECK (preferenza_intensita IN ('leggera', 'moderata', 'intensa')),
  -- Intensità preferita degli allenamenti

preferenza_orario TEXT CHECK (preferenza_orario IN ('mattina', 'pomeriggio', 'sera')),
  -- Orario preferito per allenarsi

giorni_preferiti INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  -- Giorni della settimana preferiti (1=Lunedì, 7=Domenica)
```

---

## 📊 4️⃣ RIEPILOGO CAMPI RACCOLTI

### **✅ Campi Attualmente Raccolti (15 campi)**

#### **Obiettivi e Livello**:
1. ✅ `obiettivo` - Obiettivo principale (massa/dimagrire/resistenza/tonificare)
2. ✅ `livello_esperienza` - Livello fitness (principiante/intermedio/avanzato)
3. ✅ `giorni_settimana` - Frequenza allenamento (1-7 giorni)

#### **Preferenze Allenamento**:
4. ✅ `luoghi_allenamento` - Luoghi preferiti (casa/palestra/outdoor)
5. ✅ `tempo_sessione` - Durata sessione (15/30/45/60 min)
6. ✅ `possiede_attrezzatura` - Possiede attrezzatura (true/false/null)
7. ✅ `attrezzi` - Lista attrezzi posseduti (array)
8. ✅ `altri_attrezzi` - Attrezzi custom (testo libero)

#### **Dati Personali**:
9. ✅ `nome` - Nome utente
10. ✅ `eta` - Età (1-150)
11. ✅ `peso` - Peso in kg (1-500)
12. ✅ `altezza` - Altezza in cm (50-250)
13. ✅ `consigli_nutrizionali` - Interesse consigli nutrizionali (true/false)

#### **Metadata**:
14. ✅ `onboarding_completed_at` - Data completamento
15. ✅ `last_modified_at` - Ultima modifica

---

## 🚨 5️⃣ CAMPI CRITICI MANCANTI

### **❌ ASSENTI - Priorità ALTA**

#### **1. Limitazioni Fisiche / Dolori** 🔴 CRITICO
**Impatto**: PrimeBot potrebbe suggerire esercizi pericolosi per utenti con infortuni  
**Esempio**: Utente con dolore lombare → PrimeBot suggerisce squat pesanti

**Campi da aggiungere**:
- `limitazioni_fisiche` TEXT[] - Zone con limitazioni
- `dolori_cronici` TEXT[] - Dolori cronici
- `infortuni_pregressi` TEXT - Descrizione infortuni passati
- `zone_da_evitare` TEXT[] - Zone del corpo da evitare

#### **2. Condizioni Mediche** 🔴 CRITICO
**Impatto**: PrimeBot potrebbe suggerire allenamenti non adatti a condizioni mediche  
**Esempio**: Utente con ipertensione → PrimeBot suggerisce HIIT intenso

**Campi da aggiungere**:
- `condizioni_mediche` TEXT[] - Condizioni mediche note
- `ha_consenso_medico` BOOLEAN - Consenso medico ottenuto
- `medicazioni_attuali` TEXT - Farmaci in uso

#### **3. Allergie Alimentari** 🟡 MEDIO
**Impatto**: Se `consigli_nutrizionali = true`, PrimeBot potrebbe suggerire alimenti allergenici  
**Esempio**: Utente allergico alle noci → PrimeBot suggerisce snack con noci

**Campi da aggiungere**:
- `allergie_alimentari` TEXT[] - Allergie alimentari
- `intolleranze` TEXT[] - Intolleranze alimentari
- `dieta_seguita` TEXT - Tipo di dieta (vegetariana/vegana/etc.)

---

## 💡 6️⃣ SUGGERIMENTI IMPLEMENTAZIONE

### **A) Step 5: Salute e Limitazioni** (NUOVO STEP)

**Posizione**: Dopo Step 4 (Personalizzazione), prima del Completion Screen

**Domande da aggiungere**:

1. **"Hai limitazioni fisiche o dolori cronici?"**
   - Checkbox multi-select:
     - Schiena/Lombare
     - Ginocchio
     - Spalla
     - Collo/Cervicale
     - Caviglia
     - Altro (campo testo)

2. **"Hai avuto infortuni recenti?"**
   - Radio: Sì / No
   - Se Sì: Campo testo per descrizione

3. **"Ci sono zone del corpo che preferisci evitare?"**
   - Checkbox multi-select:
     - Schiena
     - Ginocchia
     - Spalle
     - Collo
     - Nessuna

4. **"Hai condizioni mediche che influenzano l'allenamento?"**
   - Checkbox multi-select:
     - Ipertensione
     - Diabete
     - Asma
     - Problemi cardiaci
     - Altro (campo testo)

5. **"Hai ottenuto consenso medico per attività fisica?"**
   - Radio: Sì / No / Non necessario

6. **"Seleziona allergie o intolleranze alimentari"** (solo se `consigli_nutrizionali = true`)
   - Checkbox multi-select:
     - Glutine
     - Lattosio
     - Noci
     - Frutti di mare
     - Altro (campo testo)

### **B) Migrazione Database**

**File SQL suggerito**: `supabase/migrations/20250116000000_add_health_limitations.sql`

```sql
-- Aggiungi colonne salute e limitazioni
ALTER TABLE user_onboarding_responses
ADD COLUMN IF NOT EXISTS limitazioni_fisiche TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS dolori_cronici TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS infortuni_pregressi TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS zone_da_evitare TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS condizioni_mediche TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS ha_consenso_medico BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS medicazioni_attuali TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allergie_alimentari TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS intolleranze TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS dieta_seguita TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS anni_esperienza INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sport_praticati TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS esercizi_preferiti TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS esercizi_da_evitare TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS preferenza_intensita TEXT CHECK (preferenza_intensita IN ('leggera', 'moderata', 'intensa')),
ADD COLUMN IF NOT EXISTS preferenza_orario TEXT CHECK (preferenza_orario IN ('mattina', 'pomeriggio', 'sera')),
ADD COLUMN IF NOT EXISTS giorni_preferiti INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- Commenti documentazione
COMMENT ON COLUMN user_onboarding_responses.limitazioni_fisiche IS 'Zone del corpo con limitazioni fisiche';
COMMENT ON COLUMN user_onboarding_responses.dolori_cronici IS 'Dolori cronici dell''utente';
COMMENT ON COLUMN user_onboarding_responses.infortuni_pregressi IS 'Descrizione infortuni passati';
COMMENT ON COLUMN user_onboarding_responses.zone_da_evitare IS 'Zone del corpo da evitare negli esercizi';
COMMENT ON COLUMN user_onboarding_responses.condizioni_mediche IS 'Condizioni mediche che influenzano allenamento';
COMMENT ON COLUMN user_onboarding_responses.ha_consenso_medico IS 'Ha ottenuto consenso medico per attività fisica';
COMMENT ON COLUMN user_onboarding_responses.medicazioni_attuali IS 'Farmaci attualmente in uso';
COMMENT ON COLUMN user_onboarding_responses.allergie_alimentari IS 'Allergie alimentari (per consigli nutrizione)';
COMMENT ON COLUMN user_onboarding_responses.intolleranze IS 'Intolleranze alimentari';
COMMENT ON COLUMN user_onboarding_responses.dieta_seguita IS 'Tipo di dieta seguita (vegetariana/vegana/keto/etc.)';
COMMENT ON COLUMN user_onboarding_responses.anni_esperienza IS 'Anni totali di esperienza fitness';
COMMENT ON COLUMN user_onboarding_responses.sport_praticati IS 'Sport praticati in passato o attualmente';
COMMENT ON COLUMN user_onboarding_responses.esercizi_preferiti IS 'Esercizi che l''utente preferisce';
COMMENT ON COLUMN user_onboarding_responses.esercizi_da_evitare IS 'Esercizi che l''utente vuole evitare';
COMMENT ON COLUMN user_onboarding_responses.preferenza_intensita IS 'Intensità preferita degli allenamenti';
COMMENT ON COLUMN user_onboarding_responses.preferenza_orario IS 'Orario preferito per allenarsi';
COMMENT ON COLUMN user_onboarding_responses.giorni_preferiti IS 'Giorni della settimana preferiti (1=Lunedì, 7=Domenica)';
```

### **C) Aggiornamento TypeScript Types**

**File**: `src/services/onboardingService.ts`

```typescript
export interface OnboardingResponse {
  // ... campi esistenti ...
  
  // Nuovi campi salute
  limitazioni_fisiche?: string[] | null;
  dolori_cronici?: string[] | null;
  infortuni_pregressi?: string | null;
  zone_da_evitare?: string[] | null;
  condizioni_mediche?: string[] | null;
  ha_consenso_medico?: boolean | null;
  medicazioni_attuali?: string | null;
  
  // Nuovi campi nutrizione
  allergie_alimentari?: string[] | null;
  intolleranze?: string[] | null;
  dieta_seguita?: string | null;
  
  // Nuovi campi esperienza dettagliata
  anni_esperienza?: number | null;
  sport_praticati?: string[] | null;
  esercizi_preferiti?: string[] | null;
  esercizi_da_evitare?: string[] | null;
  
  // Nuovi campi preferenze
  preferenza_intensita?: 'leggera' | 'moderata' | 'intensa' | null;
  preferenza_orario?: 'mattina' | 'pomeriggio' | 'sera' | null;
  giorni_preferiti?: number[] | null;
}
```

---

## 📈 7️⃣ STATISTICHE DATI RACCOLTI

### **Campi Totali Attuali**: 15
- **Obiettivi**: 1 campo
- **Esperienza**: 2 campi
- **Preferenze**: 5 campi
- **Personalizzazione**: 5 campi
- **Metadata**: 2 campi

### **Campi Suggeriti da Aggiungere**: 17
- **Salute/Limitazioni**: 7 campi
- **Nutrizione**: 3 campi
- **Esperienza Dettagliata**: 4 campi
- **Preferenze Specifiche**: 3 campi

### **Totale Campi Dopo Implementazione**: 32

---

## ✅ 8️⃣ CONCLUSIONI

### **Campi Attualmente Raccolti**:
✅ **15 campi** coprono:
- Obiettivi allenamento
- Livello esperienza base
- Preferenze luogo/tempo/attrezzatura
- Dati personali base
- Interesse nutrizione

### **Campi Critici Mancanti**:
❌ **17 campi** mancanti per:
- Limitazioni fisiche/dolori/infortuni
- Condizioni mediche
- Allergie/intolleranze alimentari
- Esperienza dettagliata
- Preferenze specifiche

### **Raccomandazione**:
🔴 **PRIORITÀ ALTA**: Implementare Step 5 (Salute e Limitazioni) per:
1. **Sicurezza**: Evitare suggerimenti pericolosi per utenti con infortuni
2. **Personalizzazione**: Migliorare qualità consigli PrimeBot
3. **Compliance**: Rispettare limitazioni fisiche e mediche

---

**Report generato il**: 16 Gennaio 2025  
**Versione**: 1.0  
**Autore**: Analisi Automatica Sistema


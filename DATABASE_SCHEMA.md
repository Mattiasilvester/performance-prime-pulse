# 🗄️ SCHEMA DATABASE - PERFORMANCE PRIME PULSE

**Ultimo aggiornamento:** 23 Gennaio 2025  
**Database:** PostgreSQL (Supabase)

---

## 📋 INDICE

1. [Tipo Enum](#tipo-enum)
2. [Tabelle Principali](#tabelle-principali)
3. [Tabelle Professional System](#tabelle-professional-system)
4. [Tabelle Clienti e Progetti](#tabelle-clienti-e-progetti)
5. [Tabelle Impostazioni Professionista](#tabelle-impostazioni-professionista)
6. [Tabelle Workout System](#tabelle-workout-system)
7. [Tabelle Admin System](#tabelle-admin-system)
8. [Tabelle PrimeBot](#tabelle-primebot)
9. [Indici](#indici)
10. [Trigger e Funzioni](#trigger-e-funzioni)
11. [RLS Policies](#rls-policies)

---

## 📊 TIPO ENUM

### `user_category`
```sql
ENUM ('amatori', 'atleti', 'agonisti')
```

### `professional_category`
```sql
ENUM ('fisioterapista', 'nutrizionista', 'mental_coach', 'osteopata', 'pt')
```

---

## 📋 TABELLE PRINCIPALI

**Nota:** La tabella `users` è stata rimossa (migrazione cleanup 21 Gennaio 2025). Il sistema ora usa `auth.users` (Supabase Auth) → `profiles` (1:1).

---

### `professionals`
Tabella professionisti dell'applicazione.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `first_name` | VARCHAR(100) | NO | - | Nome |
| `last_name` | VARCHAR(100) | NO | - | Cognome |
| `company_name` | VARCHAR(255) | NO | - | Nome azienda |
| `birth_place` | VARCHAR(255) | NO | - | Luogo di nascita |
| `birth_date` | DATE | NO | - | Data di nascita |
| `vat_number` | VARCHAR(50) | NO | - | Partita IVA |
| `vat_address` | TEXT | NO | - | Indirizzo fiscale |
| `vat_postal_code` | VARCHAR(20) | NO | - | CAP fiscale |
| `vat_city` | VARCHAR(100) | NO | - | Città fiscale |
| `sdi_code` | VARCHAR(50) | YES | NULL | Codice SDI |
| `email` | VARCHAR(255) | NO | - | Email (UNIQUE) |
| `pec_email` | VARCHAR(255) | YES | NULL | Email PEC |
| `phone` | VARCHAR(30) | NO | - | Telefono |
| `office_phone` | VARCHAR(30) | YES | NULL | Telefono ufficio |
| `payment_method` | TEXT | YES | NULL | Metodo pagamento |
| `category` | `professional_category` | NO | - | Categoria professionista |
| `user_id` | UUID | YES | NULL | **FK → auth.users(id)** |
| `approval_status` | VARCHAR(20) | NO | `'pending'` | Stato approvazione: 'pending', 'approved', 'rejected' |
| `approved_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | Data approvazione |
| `is_partner` | BOOLEAN | NO | `false` | Se è partner attivo |
| `bio` | TEXT | YES | NULL | Biografia |
| `foto_url` | TEXT | YES | NULL | URL foto profilo |
| `specializzazioni` | TEXT[] | YES | NULL | Array specializzazioni |
| `zona` | VARCHAR(100) | YES | NULL | Zona operativa |
| `modalita` | VARCHAR(20) | NO | `'entrambi'` | Modalità: 'online', 'presenza', 'entrambi' |
| `prezzo_fascia` | VARCHAR(10) | NO | `'€€'` | Fascia prezzo: '€', '€€', '€€€' |
| `prezzo_seduta` | INTEGER | YES | NULL | Prezzo seduta (nuovo campo) |
| `titolo_studio` | TEXT | YES | NULL | Titolo di studio |
| `rating` | DECIMAL(2,1) | NO | `0` | Rating medio (0-5) |
| `reviews_count` | INT | NO | `0` | Numero recensioni |
| `attivo` | BOOLEAN | NO | `true` | Se visibile nella ricerca pubblica |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data ultimo aggiornamento |

**Indici:**
- `idx_professionals_email` su `email`
- `idx_professionals_category` su `category`
- `idx_professionals_user_id` su `user_id`
- `idx_professionals_approval_status` su `approval_status`
- `idx_professionals_zona` su `zona`
- `idx_professionals_attivo` su `attivo`
- `idx_professionals_rating` su `rating` (DESC)

**RLS:** Abilitata

---

## 🏢 TABELLE PROFESSIONAL SYSTEM

### `professional_applications`
Richieste di registrazione professionisti in attesa di approvazione.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `first_name` | VARCHAR(100) | NO | - | Nome |
| `last_name` | VARCHAR(100) | NO | - | Cognome |
| `email` | VARCHAR(255) | NO | - | Email (UNIQUE) |
| `phone` | VARCHAR(30) | NO | - | Telefono |
| `category` | VARCHAR(50) | NO | - | Categoria (CHECK) |
| `city` | VARCHAR(100) | NO | - | Città |
| `bio` | TEXT | YES | NULL | Biografia |
| `specializations` | TEXT[] | YES | NULL | Specializzazioni |
| `company_name` | VARCHAR(255) | YES | NULL | Nome azienda |
| `vat_number` | VARCHAR(50) | YES | NULL | Partita IVA |
| `status` | VARCHAR(20) | NO | `'pending'` | Stato: 'pending', 'approved', 'rejected' |
| `rejection_reason` | TEXT | YES | NULL | Motivo rifiuto |
| `submitted_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data invio |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | Data revisione |
| `reviewed_by` | UUID | YES | NULL | **FK → auth.users(id)** |
| `professional_id` | UUID | YES | NULL | **FK → professionals(id)** |

**Indici:**
- `idx_applications_status` su `status`
- `idx_applications_email` su `email`
- `idx_applications_submitted` su `submitted_at` (DESC)
- `idx_applications_professional_id` su `professional_id`

**RLS:** Abilitata

---

### `professional_availability`
Disponibilità oraria settimanale dei professionisti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `day_of_week` | INT | NO | - | Giorno: 0=Domenica, 1=Lunedì, ..., 6=Sabato (CHECK 0-6) |
| `start_time` | TIME | NO | - | Ora inizio |
| `end_time` | TIME | NO | - | Ora fine |
| `is_available` | BOOLEAN | NO | `true` | Se disponibile |

**Constraints:**
- `UNIQUE(professional_id, day_of_week, start_time)`
- `CHECK (end_time > start_time)`

**Indici:**
- `idx_availability_professional` su `professional_id`
- `idx_availability_day` su `day_of_week`
- `idx_availability_active` su `is_available` (WHERE is_available = true)

**RLS:** Abilitata

---

### `professional_blocked_periods`
Periodi bloccati dai professionisti (ferie, indisponibilità, ecc.).

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `start_date` | DATE | NO | - | Data inizio blocco |
| `end_date` | DATE | NO | - | Data fine blocco |
| `block_type` | VARCHAR(10) | NO | - | Tipo blocco: 'day' (singolo giorno), 'week' (settimana intera) |
| `reason` | VARCHAR(255) | YES | NULL | Motivo opzionale del blocco (es. Ferie, Malattia) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Data ultimo aggiornamento |

**Constraints:**
- `CHECK (block_type IN ('day', 'week'))`
- `CHECK (end_date >= start_date)`

**Indici:**
- `idx_blocked_periods_professional` su `professional_id`
- `idx_blocked_periods_dates` su `(professional_id, start_date, end_date)`
- `idx_blocked_periods_type` su `block_type`

**RLS:** Abilitata

**Funzioni Helper:**
- `is_date_blocked(p_professional_id UUID, p_date DATE)` - Verifica se una data è bloccata
- `get_blocked_dates_in_range(p_professional_id UUID, p_start DATE, p_end DATE)` - Ottiene tutte le date bloccate in un range

---

### `professional_services`
Servizi offerti dai professionisti (Personal Training, Consulenza, etc.).

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `name` | VARCHAR(200) | NO | - | Nome servizio |
| `description` | TEXT | YES | NULL | Descrizione servizio |
| `duration_minutes` | INTEGER | NO | `60` | Durata in minuti (CHECK > 0) |
| `price` | DECIMAL(10,2) | NO | - | Prezzo servizio (CHECK >= 0) |
| `is_online` | BOOLEAN | NO | `false` | Se disponibile online |
| `is_in_person` | BOOLEAN | NO | `true` | Se disponibile in presenza |
| `is_active` | BOOLEAN | NO | `true` | Se servizio è attivo |
| `color` | VARCHAR(7) | NO | `'#EEBA2B'` | Colore per visualizzazione calendario |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Data ultimo aggiornamento |

**Constraints:**
- `UNIQUE(professional_id, name)` - Nome servizio unico per professionista

**Indici:**
- `idx_professional_services_professional` su `professional_id`
- `idx_professional_services_active` su `(professional_id, is_active)` WHERE is_active = TRUE

**RLS:** Abilitata

---

### `bookings`
Prenotazioni appuntamenti tra utenti e professionisti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `booking_date` | DATE | NO | - | Data appuntamento |
| `booking_time` | TIME | NO | - | Ora appuntamento |
| `duration_minutes` | INT | NO | `60` | Durata in minuti (CHECK > 0) |
| `status` | VARCHAR(20) | NO | `'pending'` | Stato: 'pending', 'confirmed', 'cancelled', 'completed', 'no_show' |
| `notes` | TEXT | YES | NULL | Note libere. Per prenotazioni manuali, può contenere JSON con original_notes. Le colonne client_name, client_email, client_phone, service_type, color ora sono separate. |
| `cancellation_reason` | TEXT | YES | NULL | Motivo cancellazione |
| `modalita` | VARCHAR(20) | NO | `'presenza'` | Modalità: 'online', 'presenza' |
| `client_name` | VARCHAR(200) | YES | NULL | Nome cliente per prenotazioni manuali (estratto da notes JSON o inserito direttamente) |
| `client_email` | VARCHAR(255) | YES | NULL | Email cliente per prenotazioni manuali (estratto da notes JSON o inserito direttamente) |
| `client_phone` | VARCHAR(30) | YES | NULL | Telefono cliente per prenotazioni manuali (estratto da notes JSON o inserito direttamente) |
| `service_id` | UUID | YES | NULL | **FK → professional_services(id)** - Riferimento al servizio prenotato |
| `service_type` | VARCHAR(100) | YES | NULL | Tipo servizio (es: Personal Training, Consulenza) - retrocompatibilità, preferire service_id |
| `color` | VARCHAR(7) | YES | `'#EEBA2B'` | Colore personalizzato per visualizzazione calendario |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data ultimo aggiornamento |
| `confirmed_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | Data conferma |
| `cancelled_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | Data cancellazione |

**Indici:**
- `idx_bookings_professional` su `professional_id`
- `idx_bookings_user` su `user_id`
- `idx_bookings_date` su `booking_date`
- `idx_bookings_status` su `status`
- `idx_bookings_date_time` su `booking_date, booking_time`
- `idx_bookings_unique_slot` UNIQUE su `(professional_id, booking_date, booking_time)` WHERE status NOT IN ('cancelled')
- `idx_bookings_client_name` su `client_name` (WHERE client_name IS NOT NULL)
- `idx_bookings_client_email` su `client_email` (WHERE client_email IS NOT NULL)
- `idx_bookings_service_type` su `service_type` (WHERE service_type IS NOT NULL)

**RLS:** Abilitata

---

### `professional_clients`
Relazione tra professionisti e loro clienti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `status` | VARCHAR(20) | NO | `'lead'` | Stato: 'lead', 'active', 'inactive', 'completed' |
| `first_contact_date` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data primo contatto |
| `notes` | TEXT | YES | NULL | Note |
| `total_sessions` | INT | NO | `0` | Sessioni totali (CHECK >= 0) |
| `last_session_date` | TIMESTAMP WITH TIME ZONE | YES | NULL | Data ultima sessione |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data ultimo aggiornamento |

**Constraints:**
- `UNIQUE(professional_id, user_id)`

**Indici:**
- `idx_prof_clients_professional` su `professional_id`
- `idx_prof_clients_user` su `user_id`
- `idx_prof_clients_status` su `status`

**RLS:** Abilitata

---

## 👥 TABELLE CLIENTI E PROGETTI

### `clients`
Clienti dei professionisti (gestione separata da auth.users).

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `user_id` | UUID | YES | NULL | **FK → auth.users(id)** (opzionale) |
| `full_name` | TEXT | NO | - | Nome completo |
| `email` | TEXT | YES | NULL | Email |
| `phone` | TEXT | YES | NULL | Telefono |
| `notes` | TEXT | YES | NULL | Note |
| `is_pp_subscriber` | BOOLEAN | NO | `false` | Se abbonato Performance Prime |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data ultimo aggiornamento |

**Indici:**
- `idx_clients_professional` su `professional_id`
- `idx_clients_name` su `full_name`
- `idx_clients_email` su `email`
- `idx_clients_user_id` su `user_id`

**RLS:** Abilitata

---

### `projects`
Progetti di allenamento dei clienti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `client_id` | UUID | NO | - | **FK → clients(id)** |
| `name` | TEXT | NO | - | Nome progetto |
| `objective` | TEXT | YES | NULL | Obiettivo |
| `status` | TEXT | NO | `'active'` | Stato: 'active', 'paused', 'completed' |
| `start_date` | DATE | NO | `CURRENT_DATE` | Data inizio |
| `end_date` | DATE | YES | NULL | Data fine |
| `notes` | TEXT | YES | NULL | Note |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data ultimo aggiornamento |

**Indici:**
- `idx_projects_professional` su `professional_id`
- `idx_projects_client` su `client_id`
- `idx_projects_status` su `status`

**RLS:** Abilitata

---

## ⚙️ TABELLE IMPOSTAZIONI PROFESSIONISTA

### `professional_settings`
Impostazioni complete del professionista (1:1 con professionals).

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** (UNIQUE) |

**Notifiche:**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `notify_new_booking` | BOOLEAN | NO | `true` |
| `notify_booking_cancelled` | BOOLEAN | NO | `true` |
| `notify_booking_reminder` | BOOLEAN | NO | `true` |
| `notify_messages` | BOOLEAN | NO | `true` |
| `notify_reviews` | BOOLEAN | NO | `false` |
| `notify_weekly_summary` | BOOLEAN | NO | `true` |

**Privacy:**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `profile_public` | BOOLEAN | NO | `true` |
| `show_reviews` | BOOLEAN | NO | `true` |
| `show_price` | BOOLEAN | NO | `true` |
| `allow_direct_contact` | BOOLEAN | NO | `true` |

**Pagamenti (Stripe):**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `stripe_account_id` | TEXT | YES | NULL |
| `stripe_connect_enabled` | BOOLEAN | NO | `false` |
| `stripe_payout_enabled` | BOOLEAN | NO | `false` |
| `next_payout_date` | DATE | YES | NULL |

**Area di Copertura:**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `coverage_address` | TEXT | YES | NULL |
| `coverage_city` | VARCHAR(100) | YES | NULL |
| `coverage_postal_code` | VARCHAR(20) | YES | NULL |
| `coverage_country` | VARCHAR(100) | NO | `'Italia'` |
| `coverage_latitude` | DECIMAL(10, 8) | YES | NULL |
| `coverage_longitude` | DECIMAL(11, 8) | YES | NULL |
| `coverage_radius_km` | INT | NO | `10` (CHECK >= 0) |

**Politiche Cancellazione:**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `cancellation_min_hours` | INT | NO | `24` (CHECK >= 0) |
| `cancellation_penalty_percent` | DECIMAL(5, 2) | NO | `0` (CHECK 0-100) |
| `no_show_penalty_percent` | DECIMAL(5, 2) | NO | `50` (CHECK 0-100) |

**Link Social:**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `instagram_url` | TEXT | YES | NULL |
| `linkedin_url` | TEXT | YES | NULL |
| `youtube_url` | TEXT | YES | NULL |
| `tiktok_url` | TEXT | YES | NULL |
| `facebook_url` | TEXT | YES | NULL |
| `website_url` | TEXT | YES | NULL |

**Timestamps:**
| Colonna | Tipo | Null | Default |
|---------|------|------|---------|
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` |

**Constraints:**
- `UNIQUE(professional_id)`

**Indici:**
- `idx_professional_settings_professional` su `professional_id`

**RLS:** Abilitata

---

### `subscription_invoices`
Fatture abbonamenti PrimePro per professionisti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `stripe_invoice_id` | VARCHAR(255) | YES | NULL | Stripe Invoice ID |
| `invoice_number` | VARCHAR(50) | YES | NULL | Numero fattura |
| `amount` | DECIMAL(10,2) | NO | - | Importo fattura |
| `currency` | VARCHAR(3) | NO | `'EUR'` | Valuta |
| `status` | VARCHAR(20) | NO | `'paid'` | Stato: 'draft', 'open', 'paid', 'void', 'uncollectible' |
| `description` | TEXT | YES | NULL | Descrizione fattura |
| `invoice_pdf_url` | TEXT | YES | NULL | URL PDF fattura |
| `invoice_date` | DATE | NO | - | Data fattura |
| `paid_at` | TIMESTAMPTZ | YES | NULL | Data pagamento |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Data creazione |

**Indici:**
- `idx_invoices_professional` su `professional_id`
- `idx_invoices_date` su `invoice_date` (DESC)
- `idx_invoices_status` su `status`

**RLS:** Abilitata

---

### `professional_languages`
Lingue parlate dal professionista con livello di competenza (1:N con professionals).

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `professional_id` | UUID | NO | - | **FK → professionals(id)** |
| `language_code` | VARCHAR(10) | NO | - | Codice lingua ISO (es: 'it', 'en') |
| `language_name` | VARCHAR(50) | NO | - | Nome lingua (es: 'Italiano') |
| `proficiency_level` | VARCHAR(20) | NO | - | Livello: 'madrelingua', 'fluente', 'intermedio', 'base' |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

**Constraints:**
- `UNIQUE(professional_id, language_code)`

**Indici:**
- `idx_professional_languages_professional` su `professional_id`
- `idx_professional_languages_code` su `language_code`

**RLS:** Abilitata

---

## 💪 TABELLE WORKOUT SYSTEM

### `custom_workouts`
Allenamenti personalizzati creati dagli utenti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `name` | TEXT | NO | - | Nome allenamento |
| `exercises` | JSONB | NO | - | Esercizi (JSON) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

---

### `user_workout_stats`
Statistiche allenamenti utente.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `date` | DATE | NO | - | Data |
| `workout_count` | INT | NO | `0` | Numero allenamenti |
| `total_minutes` | INT | NO | `0` | Minuti totali |

---

### `monthly_workout_stats`
Statistiche mensili allenamenti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `month` | DATE | NO | - | Mese |
| `workout_count` | INT | NO | `0` | Numero allenamenti |

---

### `workout_diary`
Diario allenamenti utente.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `date` | DATE | NO | - | Data allenamento |
| `workout_data` | JSONB | NO | - | Dati allenamento (JSON) |

---

### `workout_attachments`
Allegati agli allenamenti.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `workout_id` | UUID | NO | - | ID allenamento |
| `file_url` | TEXT | NO | - | URL file |
| `file_type` | VARCHAR(50) | NO | - | Tipo file |

---

### `user_objectives`
Obiettivi utente.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `objective` | TEXT | NO | - | Obiettivo |
| `target_date` | DATE | YES | NULL | Data obiettivo |

---

### `notes`
Note utente.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `content` | TEXT | NO | - | Contenuto nota |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

---

### `user_onboarding_responses`
Risposte onboarding utente.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `responses` | JSONB | NO | - | Risposte (JSON) |

---

### `health_disclaimer_acknowledgments`
Acknowledgment disclaimer salute.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `acknowledged_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data acknowledgment |

---

### `waiting_list`
Lista d'attesa.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `email` | VARCHAR(255) | NO | - | Email |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

---

## 🔐 TABELLE ADMIN SYSTEM

### `admin_audit_logs`
Log audit amministrativi.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `admin_user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `action` | TEXT | NO | - | Azione eseguita |
| `target_type` | TEXT | YES | NULL | Tipo target |
| `target_id` | UUID | YES | NULL | ID target |
| `details` | JSONB | YES | NULL | Dettagli (JSON) |
| `ip_address` | TEXT | YES | NULL | Indirizzo IP |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

---

### `admin_sessions`
Sessioni admin.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `admin_user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `token` | TEXT | NO | - | Token sessione |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NO | - | Data scadenza |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

---

### `admin_settings`
Impostazioni sistema admin.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `key` | TEXT | NO | - | Chiave (UNIQUE) |
| `value` | JSONB | NO | - | Valore (JSON) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data ultimo aggiornamento |

---

### `escalations`
Escalation.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `issue_type` | TEXT | NO | - | Tipo problema |
| `description` | TEXT | NO | - | Descrizione |
| `status` | TEXT | NO | `'open'` | Stato |

---

## 🤖 TABELLE PRIMEBOT

### `primebot_interactions`
Interazioni con PrimeBot.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `message` | TEXT | NO | - | Messaggio |
| `response` | TEXT | NO | - | Risposta |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | Data creazione |

---

### `primebot_preferences`
Preferenze PrimeBot utente.

| Colonna | Tipo | Null | Default | Descrizione |
|---------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | **FK → auth.users(id)** |
| `preferences` | JSONB | NO | - | Preferenze (JSON) |

---

## 🔄 TRIGGER E FUNZIONI

### `update_updated_at_column()`
Funzione trigger per aggiornare automaticamente il campo `updated_at`.

**Tabelle che utilizzano questo trigger:**
- `professionals`
- `clients`
- `projects`
- `bookings`
- `professional_clients`
- `professional_settings`
- `professional_blocked_periods`
- `professional_services`

---

## 🔒 RLS POLICIES

### `users`
- **Users can view their own data**: SELECT usando `id = auth.uid()`
- **Users can update their own data**: UPDATE usando `id = auth.uid()`

### `professionals`
- **Public can view active approved professionals**: SELECT per professionisti attivi e approvati
- **Professional can view own profile**: SELECT usando `user_id = auth.uid()`
- **Professional can update own profile**: UPDATE usando `user_id = auth.uid()`

### `professional_applications`
- **Users can view own application**: SELECT usando email
- **Users can insert own application**: INSERT permesso a tutti

### `professional_availability`
- **Professional manages own availability**: ALL usando `professional_id` e `user_id`
- **Public can view availability**: SELECT permesso a tutti

### `bookings`
- **User can manage own bookings**: ALL usando `user_id = auth.uid()`
- **Professional can view own bookings**: SELECT usando `professional_id` e `user_id`
- **Professional can update own bookings**: UPDATE usando `professional_id` e `user_id`

### `professional_clients`
- **Professional manages own clients**: ALL usando `professional_id` e `user_id`
- **User can view own client relationships**: SELECT usando `user_id = auth.uid()`

### `clients`
- **Professionals can manage their clients**: ALL usando `professional_id` e `user_id`

### `projects`
- **Professionals can manage their projects**: ALL usando `professional_id` e `user_id`

### `professional_settings`
- **Professional manages own settings**: ALL usando `professional_id` e `user_id`
- **Public can view public settings**: SELECT per profili pubblici

### `professional_languages`
- **Professional manages own languages**: ALL usando `professional_id` e `user_id`
- **Public can view public languages**: SELECT per profili pubblici

### `professional_blocked_periods`
- **Professionals can view own blocked periods**: SELECT usando `professional_id` e `user_id`
- **Professionals can insert own blocked periods**: INSERT usando `professional_id` e `user_id`
- **Professionals can update own blocked periods**: UPDATE usando `professional_id` e `user_id`
- **Professionals can delete own blocked periods**: DELETE usando `professional_id` e `user_id`
- **Users can view blocked periods for availability check**: SELECT permesso a tutti (per escludere giorni bloccati durante prenotazione)

### `professional_services`
- **Professionals can manage own services**: ALL usando `professional_id` e `user_id`
- **Public can view active services**: SELECT per servizi attivi di professionisti pubblici

### `subscription_invoices`
- **Professionals can view own invoices**: SELECT usando `professional_id` e `user_id`

---

## 📝 NOTE IMPORTANTI

1. **Autenticazione**: Il sistema usa Supabase Auth (`auth.users`). La colonna `professionals.user_id` collega il professionista al suo account Supabase. La tabella `users` è stata rimossa (cleanup 21 Gennaio 2025).

2. **Cleanup Database**: I campi deprecati `password_hash`, `password_salt`, `reset_token`, `reset_requested_at` in `professionals` sono stati rimossi (cleanup 21 Gennaio 2025). L'autenticazione avviene esclusivamente tramite Supabase Auth.

3. **Bookings - Colonne Separate**: Il campo `notes` in `bookings` può ancora contenere JSON per retrocompatibilità, ma ora esistono colonne separate (`client_name`, `client_email`, `client_phone`, `service_type`, `color`, `service_id`) per migliorare query e indici. La migrazione è stata completata il 21 Gennaio 2025.

4. **Professional Services**: I professionisti possono gestire servizi multipli tramite la tabella `professional_services`. Le prenotazioni ora possono riferirsi a un servizio specifico tramite `service_id`.

5. **Blocked Periods**: I professionisti possono bloccare giorni o settimane tramite `professional_blocked_periods`. Questi periodi vengono automaticamente esclusi quando gli utenti cercano disponibilità.

6. **RLS Abilitata**: Tutte le tabelle hanno Row Level Security abilitata per sicurezza.

7. **Indici**: Gli indici sono stati creati per ottimizzare le query più frequenti.

---

**Documento generato il:** 23 Gennaio 2025  
**Versione Database:** 2.0


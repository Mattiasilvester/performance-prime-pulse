# FASE 2A: VERIFICA ESISTENZA TABELLE IN SUPABASE
**Data:** 29 Gennaio 2026  
**Obiettivo:** Raccolta dati per rigenerazione types.ts. **Nessuna modifica applicata.**

---

## 1. LISTA TABELLE USATE NEL CODICE (con conteggio utilizzi)

Estratta da `grep -roh "\.from(['\"][^'\"]*['\"]" src/` + normalizzazione:

| # | Tabella | Utilizzi |
|---|---------|----------|
| 1 | professionals | 36 |
| 2 | bookings | 30 |
| 3 | user_onboarding_responses | 20 |
| 4 | profiles | 20 |
| 5 | custom_workouts | 17 |
| 6 | workout_plans | 16 |
| 7 | professional_settings | 16 |
| 8 | user_workout_stats | 14 |
| 9 | projects | 12 |
| 10 | professional_services | 11 |
| 11 | clients | 11 |
| 12 | workout-files | 8 *(bucket storage, non tabella)* |
| 13 | reviews | 8 |
| 14 | workout_diary | 7 |
| 15 | professional_subscriptions | 7 |
| 16 | professional_blocked_periods | 7 |
| 17 | professional_availability | 7 |
| 18 | professional_notifications | 6 |
| 19 | workout_attachments | 5 |
| 20 | notes | 5 |
| 21 | avatars | 4 |
| 22 | user_objectives | 3 |
| 23 | scheduled_notifications | 3 |
| 24 | professional_languages | 3 |
| 25 | primebot_interactions | 3 |
| 26 | openai_usage_logs | 3 |
| 27 | onboarding_preferenze | 3 |
| 28 | push_subscriptions | 2 |
| 29 | onboarding_obiettivo_principale | 2 |
| 30 | onboarding_esperienza | 2 |
| 31 | admin_sessions | 2 |
| 32 | admin_audit_logs | 2 |
| 33 | subscription_invoices | 1 |
| 34 | primebot_preferences | 1 |
| 35 | onboarding_personalizzazione | 1 |
| 36 | onboarding_analytics | 1 |
| 37 | notifications | 1 *(commentato in useNotifications)* |
| 38 | health_disclaimer_acknowledgments | 1 |

**Totale:** 38 nomi (37 tabelle + 1 bucket `workout-files`).

---

## 2. LISTA TABELLE IN types.ts ATTUALE

Estratte da `grep -E "^\s+[a-z_]+:" src/integrations/supabase/types.ts` (sezione Tables + Views):

**Tables:**
- admin_audit_logs
- admin_sessions
- admin_settings
- custom_workouts
- monthly_workout_stats
- notes
- openai_usage_logs
- professionals
- profiles
- primebot_interactions
- primebot_preferences
- user_objectives
- user_workout_stats
- waiting_list

**Views:**
- users_public

**Functions (tipi):**
- validate_password_strength

*(La tabella `users` è stata rimossa nella Fase 1.)*

---

## 3. GAP ANALYSIS: TABELLE USATE MA NON IN types.ts

Tabelle referenziate nel codice con `.from('...')` che **non** compaiono nella sezione Tables di types.ts:

| Tabella | Utilizzi nel codice |
|---------|----------------------|
| clients | 11 |
| bookings | 30 |
| projects | 12 |
| professional_services | 11 |
| professional_settings | 16 |
| professional_availability | 7 |
| professional_subscriptions | 7 |
| professional_notifications | 6 |
| professional_languages | 3 |
| professional_blocked_periods | 7 |
| avatars | 4 |
| subscription_invoices | 1 |
| scheduled_notifications | 3 |
| reviews | 8 |
| workout_diary | 7 |
| workout_plans | 16 |
| user_onboarding_responses | 20 |
| onboarding_analytics | 1 |
| onboarding_obiettivo_principale | 2 |
| onboarding_esperienza | 2 |
| onboarding_preferenze | 3 |
| onboarding_personalizzazione | 1 |
| health_disclaimer_acknowledgments | 1 |
| workout_attachments | 5 |
| push_subscriptions | 2 |

**Nota:** `workout-files` è un bucket storage, non una tabella; `notifications` è usato solo in un commento.

---

## 4. SCHEMA professionals: CODICE vs types.ts vs MIGRAZIONI

### 4.1 Campi usati nel codice (da `professional.xxx` / oggetti professional)

Estratti dai file (Professionals.tsx, ProfessionalDetail.tsx, ServiziTariffePage.tsx, professionalsService.ts, subscriptionService.ts, ecc.):

- **id**
- **first_name**, **last_name**
- **email**
- **category**
- **zona**
- **bio**
- **foto_url**
- **modalita**
- **prezzo_seduta**, **prezzo_fascia**
- **rating**, **reviews_count**
- **specializzazioni** (array)
- **is_partner**
- **services** (in alcuni contesti lista servizi)
- **professional_id** (usato in query su altre tabelle, non come campo di `professionals`)

### 4.2 Colonne da migrazioni (INSERT trigger)

Da `20250129140000_professionals_trigger_auth_signup.sql`:

- user_id
- first_name, last_name
- email, phone
- category
- zona, bio
- company_name, titolo_studio
- specializzazioni (array)
- approval_status, approved_at
- attivo, is_partner
- modalita
- prezzo_seduta, prezzo_fascia
- rating, reviews_count
- birth_date, birth_place
- vat_number, vat_address, vat_postal_code, vat_city

*(La migrazione RLS usa anche la colonna `user_id` per WITH CHECK / USING.)*

### 4.3 Schema `professionals` attuale in types.ts (Row)

- birth_date, birth_place
- category
- company_name
- created_at
- email
- first_name, last_name
- **id**
- office_phone
- **password_hash**, **password_salt**
- payment_method
- pec_email
- phone
- reset_requested_at, reset_token
- sdi_code
- updated_at
- vat_address, vat_city, vat_number, vat_postal_code

### 4.4 Confronto

| Origine | Presente in types? | Presente in migrazioni/codice? |
|---------|--------------------|---------------------------------|
| **user_id** | No | Sì (migrazioni RLS + INSERT) |
| **zona** | No | Sì (codice + INSERT) |
| **bio** | No | Sì (codice + INSERT) |
| **titolo_studio** | No | Sì (INSERT) |
| **specializzazioni** | No | Sì (codice + INSERT) |
| **approval_status**, **approved_at** | No | Sì (INSERT) |
| **attivo** | No | Sì (INSERT) |
| **is_partner** | No | Sì (codice + INSERT) |
| **modalita** | No | Sì (codice + INSERT) |
| **prezzo_seduta**, **prezzo_fascia** | No | Sì (codice + INSERT) |
| **rating**, **reviews_count** | No | Sì (codice + INSERT) |
| **foto_url** | No | Sì (codice) |
| password_hash, password_salt | Sì | No (deprecati, NOTE.md) |
| reset_* | Sì | No (deprecati) |
| office_phone, pec_email, sdi_code | Sì | No (non nel trigger) |

**Conclusione:** Lo schema `professionals` in types.ts non riflette la tabella reale: mancano molti campi usati da codice e migrazioni e include campi deprecati (password_*, reset_*).

---

## 5. SUPABASE CLI: POSSIBILITÀ DI GENERARE TYPES AUTOMATICAMENTE

| Check | Risultato |
|-------|-----------|
| **Supabase CLI** | Installato: `npx supabase --version` → **2.72.7** |
| **Project ref** | Presente: `supabase/.temp/project-ref` → **kfxoyucatvvcgmqalxsg** |
| **Credenziali .env** | Presenti: `.env` contiene `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |
| **.env.local** | Non cercato (grep solo .env) |

**Comando per generare types (richiede rete):**
```bash
npx supabase gen types typescript --project-id kfxoyucatvvcgmqalxsg > src/integrations/supabase/types.ts
```

**Nota:** La generazione types da Supabase CLI si appoggia all’API del progetto (e quindi alla rete). Se il progetto è linkato (`supabase link`) si può usare anche:
```bash
npx supabase gen types typescript
```
e redirigere l’output in `src/integrations/supabase/types.ts`.

**Conclusione:** Sì, è possibile generare i types automaticamente una volta in ambiente con rete; il project-id è **kfxoyucatvvcgmqalxsg**.

---

## 6. RIGHE MIGRAZIONI CHE MENZIONANO `professionals`

- **20250129120000_professionals_rls_insert_select_update.sql:**  
  RLS su `professionals` (ALTER TABLE, CREATE POLICY) con colonna **user_id**.
- **20250129140000_professionals_trigger_auth_signup.sql:**  
  INSERT in `public.professionals` con le colonne elencate in sezione 4.2.

Nessuna migrazione nella cartella corrente contiene `CREATE TABLE professionals`; la tabella è presupposta esistente.

---

Fine report FASE 2A. Nessuna modifica è stata applicata al codice.

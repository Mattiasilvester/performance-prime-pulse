# RACCOLTA INFORMAZIONI PRE-FIX - AUDIT CRITICITÀ
**Data:** 29 Gennaio 2026  
**Obiettivo:** Raccolta dati per fix criticità audit. **Nessuna modifica applicata.**

---

## 1. EDGE FUNCTIONS MANCANTI

Per ognuna delle 5 funzioni referenziate in `config.toml` ma **senza cartella** in `supabase/functions/`:

### 1.1 admin-stats

| Campo | Dettaglio |
|-------|-----------|
| **Usata nel codice** | Sì |
| **File** | `src/pages/admin/SuperAdminDashboard.tsx` |
| **Riga** | 17 (URL), 107 (log risposta) |
| **Come viene chiamata** | `fetch()` diretto (non `supabase.functions.invoke`) |
| **URL** | `${VITE_SUPABASE_URL}/functions/v1/admin-stats?includeWorkouts=true` |
| **Metodo** | POST |
| **Headers** | `Authorization: Bearer ${session.access_token}`, `Content-Type: application/json` |
| **Risposta attesa** | JSON con oggetto `AdminStats`: `totalUsers`, `payingUsers`, `activeToday`, `revenue`, `churnRate`, `conversionRate`, `activeUsers`, `inactiveUsers`, `totalWorkouts`, `monthlyWorkouts`, `totalPT`, `professionals`, `activeObjectives`, `totalNotes`, `growth`, `engagement`, `newUsersThisMonth`, `activationD0Rate`, `activationRate`, `retentionD7`, `weeklyGrowth`, `newUsersLast7Days`, `workoutAnalytics` (opzionali). Il client normalizza con fallback a 0. |

---

### 1.2 admin-users

| Campo | Dettaglio |
|-------|-----------|
| **Usata nel codice** | Sì |
| **File** | `src/lib/adminApi.ts` |
| **Righe** | 89 (GET lista), 115 (PATCH), 135 (DELETE) |
| **Come viene chiamata** | `fetch()` diretto (baseUrl = `${VITE_SUPABASE_URL}/functions/v1`) |
| **Chiamate** | GET `/admin-users?limit=&offset=&search=&status=`, PATCH `/admin-users/:userId`, DELETE `/admin-users/:userId` |
| **Headers** | Stessi di admin-stats (Bearer + Content-Type) |
| **Risposta attesa** | GET: `{ users, count, limit, offset }` con `users` array mappato a `AdminUser`. PATCH: `{ user }`. DELETE: nessun body. In caso errore: `{ error: string }`. |

Nota: In `SuperAdminDashboard.tsx` riga 224 c’è un TODO che menziona “admin-users, admin-analytics” per migrazione elenco utenti.

---

### 1.3 admin-auth-validate

| Campo | Dettaglio |
|-------|-----------|
| **Usata nel codice** | Sì |
| **File** | `src/hooks/useAdminAuthBypass.tsx` |
| **Riga** | 109 |
| **Come viene chiamata** | `fetch()` diretto |
| **URL** | `${VITE_SUPABASE_URL}/functions/v1/admin-auth-validate` |
| **Metodo** | POST |
| **Body** | `JSON.stringify({ secretKey: credentials.secretKey })` |
| **Risposta attesa** | JSON con `{ valid: boolean }`. Se `!valid` o non ok → errore login SuperAdmin. |

---

### 1.4 n8n-webhook-proxy

| Campo | Dettaglio |
|-------|-----------|
| **Usata nel codice** | Sì |
| **File** | `src/services/emailService.ts` |
| **Righe** | 33 (welcome), 67 (passwordReset), 97 (verification) |
| **Come viene chiamata** | `fetch()` diretto, 3 URL con query `?type=welcome` | `?type=passwordReset` | `?type=verification` |
| **Metodo** | POST |
| **Body** | welcome: `{ user_id, name, email }`; passwordReset/verification: `{ email, reset_link }` o `{ email, verification_link }` |
| **Risposta attesa** | Qualsiasi 2xx; in caso non ok viene lanciato errore ma la registrazione/invio non viene bloccata (gestione “non bloccante” in catch). |

---

### 1.5 send-push-notification

| Campo | Dettaglio |
|-------|-----------|
| **Usata nel codice** | Sì |
| **File** | `src/services/notificationService.ts` |
| **Riga** | 88 |
| **Come viene chiamata** | `supabase.functions.invoke('send-push-notification', { body: { professionalId, notificationId } })` |
| **Risposta attesa** | Non critica: in caso di “Function not found” / 404 il codice fa log e return; in DEV logga warning. Push è opzionale. |

---

## 2. TABELLE DATABASE

### 2.1 Tabelle usate nel codice (da `.from('...')` in `src/`)

Estratte dai 301 match (storage bucket `workout-files` escluso dalla lista tabelle):

| Tabella | Note |
|---------|------|
| professionals | Molti file |
| clients | Partner |
| bookings | Partner |
| projects | Partner |
| profiles | Auth/Admin/Partner |
| professional_services | Partner |
| professional_availability | Partner |
| professional_settings | Partner |
| professional_subscriptions | Partner/Subscription |
| professional_notifications | Partner |
| professional_languages | Partner |
| professional_blocked_periods | Partner |
| avatars | Profilo (storage/public?) |
| subscription_invoices | Subscription |
| scheduled_notifications | Notifiche |
| reviews | Recensioni |
| custom_workouts | Workout |
| user_workout_stats | Stats |
| workout_diary | Diario |
| notes | Note |
| workout_plans | Piani |
| openai_usage_logs | OpenAI |
| user_objectives | Obiettivi |
| primebot_preferences | PrimeBot |
| primebot_interactions | PrimeBot |
| user_onboarding_responses | Onboarding/PrimeBot |
| onboarding_analytics | Onboarding |
| onboarding_obiettivo_principale | Onboarding |
| onboarding_esperienza | Onboarding |
| onboarding_preferenze | Onboarding |
| onboarding_personalizzazione | Onboarding |
| health_disclaimer_acknowledgments | PrimeBot |
| workout_attachments | Allegati |
| admin_sessions | Admin |
| admin_audit_logs | Admin |
| push_subscriptions | Push |

**Bucket storage (non tabella):** `workout-files` (usato con `supabase.storage.from('workout-files')`).

### 2.2 Tabelle create nelle migrazioni

Nella cartella `supabase/migrations/` **non** compare alcuna riga con `CREATE TABLE`.  
Le migrazioni presenti:
- **20250127_add_cancellation_reason.sql** – `ALTER TABLE professional_subscriptions` (aggiunge `cancellation_reason`)
- **20250128120000_fix_prof_sub_plan_check.sql** – `ALTER TABLE professional_subscriptions` (constraint `plan`)
- **20250128120100_add_paypal_support.sql** – `ALTER TABLE professional_subscriptions` e `subscription_invoices` (colonne PayPal)
- **20250129120000_professionals_rls_insert_select_update.sql** – RLS su `professionals` (usa colonna `user_id`)
- **20250129140000_professionals_trigger_auth_signup.sql** – `INSERT INTO public.professionals (...)` da trigger su `auth.users` (presuppone che la tabella `professionals` esista già)

**Conclusione:** Nessuna migrazione nel repo crea tabelle; le tabelle sono create altrove (altro branch, Supabase Dashboard, o migrazioni rimosse). Le migrazioni attuali solo alterano/RLS/trigger su `professionals` e `professional_subscriptions` / `subscription_invoices`.

---

## 3. SCHEMA PROFESSIONALS

### 3.1 Colonne usate nel trigger di migrazione (INSERT)

Da `20250129140000_professionals_trigger_auth_signup.sql`:

- user_id  
- first_name, last_name, email, phone  
- category, zona, bio  
- company_name, titolo_studio, specializzazioni  
- approval_status, approved_at, attivo, is_partner  
- modalita, prezzo_seduta, prezzo_fascia  
- rating, reviews_count  
- birth_date, birth_place  
- vat_number, vat_address, vat_postal_code, vat_city  

**Non** inseriti dal trigger: `id`, `created_at`, `updated_at` (probabilmente default), `password_hash`, `password_salt`, `reset_*`, `office_phone`, `pec_email`, `sdi_code`, `payment_method`.

### 3.2 Tipo `professionals` in `src/integrations/supabase/types.ts`

- **Row/Insert/Update** includono:  
  `birth_date`, `birth_place`, `category`, `company_name`, `created_at`, `email`, `first_name`, `last_name`, `id`, `office_phone`, `password_hash`, `password_salt`, `payment_method`, `pec_email`, `phone`, `reset_requested_at`, `reset_token`, `sdi_code`, `updated_at`, `vat_address`, `vat_city`, `vat_number`, `vat_postal_code`.

- **Mancanti in types (ma usate nel trigger/codice):**  
  `user_id`, `zona`, `bio`, `titolo_studio`, `specializzazioni`, `approval_status`, `approved_at`, `attivo`, `is_partner`, `modalita`, `prezzo_seduta`, `prezzo_fascia`, `rating`, `reviews_count`.

- **Presenti in types ma deprecate/assenti nel trigger:**  
  `password_hash`, `password_salt`, `reset_requested_at`, `reset_token` (NOTE.md indica rimozione dal DB).  
  `id` nei types è string; il trigger inserisce `user_id = NEW.id` (auth.users), quindi la tabella reale probabilmente ha sia `id` (PK) che `user_id` (FK).

**Conclusione:** Lo schema in `types.ts` non riflette la tabella reale (colonne partner/approval mancanti, colonne deprecate ancora presenti).

---

## 4. TABELLE PRIMEBOT / ONBOARDING

- **Cercato in migrazioni:**  
  `grep -r "primebot|user_progress|onboarding" supabase/migrations/*.sql`  
  **Risultato:** Nessun match.

- **Conclusione:** Nessuna migrazione nella cartella corrente crea o altera tabelle `primebot_*`, `user_progress` o tabelle onboarding (`onboarding_analytics`, `onboarding_obiettivo_principale`, ecc.). Queste tabelle sono usate nel codice ma la loro creazione non è tracciata in questo repo.

---

## 5. VARIABILI AMBIENTE

### 5.1 Variabili `VITE_*` usate nel codice (uniche)

Da grep su `import.meta.env.VITE_` in `src/`:

- VITE_SUPABASE_URL  
- VITE_SUPABASE_ANON_KEY  
- VITE_STRIPE_PUBLISHABLE_KEY  
- VITE_PAYPAL_CLIENT_ID  
- VITE_PAYPAL_PLAN_ID  
- VITE_PAYPAL_MODE  
- VITE_ADMIN_EMAIL  
- VITE_APP_MODE  
- VITE_API_URL  
- VITE_DEBUG_MODE  
- VITE_EMAIL_VALIDATION_API_KEY  
- VITE_EMAIL_VALIDATION_PROVIDER  
- VITE_DEV_TEST_EMAIL (in `src/test/test-env.ts`)  
- VITE_DEV_TEST_PASSWORD (in `src/test/test-env.ts`)  

**Non cercate in questa raccolta (ma citate in doc):** VITE_ENABLE_PRIMEBOT, VITE_ADMIN_SECRET_KEY, VITE_N8N_WEBHOOK_SECRET, VITE_VF_* (Voiceflow).

### 5.2 Dichiarate in `src/vite-env.d.ts`

```ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_MODE: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG_MODE?: string
  readonly VITE_EMAIL_VALIDATION_API_KEY?: string
  readonly VITE_EMAIL_VALIDATION_PROVIDER?: string
}
```

### 5.3 Confronto

| Variabile usata | In vite-env.d.ts |
|-----------------|-------------------|
| VITE_SUPABASE_URL | Sì |
| VITE_SUPABASE_ANON_KEY | Sì |
| VITE_APP_MODE | Sì |
| VITE_API_URL | Sì |
| VITE_DEBUG_MODE | Sì |
| VITE_EMAIL_VALIDATION_API_KEY | Sì |
| VITE_EMAIL_VALIDATION_PROVIDER | Sì |
| VITE_STRIPE_PUBLISHABLE_KEY | No |
| VITE_PAYPAL_CLIENT_ID | No |
| VITE_PAYPAL_PLAN_ID | No |
| VITE_PAYPAL_MODE | No |
| VITE_ADMIN_EMAIL | No |
| VITE_DEV_TEST_EMAIL | No |
| VITE_DEV_TEST_PASSWORD | No |

---

## 6. .env.example

File presente. Variabili documentate (solo quelle con prefisso o rilevanti):

- VITE_SUPABASE_URL  
- VITE_SUPABASE_ANON_KEY  
- VITE_APP_MODE  
- VITE_API_URL  
- VITE_VF_API_KEY, VITE_VF_VERSION_ID  
- VITE_N8N_WEBHOOK_SECRET  
- VITE_EMAIL_VALIDATION_API_KEY  
- VITE_DEBUG_MODE  
- OPENAI_API_KEY (non VITE_)  
- VITE_ADMIN_SECRET_KEY, VITE_ADMIN_EMAIL  
- STRIPE_*, VITE_STRIPE_PUBLISHABLE_KEY  

Non in .env.example (ma usate in codice): VITE_PAYPAL_*, VITE_DEV_TEST_*.

---

## 7. CONFIG.TOML – SEZIONE FUNCTIONS

```toml
[functions]
admin-stats = { verify_jwt = true, import_map = "./functions/admin-stats/deno.json", entrypoint = "./functions/admin-stats/index.ts" }
admin-users = { verify_jwt = true, import_map = "./functions/admin-users/deno.json", entrypoint = "./functions/admin-users/index.ts" }
admin-auth-validate = { verify_jwt = false, import_map = "./functions/admin-auth-validate/deno.json", entrypoint = "./functions/admin-auth-validate/index.ts" }
n8n-webhook-proxy = { verify_jwt = false, import_map = "./functions/n8n-webhook-proxy/deno.json", entrypoint = "./functions/n8n-webhook-proxy/index.ts" }
send-push-notification = { verify_jwt = true, import_map = "./functions/send-push-notification/deno.json", entrypoint = "./functions/send-push-notification/index.ts" }
stripe-create-customer = { verify_jwt = true, import_map = "./functions/stripe-create-customer/deno.json", entrypoint = "./functions/stripe-create-customer/index.ts" }
stripe-create-subscription = { verify_jwt = true, import_map = "./functions/stripe-create-subscription/deno.json", entrypoint = "./functions/stripe-create-subscription/index.ts" }
stripe-webhook = { verify_jwt = false, import_map = "./functions/stripe-webhook/deno.json", entrypoint = "./functions/stripe-webhook/index.ts" }
stripe-test-import = { verify_jwt = false, import_map = "./functions/stripe-test-import/deno.json", entrypoint = "./functions/stripe-test-import/index.ts" }
```

**Nota:** In `supabase/functions/` esistono anche altre directory (es. `stripe-cancel-subscription`, `stripe-reactivate-subscription`, `paypal-*`, `subscription-reminders`, `ensure-partner-subscription`, `send-test-email`, ecc.) che **non** compaiono in questa sezione di `config.toml`. Il deploy Supabase potrebbe usare discovery automatico delle funzioni; le 5 funzioni elencate sopra sono quelle senza cartella e quindi mancanti.

---

## 8. CHIAMATE `supabase.functions.invoke` NEL CODICE

- **PaymentsModal.tsx:546** – `stripe-cancel-subscription` (body: `cancel_immediately`, ecc.)  
- **Abbonamento.tsx:90** – `stripe-cancel-subscription`  
- **Abbonamento.tsx:120** – `stripe-reactivate-subscription`  
- **AddStripeCardModal.tsx:288** – `stripe-update-payment-method`  
- **AbbonamentoPage.tsx:108, 134, 184** – `stripe-cancel-subscription` / `stripe-reactivate-subscription`  
- **subscriptionService.ts:64** – `stripe-create-customer`  
- **subscriptionService.ts:109** – `stripe-create-subscription`  
- **notificationService.ts:88** – `send-push-notification` (body: `professionalId`, `notificationId`)  

Tutte le altre Edge Functions usate nel codice sono invocate tramite **fetch** diretto all’URL della function (admin-stats, admin-users, admin-auth-validate, n8n-webhook-proxy, ensure-partner-subscription, paypal-create-subscription, stripe-list-payment-methods, stripe-set-default-payment-method, stripe-detach-payment-method).

---

Fine raccolta informazioni. Nessuna modifica è stata applicata al progetto.

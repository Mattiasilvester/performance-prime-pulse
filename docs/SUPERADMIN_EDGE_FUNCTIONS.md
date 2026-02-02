# SuperAdmin — Edge Functions

## Funzioni

- **admin-auth-validate** — Verifica la Secret Key per il login SuperAdmin. Body: `{ secretKey }`. Restituisce `{ valid: true }` se `secretKey` coincide con la variabile d’ambiente `ADMIN_SECRET_KEY`. **Obbligatoria per il login.**
- **admin-stats** — KPI Pulse Check (MRR, utenti, professionisti, booking mese, rating) + lista applicazioni in attesa + lista professionisti. Usa `SUPABASE_SERVICE_ROLE_KEY` per bypass RLS.
- **admin-login** — Verifica email + password SuperAdmin leggendo `profiles` con Service Role (bypass RLS). Body: `{ email, password }`. Restituisce `{ valid: true, profile }` o `{ valid: false, error }`. **Obbligatoria per il login** (senza di essa la query client su profiles fallisce per RLS).
- **admin-application-action** — Approva (crea professional + professional_settings) o Rifiuta (aggiorna application con motivo). Body: `{ applicationId, action: 'approve' | 'reject', rejectionReason? }`.
- **admin-users** — Lista utenti B2C (profiles) per pagina Utenti. GET: `?limit=&offset=&search=&status=` → `{ users, count, limit, offset }`. Usa Service Role. PATCH/DELETE: 501 (da implementare se serve).
- **admin-analytics** — Dati reali per grafici Analytics: ultimi 6 mesi. POST → `{ months: [ { month, monthKey, users (cumulativo), revenue (booking completati) } ] }`.

## Deploy

```bash
supabase functions deploy admin-auth-validate
supabase functions deploy admin-login
supabase functions deploy admin-stats
supabase functions deploy admin-application-action
supabase functions deploy admin-users
supabase functions deploy admin-analytics
```

Dopo il deploy, imposta i secret in Supabase:

```bash
supabase secrets set ADMIN_SECRET_KEY=LA_TUA_CHIAVE_SEGRETA
supabase secrets set ADMIN_PASSWORD=SuperAdmin2025!
```

- **ADMIN_SECRET_KEY**: la stessa stringa va usata nel campo "Secret Key" nella pagina di login.
- **ADMIN_PASSWORD**: deve coincidere con la password che gli admin usano per il login (es. `SuperAdmin2025!`).

(Oppure da Dashboard → Project Settings → Edge Functions → Secrets.) La stessa stringa va usata nel campo “Secret Key” nella pagina di login SuperAdmin.

Le variabili `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono fornite automaticamente in produzione. Il frontend chiama le funzioni con `Authorization: Bearer <session.access_token>` (login SuperAdmin bypass); le funzioni usano internamente il Service Role per leggere/scrivere il DB.

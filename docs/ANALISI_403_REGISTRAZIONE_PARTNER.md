# Analisi 403 Forbidden – Registrazione Partner

## Problema

Dopo l’ultimo step della registrazione partner l’app riceve **403 Forbidden** sull’INSERT nella tabella `professionals`.

---

## Cause individuate

### 1. RLS (Row Level Security) sulla tabella `professionals`

- Con RLS attivo, ogni INSERT è consentito solo se esiste una **policy** che lo permette.
- La policy usata è: `WITH CHECK (auth.uid() = user_id)`.
- Quindi l’INSERT passa **solo se** la richiesta è fatta con un utente autenticato e `auth.uid()` coincide con il `user_id` che si sta inserendo.

### 2. Nessuna sessione subito dopo `signUp()` se la conferma email è attiva

- In Supabase, con **“Confirm email”** attivo:
  - `signUp()` crea l’utente e restituisce l’oggetto **user**.
  - La **session** restituita è **null** finché l’utente non conferma l’email.
- La chiamata successiva (INSERT in `professionals`) viene fatta **senza sessione** (nessun JWT di utente autenticato).
- In quel contesto `auth.uid()` è **null**.
- La policy richiede `auth.uid() = user_id` → con `auth.uid()` null la condizione fallisce → **403 Forbidden**.

Quindi: **403 non per “policy sbagliata”, ma perché con conferma email attiva non c’è sessione e quindi `auth.uid()` è null.**

---

## Soluzioni già applicate (e perché da sole non bastano)

### A. Rimozione di `password_hash` e `password_salt` dall’INSERT

- **Problema risolto:** `PGRST204` (colonna non trovata).
- **Effetto sul 403:** nessuno. Il 403 dipende da RLS/sessione, non da quelle colonne.

### B. Policy RLS per INSERT/SELECT/UPDATE su `professionals`

- **Cosa fa:** consente INSERT solo se `auth.uid() = user_id`.
- **Quando funziona:** solo se la richiesta è fatta **con sessione** (utente autenticato).
- **Quando non funziona:** quando subito dopo `signUp()` non c’è sessione (conferma email attiva) → `auth.uid()` è null → 403.

Quindi le policy RLS sono corrette, ma non risolvono il caso “registrazione + conferma email attiva”.

---

## Cosa serve per risolvere davvero

L’INSERT in `professionals` non deve dipendere dalla sessione del client. Due strade:

1. **Disattivare la conferma email** (Authentication → Settings)  
   Dopo `signUp()` viene restituita subito una sessione, l’INSERT dal client passa con RLS.  
   Svantaggio: nessuna verifica email.

2. **Creare il record `professionals` lato server quando viene creato l’utente**  
   Così non si usa mai l’INSERT dal client subito dopo `signUp()`.  
   Implementazione scelta: **trigger su `auth.users`** che, per gli utenti con `role = 'professional'` nei metadata, inserisce la riga in `public.professionals` (con funzione `SECURITY DEFINER` che bypassa RLS).  
   Il client deve inviare tutti i dati necessari in `signUp(..., options: { data: { ... } })` e **non** fare più l’INSERT in `professionals`.

Con il trigger, la registrazione funziona **sia con conferma email attiva sia disattiva**.

---

## Riepilogo

| Cosa | Effetto sul 403 |
|------|------------------|
| Rimozione `password_hash` / `password_salt` | Risolve solo PGRST204, non il 403. |
| Policy RLS INSERT con `auth.uid() = user_id` | Necessaria ma non sufficiente se non c’è sessione. |
| Conferma email **disattiva** | Dopo `signUp()` c’è sessione → RLS basta → 403 risolto. |
| Conferma email **attiva** | Dopo `signUp()` sessione = null → RLS blocca → 403. |
| **Trigger su `auth.users`** | Crea il professional lato DB indipendentemente dalla sessione → 403 risolto in ogni caso. |

Implementazione applicata: trigger + adattamento client (tutti i dati in `options.data`, nessun INSERT client in `professionals`).

---

## Implementazione applicata (Gen 2025)

1. **Migrazione** `20250129140000_professionals_trigger_auth_signup.sql`
   - Funzione `public.handle_new_professional_signup()` (SECURITY DEFINER) che inserisce in `public.professionals` leggendo da `NEW.raw_user_meta_data`.
   - Trigger `on_auth_user_created_professional` AFTER INSERT ON `auth.users`.
   - Se la tabella `professionals` ha colonne diverse (es. nomi o tipi diversi), la migrazione può fallire: allineare lo schema o adattare la funzione.

2. **Client** `professionalAuthService.register()`
   - Invia tutti i dati professional in `signUp(..., options: { data: { ... } })`.
   - Non esegue più INSERT da client.
   - Restituisce `{ user, professional, requiresEmailConfirmation }`; se `requiresEmailConfirmation` è true, la UI reindirizza al login con messaggio "Controlla la tua email".

3. **Pagina** `PartnerRegistration`
   - Se `requiresEmailConfirmation` è true: toast di successo e redirect a `/partner/login`.

Dopo aver applicato le migrazioni (`supabase db push`), la registrazione partner funziona sia con conferma email attiva sia disattiva.

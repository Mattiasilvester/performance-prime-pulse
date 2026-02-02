# Verifica aggiornamento dati Analytics (utenti e professionisti)

Controllo generale per verificare che, quando un nuovo utente si iscrive o un nuovo professionista viene creato, i dati in Analytics e Pulse Check si aggiornino correttamente.

---

## 1. Flusso dati

### Nuovo utente B2C (registrazione da app)

1. **Registrazione** → `supabase.auth.signUp()` (es. da `RegistrationForm` / `useAuth.signUp`).
2. **Auth** → Supabase crea riga in `auth.users` con `created_at`.
3. **Trigger** → `on_auth_user_created` esegue `handle_new_user()` e inserisce/aggiorna una riga in `public.profiles` con:
   - `id` = `auth.users.id`
   - `email`, `full_name`, `first_name`, `last_name`, `role` (default `'user'`)
   - `created_at` = `auth.users.created_at` (o `now()`)
4. **Analytics** → Alla prossima chiamata a `admin-analytics`:
   - Conteggio **totale profili** include il nuovo profilo (se `created_at <= ultimo giorno del mese`).
   - Lista **profili che sono professionisti** non include questo utente (nessun `professionals.user_id` = questo `id`).
   - **Crescita Utenti (B2C)** = totale − professionisti → il nuovo utente viene contato.
5. **Pulse Check** → `admin-stats` conta tutti i `profiles` e i `profiles` con `created_at >= 7 giorni fa`; i numeri si aggiornano al prossimo refresh.

**Requisito:** deve esistere il trigger `on_auth_user_created` che chiama `handle_new_user()`.  
Se manca, non viene creata nessuna riga in `profiles` e Analytics/Pulse Check non vedono il nuovo utente.  
→ Migrazione: `20260202160000_handle_new_user_profiles.sql`.

---

### Nuovo professionista (registrazione partner o approvazione)

**Caso A – Registrazione partner (con role = professional)**

1. **Sign up** → `professionalAuthService.register()` chiama `supabase.auth.signUp()` con `options.data.role = 'professional'`.
2. **Auth** → Riga in `auth.users`.
3. **Trigger profilo** → `handle_new_user()` crea riga in `profiles` (id = user id, role da metadata).
4. **Trigger professionista** → `handle_new_professional_signup()` (solo se `role = 'professional'`) inserisce in `public.professionals` con `user_id = NEW.id`.
5. **Analytics**:
   - **Crescita Professionisti (B2B)** conta `professionals` con `created_at <= ultimo giorno del mese` → il nuovo professionista entra nel mese corrente.
   - **Crescita Utenti (B2C)** esclude i profili il cui `id` è in `professionals.user_id` → questo profilo è escluso (corretto, è B2B).

**Caso B – Approvazione da SuperAdmin**

1. **Applicazione** → Riga in `professional_applications` con status `pending`.
2. **Approvazione** → Edge Function `admin-application-action` con `action: 'approve'` inserisce in `professionals` (e opzionalmente in `professional_settings`). In questo flusso `user_id` può essere `null` fino al primo login del professionista.
3. **Analytics**:
   - **Crescita Professionisti (B2B)** include il nuovo professionista (per `created_at` su `professionals`).
   - **Crescita Utenti (B2C)** non viene ridotta da questo professionista finché non esiste un profilo con `id = professionals.user_id` (quando il professionista si collega con un account auth).

---

## 2. Cosa verificare

| Controllo | Dove | Cosa fare |
|-----------|------|-----------|
| Trigger profilo su signup | DB | Verificare che esista `handle_new_user` e trigger `on_auth_user_created` su `auth.users`. Eseguire la migrazione `20260202160000_handle_new_user_profiles.sql` se non presenti. |
| Colonne `created_at` | DB | `profiles.created_at` e `professionals.created_at` devono essere valorizzate (default `now()` o da trigger). |
| Edge Function analytics | Supabase | `admin-analytics` usa Service Role: legge tutti i dati senza RLS. Nessuna cache: ogni richiesta interroga il DB. |
| Frontend Analytics | App | I grafici si aggiornano quando l’utente apre la pagina Analytics o clicca **Aggiorna** (chiamata a `admin-analytics`). |

---

## 3. Test rapidi

1. **Nuovo utente B2C**
   - Registrare un nuovo utente (form registrazione app, senza role professional).
   - In Nexus Control → Analytics → cliccare **Aggiorna**.
   - Il grafico **Crescita Utenti (B2C)** per il mese corrente deve aumentare di 1 (rispetto al valore prima della registrazione).

2. **Nuovo professionista**
   - Creare un professionista (registrazione partner con role professional, oppure approvazione da SuperAdmin).
   - In Nexus Control → Analytics → **Aggiorna**.
   - Il grafico **Crescita Professionisti (B2B)** per il mese corrente deve aumentare di 1.
   - Se il professionista ha `user_id` valorizzato, **Crescita Utenti (B2C)** non deve contarlo (già escluso dalla logica totale − professionisti).

3. **Pulse Check (Overview)**
   - Dopo nuove registrazioni (utenti o professionisti), aprire **Overview** e verificare che **Utenti totali** e **Nuovi utenti (7 giorni)** riflettano i nuovi dati (refresh della pagina o richiesta a `admin-stats`).

---

## 4. Riepilogo

- **Utenti B2C:** aggiornati correttamente se esiste il trigger che crea il profilo alla registrazione (`handle_new_user`).
- **Professionisti B2B:** aggiornati da trigger (signup con role professional) o da `admin-application-action` (approvazione); i conteggi Analytics usano `professionals` e `profiles` con la logica totale − professionisti per il B2C.
- **Revenue / MRR:** letti da `subscription_invoices` (e in futuro B2C); nessun legame con la creazione utenti/professionisti, solo con le fatture pagate.
- **Quando si aggiornano:** ad ogni apertura della pagina Analytics (o Overview) e ad ogni click su **Aggiorna**; non c’è aggiornamento in tempo reale senza refresh/chiamata.

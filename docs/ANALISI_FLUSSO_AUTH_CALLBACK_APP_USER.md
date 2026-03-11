# ANALISI: Flusso /auth/callback — app-user (Performance Prime)

**Data:** 11 Marzo 2026  
**Scope:** `packages/app-user/src/` — solo analisi, nessuna modifica.

---

## 1. useAuth / AuthContext

### File principale
- **Path:** `packages/app-user/src/hooks/useAuth.tsx`
- **Contesto:** `AuthContext` + `AuthProvider` + hook `useAuth()`.
- **Client Supabase:** import da `@/integrations/supabase/client` (vedi §1.4).

### 1.1 Funzione `signUp` e `emailRedirectTo`

`signUp` passa a `supabase.auth.signUp` un oggetto con `options.emailRedirectTo`:

```ts
// useAuth.tsx, righe 86-99
const signupData = {
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: `${first_name} ${last_name}`,
      first_name,
      last_name,
    }
  }
};
const { data, error } = await supabase.auth.signUp(signupData);
```

- **emailRedirectTo:** sì, presente. Punta a **`{origin}/auth/callback`** (es. `http://localhost:5173/auth/callback` o `https://.../auth/callback` in prod).

### 1.2 Login con Google OAuth

- **Non** c’è una funzione dedicata in `useAuth` per OAuth.  
- Google viene usato **solo** dai componenti che chiamano direttamente `supabase.auth.signInWithOAuth`:
  - **LoginPage:** `packages/app-user/src/pages/auth/LoginPage.tsx` (righe 66-69)
  - **Step0Registration:** `packages/app-user/src/pages/onboarding/steps/Step0Registration.tsx` (righe 91-94)

**redirectTo usato (entrambi):**

```ts
redirectTo: `${window.location.origin}/dashboard`
```

Quindi: **OAuth non usa `/auth/callback`**, ma va direttamente a `/dashboard`. Con `detectSessionInUrl: true` il client Supabase legge i token dall’URL (hash/query) e imposta la sessione quando l’utente atterra su `/dashboard`.

### 1.3 Inizializzazione client Supabase

- **Path:** `packages/app-user/src/integrations/supabase/client.ts`
- **Codice:** `createClient(supabaseUrl, supabaseAnonKey, { auth: { ... } })`.
- **Variabili:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 2. App.tsx — Routing

### 2.1 Struttura route (solo path e componente)

| Path | Componente / comportamento |
|------|----------------------------|
| `/` | `NewLandingPage` |
| `/onboarding` | `OnboardingPage` |
| `/auth` | Redirect: se `session` → `/dashboard`, altrimenti → `/auth/login` |
| `/auth/login` | Se `session` → `<Navigate to="/dashboard" />`, altrimenti `LoginPage` |
| `/auth/register` | Se `session` → `<Navigate to="/dashboard" />`, altrimenti `RegisterPage` (lazy) |
| `/auth/reset-password` | `ResetPassword` |
| `/terms-and-conditions` | `TermsAndConditions` (lazy) |
| `/privacy-policy` | `MainPrivacyPolicy` (lazy) |
| `/dashboard` … (tutte le altre route app) | `ProtectedRoute` + layout (Header, BottomNavigation, ecc.) |
| `*` | `NotFound` (lazy) |

### 2.2 Route `/auth/callback`

- **Non esiste** nessuna route per `/auth/callback`.
- Qualsiasi richiesta a `/auth/callback` (con o senza query/hash) finisce nel catch-all `*` e viene gestita da **`NotFound`**.

### 2.3 Protezione route private

- **Componente:** `ProtectedRoute` (`packages/app-user/src/components/ProtectedRoute.tsx`).
- **Logica:**
  - Se path è `/onboarding` (o sotto) e `safeLocalStorage.getItem('isOnboarding') === 'true'` → lascia passare (bypass onboarding).
  - In **DEV**: se la route non è pubblica (`/`, `/auth`, `/auth/login`, `/auth/register`, `/onboarding`) → lascia passare senza sessione (bypass temporaneo per debug).
  - Se `!session` → `<Navigate to="/auth/login" replace />`.
  - Altrimenti → rende `children`.
- **Nessun controllo** su `email_confirmed_at` o stato “email confermata”: basta avere `session`.

### 2.4 Route `/auth/*` pubbliche o protette?

- **Pubbliche (non richiedono sessione):**
  - `/auth`, `/auth/login`, `/auth/register`, `/auth/reset-password`
- **Protetta:** nessuna sotto `/auth`; la “protezione” è solo il redirect da `/auth` a `/auth/login` se non c’è sessione.

---

## 3. Flusso post-registrazione attuale

### 3.1 Dopo `signUp`

- **useAuth.signUp** ritorna:
  - Se `data.user && data.session`: `{ success: true, message: 'Registrazione completata e accesso effettuato!' }`.
  - Se `data.user && !data.session` (conferma email richiesta): `{ success: true, message: 'Registrazione completata! Controlla la tua email per confermare l\'account.' }`.
- **Nessun redirect lato useAuth**: la navigazione dipende dal componente che chiama `signUp`.

### 3.2 Dove viene mostrato “controlla la tua email”

- **RegistrationForm** (`packages/app-user/src/components/auth/RegistrationForm.tsx`):
  - In caso di successo: `toast.success(result.message)`.
  - Se il messaggio non contiene `'accesso effettuato'`: anche `toast.info("Controlla la tua email per confermare l'account prima di accedere.")`.
  - **Nessun redirect**: l’utente resta sulla pagina di registrazione.
- **Step0Registration** (onboarding):
  - In caso di successo: `nextStep()` (passa allo step successivo dell’onboarding).
  - **Non** mostra esplicitamente “controlla la tua email”; il messaggio di useAuth non viene mostrato in modo evidente come in RegistrationForm.

### 3.3 Accesso alla dashboard senza conferma email

- **ProtectedRoute** controlla solo `session`. Non controlla `user.email_confirmed_at` (o simili).
- Se in Supabase è disabilitato “Confirm email”, alla signUp può essere restituita una sessione: in quel caso l’utente può andare in dashboard senza aver mai cliccato il link.
- Se “Confirm email” è attivo:
  - L’utente non ha sessione finché non clicca il link nell’email.
  - Il link punta a `emailRedirectTo` = **`/auth/callback`**.
  - Su `/auth/callback` non c’è una pagina dedicata → l’utente vede **NotFound**, anche se il client Supabase (con `detectSessionInUrl: true`) potrebbe comunque aver impostato la sessione dall’URL.

---

## 4. Supabase Auth (da codice)

### 4.1 `onAuthStateChange`

- **useAuth.tsx (AuthProvider):**  
  `supabase.auth.onAuthStateChange((event, session) => { ... })`  
  - Aggiorna solo `setSession(session)` e `setUser(session?.user ?? null)`.  
  - **Nessuna** logica specifica per `event === 'SIGNED_IN'` (o altri eventi).
- **App.tsx:**  
  Altro listener `onAuthStateChange` che fa solo `setSession(session)` (per il routing in base a `session`).
- **useAuthListener.tsx:**  
  Listener con `switch (event)` che include `SIGNED_IN`, `PASSWORD_RECOVERY`, ecc., ma ogni case è vuoto (`break`).  
  **In più:** `useAuthListener` **non è usato** in nessun file dell’app → codice morto.

### 4.2 EMAIL_OTP_SENT / PASSWORD_RECOVERY

- **EMAIL_OTP_SENT:** non gestito da nessuna parte.
- **PASSWORD_RECOVERY:** gestito solo in `useAuthListener` (case vuoto); hook non usato.  
  Il flusso reale di reset password è gestito dalla pagina **ResetPassword**, che legge `access_token`, `refresh_token`, `type=recovery` dall’URL e chiama `setSession` (vedi §5).

### 4.3 PKCE vs implicit / `detectSessionInUrl`

- **File:** `packages/app-user/src/integrations/supabase/client.ts`
- **Opzioni auth:**  
  `persistSession: true`, `autoRefreshToken: true`, **`detectSessionInUrl: true`**
- **Nessun** `flowType` esplicito nel codice → comportamento default del client Supabase (OAuth con PKCE dove applicabile).
- **`detectSessionInUrl: true`:** il client può risolvere la sessione quando l’utente atterra su una URL con token (hash o query). Questo è ciò che permette a:
  - Reset password su `/auth/reset-password?...` di funzionare (pagina che fa anche `setSession`).
  - OAuth con `redirectTo: /dashboard` di funzionare senza una route `/auth/callback`.

---

## 5. Reset password

### 5.1 Pagina

- **Path:** `packages/app-user/src/pages/ResetPassword.tsx`
- **Route:** `/auth/reset-password` (in `App.tsx`).

### 5.2 Flusso

- **Richiesta reset:** l’utente inserisce l’email; viene chiamato `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset-password` })`.
- **Link nell’email:** Supabase reindirizza a  
  `{origin}/auth/reset-password?access_token=...&refresh_token=...&type=recovery` (o parametri equivalenti).
- **Stessa route, stessa pagina:** la pagina `ResetPassword`:
  - Legge `access_token`, `refresh_token`, `type` da `useSearchParams()`.
  - Se `type === 'recovery'` e ci sono i token → chiama `supabase.auth.setSession({ access_token, refresh_token })`.
  - Poi mostra il form “Imposta nuova password” (`hasValidToken === true`).
  - Dopo l’aggiornamento password → redirect a `/auth/login`.
- **Nessun uso di `/auth/callback`:** il redirect del reset è esplicitamente su `/auth/reset-password`, che gestisce sia la richiesta di reset sia il ritorno dal link.

### 5.3 Stato

- Il flusso reset password è **coerente e funzionante** (stessa URL per richiesta e callback, gestione token e `setSession` in pagina).

---

## 6. Google OAuth

### 6.1 Implementazione

- **Sì**, presente in app-user:
  - **LoginPage:** `handleGoogleLogin` → `signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/dashboard' } })`.
  - **Step0Registration:** `handleGoogleSignIn` → stesso `redirectTo: origin + '/dashboard'`.

### 6.2 Redirect dopo login Google

- **redirectTo:** sempre **`/dashboard`**, mai `/auth/callback`.
- Supabase reindirizza il browser a `{origin}/dashboard` con i token nell’URL (es. hash).  
  Con `detectSessionInUrl: true`, al caricamento di `/dashboard` il client legge i token e imposta la sessione; `ProtectedRoute` vede `session` e mostra la dashboard.
- Quindi **non** si usa una route dedicata “callback” per OAuth; il “callback” è di fatto la stessa `/dashboard`.

---

## 7. Riepilogo: cosa funziona, cosa è rotto, cosa manca

### Funziona

- **useAuth / signUp:** parametri corretti, incluso `emailRedirectTo: .../auth/callback`; messaggi distinti per “confermato” vs “controlla email”.
- **Client Supabase:** inizializzazione in `integrations/supabase/client.ts`, con `detectSessionInUrl: true`.
- **Reset password:** pagina unica `/auth/reset-password` per richiesta e ritorno dal link; gestione token e `setSession` corretta.
- **Google OAuth:** implementato con `redirectTo: /dashboard`; nessun bisogno di `/auth/callback` per OAuth.
- **Route /auth/*:** pubbliche e redirect da `/auth` gestiti in modo coerente.
- **Protezione route:** `ProtectedRoute` basata su `session` (e bypass onboarding/DEV come da codice).

### Rotto / problematico

- **Route `/auth/callback` assente:**  
  Il link di conferma email inviato da Supabase porta a `{origin}/auth/callback?...`.  
  Non esiste una route per `/auth/callback` → React Router serve **NotFound**.  
  Anche se il client Supabase, grazie a `detectSessionInUrl`, potrebbe impostare la sessione dall’URL, l’utente **vede una pagina 404/NotFound** invece di una schermata “Account confermato” e redirect alla dashboard (o login).
- **useAuthListener:** hook con switch su eventi auth (incluso `PASSWORD_RECOVERY`) ma mai usato; non incide sul comportamento reale.

### Manca

- **Pagina/route dedicata `/auth/callback`** che:
  - lasci il client processare l’URL (o gestisca esplicitamente i parametri di conferma se necessario);
  - mostri un feedback (“Account confermato”, “Reindirizzamento…”);
  - reindirizzi a `/dashboard` (o `/onboarding` se appropriato) dopo conferma.
- **Gestione esplicita dell’evento** di conferma email (se si volesse logica aggiuntiva tipo “primo accesso dopo conferma”) — al momento non c’è.
- **Controllo opzionale su “email confermata”** in `ProtectedRoute` (es. rimandare a “Controlla la tua email” se `session` c’è ma `email_confirmed_at` no) — attualmente non presente e probabilmente non necessario se il flusso callback è corretto.

---

## 8. Dipendenze e side effect da considerare prima del fix

1. **Supabase Dashboard — Redirect URLs:**  
   In **Authentication → URL Configuration → Redirect URLs** deve essere presente l’URL di callback (es. `https://dominio.com/auth/callback` e in dev `http://localhost:5173/auth/callback`). Senza questo, Supabase può bloccare il redirect alla conferma email.

2. **Impostazione “Confirm email”:**  
   Se in Supabase è disabilitata, non si vede il problema della “pagina mancante” perché l’utente può entrare subito con sessione; il fix della route ha senso soprattutto con conferma email attiva.

3. **Sessione già impostata dall’URL:**  
   Con `detectSessionInUrl: true`, atterrando su `/auth/callback?...` la sessione potrebbe essere già impostata dal client prima che la nuova pagina callback faccia qualcosa. La nuova route deve quindi concentrarsi su: rendering di “Conferma in corso…” / “Account confermato”, eventuale `navigate('/dashboard')` dopo un breve delay o dopo aver verificato che la sessione c’è, e non su una seconda chiamata di exchange token (per evitare doppie chiamate o errori).

4. **Onboarding:**  
   Dopo conferma email, se l’utente si era registrato da onboarding (Step0Registration), potrebbe essere preferibile redirect a `/onboarding` invece che a `/dashboard` (stesso criterio usato dopo login: controllare `onboarding_completed_at`). Da decidere in fase di implementazione.

5. **App.tsx e sessione:**  
   La sessione usata per le route è quella in `App` (`useState` + `onAuthStateChange`), non solo quella in `AuthProvider`. Dopo che il callback imposta la sessione (via URL), entrambi i listener la ricevono; un redirect a `/dashboard` da pagina callback funzionerà con la sessione già aggiornata.

6. **EXCLUDED_WIDGET_PATHS e PrimeBot:**  
   In `App.tsx`, `EXCLUDED_WIDGET_PATHS` e il check `location.pathname.startsWith('/auth')` escludono il widget su tutte le route `/auth/*`. Aggiungendo `/auth/callback`, quella pagina sarà automaticamente senza widget; nessun altro adattamento necessario per il widget.

---

*Fine report — solo analisi, nessuna modifica al codice.*

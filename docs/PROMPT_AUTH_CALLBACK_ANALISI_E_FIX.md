# Analisi prompt Fix /auth/callback — problemi rilevati e correzioni

**Data:** 11 Marzo 2026

---

## Problemi nel prompt (prima di implementare)

### 1. **CRITICO — Check `onboarding_completed`**

**Nel prompt:** viene suggerito come esempio:
```ts
const onboardingCompleted = session.user.user_metadata?.onboarding_completed === true
```

**Nel codice reale (app-user):** l’onboarding **non** è in `user_metadata`. È in tabella Supabase **`user_onboarding_responses`**, campo **`onboarding_completed_at`**.

**Snippet reale (LoginPage):**
```ts
const { data: onboardingData } = await supabase
  .from('user_onboarding_responses')
  .select('onboarding_completed_at')
  .eq('user_id', data.user.id)
  .maybeSingle()
if (!onboardingData?.onboarding_completed_at) {
  navigate('/onboarding')
} else {
  navigate('/dashboard')
}
```

**Conseguenza:** se in AuthCallback si usasse `user_metadata?.onboarding_completed`, il redirect sarebbe sempre sbagliato (tutti a `/onboarding` o tutti a `/dashboard`).  
**Correzione:** in AuthCallback usare la **stessa logica** di LoginPage: query a `user_onboarding_responses` e redirect in base a `onboarding_completed_at`.

---

### 2. **Evento `onAuthStateChange`: solo SIGNED_IN?**

**Nel prompt:** si reagisce solo a `event === 'SIGNED_IN'`.

**Comportamento Supabase:** dopo un redirect (email confirm / magic link), al caricamento della pagina con token in URL può essere emesso **`INITIAL_SESSION`** (sessione ripristinata dall’URL), non solo `SIGNED_IN`. In alcuni flussi arrivano entrambi.

**Conseguenza:** se il client emette solo `INITIAL_SESSION`, l’utente resterebbe su “Conferma in corso...” fino al timeout di 8 secondi e poi sarebbe mandato al login.  
**Correzione:** gestire sia **`SIGNED_IN`** sia **`INITIAL_SESSION`** quando `session` è presente.

---

### 3. **Design system — verificato**

- **Outfit:** caricato in `index.html` (Google Fonts). OK.
- **bg-background:** in `index.css` è `--background: 240 10% 4%` → equivalente a `#0A0A0C`. OK.
- **Oro:** usato come `#EEBA2B` (inline o `border-[#EEBA2B]`). Nessuna classe tipo `text-gold`. OK.

Nessuna correzione necessaria qui.

---

### 4. **Struttura route App.tsx**

- Route `/auth/*`: righe 132–147 (path `/auth/login`, `/auth`, `/auth/register`, `/auth/reset-password`).
- Import eager: `NewLandingPage`, `OnboardingPage`, `LoginPage`, `ResetPassword`.
- La nuova route va aggiunta **dopo** `/auth/reset-password`, **prima** di `/terms-and-conditions`, con import eager di `AuthCallback`.

---

## Riepilogo correzioni applicate in implementazione

1. **AuthCallback.tsx:** redirect basato su query a `user_onboarding_responses` (stesso pattern di LoginPage), non su `user_metadata`.
2. **AuthCallback.tsx:** in `onAuthStateChange` considerare sia `SIGNED_IN` sia `INITIAL_SESSION` (con `session` presente).
3. **App.tsx:** aggiungere `import AuthCallback from '@/pages/auth/AuthCallback'` (eager) e `<Route path="/auth/callback" element={<AuthCallback />} />` dopo `/auth/reset-password`.

---

---

## STEP 3 — Supabase Redirect URLs (verifica manuale)

Controlla in **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** che siano presenti:

- `https://performanceprime.it/auth/callback` (o il dominio produzione effettivo)
- `http://localhost:5173/auth/callback`

Se non ci sono, aggiungili manualmente dalla dashboard.

---

## STEP 4 — Build e verifica (eseguito)

```bash
cd ~/Prime-puls-HUB && pnpm build:user
```

- [x] Build completata con **0 errori TypeScript**
- [x] 0 warning su import non usati o tipi mancanti
- [x] La route `/auth/callback` è gestita (componente eager nel bundle principale)
- [ ] **Stato Supabase Redirect URLs:** da verificare manualmente (STEP 3)

Warning preesistenti (non bloccanti): chunk >500 KB, dynamic/static import PrimeBot — invariati rispetto a prima.

---

*Fine analisi e implementazione — 11 Marzo 2026*

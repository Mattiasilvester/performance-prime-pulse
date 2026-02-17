# ANALISI — Stato attuale per setup Capacitor in PrimePro

**Data:** 16 Febbraio 2026  
**Scope:** `packages/app-pro` (PrimePro).  
**Nessuna modifica al codice: solo analisi.**

---

## 1. Output di build attuale

- **Config:** `packages/app-pro/vite.config.ts`  
  - Non è impostato `build.outDir` → Vite usa il default **`dist`** (relativo alla directory del config).  
  - Quindi l’output di build è: **`packages/app-pro/dist/`**.
- **Contenuto tipico:** `index.html` alla root di `dist/`, script in `dist/assets/*.js`, CSS in `dist/assets/*.css`, `dist/images/` se presenti asset da `public/`.
- **Base path:** In `vite.config.ts` **non** è impostato `base` → default Vite **`base: '/'`**.

**Nota:** Il file `capacitor.config.ts` è nella **root del monorepo** (non in app-pro) e ha `webDir: 'dist'`. Quindi punta a una cartella `dist` rispetto alla root del repo. Per usare app-pro con Capacitor andrà o spostato/duplicato il config in app-pro con `webDir: 'dist'` (e build eseguito da app-pro), oppure far produrre a app-pro l’output nella root (es. `outDir: '../../dist'` o script che copia), in modo che il Capacitor attuale trovi i file. Da definire in fase di setup.

---

## 2. Dipendenze Capacitor nel progetto

- **`packages/app-pro/package.json`:** **Nessuna** dipendenza `@capacitor/*`.  
  L’app PrimePro (app-pro) non dichiara Capacitor.
- **Root del monorepo** (`/package.json`):  
  - Sono presenti: `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios` (es. ^7.4.0).  
  - Nel lockfile risultano risolte come 7.4.5.
- **Configurazione Capacitor:**  
  - Root: `capacitor.config.ts` (appId: `com.tuonome.performanceprime`, appName: `performance-prime-pulse`, webDir: `dist`).  
  - Root: cartelle `android/`, `ios/` con progetto nativo che referenzia `node_modules/@capacitor/...`.

**Conclusione:** Capacitor è configurato a **livello monorepo** (root), non nel package app-pro. Per “aggiungere Capacitor” a PrimePro si dovrà o usare questa struttura (build app-pro → output usato da root) o spostare/aggiungere Capacitor nel workspace app-pro.

---

## 3. Service Worker e PWA

### Service Worker

- **File:** `packages/app-pro/public/sw.js`  
  - Registrazione: **`pushNotificationService.ts`** (righe 32, 44, 85, 351).  
  - Controllo: `'serviceWorker' in navigator`, `'PushManager' in window`, `'Notification' in window`.  
  - Registrazione: `navigator.serviceWorker.register('/sw.js', { scope: '/' })` (riga 44).  
- **Comportamento di `sw.js`:**
  - `install` → `skipWaiting()`
  - `activate` → `clients.claim()`
  - `push` → mostra notifica (titolo, body, icon, badge, vibrate, `silent: false`, tag)
  - `notificationclick` → chiude notifica, apre/focus finestra con `urlToOpen` (da `event.notification.data?.url` o `'/'`)

Quindi l’app usa un **Service Worker dedicato alle push**, non un SW generato da Workbox o da un plugin PWA di Vite.

### Manifest e PWA

- **Ricerca:** Nessun file `manifest.json` (o simile) sotto `packages/app-pro`.  
- **`index.html`:** Nessun `<link rel="manifest">` né meta da PWA (theme-color, apple-mobile-web-app, ecc.).  
- **Workbox:** Nessun riferimento a `workbox` nel codice app-pro.

**Conclusione:** C’è un **Service Worker** (`public/sw.js`) usato per le **push notification**; **nessun** manifest PWA né Workbox. Su Capacitor (WebView nativa) la registrazione di `/sw.js` e il comportamento push vanno verificati (supporto SW e Push in WebView/ambiente nativo).

---

## 4. API solo-browser che su mobile nativo potrebbero dare problemi

Elenco file e righe dove compaiono; su mobile nativo (Capacitor) andrebbero gestite con fallback o plugin (es. `CapacitorBrowser` per open, `Clipboard` per clipboard, ecc.).

| API / pattern | File | Righe | Uso |
|---------------|------|-------|-----|
| **window.location** (href, hostname, pathname, reload) | `ImpostazioniPage.tsx` | 149, 160 | Redirect a `/partner/dashboard` |
| | `PartnerDashboard.tsx` | 168 | `window.location.reload()` |
| | `ClientDetailModal.tsx` | 311, 328 | `mailto:` e `tel:` (in app nativa potrebbero aprire app esterne) |
| | `App.tsx` | 133, 170 | hostname; redirect `/partner/update-password` |
| | `DatabaseDiagnostic.tsx` | 121 | reload dopo 2s |
| | `CookiePolicy.tsx` | 158, 160 | reload |
| | `ErrorBoundary.tsx` | 107, 114 | href `/`, reload |
| | `AccountModal.tsx` | 251 | reload |
| | `OnboardingPreferencesCard.tsx` | 54 | `window.location.href` (log) |
| | `clearAuth.ts` | 44 | reload |
| | `errorHandler.ts` | 239 | `window.location.href` in report |
| | `useErrorHandler.tsx` | 47 | reload |
| | `NotFound.tsx` | 16 | reload |
| | `settings/Notifications.tsx` | 35 | reload |
| **window.location.origin** | `Step0Registration.tsx` | 100 | `redirectTo` Supabase |
| | `LoginPage.tsx` | 65, 101, 130 | `redirectTo` auth |
| | `useAuth.tsx` | 99 | `emailRedirectTo` `/auth/callback` |
| | `AddStripeCardModal.tsx` | 94 | `return_url` Stripe |
| **window.location.pathname** | `openai-service.ts` | 363, 1015 | contesto per AI |
| | `PrimeChat.tsx` | 1472 | idem |
| **navigator.clipboard** | `ChatInterface.tsx` | 289 | `navigator.clipboard.writeText(text)` |
| **Notification API** | `pushNotificationService.ts` | 85, 133 | check support; `Notification.requestPermission()` |
| | `NotificationsModal.tsx` | 183 | `Notification.permission` |
| **Service Worker / Push** | `pushNotificationService.ts` | 32, 37, 44 | `navigator.serviceWorker`, `PushManager`, `register('/sw.js')` |

Su dispositivo nativo: `window.location` per redirect/reload può andare bene nella WebView; `mailto:`/`tel:` di solito funzionano; clipboard e Notification potrebbero richiedere permessi o plugin; lo SW push in WebView va testato. Gli **redirect URL** costruiti con `window.location.origin` vanno verificati quando l’app gira in Capacitor (origine può essere `capacitor://` o simile): vedi punto 6.

---

## 5. Uso di localStorage (e sessionStorage)

### localStorage

| File | Righe | Scopo |
|------|-------|--------|
| `OverviewPage.tsx` | 104–108 | Tour onboarding: `pp_dashboard_tour_done_*`, `pp_dashboard_tour_force_show_*` |
| `ImpostazioniPage.tsx` | 144–158 | Reset tour: chiavi `pp_dashboard_tour_done_*` |
| `PartnerRegistration.tsx` | 270–273 | Pulizia chiavi tour dopo registrazione |
| `OnboardingTour.tsx` | 248, 266 | Salvataggio tour completato per professional |
| `ClientDetailModal.tsx` | 82–84, 265–267, 488–490, 657–659, 675–677, 703 | Note clienti (mock): `client_notes_${client.id}` |
| `integrations/supabase/client.ts` | 23–24, 141–147, 157 | Persistenza sessione/token (fallback da sessionStorage) |
| `PartnerLogin.tsx` | 55–57, 97 | “Ricordami email”: `partner_remember_email` |
| `useNotifications.tsx` | 47–78 | Notifiche UI: `NOTIFICATIONS_STORAGE_KEY` |
| `useAdminAuthBypass.tsx` | 30, 77, 93, 97, 174, 199, 209 | Sessione admin bypass: `admin_session` |
| `CookiePolicy.tsx` | 157 | Rimozione `cookieConsent` |
| `CookieBanner.tsx` | 21, 30 | Lettura/salvataggio `cookieConsent` |
| `pushNotificationService.ts` | 90, 104, 180, 323, 345–347 | Permesso push e subscription: `PERMISSION_KEY`, `SUBSCRIPTION_KEY` |
| `primebotConversationService.ts` | 55–57, 67, 76–77, 111–113, 267–268 | Sessione PrimeBot: `SESSION_ID_KEY_*`, `SESSION_TIMESTAMP_KEY_*` |
| `Step0Registration.tsx` | 153–161 | Dati registrazione: `pp_registration_data` |
| `QuickWorkout.tsx` | 116–141, 458, 526–528 | Progresso workout; `lastWorkoutCompleted`, `firstWorkoutCompleted` |
| `diaryNotesStorage.ts` | 145–213, 309 | Note diario (chiave dedicata) |
| `EditClientModal.tsx` | 46, 93 | Note clienti mock: `client_notes_${client.id}` |
| `ChatInterface.tsx` | 48–50, 116, 159–161, 171 | Messaggi chat; `user_onboarded_${userId}` |
| `PrimeChat.tsx` | 286, 1215 | `user_onboarded_${userId}` |
| `clearAuth.ts` | 4–7, 19–20, 40, 56–57 | Pulizia chiavi auth (localStorage e sessionStorage) |
| `storageHelpers.ts` | 4 | Wrapper localStorage |
| `domHelpers.ts` | 9–14, 24–25, 36–37, 48–49, 91–93 | Accesso sicuro localStorage |
| `challengeTracking.ts` | 25, 39, 57, 87–90, 100, 131, 141, 157 | Sfida 7 giorni; medaglie |
| `notificationSoundService.ts` | 138–148, 155–166, 174 | Preferenze suono/vibrazione notifiche |
| `errorHandler.ts` | 272–274 | Ultimi errori critici |
| `useMedalSystem.tsx` | 27–47, 212 | Stato medaglie; workout completato |
| `useFileAccess.tsx` | 11, 22, 28, 34 | Consenso accesso file |
| `useTranslation.tsx` | 15, 39, 51 | Lingua app: `app-language` |
| `AnalyticsConsent.tsx` | 16, 24, 33 | Consenso analytics |
| `planCreationStore.ts` | 123 | Nome storage (Zustand persist) |
| `OnboardingBot.tsx` | 61 | Fallback localStorage (commento) |

Su Capacitor l’ambiente è comunque un WebView con contesto “browser-like”: **localStorage** è in genere disponibile. Da tenere presente: in iOS in modalità privata o con poca memoria lo storage può essere limitato o vuoto; gestione errori e fallback già presenti in `domHelpers`/`storageHelpers` restano utili.

### sessionStorage

| File | Righe | Scopo |
|------|-------|--------|
| `integrations/supabase/client.ts` | 26–30, 146–149, 158 | Token/sessione (fallback se localStorage pieno) |
| `Professionals.tsx` | 93, 107, 118, 475, 566 | Scroll position: `professionals_scroll_position` |
| `ChatInterface.tsx` | 117, 121 | `first_visit_${userId}` |
| `PrimeChat.tsx` | 287, 291 | idem |
| `clearAuth.ts` | 22–25, 37, 40 | Pulizia sessionStorage |
| `domHelpers.ts` | 59–64, 74–75 | Accesso sicuro sessionStorage |
| `profile/Settings.tsx` | 35, 39, 48 | `settingsScrollPosition` |

Stesse considerazioni: in WebView Capacitor sessionStorage è di solito supportato; stesso caveat per storage limitato su iOS.

---

## 6. Redirect URL hardcodati (Stripe, auth, reset password)

- **Stripe confirmSetup (return_url):**  
  `AddStripeCardModal.tsx` riga 94:  
  `return_url: window.location.origin + '/partner/dashboard/impostazioni'`  
  In Capacitor `window.location.origin` può essere `capacitor://localhost` (o simile). Stripe potrebbe reindirizzare lì; va verificato che il deep link / schema Capacitor gestisca il ritorno dall’esterno, altrimenti serve una URL universale (es. `https://pro.performanceprime.it/...`) e gestione lato app.

- **Auth Supabase (redirectTo / emailRedirectTo):**  
  - `useAuth.tsx` 99: `emailRedirectTo: ${window.location.origin}/auth/callback` (magic link / recovery).  
  - `LoginPage.tsx` 65, 101, 130: `redirectTo: ${window.location.origin}/auth/reset-password` o `/dashboard`.  
  - `Step0Registration.tsx` 100: `redirectTo: ${window.location.origin}/dashboard`.  
  Con origine `capacitor://...` il redirect dopo login/email potrebbe restare in-app; per link da email (magic link, reset password) il dominio deve essere raggiungibile dal browser (es. `https://pro.performanceprime.it/auth/callback`). In quel caso conviene **non** usare `window.location.origin** per emailRedirectTo ma un URL di produzione fissa, oppure una variabile d’ambiente.

- **Reset password (hardcodato):**  
  `PartnerResetPassword.tsx` riga 42:  
  `redirectTo: 'https://pro.performanceprime.it/partner/update-password'`  
  È già un URL assoluto di produzione; per l’app nativa potrebbe essere necessario aprire quella URL nel browser esterno o in InAppBrowser e poi tornare in app (deep link o custom scheme). Da definire in fase di setup mobile.

**Riepilogo:**  
- Da aggiornare/gestire per mobile: `return_url` Stripe e tutti i `redirectTo`/`emailRedirectTo` costruiti con `window.location.origin` quando l’app gira in Capacitor, più la gestione del ritorno da `https://pro.performanceprime.it/partner/update-password` in app nativa.

---

## 7. Verifica base in vite.config.ts

- **File:** `packages/app-pro/vite.config.ts`  
- **`base`:** **Non** impostato → Vite usa il default **`base: '/'`**.  
- **`build.outDir`:** Non impostato → default **`dist`** (quindi `packages/app-pro/dist/`).

Per Capacitor con app servita da file (file://) su alcuni progetti si usa `base: './'` per path relativi. Con `base: '/'` e WebView che carica da `file://` o da un server locale, i riferimenti assoluti tipo `/assets/...` potrebbero richiedere che la WebView sia configurata con la stessa “origin” (es. `capacitor://localhost` con server locale). Va verificato in fase di integrazione; eventuale cambio a `base: './'` andrebbe testato per non rompere routing e asset.

---

## Riferimenti rapidi

- Build output: `packages/app-pro/vite.config.ts` (nessun outDir/base) → `packages/app-pro/dist/`, `base: '/'`.
- Capacitor: root `package.json`, `capacitor.config.ts`, `android/`, `ios/`; app-pro senza dipendenze Capacitor.
- Service Worker: `packages/app-pro/public/sw.js`; registrazione in `src/services/pushNotificationService.ts` (righe 32, 37, 44, 85, 351).
- Redirect / origin: `AddStripeCardModal.tsx` 94; `useAuth.tsx` 99; `LoginPage.tsx` 65, 101, 130; `Step0Registration.tsx` 100; `PartnerResetPassword.tsx` 42.

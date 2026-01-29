# AUDIT COMPLETO PROGETTO PERFORMANCE PRIME PULSE
**Data:** 29 Gennaio 2026  
**Branch:** dev  
**Obiettivo:** Identificare tutti i problemi, inconsistenze, errori e potenziali bug senza modificare nulla.

---

## RIEPILOGO ESECUTIVO

| Categoria | Count |
|-----------|--------|
| Build | ✅ Success (con warning) |
| TypeScript | ✅ 0 errori |
| ESLint | ❌ ~350+ problemi (errori + warning) |
| Errori critici | 3 |
| Errori alti | 8+ |
| Errori medi | Molti (lint) |
| Edge Functions mancanti | 5 |
| Tabelle types vs codice | Schema types.ts obsoleto |

---

# SEZIONE A: ERRORI CRITICI (bloccanti)

## [CRITICO] Edge Functions referenziate in config.toml ma cartelle assenti

**File:** `supabase/config.toml` (righe 33-36)  
**Tipo:** Configurazione / Deploy  
**Descrizione:** Il file `config.toml` dichiara 5 funzioni i cui directory **non esistono** in `supabase/functions/`:
- `admin-stats`
- `admin-users`
- `admin-auth-validate`
- `n8n-webhook-proxy`
- `send-push-notification`

**Impatto:** Deploy Supabase Functions fallirà; le chiamate frontend a queste URL restituiranno 404 (SuperAdmin login, email welcome/reset, push notifications, admin stats/users).

**Soluzione suggerita:** Creare le 5 Edge Functions in `supabase/functions/<nome>/index.ts` e `deno.json` come da documentazione (SECRETS_SETUP.md, PROMPT_MASTER) oppure rimuovere le voci da config.toml se non più usate e adattare il frontend.

---

## [CRITICO] Schema TypeScript `types.ts` non allineato al database reale

**File:** `src/integrations/supabase/types.ts`  
**Tipo:** DB Mismatch  
**Descrizione:** Il file dichiara solo una parte delle tabelle effettivamente usate dal codice. **Mancano** (usate nel codice ma non in types):  
`professional_subscriptions`, `subscription_invoices`, `professional_notifications`, `professional_settings`, `professional_services`, `professional_availability`, `professional_blocked_periods`, `professional_languages`, `clients`, `projects`, `bookings`, `avatars`, `scheduled_notifications`, `push_subscriptions`, `reviews`, `workout_diary`, `workout_plans`, `user_onboarding_responses`, `onboarding_analytics`, `onboarding_obiettivo_principale`, `onboarding_esperienza`, `onboarding_preferenze`, `onboarding_personalizzazione`, `health_disclaimer_acknowledgments`, `workout_attachments`.

**Impatto:** Nessun type-safety per le query su queste tabelle; possibili errori a runtime e manutenzione difficile.

**Soluzione suggerita:** Eseguire `supabase gen types typescript` (o equivalente) per rigenerare i types dal DB reale e sostituire/estendere `src/integrations/supabase/types.ts`.

---

## [CRITICO] Tabella `professionals` in types con colonne deprecate

**File:** `src/integrations/supabase/types.ts` (professionals Row/Insert/Update)  
**Tipo:** DB Mismatch  
**Descrizione:** I types per `professionals` includono `password_hash`, `password_salt`, `reset_token`, `reset_requested_at` e struttura vecchia (company_name, vat_*, birth_place, ecc.). Secondo NOTE.md (21 Gen 2025) queste colonne sono state rimosse dal DB; la tabella reale usa `user_id`, `first_name`, `last_name`, `category`, `zona`, `bio`, `approval_status`, `specializzazioni`, ecc. (vedi migration `20250129140000_professionals_trigger_auth_signup.sql`).

**Impatto:** Insert/update da codice potrebbero usare campi inesistenti o mancare campi obbligatori; tipo `professionals` non utilizzabile per type-check corretto.

**Soluzione suggerita:** Allineare i types di `professionals` allo schema reale (migrazioni + Supabase schema) e rimuovere riferimenti a colonne deprecate.

---

# SEZIONE B: ERRORI ALTI (da fixare prima di nuove feature)

## [ALTO] Regex con surrogate pair senza flag `u` (FileAnalysisResults)

**File:** `src/components/schedule/FileAnalysisResults.tsx:75`  
**Tipo:** ESLint / Bug potenziale  
**Descrizione:** La regex usa caratteri Unicode (emoji) in una character class senza flag `u`, causando 20 errori ESLint `no-misleading-character-class` (Unexpected surrogate pair in character class. Use 'u' flag).

**Impatto:** Comportamento regex non garantito con emoji/Unicode in alcuni engine.

**Soluzione suggerita:** Aggiungere flag `u` alla regex, es. `.replace(/[...]/gu, '')`.

---

## [ALTO] Self-assignment in UserManagementTable

**File:** `src/components/admin/UserManagementTable.tsx:102`  
**Tipo:** ESLint no-self-assign  
**Descrizione:** `filtered = filtered` nel branch `default` del switch è un no-op e viene segnalato come self-assignment.

**Impatto:** Codice ridondante; nessun bug funzionale.

**Soluzione suggerita:** Rimuovere la riga `filtered = filtered` nel default (il `filtered` prima dello switch è già quello da usare) o sostituire con un commento.

---

## [ALTO] Variabili ambiente usate ma non dichiarate in vite-env.d.ts

**File:** `src/vite-env.d.ts`  
**Tipo:** TypeScript / Documentazione  
**Descrizione:** Il frontend usa `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PAYPAL_CLIENT_ID`, `VITE_PAYPAL_PLAN_ID`, `VITE_PAYPAL_MODE`, `VITE_ADMIN_EMAIL`, `VITE_ENABLE_PRIMEBOT` (e possibilmente altre) ma queste non sono dichiarate in `ImportMetaEnv`. Sono presenti solo: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_MODE, VITE_API_URL, VITE_DEBUG_MODE, VITE_EMAIL_VALIDATION_*.

**Impatto:** Uso di `import.meta.env.VITE_*` non tipizzato; possibili typo non rilevati.

**Soluzione suggerita:** Aggiungere in `vite-env.d.ts` le chiavi mancanti (readonly e opzionali dove serve).

---

## [ALTO] Tabelle referenziate nel codice potenzialmente assenti (PROMPT_MASTER)

**File:** Vari (primebotUserContextService, primebotConversationService, painTrackingService, ecc.)  
**Tipo:** DB Mismatch  
**Descrizione:** PROMPT_MASTER e NOTE segnalano che le tabelle `primebot_preferences`, `primebot_interactions`, `user_progress` sono “referenziate ma non esiste”. I types.ts le includono (primebot_preferences, primebot_interactions); `user_progress` non è nei types. Se nel DB non esistono, le query falliranno con errore tabella inesistente.

**Impatto:** PrimeBot e onboarding potrebbero andare in errore in produzione se le tabelle non sono state create.

**Soluzione suggerita:** Verificare in Supabase Dashboard (o con migrazioni) l’esistenza di `primebot_preferences`, `primebot_interactions`, `user_progress`. Creare migrazioni se mancanti o rimuovere l’uso dal codice.

---

## [ALTO] Tabella `users` nei types ma deprecata

**File:** `src/integrations/supabase/types.ts` (tabella `users`)  
**Tipo:** DB Mismatch  
**Descrizione:** NOTE.md (21 Gen 2025) indica “Rimossa tabella users duplicata, usare solo profiles”. Il tipo `users` è ancora definito in types.ts e potrebbe essere usato per errore.

**Impatto:** Rischio di query su tabella inesistente se qualcuno usa il tipo/table `users`.

**Soluzione suggerita:** Rimuovere la definizione `users` da types.ts dopo aver verificato che nessun codice faccia `.from('users')`; usare solo `profiles`.

---

## [ALTO] Chunk principale > 1000 KB

**File:** Build output (index-BAxUgwB9.js ~1,728 KB)  
**Tipo:** Performance  
**Descrizione:** Vite segnala: “Some chunks are larger than 1000 kB after minification”. Il bundle principale è ~1.73 MB (gzip ~473 KB).

**Impatto:** First load più lento su reti lente; possibile impatto LCP.

**Soluzione suggerita:** Code splitting (lazy route, manualChunks per vendor/primebot/pdf/recharts), già parzialmente in uso; aumentare `chunkSizeWarningLimit` solo come misura temporanea.

---

## [ALTO] Import dinamici che non splittano (warning build)

**File:** `src/lib/openai-service.ts`, `src/components/partner/settings/NotificationsModal.tsx`  
**Tipo:** Build warning  
**Descrizione:** Vite avvisa che moduli importati sia dinamicamente che staticamente non vengono spostati in un chunk separato (primebotConversationService, bodyPartExclusions, notificationSoundService).

**Impatto:** Bundle più grande del necessario; nessun crash.

**Soluzione suggerita:** Scegliere un solo tipo di import (solo dinamico o solo statico) per quei moduli per rispettare le aspettative di code splitting.

---

# SEZIONE C: ERRORI MEDI (da fixare appena possibile)

## [MEDIO] Uso massiccio di `any` (ESLint @typescript-eslint/no-explicit-any)

**File:** Molti (PrimeChat.tsx, WorkoutUploader, UserManagementTable, AgendaView, AddStripeCardModal, openai-service, primebot-fallback, supabase-retry, hooks, pages, ecc.)  
**Tipo:** Code quality  
**Descrizione:** Oltre 200 occorrenze di `any` segnalate da ESLint in tutto il progetto.

**Impatto:** Perdita di type safety; refactor e manutenzione più rischiosi.

**Soluzione suggerita:** Sostituire gradualmente con tipi specifici (unknown, generics, interfacce). Partire da file critici (auth, subscription, PrimeChat, servizi).

---

## [MEDIO] Dipendenze useEffect incomplete (react-hooks/exhaustive-deps)

**File:** PrimeChat.tsx (userId), ChatInterface.tsx (messages.length), ManageBlocksModal, AgendaView, DisponibilitaManager, AddClientModal, ClientDetailModal, ScheduleNotificationModal, AddProjectModal, AcceptPaymentMethodsModal, CancellationPolicyModal, CoverageAreaModal, LinguaModal, NotificationsModal, PaymentsModal, PrivacyModal, SocialLinksModal, SpecializzazioniModal, AddStripeCardModal, PlanModificationChat, GeneratingStep, GeneratingWeeklyStep, AppointmentCalendar, ActiveWorkout, QuickWorkout, WorkoutAttachments, useOnboardingData, useUserProfile, useSubscription, ecc.  
**Tipo:** ESLint / Bug potenziale  
**Descrizione:** Molti `useEffect` hanno array di dipendenze incompleti (mancano variabili usate nel body).

**Impatto:** Effetti che non si ri-eseguono quando cambiano dipendenze, o loop/aggiornamenti inattesi se aggiunte in modo errato; richiede analisi caso per caso.

**Soluzione suggerita:** Per ogni warning, decidere se aggiungere la dipendenza, wrappare in useCallback/useRef, o disabilitare con commento motivato.

---

## [MEDIO] Interface vuote / equivalenti al supertipo (no-empty-object-type)

**File:** `src/components/onboarding/OnboardingPreferencesCard.tsx` (empty interface + no-empty-pattern), `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`  
**Tipo:** ESLint  
**Descrizione:** Interface che non aggiungono proprietà o pattern vuoti.

**Soluzione suggerita:** Sostituire con `object`/`Record<string, never>` o estendere un tipo esistente; rimuovere pattern vuoti.

---

## [MEDIO] prefer-const e no-empty

**File:** AgendaView.tsx (profilesMap, value), PlanModificationChat.tsx (exerciseList), DisponibilitaManager, StartTodayButton (empty block), ecc.  
**Tipo:** ESLint  
**Descrizione:** Variabili mai riassegnate dichiarate con `let`; blocchi catch/else vuoti.

**Soluzione suggerita:** Usare `const` dove possibile; in blocchi vuoti aggiungere almeno un commento o `// no-op` se intenzionale.

---

## [MEDIO] Fast refresh (react-refresh/only-export-components)

**File:** badge.tsx, button.tsx, form.tsx, navigation-menu.tsx, sidebar.tsx, sonner.tsx, toggle.tsx, PrimeBotContext.tsx, useAuth.tsx, useNotes.tsx, useNotifications.tsx  
**Tipo:** ESLint warning  
**Descrizione:** File che esportano sia componenti sia costanti/funzioni; Fast Refresh potrebbe non aggiornare correttamente.

**Soluzione suggerita:** Spostare costanti/helper in file separati (es. `buttonVariants` in `button-utils.ts`) per mantenere solo export di componenti.

---

# SEZIONE D: ERRORI BASSI (miglioramenti)

## [BASSO] API folder in root (admin-operations, ai-chat, supabase-proxy)

**File:** `api/admin-operations.ts`, `api/ai-chat.ts`, `api/supabase-proxy.ts`  
**Tipo:** Lint / Organizzazione  
**Descrizione:** Contengono no-case-declarations e no-explicit-any; la cartella `api/` non è in `src/` e potrebbe essere per runtime diverso (es. Vercel).

**Impatto:** Solo lint e chiarezza progetto.

**Soluzione suggerita:** Allineare a ESLint (wrap case in block, tipizzare) e documentare se `api/` è usata da Vercel o altro host.

---

## [BASSO] useCallback con dipendenze “non necessarie”

**File:** useErrorHandler.tsx, useMedalSystem.tsx, useNotifications.tsx  
**Tipo:** ESLint react-hooks/exhaustive-deps  
**Descrizione:** Dipendenze ritenute non necessarie (logError, medalSystem, notifications).

**Soluzione suggerita:** Valutare se rimuoverle riduce re-render; altrimenti lasciare e disabilitare la regola con commento.

---

# SEZIONE E: INCONSISTENZE DATABASE/CODICE

## Tabelle usate nel codice (da grep `.from('...')`) e presenza in types.ts

| Tabella / bucket | In types.ts | Note |
|------------------|-------------|------|
| admin_audit_logs | ✅ | |
| admin_sessions | ✅ | |
| professionals | ✅ | Schema types obsoleto (password_hash, ecc.) |
| profiles | ✅ | |
| clients | ❌ | Mancante in types |
| projects | ❌ | Mancante in types |
| bookings | ❌ | Mancante in types |
| professional_availability | ❌ | Mancante in types |
| professional_settings | ❌ | Mancante in types |
| professional_services | ❌ | Mancante in types |
| professional_subscriptions | ❌ | Mancante in types |
| subscription_invoices | ❌ | Mancante in types |
| professional_notifications | ❌ | Mancante in types |
| professional_blocked_periods | ❌ | Mancante in types |
| professional_languages | ❌ | Mancante in types |
| avatars | ❌ | Mancante in types |
| custom_workouts | ✅ | |
| user_workout_stats | ✅ | |
| workout_diary | ❌ | Mancante in types |
| notes | ✅ | |
| primebot_preferences | ✅ | Potenzialmente assente nel DB (PROMPT_MASTER) |
| primebot_interactions | ✅ | Potenzialmente assente nel DB |
| user_onboarding_responses | ❌ | Mancante in types |
| workout_plans | ❌ | Mancante in types |
| openai_usage_logs | ✅ | |
| reviews | ❌ | Mancante in types |
| scheduled_notifications | ❌ | Mancante in types |
| push_subscriptions | ❌ | Mancante in types |
| user_objectives | ✅ | |
| workout_attachments | ❌ | Mancante in types |
| health_disclaimer_acknowledgments | ❌ | Mancante in types |
| onboarding_analytics | ❌ | Mancante in types |
| onboarding_obiettivo_principale | ❌ | Mancante in types |
| onboarding_esperienza | ❌ | Mancante in types |
| onboarding_preferenze | ❌ | Mancante in types |
| onboarding_personalizzazione | ❌ | Mancante in types |
| users | ✅ (in types) | Deprecata (NOTE: usare profiles) |
| workout-files | Storage bucket | N/A per types tabelle |

**Conclusione:** Lo schema in `src/integrations/supabase/types.ts` non riflette il database reale (mancano molte tabelle partner/onboarding/primebot); inoltre `professionals` e `users` sono obsoleti/deprecati.

---

# SEZIONE F: EDGE FUNCTIONS STATUS

## Funzioni presenti in `supabase/functions/`

| Funzione | Presente | CORS / Gestione errori |
|----------|----------|--------------------------|
| ensure-partner-subscription | ✅ | Da verificare |
| send-test-email | ✅ | Da verificare |
| stripe-create-customer | ✅ | Da verificare |
| stripe-create-subscription | ✅ | Da verificare |
| stripe-webhook | ✅ | CORS + try/catch (campione verificato) |
| stripe-cancel-subscription | ✅ | - |
| stripe-reactivate-subscription | ✅ | - |
| stripe-list-payment-methods | ✅ | - |
| stripe-set-default-payment-method | ✅ | - |
| stripe-detach-payment-method | ✅ | - |
| stripe-update-payment-method | ✅ | - |
| stripe-health-check | ✅ | - |
| stripe-test-import | ✅ | - |
| paypal-create-subscription | ✅ | - |
| paypal-cancel-subscription | ✅ | - |
| paypal-webhook | ✅ | - |
| subscription-reminders | ✅ | - |

## Funzioni in config.toml ma **NON** presenti come cartella

| Funzione | Chiamata da |
|----------|--------------|
| admin-stats | SuperAdminDashboard.tsx |
| admin-users | adminApi.ts (presumibile) |
| admin-auth-validate | useAdminAuthBypass.tsx |
| n8n-webhook-proxy | emailService.ts (welcome, passwordReset, verification) |
| send-push-notification | (notifiche push) |

**Nota:** `stripe-webhook` usa import dinamico corretto (`await import('https://esm.sh/stripe@...')`) e CORS da `_shared/cors.ts`. Altre funzioni andrebbero verificate per stesso pattern e variabili ambiente.

---

# SEZIONE G: DIPENDENZE PROBLEMATICHE

- **npm audit:** Non eseguito con successo (rete sandbox: `getaddrinfo ENOTFOUND registry.npmjs.org`). Eseguire manualmente: `npm audit` e `npm outdated`.
- **PROMPT_MASTER / NOTE:** Segnalate vulnerabilità su `pdfjs-dist`, `esbuild`, `path-to-regexp`, `undici`; sicurezza migrata su Edge Functions per admin e n8n.

**Raccomandazione:** Eseguire `npm audit` e `npm outdated` in ambiente con rete e aggiornare le dipendenze vulnerabili; verificare changelog prima di upgrade major.

---

# SEZIONE H: FILE DA RIMUOVERE/PULIRE

- **api/:** Se le API in `api/admin-operations.ts`, `api/ai-chat.ts`, `api/supabase-proxy.ts` non sono usate da nessun host (Vercel/Netlify), valutare rimozione o spostamento; altrimenti tenere e sistemare lint.
- **src/test/test-env.ts:** Usa `VITE_DEV_TEST_EMAIL` e `VITE_DEV_TEST_PASSWORD`; verificare se è ancora usato e se è incluso in build (escluso da produzione).
- **dist 2/:** Presenza di una cartella tipo `dist 2` (da grep) suggerisce possibile copia di build; da rimuovere se non necessaria.
- Nessun altro file “orfano” evidente dalla sola analisi; una ricerca con strumenti di dead-code (es. ts-prune, knip) può integrare questa sezione.

---

# SEZIONE I: RACCOMANDAZIONI PRIORITARIE

1. **Creare o ripristinare le 5 Edge Functions mancanti** (admin-stats, admin-users, admin-auth-validate, n8n-webhook-proxy, send-push-notification) e verificare che il deploy Supabase funzioni, oppure adattare config e frontend se si abbandonano.
2. **Allineare `src/integrations/supabase/types.ts` al database reale** (rigenerare da Supabase o da migrazioni) e rimuovere/deprecare `users` e colonne deprecate di `professionals`.
3. **Fixare FileAnalysisResults.tsx** aggiungendo il flag `u` alla regex (riga 75) per eliminare i 20 errori ESLint e il rischio Unicode.
4. **Rimuovere il self-assignment** in UserManagementTable.tsx (riga 102: `filtered = filtered`).
5. **Dichiarare in `vite-env.d.ts`** tutte le variabili `VITE_*` usate (Stripe, PayPal, Admin, PrimeBot, ecc.).
6. **Verificare in DB** l’esistenza di `primebot_preferences`, `primebot_interactions`, `user_onboarding_responses` e tabelle onboarding/partner; creare migrazioni se mancanti.
7. **Ridurre l’uso di `any`** partendo da auth, subscription, PrimeChat e servizi critici; introdurre tipi espliciti e `unknown` dove appropriato.
8. **Rivedere le dipendenze di `useEffect`** nei file con warning exhaustive-deps (AgendaView, AddStripeCardModal, PrimeChat, QuickWorkout, ActiveWorkout, ecc.) e correggere o documentare le eccezioni.
9. **Eseguire `npm audit` e `npm outdated`** con rete e pianificare aggiornamenti di sicurezza e versioni.
10. **Code splitting:** Ottimizzare chunk (lazy route, manualChunks) per portare il bundle principale sotto 1000 KB e risolvere i warning di import dinamico/statico duplicato.

---

# APPENDICE: COMANDI ESEGUITI E RISULTATI

- **npm run build:** Exit 0. Warning: dynamic/static import misti; chunk > 1000 KB.
- **npx tsc --noEmit:** Exit 0. Nessun errore TypeScript.
- **npm run lint:** Exit 1. ~350+ problemi ESLint (errori + warning).
- **npm audit:** Fallito (rete non disponibile in sandbox).
- **npm outdated:** Timeout (non completato).

Fine report. Nessuna modifica è stata applicata al codice.

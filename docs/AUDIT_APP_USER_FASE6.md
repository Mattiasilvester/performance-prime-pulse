# AUDIT APP-USER — FASE 6
## Data: 26 Febbraio 2026

---

## AVVISO CRITICO: DOVE STA L’APP UTENTI

**`packages/app-user/` è attualmente un guscio quasi vuoto.** Non contiene il codice sorgente dell’app B2C.

- **packages/app-user:** nessun `package.json`, nessuno script `build`/`dev`, solo `src/lib/debug/` (vuoto), una vecchia `dist/` (build del 3 feb), `.env` e `node_modules`. **Non è possibile eseguire `pnpm build:user` né `pnpm dev:user`** (script non presenti in root).
- **App utenti effettiva:** il codice dell’app Performance Prime (B2C) si trova nella **root del monorepo** (`/src`, vite dalla root). Build: `pnpm build`, dev: `pnpm dev` (porta **8080** in vite.config, non 5173).

L’audit sotto si riferisce al **codice reale dell’app utenti** (root `src/`) e allo **stato del package `packages/app-user`**. Il piano di fix include sia il ripristino/build dell’app in root sia la futura migrazione in `packages/app-user`.

---

## RIEPILOGO ESECUTIVO

| Metrica | Valore |
|--------|--------|
| Errori build (root) | **0** (build passa) |
| Errori TypeScript (root) | **7** (in 2 file admin) |
| File TS/TSX totali (root src) | **418** |
| File in packages/app-user/src | **0** (solo cartelle vuote) |
| Codice morto / file da ripulire | **3 file** + 1 backup |
| Dipendenze @pp/shared in root | **0** (root non usa shared) |
| Script build:user / dev:user | **Assenti** |
| Punteggio salute (app utenti = root) | **6/10** |

**Punteggio:** Build OK, 7 errori TS bloccanti per `tsc --noEmit`, TypeScript non strict, nessuna migrazione a `packages/app-user` effettuata.

---

## ERRORI BUILD (BLOCCANTI)

La **build Vite** dalla root **completa con successo** (`pnpm build`).  
I seguenti errori compaiono solo con **`pnpm exec tsc --noEmit`** (type-check senza emit).

### Errori TypeScript (7 in 2 file)

| File | Riga | Errore |
|------|------|--------|
| `src/components/admin/AdminKpiAggiuntivi.tsx` | 14 | `Property 'churnB2BCanceledCount' does not exist on type '{}'.` |
| `src/components/admin/AdminKpiAggiuntivi.tsx` | 15 | `Property 'bookingCompletionRate' does not exist on type '{}'.` |
| `src/components/admin/AdminKpiAggiuntivi.tsx` | 16 | `Property 'cancellationsInScadenza' does not exist on type '{}'.` |
| `src/components/admin/AdminKpiAggiuntivi.tsx` | 17 | `Property 'b2cActiveCount' does not exist on type '{}'.` |
| `src/components/admin/AdminKpiAggiuntivi.tsx` | 18 | `Property 'b2cTotalCount' does not exist on type '{}'.` |
| `src/components/admin/AdminKpiAggiuntivi.tsx` | 19 | `Property 'b2cActivePercent' does not exist on type '{}'.` |
| `src/components/admin/PulseCheckCards.tsx` | 94 | `Conversion of type 'PulseCheck' to type 'Record<string, number>' may be a mistake...` |

**Causa:**  
- **AdminKpiAggiuntivi:** `const pc = pulseCheck ?? {}` fa sì che `pc` sia tipizzato come `PulseCheck | {}`. Quando è `{}`, TypeScript non riconosce le proprietà di `PulseCheck`.  
- **PulseCheckCards:** cast diretto `(pc as Record<string, number>)` considerato insicuro.

**Fix suggeriti (solo riferimento, non applicati):**

```ts
// AdminKpiAggiuntivi.tsx — sostituire:
const pc = pulseCheck ?? {}
// con:
const pc: PulseCheck = pulseCheck ?? ({} as PulseCheck)
// oppure definire un default: const DEFAULT_PULSE: PulseCheck = { ... } e usare pulseCheck ?? DEFAULT_PULSE
```

```ts
// PulseCheckCards.tsx riga 94 — cast sicuro:
{(pc as unknown as Record<string, number>)[key] ?? 0}
```

---

## DIPENDENZE

### packages/app-user

- **Non esiste `packages/app-user/package.json`.** Non è possibile confrontare dipendenze con app-pro.  
- In `packages/app-user/node_modules` è presente il link `@pp/shared` (workspace), residuo di un precedente setup.

### Root (app utenti) vs packages/app-pro

| Aspetto | Root (app utenti) | packages/app-pro |
|--------|--------------------|------------------|
| @pp/shared | **No** | Sì `"@pp/shared": "workspace:*"` |
| Supabase | `@supabase/supabase-js` (locale `@/integrations/supabase/client`) | `@pp/shared` + Supabase |
| React | ^18.3.1 | ^18.3.1 |
| Vite | ^5.4.21 | ^5.4.0 |
| Altre | Radix, Tailwind, Recharts, jspdf, tesseract, OpenAI, ecc. | Stripe, Radix, Recharts, jspdf-autotable, ecc. |

**Mancanze in root (rispetto a un ipotetico app-user allineato ad app-pro):**

- Nessun riferimento a `@pp/shared` (client Supabase e auth sono locali).
- Root ha molte dipendenze in più (es. lovable-tagger, pdfjs-dist, tesseract.js, qrcode, canvas-confetti, ecc.) perché include sia B2C sia parti PrimePro e admin.

**Quando si creerà/migrerà `packages/app-user`:**

1. Aggiungere `package.json` con `"@pp/shared": "workspace:*"` e dipendenze coerenti con app-pro (React, Supabase, Radix, Tailwind, Vite, ecc.).
2. Sostituire gradualmente `@/integrations/supabase/client` con client/esport da `@pp/shared` (e variabili `VITE_SUPABASE_*`).

---

## CODICE MORTO

### File da eliminare o spostare (root src)

| File | Motivazione |
|------|-------------|
| `src/components/PrimeChat.tsx.backup` | Backup non necessario in repo. |
| `src/test/test-env.ts` | File di test/env, non usato in build. |
| `src/test-onboarding-service.ts` | Test/utility, verificare se usato; altrimenti rimuovere o spostare in test. |

### Residui Voiceflow

- **Solo commenti:** in `src/components/PrimeChat.tsx` (righe 164, 298): `// Voiceflow rimosso - ora usa solo OpenAI`. Nessun import o chiamata Voiceflow. Opzionale: rimuovere i commenti per pulizia.

### PWA / Service worker

- **sw.js** è usato intenzionalmente per le **notifiche push** (`src/main.tsx`, `src/services/pushNotificationService.ts`). Non è Progressier.  
- Nessun riferimento a Progressier nel codice.

### packages/app-user

- `packages/app-user/src/lib/debug/` è vuoto. Valutare rimozione se inutile.
- `packages/app-user/dist/` è una build storica (3 feb); può essere ignorata o rimossa quando app-user avrà un proprio build.

---

## FUNZIONALITÀ — MAPPA COMPLETA

Stato dedotto da route, componenti e documentazione. La colonna “Funziona?” è da validare con test manuali.

| Feature | File principali | Funziona? | Note |
|---------|-----------------|-----------|------|
| Landing Page | `NewLandingPage.tsx`, `LandingOrPartnerRedirect` | Sì* | *Redirect se hostname primepro → /partner |
| Login/Registrazione | `LoginPage`, `RegisterPage`, `useAuth` | Sì | Supabase Auth |
| Google Login | `LoginPage` (handleGoogleLogin), `Step0Registration` (handleGoogleSignIn) | Da verificare | signInWithOAuth({ provider: 'google' }). Errore 500 tipicamente da redirect URL / Supabase Auth config |
| Dashboard Utente | `Dashboard`, route `/dashboard` | Sì | ProtectedRoute |
| PrimeBot (AI Coach) | `AICoach`, `PrimeChat`, `openai-service`, `primebot-fallback` | Sì | OpenAI GPT-4o-mini, fallback preimpostati |
| Quick Workout | `QuickWorkout`, route `/workout/quick` | Sì | |
| Schede Allenamento | `Workouts`, `WorkoutCategories`, `ActiveWorkout` | Sì | |
| Piano Personalizzato | `PlansPage`, `PlanCreationPage`, `ActivePlansPage` | Sì | |
| Diario Workout | `DiaryPage`, `DiaryNotesPage` | Sì | |
| Profilo Utente | `Profile`, `PersonalInfo`, `Security`, `Notifications`, ecc. | Sì | |
| Sfida 7 Giorni + Medaglie | `StatsOverview`, `useMedalSystem`, `challengeTracking` | Sì | |
| Note/Appunti | `DiaryNotesPage` | Sì | |
| Calendario/Schedule | `Schedule`, route `/schedule` | Sì | |
| Prenotazioni (lato utente) | Route partner: `PrenotazioniPage` (PrimePro) | N/A | B2C: professionisti in `Professionals`, `ProfessionalDetail` |
| Ricerca Professionisti | `Professionals`, `ProfessionalDetail` | Sì | |
| SuperAdmin | `SuperAdminLogin`, `AdminGuard`, `AdminLayout`, route `/nexus-prime-control` | Sì | Presente; da tenere o rimuovere a seconda della strategia prodotto |
| Route Partner (PrimePro) | `PartnerDashboard`, `OverviewPage`, `CalendarioPage`, ecc. | Sì | Stesso codebase root: app B2C + PrimePro |

---

## AUTENTICAZIONE

- **Meccanismo:** Supabase Auth (`supabase.auth.getSession()`, `onAuthStateChange`) + `AuthProvider` (hook `useAuth`) in root.
- **Client Supabase:** `src/integrations/supabase/client.ts` (createClient con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Non usa `@pp/shared`.
- **Protezione route:** `ProtectedRoute` avvolge le route riservate; riceve `session` e reindirizza se non autenticato.
- **Google Login:**  
  - `LoginPage.tsx`: `handleGoogleLogin` → `supabase.auth.signInWithOAuth({ provider: 'google' })`.  
  - `Step0Registration.tsx`: `handleGoogleSignIn` stesso pattern.  
  - Un eventuale 500 è in genere legato a: redirect URL non autorizzati in Supabase Dashboard (Authentication → URL Configuration), o errore lato Supabase Auth. Verificare URL di redirect e log Supabase.

---

## IMPORT @pp/shared

- **In root (`src/`):** **nessun import** da `@pp/shared`. L’app utenti usa solo codice e client locali.
- **In packages/app-user:** non c’è codice sorgente da analizzare; solo cartelle vuote.
- **packages/shared:** espone `supabase` (client condizionato a env) e `AuthProvider`. Per una futura app-user in `packages/app-user` andranno aggiunti import da `@pp/shared` e allineamento env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## SUPABASE CLIENT E ENV

- **Root:** client in `src/integrations/supabase/client.ts`; legge `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Se `VITE_SUPABASE_ANON_KEY` manca, throw.
- **File env presenti:**  
  - Root: `.env.local`, `env.example`.  
  - packages/app-pro: `.env`, `.env.example`.  
  - packages/app-user: `.env` (presente; nessun `package.json` per caricarlo in build).
- **packages/app-user:** non ha entry point né build; il `.env` non è usato in alcuno script attuale. Per un futuro `packages/app-user` andrà creato anche `.env.example` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

---

## TYPESCRIPT STRICT

- **tsconfig.json (root):**  
  - `"strict": false`  
  - `"strictNullChecks": false`  
  - `"noImplicitAny": false`  
  Quindi TypeScript **non** è in modalità strict.
- **@ts-ignore:** 1 occorrenza in `src/services/AdvancedWorkoutAnalyzer.ts` (riga 271, commento “pdfjs-dist types issue”).
- **Uso di `any`:** ~85 occorrenze di `: any` o `as any` in `src/` (conteggio grep). Da ridurre progressivamente se si vuole avvicinarsi a strict.

---

## VITE CONFIG (ROOT)

- **File:** `vite.config.ts` (root).
- **Porta dev:** `server.port: 8080` (non 5173).
- **Alias:** `@` → `./src`, `@components`, `@hooks`, `@services`, `@lib`, `@utils`, `@pages`, `@types` tutti su `./src`. Configurazione corretta.
- **Plugin:** react (swc), lovable-tagger (dev), rollup-plugin-visualizer (build), middleware no-store in dev. Nessun proxy verso localhost non necessario; proxy `/api/supabase-proxy` verso Supabase per token grandi.
- **Build:** nessuna opzione particolare che impedisca la build; ottimizzazioni (es. chunk) già presenti.

---

## PIANO DI FIX (PRIORITIZZATO)

### P0 — Bloccanti (type-check e script)

1. **Fixare i 7 errori TypeScript** in `AdminKpiAggiuntivi.tsx` e `PulseCheckCards.tsx` (vedi sezione ERRORI BUILD) così che `pnpm exec tsc --noEmit` passi.
2. **Aggiungere script root** (opzionale ma consigliato per coerenza monorepo):
   - `"dev:user": "vite --port 5173"` (o altro port) e/o
   - `"build:user": "vite build"`  
   così che “app utenti” abbia comandi espliciti anche finché il codice resta in root.

### P1 — Critici (app funzionante)

3. **Verificare Google Login** in staging/prod: redirect URL in Supabase, eventuali 500 e log.
4. **Confermare variabili env** per produzione (root): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (e altre eventuali).

### P2 — Importanti (migrazione e qualità)

5. **Decidere se mantenere SuperAdmin** nell’app utenti (`/nexus-prime-control`). Se no: rimuovere route e componenti admin dall’app B2C (o spostarli in app-pro).
6. **Pulizia codice morto:** rimuovere `PrimeChat.tsx.backup`, valutare `src/test/test-env.ts` e `src/test-onboarding-service.ts` (eliminare o spostare in test).
7. **Creare `packages/app-user` come package reale:** aggiungere `package.json`, `tsconfig.json`, `vite.config.ts`; copiare da root solo il codice B2C necessario; introdurre `@pp/shared` e script `dev`/`build`; aggiungere in root `dev:user`/`build:user` che eseguono `pnpm -C packages/app-user dev` / `build`.

### P3 — Cleanup e ottimizzazioni

8. Rimuovere commenti “Voiceflow rimosso” in `PrimeChat.tsx` se si vuole pulizia.
9. Ridurre uso di `any` e abilitare gradualmente `strict` (o `strictNullChecks`) in tsconfig.
10. Valutare rimozione cartella vuota `packages/app-user/src/lib/debug` e vecchia `packages/app-user/dist` quando app-user sarà attiva come package.

---

## STIMA EFFORT

| Priorità | Attività | Stima |
|----------|----------|--------|
| P0 | Fix 7 errori TS + (opz.) script dev:user/build:user | 0.5–1 h |
| P1 | Verifica Google Login + env prod | 0.5–1 h |
| P2 | Pulizia file morti + decisione SuperAdmin + setup package app-user | 2–5 h (setup package dipende da scope migrazione) |
| P3 | Commenti Voiceflow, riduzione any, strict, pulizia cartelle app-user | 1–3 h |

---

## COMANDI UTILI

```bash
# Build app utenti (codice in root)
pnpm build

# Type-check (fallisce finché non si correggono i 7 errori)
pnpm exec tsc --noEmit

# Dev app utenti (root, porta 8080)
pnpm dev

# Cercare residui Voiceflow
grep -r "voiceflow\|Voiceflow\|VF_API" src/ --include="*.ts" --include="*.tsx"

# Cercare file backup/test
find src -name "*.backup" -o -name "test-*.ts" -o -name "test-*.tsx"
```

---

*Audit completato il 26 Febbraio 2026. Nessuna modifica applicata al codice; solo analisi e report.*

---

## STEP 0.3b — MIGRAZIONE HOOKS (26 Febbraio 2026)

### Completato

| Voce | Valore |
|------|--------|
| Hooks copiati | **21** |
| Contexts copiati | **1** (PrimeBotContext.tsx) |
| Stores copiati | **2** (onboardingStore, planCreationStore) |
| i18n | **SÌ** (en.json, it.json) |
| vite-env.d.ts | **CREATO** (`/// <reference types="vite/client" />`) |
| File totali in app-user | **84** (.ts/.tsx) |
| Import problematici | **1** risolto (useProfessionalId → professionalAuthService.stub); use-toast dipende da `@/components/ui/toast` (Step 0.3c) |
| Errori import.meta.env | **SÌ** risolti |
| Build app-user | **FAIL** (atteso — mancano componenti/pagine) |
| Build app-pro | **OK** |
| Build root | **OK** |

### Errori build app-user (13 totali, primi 10)

1. `exerciseGifs.ts` (23, 41) — `Promise<Record<string, string> | null>` non assegnabile a `Record<string, string>`
2. `use-toast.ts` (6) — Cannot find module `@/components/ui/toast`
3. `use-toast.ts` (158) — Parameter 'open' implicitly has 'any' type
4. `openai-service.ts` (346, 351, 759, 813) — `successData.choices` possibly undefined
5. `analytics.ts` (161, 167, 173, 179) — `string | undefined` non assegnabile a `string | number | boolean`
6. `reviewsService.ts` (333) — `service_name: string | null` vs `string | undefined`

### File aggiunti in Step 0.3b

- `packages/app-user/src/vite-env.d.ts`
- `packages/app-user/src/services/professionalAuthService.stub.ts`
- Modifica `packages/app-user/src/hooks/useProfessionalId.ts` (import da stub)

---

## STEP 0.3c — MIGRAZIONE COMPONENTI UI (26 Febbraio 2026)

### Completato

| Voce | Valore |
|------|--------|
| Componenti shadcn/ui copiati | **55** |
| Cartelle componenti B2C copiate | ai, auth, dashboard, diary, feedback, layout, legal, medals, notes, notifications, onboarding, plans, primebot, professionals, profile, schedule, user, workouts |
| Componenti standalone copiati | PrimeChat, MobileScrollFix, ErrorBoundary, ProtectedRoute, DaySelector, ManualWorkoutInput, ProgressChart, QRCode, WorkoutResults, SchedaView, WorkoutUploader, OnboardingBot (+ .css dove presenti) |
| File admin/partner rimossi | **0** (nessuno copiato; ProfessionalsList.tsx lasciato — lista professionisti B2C) |
| Assets public/ copiati | **SÌ** (_redirects, clear-auth.html, data, images, robots.txt, sitemap.xml) |
| Servizi aggiuntivi | professionalsService.ts, weeklyPlanGenerator.ts (per MatchQuiz e GeneratingWeeklyStep) |
| File totali in app-user | **230** (.ts/.tsx) |
| Componenti (solo .tsx/.ts in components/) | **145** |
| Import problematici | 2 risolti copiando professionalsService e weeklyPlanGenerator |
| Build app-user errori | **54** (erano 13 — aumentati per nuovi componenti con TS strict) |
| Build app-pro | **OK** |
| Build root | **OK** |

### Errori build app-user (54 totali, categorie)

- **exerciseGifs.ts** — null vs Record (2)
- **openai-service.ts** — choices possibly undefined (4)
- **analytics.ts** — string \| undefined (4)
- **reviewsService.ts** — service_name null vs undefined (1)
- **PrimeChat.tsx** — Msg.text string \| undefined, NavigateFunction (4)
- **SchedaView.tsx** — possibly undefined (12)
- **WorkoutCreationModal.tsx** — exercisesData implicit any (5)
- **WorkoutViewModal.tsx** — overload, unknown (2)
- **PlanPreview.tsx** — unknown vs Record (1)
- **fast-date-picker.tsx** — Date \| null vs Matcher (2)
- **CustomWorkoutDisplay.tsx** — undefined index (1)
- **Workouts.tsx** — GeneratedWorkoutShape meta.duration (1)

---

## STEP 0.3d/e — PAGINE, ROUTING, LANDING, APP (26 Febbraio 2026)

### Completato

| Voce | Valore |
|------|--------|
| Pagine B2C copiate | **31** (auth, diary, landing, onboarding, piani, settings + root: NotFound, PrivacyPolicy, ProfessionalDetail, Professionals, QuickWorkout, ResetPassword, Subscriptions, TermsAndConditions, Timer) |
| Landing page | **SÌ** (landing-new + landing/BackToTopButton, pages/landing/NewLandingPage) |
| Assets | **SÌ** (src/assets/images, src/styles/mobile-fix.css) |
| App.tsx | **RISCRITTO** — sole route B2C, AuthProvider, NotificationProvider, PrimeBotProvider, ProtectedRoute, no partner/admin |
| main.tsx | **ADATTATO** — index.css + mobile-fix.css, no admin-override, bonifica SW, safeGetElement |
| index.css | **COPIATO** dalla root |
| Servizio aggiuntivo | availabilityOverrideService.ts (per ProfessionalDetail) |
| File totali in app-user | **273** (.ts/.tsx) |
| File partner/admin in pages | **0** |
| Build app-user errori | **69** (erano 54 — nuovi errori da pagine onboarding, Step5HealthLimitations, ecc.) |
| Build app-pro | **OK** |
| Build root | **OK** |
| Dipendenze npm aggiunte | **nessuna** |

### Errori build app-user (69 totali, nuove categorie 0.3d/e)

- **OnboardingPage.tsx** — null vs undefined per obiettivo, livello, giorni, ecc. (12)
- **Step5HealthLimitations.tsx** — limitazioniFisiche/condizioniMediche null vs string \| undefined (4)
- **ProfessionalDetail.tsx** — risolto copiando availabilityOverrideService
- Resto invariato rispetto a 0.3c (exerciseGifs, openai-service, analytics, reviewsService, PrimeChat, SchedaView, schedule, ui/fast-date-picker, workouts, ecc.)

---

## STEP 0.3f — BUILD FIX PASS (26 Febbraio 2026)

### Completato

| Voce | Valore |
|------|--------|
| Errori iniziali | **69** |
| Errori finali | **0** |
| Build app-user | **OK** |
| Build app-pro | **OK** |
| Build root | **OK** |
| Dipendenze npm aggiunte | **nessuna** |
| File rimossi (admin/partner) | **nessuno** |

### File modificati (fix tipi / null-safety)

- **data/exerciseGifs.ts** — Promise/Record null → fallback `{}`, tipo esplicito async
- **services/analytics.ts** — `planType`/`workoutType`/`setting`/`plan` string \| undefined → `?? ''`
- **services/reviewsService.ts** — `service_name: null` → `?? undefined`
- **lib/openai-service.ts** — `successData.choices?.[0]?.message?.content ?? ''` (optional chaining)
- **pages/onboarding/OnboardingPage.tsx** — campi existingData `?? undefined` per store
- **pages/onboarding/steps/Step5HealthLimitations.tsx** — payload `null` → `undefined`
- **components/auth/RegistrationForm.tsx** — import `@/services/emailValidation`, debounce generic `A extends unknown[]`
- **services/emailValidation.d.ts** — dichiarazione modulo per .js
- **tsconfig.app.json** — `allowJs: true` per emailValidation.js
- **components/SchedaView.tsx** — optional chaining `scheda.metadata?.`, `scheda.riscaldamento?.`, ecc.
- **components/ai/AICoach.tsx** — `sendMessage?.(aiMessage)`, goalLabel da planData.goal
- **components/ai/ChatInterface.tsx** — `navigation: generateNavigation(text) ?? undefined`
- **components/dashboard/StatsOverview.tsx** — `medalData?.state`, `medalData?.icon`, `medalData?.progress`
- **components/diary/StatsWidget.tsx** — `setMetrics(metricsData as UserStats \| null)`
- **components/diary/WorkoutDetailsModal.tsx** — cast `entry.exercises` per map/filter, `Intl.DateTimeFormatOptions` per toLocaleDateString
- **components/plans/PlanPreview.tsx** — `(exercises as Record<string, unknown>[]).map(...)`
- **components/PrimeChat.tsx** — `text: planResponse.question ?? ''` (3 punti), executeAction con wrapper `(path, state) => navigate(path, { state })`
- **components/schedule/WorkoutCreationModal.tsx** — `exercisesData: Record<string, unknown>[]`, cast `as unknown as Record<string, unknown>[]`
- **components/schedule/WorkoutViewModal.tsx** — `new Date(workout.scheduled_date ?? '')`, cast `workout.exercises` per map
- **components/ui/fast-date-picker.tsx** — `selected={date ?? undefined}`, `onDateChange(selectedDate ?? null)`
- **components/workouts/CustomWorkoutDisplay.tsx** — `typeKey = workout.workout_type ?? 'personalizzato'`
- **components/workouts/Workouts.tsx** — `GeneratedWorkoutShape.meta.duration` → `number \| string`, wrapper onStartWorkout con `generatedWorkout ?? null`
- **components/ui/menubar.tsx** — `const MenubarMenu: typeof MenubarPrimitive.Menu = ...` (portabilità tipo Radix)

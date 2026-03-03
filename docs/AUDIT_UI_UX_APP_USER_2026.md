# Audit UI/UX — Performance Prime (app utenti)

**Data:** 2 marzo 2026  
**Scope:** `packages/app-user/`  
**Branch:** dev  
**Nessuna modifica al codice — solo analisi.**

---

## 1. STRUTTURA NAVIGAZIONE

### Bottom navbar (5 voci)

| Voce           | Icona    | Route           |
|----------------|----------|------------------|
| Dashboard      | Home     | `/dashboard`     |
| Allenamento    | Dumbbell | `/workouts`      |
| Appuntamenti   | Calendar | `/schedule`      |
| Professionisti | Users    | `/professionals`|
| Profilo        | User     | `/profile`       |

**File:** `src/components/layout/BottomNavigation.tsx`

- Stile: `backdrop-blur-xl bg-black/20`, bordo superiore, altezza h-16. Voce attiva: `text-yellow-400`, inattiva: `text-white/70`. z-index 9999.

### Hamburger menu (Header)

Aperto dal pulsante Menu (≡) in header. Contiene:

- **Navigazione:** Dashboard (/), Diario (/diary), Note (/diary/notes), Allenamenti (/workouts), PrimeBot (/ai-coach), Abbonamenti (/subscriptions), Profilo (/profile)
- **Legale:** Termini e Condizioni (/terms-and-conditions), Privacy Policy (/privacy-policy)
- **Header:** Nome utente / email, “Utente Premium”

**File:** `src/components/layout/Header.tsx` (DropdownMenu con `secondaryNavigationItems`)

### Altre azioni in header

- **Ricerca (lente):** overlay sotto l’header con input e risultati che linkano a dashboard, diario, allenamenti, ai-coach, profilo.
- **Notifiche (campanella):** Popover con lista notifiche, “Segna tutte come lette”, rimozione singola, badge con `unreadCount`.

### Route totali (lista)

| Path | Descrizione |
|------|-------------|
| `/` | Landing (NewLandingPage) |
| `/onboarding` | Onboarding multi-step |
| `/auth`, `/auth/login` | Login |
| `/auth/register` | Registrazione |
| `/terms-and-conditions` | Termini |
| `/privacy-policy` | Privacy policy |
| `/dashboard` | Home dopo login |
| `/workouts` | Allenamenti (categorie + attivo) |
| `/diary` | Diario allenamenti |
| `/diary/notes` | Note diario |
| `/workout/quick` | Allenamento rapido 10 min (senza header/bottom nav) |
| `/timer` | Timer generico |
| `/schedule` | Calendario / appuntamenti |
| `/ai-coach` | PrimeBot + Insights AI |
| `/subscriptions` | Abbonamenti |
| `/professionals` | Lista professionisti |
| `/professionals/:id` | Dettaglio professionista |
| `/profile` | Profilo utente |
| `/piani` | Lista piani |
| `/piani/nuovo` | Creazione piano |
| `/piani-attivi` | Piani attivi |
| `/settings/personal-info` | Dati personali |
| `/settings/security` | Password e sicurezza |
| `/settings/notifications` | Notifiche |
| `/settings/language` | Lingua e regione |
| `/settings/privacy` | Privacy |
| `/settings/help` | Centro assistenza |
| `*` | NotFound |

**File:** `src/App.tsx`

---

## 2. DASHBOARD (pagina home dopo login)

### Card / KPI

- **StatsOverview:** 4 card statistiche (es. total workout, ore totali, obiettivi) + card medaglie/sfida 7 giorni (Kickoff Champion). Click su medaglia apre ChallengeModal.
- **File:** `src/components/dashboard/StatsOverview.tsx`

### Sezioni

1. **Saluto + logout:** “Ciao, {userName}!”, “Pronto per superare i tuoi limiti oggi?”, bottone Logout.
2. **OnboardingBot:** messaggio/CTA per nuovi utenti (invio messaggio / focus chat).
3. **StatsOverview:** KPI e medaglie (lazy).
4. **CTA principale:** bottone “Avvia allenamento rapido (10')” → `/workout/quick` (gradient oro/giallo, full width).
5. **QuickActions:** azioni rapide (Calendario, Timer, PrimeBot, Allenamento, Nuovo obiettivo, Piani salvati) con modal obiettivo e modal piani (lazy).
6. **Griglia 2 colonne (lg):** WeeklyProgress (progressi settimanali) + RecentActivity (attività recente).

**File:** `src/components/dashboard/Dashboard.tsx`, `QuickActions.tsx`, `WeeklyProgress.tsx`, `RecentActivity.tsx`, `OnboardingBot.tsx`

### CTA / pulsanti

- “Avvia allenamento rapido (10')” (navigate `/workout/quick`).
- Logout (rosso).
- QuickActions: navigazione a schedule, timer, ai-coach, workouts, modale obiettivo, modale piani.

### FAB (floating action button) in basso a destra

- **Sì:** FeedbackWidget — bottone circolare blu (`bg-blue-600`), icona MessageCircle, posizione `bottom: 96px`, `right: 16px`, z-index 1000. Apre form Tally (data-tally-open="mDL24Z"). Nascosto su `/timer`.
- **File:** `src/components/feedback/FeedbackWidget.tsx`

---

## 3. SEZIONE ALLENAMENTO

### Pagina Allenamenti (`/workouts`)

- **WorkoutCategories:** 4 categorie (Cardio, Forza, HIIT, Mobilità). Per Forza/HIIT (e altre) si possono aprire filtri (gruppo muscolare, attrezzatura, durata, livello) e generare workout con `workoutGenerator`.
- **Avvio:** click “INIZIA” avvia workout generato o da DB; si passa a **ActiveWorkout** (esecuzione con timer per esercizio) o **CustomWorkoutDisplay** (workout custom/da file).
- **Chiusura:** ritorno alla griglia categorie.
- **File:** `src/components/workouts/Workouts.tsx`, `WorkoutCategories.tsx`, `ActiveWorkout.tsx`, `CustomWorkoutDisplay.tsx`, `src/services/workoutGenerator.ts`

### Quick workout (`/workout/quick`)

- **Flusso:** circuito 10 min (riscaldamento, corpo principale, defaticamento). Timer per ogni esercizio e fase di riposo; stati: ready, running, paused, rest, completed, resume-prompt.
- **Funzionalità:** PushPermissionModal (notifiche), integrazione sfida 7 giorni (trackWorkoutForChallenge), salvataggio su diario (diaryService), ChallengeNotification al completamento.
- **Layout:** senza Header/BottomNav; contenuto a tutta pagina.
- **File:** `src/pages/QuickWorkout.tsx`, `src/utils/challengeTracking.ts`, `src/hooks/useMedalSystem.tsx`

### Creazione workout personalizzato

- **Da calendario:** in `/schedule`, click su un giorno apre **WorkoutCreationModal** (titolo, tipo, durata, esercizi, data); salvataggio su `custom_workouts`.
- **Da file:** flusso che porta a Workouts con `location.state` (customExercises, workoutTitle, ecc.) e avvio in ActiveWorkout o CustomWorkoutDisplay.
- **File:** `src/components/schedule/WorkoutCreationModal.tsx`, `src/components/schedule/Schedule.tsx`, `src/components/workouts/Workouts.tsx`

### Piani di allenamento

- **Lista (`/piani`):** PlansPage con PlanCard e CreatePlanCard; fetch da planService; azioni “Avvia” e “Elimina”.
- **Creazione (`/piani/nuovo`):** WelcomeModal → PlanTypeSelector (Giornaliero / Settimanale) → step tipo piano (DailyPlanStep1–3 o WeeklyPlanStep1–5) → GeneratingStep/GeneratingWeeklyStep → PrimeBotExplanation → PlanPreview → PlanModificationChat → salvataggio.
- **Piani attivi (`/piani-attivi`):** ActivePlansPage.
- **File:** `src/pages/piani/PlansPage.tsx`, `PlanCreationPage.tsx`, `ActivePlansPage.tsx`, `src/components/plans/*`, `src/services/planService.ts`, `src/stores/planCreationStore.ts`

### Timer (`/timer`)

- Pagina con **WorkoutTimer:** cronometro count-up/countdown, input ore/minuti/secondi, play/pause/reset, fase riposo (rest phase) opzionale. Supporta `autoStartTime` e `autoStartRest` da props.
- **File:** `src/pages/Timer.tsx`, `src/components/workouts/WorkoutTimer.tsx`

---

## 4. PRIMEBOT (AI Coach)

### Accesso

- **Route:** `/ai-coach`.
- **Da header:** menu hamburger → “PrimeBot” (/ai-coach).
- **Da dashboard:** QuickActions → “PrimeBot”.

### Interfaccia

- **Tab:** “PrimeBot” e “Insights AI” (tab bar in pagina).
- **PrimeBot:** layout a 2 colonne (lg): a sinistra **PrimeChat** (chat a tutta larghezza), a destra pannello “Azioni Rapide” (Crea Piano Personalizzato) e “Suggerimenti AI”. Azioni e Suggerimenti hanno overlay “Funzionalità in arrivo” (bloccati).
- **Modal piano:** CustomPlanModal (obiettivo, titolo, dettagli) che al salvataggio invia un messaggio alla chat (generateAIPlan) per generare il piano via AI.
- **PrimeChat:** input in basso, messaggi utente/assistente, risposte con markdown (grassetto/corsivo), suggerimenti rapidi; in fullscreen (da AICoachPrime) header con logo PrimeBot e pulsante chiudi.

### Funzionalità

- **Risposte preimpostate:** `getPrimeBotFallbackResponse` per frasi tipo “non ho tempo”, “quick workout”, ecc. (con bottoni navigazione).
- **Risposte AI:** `getAIResponse` (OpenAI) per richieste libere e generazione piani.
- **Insights AI:** tab separata (AIInsights), contenuto dedicato.

**File:** `src/components/ai/AICoach.tsx`, `AICoachPrime.tsx`, `PrimeChat.tsx`, `CustomPlanModal.tsx`, `AIInsights.tsx`, `src/lib/openai-service.ts`, `src/lib/primebot-fallback.ts`, `src/contexts/PrimeBotContext.tsx`

---

## 5. PROFESSIONISTI

### Pagina lista (`/professionals`)

- **Filtri:** category (PROFESSIONAL_CATEGORIES), modalita, prezzo_fascia, zona; pannello filtri (showFilters) con Search/Filter.
- **Modalità:** “Lista” e “Match”; in Match si apre **MatchQuiz** e si ottengono **getMatchedProfessionals**.
- **Card:** nome, categoria, prezzo (servizi o prezzo_seduta o prezzo_fascia), badge partner/trial, CTA “Vedi profilo” → `/professionals/:id`. Scroll position salvata in sessionStorage al leave e ripristinata al return.
- **File:** `src/pages/Professionals.tsx`, `src/components/professionals/MatchQuiz.tsx`, `src/services/professionalsService.ts`

### Dettaglio professionista (`/professionals/:id`)

- **Contenuto:** foto/avatar, nome, categoria, stelle, recensioni, descrizione, servizi/prezzi, zona, modalità (online/presenza), pulsanti Contatta e Prenota.
- **Recensioni:** lista recensioni; se l’utente ha booking completati o non ha ancora recensito, può lasciare recensione (**ReviewForm**, getReviewsByProfessional, getAvailableBookingsForReview, hasUserReviewedProfessional).
- **Prenotazione:** modale con step calendar → time (slot disponibili, esclusi useBlockedPeriods e availabilityOverrideService) → confirm; invio prenotazione al backend.

**File:** `src/pages/ProfessionalDetail.tsx`, `src/components/user/ReviewForm.tsx`, `src/hooks/useBlockedPeriods.ts`, `src/services/availabilityOverrideService.ts`, `src/services/reviewsService.ts`

---

## 6. APPUNTAMENTI

### Pagina (`/schedule`)

- **Titolo:** “Calendario” + “Gestisci i tuoi appuntamenti”.
- **Layout:** griglia 2 colonne (lg): a sinistra **AppointmentCalendar**, a destra **UpcomingAppointments** e **ProfessionalsList**.
- **AppointmentCalendar:** griglia mensile (mesi italiani), navigazione ChevronLeft/Right; click su giorno senza workout → **WorkoutCreationModal** (crea allenamento in quella data); click su giorno con workout → **WorkoutViewModal** (dettaglio/elimina). Dati da `custom_workouts` (user_id, scheduled_date).
- **UpcomingAppointments:** sezione “Prossimi Appuntamenti” con lista attualmente **placeholder** (array statico appointments), “Vedi tutti”.
- **ProfessionalsList:** lista professionisti in miniatura/link.

**File:** `src/components/schedule/Schedule.tsx`, `AppointmentCalendar.tsx`, `UpcomingAppointments.tsx`, `ProfessionalsList.tsx`, `WorkoutCreationModal.tsx`, `WorkoutViewModal.tsx`

---

## 7. PROFILO UTENTE

### Contenuto pagina Profilo (`/profile`)

- **Titolo:** “Il Tuo Profilo”, “Monitora i tuoi progressi e risultati”.
- **Layout:** 2 colonne (lg): sinistra **UserProfile**, **AchievementsBoard**, **ProgressHistory**; destra **Settings**.
- **UserProfile:** dati utente (nome, email, ecc.) e modifica.
- **AchievementsBoard:** medaglie/achievement.
- **ProgressHistory:** storico progressi, filtri periodo, statistiche (es. totalStats.workouts).
- **Settings:** card con link a tutte le sotto-pagine impostazioni.

**File:** `src/components/profile/Profile.tsx`, `UserProfile.tsx`, `AchievementsBoard.tsx`, `ProgressHistory.tsx`, `Settings.tsx`

### Impostazioni disponibili

- **Account:** Informazioni personali (/settings/personal-info), Password e sicurezza (/settings/security), Notifiche (/settings/notifications).
- **Preferenze:** Lingua e regione (/settings/language), Privacy (/settings/privacy).
- **Supporto:** Centro assistenza (/settings/help).

**File:** `src/components/profile/Settings.tsx`, `src/pages/settings/PersonalInfo.tsx`, `Security.tsx`, `Notifications.tsx`, `Language.tsx`, `Privacy.tsx`, `Help.tsx`

### Statistiche

- In **ProgressHistory** (storico, filtri, totalStats).
- In **StatsOverview** in dashboard (total workout, ore, obiettivi, medaglie).

---

## 8. ONBOARDING

### Step

- **Step 0 — Registration:** Step0Registration (post-login/registrazione).
- **Step 1 — Goals:** Step1Goals (obiettivi: massa, dimagrire, resistenza, tonificare).
- **Step 2 — Experience:** Step2Experience (livello: principiante/intermedio/avanzato, giorni a settimana).
- **Step 3 — Preferences:** Step3Preferences (luoghi, tempo sessione, attrezzatura).
- **Step 4 — Personalization:** Step4Personalization (nome, età, peso, altezza, consigli nutrizionali).
- **Step 5 — Health limitations:** Step5HealthLimitations (limitazioni fisiche, zone da evitare, condizioni mediche, allergie).
- **Completion:** CompletionScreen (riepilogo, piano giornaliero suggerito).

URL in sync con `?step=...`; modalità `?mode=edit` per modifica. Store persistito (Zustand + persist).

### Dati raccolti (onboardingStore)

- Step 1: `obiettivo` (massa | dimagrire | resistenza | tonificare).
- Step 2: `livelloEsperienza`, `giorniSettimana`.
- Step 3: `luoghiAllenamento`, `tempoSessione` (15|30|45|60), `possiedeAttrezzatura`, `attrezzi`, `altriAttrezzi`.
- Step 4: `nome`, `eta`, `peso`, `altezza`, `consigliNutrizionali`.
- Step 5: `haLimitazioni`, `limitazioniFisiche`, `zoneEvitare`, `condizioniMediche`, `allergieAlimentari`.

**File:** `src/pages/onboarding/OnboardingPage.tsx`, `src/pages/onboarding/steps/Step0Registration.tsx` … `Step5HealthLimitations.tsx`, `CompletionScreen.tsx`, `src/stores/onboardingStore.ts`, `src/hooks/useOnboardingNavigation.ts`, `src/services/onboardingService.ts`

---

## 9. COMPONENTI UI RICORRENTI

### Shadcn/UI (components/ui)

- button, card, input, label, textarea, checkbox, switch, radio-group, select, slider, progress, tabs, accordion, dialog, sheet, drawer, dropdown-menu, popover, alert-dialog, tooltip, avatar, badge, separator, scroll-area, skeleton, table, form, calendar, command, menubar, navigation-menu, breadcrumb, pagination, carousel, collapsible, resizable, aspect-ratio, hover-card, context-menu, toast, toaster, sonner, input-otp.
- **Custom/estesi:** PageSkeleton, ChallengeNotification, AnalyticsConsent, ErrorFallback, file-access-banner, ToggleSwitch, fast-date-picker.

**File:** `src/components/ui/*.tsx` (55 file)

### Componenti custom rilevanti

- **Layout:** Header, BottomNavigation, AppLayout, PageSkeleton.
- **Workout:** WorkoutCategories, ActiveWorkout, CustomWorkoutDisplay, WorkoutCreationModal, WorkoutViewModal, WorkoutTimer, ExerciseGifLink.
- **Diary:** WorkoutCard, DiaryFilters, StatsWidget, NotesModal, WorkoutDetailsModal.
- **Profile:** UserProfile, AchievementsBoard, ProgressHistory, Settings, NewObjectiveCard.
- **Plans:** PlanCard, CreatePlanCard, WelcomeModal, PlanTypeSelector, step components, PlanPreview, PlanModificationChat, PrimeBotExplanation.
- **Medals:** ChallengeModal, useMedalSystem.
- **Feedback:** FeedbackWidget, CookieBanner.

### Color scheme

- **Tailwind:** `pp-gold: #EEBA2B`, `pp-black: #000000` (tailwind.config.ts).
- **CSS variables (index.css):**  
  - Background: `--background` (#1A1A1A), `--background-secondary`, `--background-tertiary`.  
  - Text: `--text-primary` (bianco), `--foreground`.  
  - Brand: `--brand-primary` (oro, es. #FFD700).  
  - Surface: `--surface-primary` (#2A2A2A) per card.  
  - Border: `--border`, `border-border-primary`.
- **Uso:** `.bg-surface-primary`, `.text-brand-primary`, `.text-text-primary`, `.border-brand-primary`, `.bg-brand-primary`; in molti componenti anche `#EEBA2B` e `#000000` direttamente.
- **Header/Footer:** `bg-black/20 backdrop-blur-xl`, `border-white/20`.

**File:** `tailwind.config.ts`, `src/index.css`

---

## 10. LANDING PAGE

### Sezioni (ordine)

1. **HeroSection** — hero con CTA principale.
2. **ProblemSection** — problemi dell’utente.
3. **SolutionSection** — soluzioni/features.
4. **SocialProof** — testimonianze/statistiche (lazy).
5. **CTASection** — call to action finale (lazy).
6. **Footer** — 3 colonne, link, copyright (lazy).
7. **BackToTopButton** — bottone “back to top” fixed bottom-right.

**File:** `src/pages/landing/NewLandingPage.tsx`, `src/components/landing-new/HeroSection.tsx`, `ProblemSection.tsx`, `SolutionSection.tsx`, `SocialProof.tsx`, `CTASection.tsx`, `Footer.tsx`, `src/components/landing/BackToTopButton.tsx`

### CTA

- In hero e in CTASection (tipicamente “Registrati” / “Inizia” → auth o onboarding).
- BackToTopButton per ritorno in cima.

### Responsive

- Layout responsive; SocialProof, CTASection e Footer caricati in lazy con Suspense e fallback (blocchi neri/min-height) per evitare layout shift.

---

## FILE COINVOLTI (riferimento rapido)

- **Routing / layout:** `App.tsx`, `components/layout/Header.tsx`, `BottomNavigation.tsx`, `AppLayout.tsx`, `ProtectedRoute.tsx`, `MobileScrollFix.tsx`
- **Dashboard:** `components/dashboard/Dashboard.tsx`, `StatsOverview.tsx`, `QuickActions.tsx`, `WeeklyProgress.tsx`, `RecentActivity.tsx`, `OnboardingBot.tsx`
- **Workouts:** `components/workouts/Workouts.tsx`, `WorkoutCategories.tsx`, `ActiveWorkout.tsx`, `CustomWorkoutDisplay.tsx`, `WorkoutTimer.tsx`, `WorkoutCreationModal.tsx`, `WorkoutViewModal.tsx`; `pages/QuickWorkout.tsx`, `Timer.tsx`; `services/workoutGenerator.ts`
- **Piani:** `pages/piani/PlansPage.tsx`, `PlanCreationPage.tsx`, `ActivePlansPage.tsx`, `components/plans/*`, `stores/planCreationStore.ts`, `services/planService.ts`
- **PrimeBot:** `components/ai/AICoach.tsx`, `AICoachPrime.tsx`, `PrimeChat.tsx`, `CustomPlanModal.tsx`, `AIInsights.tsx`; `lib/openai-service.ts`, `lib/primebot-fallback.ts`, `contexts/PrimeBotContext.tsx`
- **Professionisti:** `pages/Professionals.tsx`, `ProfessionalDetail.tsx`, `components/professionals/MatchQuiz.tsx`, `components/user/ReviewForm.tsx`; `services/professionalsService.ts`, `reviewsService.ts`, `availabilityOverrideService.ts`, `hooks/useBlockedPeriods.ts`
- **Appuntamenti:** `components/schedule/Schedule.tsx`, `AppointmentCalendar.tsx`, `UpcomingAppointments.tsx`, `ProfessionalsList.tsx`
- **Profilo:** `components/profile/Profile.tsx`, `UserProfile.tsx`, `AchievementsBoard.tsx`, `ProgressHistory.tsx`, `Settings.tsx`; `pages/settings/*`
- **Onboarding:** `pages/onboarding/OnboardingPage.tsx`, `pages/onboarding/steps/*`, `stores/onboardingStore.ts`, `hooks/useOnboardingNavigation.ts`, `services/onboardingService.ts`
- **Landing:** `pages/landing/NewLandingPage.tsx`, `components/landing-new/*`, `components/landing/BackToTopButton.tsx`
- **UI/theme:** `components/ui/*`, `tailwind.config.ts`, `index.css`

---

*Fine report audit. Nessuna modifica applicata al codice.*

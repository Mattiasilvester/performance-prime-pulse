# CHANGELOG

Tutte le modifiche notevoli a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

## [9.0.4] - 2025-11-13

### 🐛 Fixed
- Risolto loop infinito Step 0→1 che impediva avanzamento dopo registrazione.
- Risolto loop infinito analytics Step 1 che causava spam console.
- Risolto problema Step 4 che non avanzava a CompletionScreen.
- Risolto validazione Step 4 che falliva quando nome era nello store ma non nel campo locale.
- Ottimizzato delay CompletionScreen: ridotto da ~2-3s a ~200-500ms (-80-90%).

### ⚡ Performance
- CompletionScreen ora carica piani esistenti prima delle verifiche pesanti, mostrando la pagina immediatamente.
- Operazioni asincrone pesanti eseguite in background senza bloccare il rendering.

### 🔧 Changed
- Rollback logica onboarding a versione semplice e stabile.
- `handleNext` ora gestisce correttamente tutti gli step incluso Step 4→5.
- Validazione Step 4 migliorata per usare anche dati dallo store.

---

## [9.0.3] - 2025-11-12

### 🔒 Security
- Migrate `VITE_ADMIN_SECRET_KEY` e `VITE_N8N_WEBHOOK_SECRET` da frontend a Edge Functions sicure.
- Creato Edge Function `admin-auth-validate` per validazione secret key server-side.
- Creato Edge Function `n8n-webhook-proxy` per proxy webhook N8N con secret server-side.
- Rimossi tutti i riferimenti a secrets dal bundle frontend pubblico.

### 🐛 Fixed
- Risolti 6 errori TypeScript (`ADMIN_SECRET` scope, `workoutAnalytics` interface).
- Risolto crash ESLint configurando correttamente `@typescript-eslint/no-unused-expressions`.
- Bundle size ridotto: 670.24 KB (-107.76 KB, -13.8%).

### ✨ Added
- Edge Function `admin-auth-validate` per validazione secret key admin.
- Edge Function `n8n-webhook-proxy` per proxy webhook N8N.
- Documentazione `SECRETS_SETUP.md` per setup secrets server-side.

### 📊 Metrics
- Security Score: 8.5/10 (+3.5)
- Performance Score: 8/10 (+0.5)
- Code Quality Score: 7/10 (+1)
- ESLint problems: 232 (-11 da baseline)

---

## [9.0.2] - 2025-11-12

### ✨ Added
- Edge Function `admin-users` (GET/PATCH/DELETE) con validazione ruolo `super_admin`.
- Helper `src/lib/adminApi.ts` per chiamate amministrative sicure dal frontend.

### 🔧 Changed
- `AdminUsers` e `UserManagementTable` ora usano la nuova API edge con feedback Sonner e filtri locali.
- `supabase/config.toml` aggiornato al formato CLI 2.x con redeploy `admin-stats`/`admin-users`.

### 🐛 Fixed
- Rimossa `supabaseAdmin` dal bundle frontend e chiusa esposizione Service Role Key.

---

## [9.0.1] - 2025-11-10

### ✨ Added
- Lazy loading delle sezioni Social Proof, CTA e Footer nella nuova landing page per ottimizzare il caricamento below-the-fold.

### 🐛 Fixed
- Ripristinato l'auto-avanzamento dello Step 1 dell'onboarding dopo la selezione dell'obiettivo.

---

## [9.0.0] - 2025-10-01

### ✨ Added
- Sistema Onboarding completo con 4 step + completion screen
  - Step 1: Selezione obiettivo (4 opzioni con card interattive)
  - Step 2: Esperienza e frequenza (livello + slider giorni)
  - Step 3: Preferenze (luogo multi-select + tempo sessione)
  - Step 4: Personalizzazione (dati personali + sezione professionisti)
  - Completion Screen: Piano allenamento giornaliero personalizzato
- Nuova Landing Page con 6 sezioni:
  - Hero Section con animazioni e metriche animate
  - Problem Section con card problemi interattive
  - Solution Section con features e screenshots
  - Social Proof con testimonianze e statistiche
  - CTA Section ottimizzata con contrasto
  - Footer completo con 3 colonne
- Sistema Feature Flags per A/B testing:
  - Hook `useFeatureFlag` con logica A/B testing
  - SessionStorage per consistenza variante
  - URL override per testing (`?force-new-landing=true`)
  - Debug component per development
- Generazione dinamica piano allenamento giornaliero:
  - Database esercizi per 4 obiettivi × 3 luoghi (12 combinazioni)
  - Serie/rip personalizzate per livello esperienza
  - Piano generato per giorno corrente
  - Animazione caricamento con transizione
- Store Zustand per persistenza dati onboarding con localStorage
- Animazioni Framer Motion per onboarding e landing page
- Sistema professionisti nella sezione Step 4

### 🔧 Changed
- Routing App.tsx con A/B testing per landing page
- ProtectedRoute con bypass autenticazione per onboarding
- Analytics tracking per onboarding e landing version
- Hero Section sottotitolo aggiornato con nuova value proposition
- Background globali (body/html/#root) da `#1A1A1A` a `transparent`

### 🐛 Fixed
- Rettangolo nero lungo (4 cause identificate e risolte):
  - Rimosso script inline problematico da index.html
  - Background transparent per body/html/#root
  - Rimosso bg-black dal container principale
- Contrasto CTA Section: Card nera con testo chiaro e bordo oro
- Contrasto Problem Section: Background chiaro con testo scuro
- Bottoni navigazione duplicati: Centralizzazione in OnboardingPage.tsx
- Allineamento bottoni verticale: items-center + h-12 per stessa altezza
- Card altezza disuguale in ProblemSection: Flex layout con items-stretch

### 📦 Dependencies
- Added: `framer-motion` - Animazioni fluide
- Added: `zustand` - State management leggero

---

## [8.2] - 2025-10-01

### 🐛 Fixed
- Rettangolo nero lungo nella landing page
- Contrasto CTA Section
- Contrasto Problem Section
- Footer colore coerente

---

## [8.1] - 2025-10-01

### 🐛 Fixed
- Fix risposte preimpostate PrimeBot
- Sistema ibrido fallback + AI ottimizzato


## [0.9.0] - 2025-10-01
### Added
- Tracciamento onboarding con eventi Supabase (started/completed, durata, metadata device)
- Nuovo copy landing hero allineato al posizionamento community

### Changed
- Rifattorizzati Step1-4 onboarding con hook `useOnboardingNavigation` e override payload
- Card “Vuoi risultati ancora più veloci?”: contenuti aggiornati e layout responsive mobile/desktop

### Fixed
- Eliminato hint fisso “Tocca per vedere gli esercizi” sulle card piani
- Durata onboarding corretta (nessun valore a 0s)
- Badge professionisti compatti su mobile
- Rimosso badge “Mental Coach” non più disponibile
---

*Per versioni precedenti, consulta i commit git.*




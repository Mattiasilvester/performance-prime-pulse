# CHANGELOG

Tutte le modifiche notevoli a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

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




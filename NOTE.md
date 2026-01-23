# 📝 NOTE TECNICHE - PERFORMANCE PRIME PULSE

## Decisioni Architetturali

### 23 Gennaio 2025 - Sessione Sistema Notifiche Completo
- **Pattern Cron Jobs Esterni**: Supabase non ha scheduling integrato, quindi usiamo GitHub Actions per cron jobs. Pattern: workflow YAML con `schedule: cron` che chiama Edge Function tramite curl con `SUPABASE_ANON_KEY`. Pattern riutilizzabile per altri job schedulati
- **Service Worker Pattern**: Service Worker (`sw.js`) registrato in `main.tsx` e protetto da cleanup PWA. Pattern: mantenere service worker attivo anche durante cleanup altri service worker. Usare `skipWaiting()` e `clients.claim()` per attivazione immediata
- **VAPID Keys Pattern**: VAPID keys devono essere generate con `web-push generate-vapid-keys` e configurate come secrets Supabase. Pattern: chiave pubblica nel frontend, chiave privata solo server-side. Validazione chiave con `urlBase64ToUint8Array` con error handling robusto
- **Real-time Subscription Pattern**: Supabase Realtime per notifiche con auto-reconnection. Pattern: `useRef` per channel, cleanup in `useEffect`, gestione `mounted` state per evitare memory leaks. Reconnection automatica con timeout esponenziale
- **Notification Grouping Pattern**: Raggruppamento notifiche simili entro 24h usando utility function. Pattern: funzione pura `groupNotifications()` che restituisce array misto (singole notifiche + gruppi). Type guard `isNotificationGroup()` per TypeScript safety
- **Scheduled Notifications Pattern**: Notifiche programmate con tolleranza ±5 minuti. Pattern: Edge Function controlla `scheduled_for <= now + 5min` per evitare perdite. Cron job ogni 5 minuti per precisione. Status tracking (`pending`, `sent`, `failed`) per debugging
- **Sound/Vibration Service Pattern**: Singleton service per suoni e vibrazioni con preferenze localStorage. Pattern: lazy initialization AudioContext (richiede user interaction), preferenze sincronizzate con database. Pattern riutilizzabile per altri servizi audio
- **Expansion/Collapse Pattern**: Click sulla notifica per espandere messaggio troncato. Pattern: stato locale `isExpanded` per ogni notifica, rilevamento troncamento con `scrollHeight > clientHeight` o stima lunghezza. Icona freccia che cambia direzione
- **Badge Pattern**: Badge "Promemoria" sopra titolo per notifiche custom. Pattern: condizionale rendering basato su `type === 'custom'`. Design coerente con altri badge (colore giallo, bordo, padding)
- **Edge Function Error Handling**: Edge Functions devono gestire gracefully errori database (es. `.maybeSingle()` invece di `.single()`). Pattern: try-catch completo, logging dettagliato, risposte JSON strutturate con `success`, `processed`, `sent`, `failed`
- **Migration Pattern**: Migrazioni SQL devono essere idempotenti (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`). Pattern: ogni migration deve poter essere rieseguita senza errori. Commenti SQL per documentazione
- **Type Safety Pattern**: TypeScript types aggiornati per includere nuovi tipi (es. `'custom'` in `ProfessionalNotification['type']`). Pattern: aggiornare types quando si aggiungono nuovi valori a enum/union types

### 23 Gennaio 2025 - Sessione Sistema Recensioni Completo
- **Service Layer Pattern**: Funzione `getReviewsByProfessional()` con parametro `onlyVisible` per distinguere visualizzazione pubblica (solo recensioni visibili) vs dashboard professionista (tutte le recensioni, anche non visibili). Pattern riutilizzabile per altri servizi che necessitano di filtri condizionali
- **Componenti Modulari Recensioni**: Separazione responsabilità in `ReviewList.tsx` (statistiche e filtri), `ReviewCard.tsx` (singola recensione), `ReviewResponseModal.tsx` (risposta). Pattern modulare facilita manutenzione e riutilizzo
- **Layout Coerente**: Stesso layout recensioni (stelle → nome → titolo → commento) sia lato utente che lato professionista. Pattern di coerenza UI importante per UX
- **Responsive Design Pattern**: Layout filtri mobile (verticale) vs desktop (orizzontale) usando classi Tailwind `md:hidden` e `hidden md:flex`. Pattern da applicare a tutti i componenti con layout diverso mobile/desktop
- **Statistiche Real-time**: Statistiche recensioni (rating medio, totale, verificate) calcolate client-side da array recensioni. Pattern efficiente per dataset piccoli, considerare calcolo server-side per dataset grandi

### 23 Gennaio 2025 - Sessione Ottimizzazioni Performance
- **Query Batch Pattern**: Sostituito pattern loop con N query separate (`Promise.all` con `map` async) con query batch singola usando `.in()` per array di ID. Pattern applicato a `profiles` e `bookings` queries. Miglioramento performance: 70-95% più veloce (50 query → 1 query)
- **Progressive Loading Pattern**: Pagine dashboard mostrano UI immediatamente con `loading = false` iniziale, dati caricano in background. Migliora perceived performance senza cambiare tempi reali. Pattern applicato a tutte le pagine dashboard
- **Auto-completamento Background**: Funzioni di auto-completamento (es. `autoCompletePastBookings`) eseguite in background senza `await` per non bloccare UI. Pattern da applicare a tutte le operazioni non critiche
- **Console Log Cleanup**: Rimossi tutti i `console.log` da componenti e script inline per produzione. Mantenuti solo `console.error` e `console.warn` per debugging critico
- **Error Handling Script Esterni**: Script esterni (Tally, Plausible) gestiti con `onerror` handlers silenziosi per evitare errori console che inquinano debugging. Pattern da applicare a tutti gli script esterni

### 22 Gennaio 2025 - Sessione Pagamenti FASE A e B
- **Payment Provider Pattern**: Sistema `payment_provider` (stripe/paypal) con colonne provider-specific per gestire metodi multipli abbonamento. Colonne comuni per display (`payment_method_last4`, `payment_method_brand`) e colonne specifiche per ogni provider (Stripe: `stripe_customer_id`, `payment_method_id`; PayPal: `paypal_subscription_id`, `paypal_subscription_email`)
- **Separazione Logica Pagamenti**: Distinzione netta tra metodo pagamento abbonamento professionista (FASE A) e metodi pagamento accettati dai clienti (FASE B). Colonne separate in `professional_settings` per evitare confusione
- **Modal Selezione Provider**: Modal "Aggiungi carta" mostra lista provider disponibili (Carta Stripe, PayPal). Pattern riutilizzabile per altre selezione metodi in futuro
- **Toggle Switch Component**: Componente `ToggleSwitch.tsx` stile Apple/iOS riutilizzabile. Design pill-shape rettangolare (51x31px) con pallino bianco che scorre. Pattern applicato a tutti i modali impostazioni
- **RLS Policy Idempotenza**: Aggiunto `DROP POLICY IF EXISTS` prima di creare policy in migrazioni SQL per permettere re-run senza errori. Pattern da applicare a tutte le future migrazioni con policies
- **Tabella Subscription Invoices**: Tabella separata `subscription_invoices` per storico fatture abbonamenti con supporto sia Stripe (`stripe_invoice_id`) che PayPal (futuro). RLS policies per sicurezza, indici per performance
- **Pattern Toggle Condizionale**: Campi extra (IBAN, email PayPal, telefono Satispay) visibili solo quando toggle metodo attivo. Pattern UX chiaro per evitare clutter

### 21 Gennaio 2025 - Sessione Database Schema Cleanup
- **Database Cleanup**: Rimossa tabella `users` duplicata, usare solo `profiles` collegata a `auth.users`
- **Colonne Deprecate**: Rimosse `password_hash`, `password_salt`, `reset_token`, `reset_requested_at` da `professionals` (usare Supabase Auth)
- **Professional Services**: Tabella `professional_services` creata per gestire servizi multipli per professionista (prima solo `prezzo_seduta` singolo)
- **Reviews System**: Tabella `reviews` con trigger automatico per aggiornare `professionals.rating` e `reviews_count`
- **Prezzo Seduta**: Aggiunta colonna `prezzo_seduta` (INTEGER) in `professionals`, aggiornato codice per usarla invece di `prezzo_fascia` (string)
- **Migrazione Dati**: I dati in JSON in `bookings.notes` sono stati migrati a colonne separate (`client_name`, `client_email`, `client_phone`, `service_type`, `color`)
- **Pattern RLS**: Tutte le nuove tabelle hanno RLS policies configurate per sicurezza (ogni utente vede/modifica solo i propri dati)
- **Trigger Automatici**: Sistema di trigger PostgreSQL per aggiornare rating professionisti automaticamente quando cambiano recensioni
- **Priorità Critica**: `professional_services` esiste ma codice non lo usa ancora - PRIORITÀ 1 per prossima sessione

### 16 Gennaio 2026 - Sessione Fix Prenotazioni e Profilo
- **Helper funzione `getLocalDateString()`**: Funzione utility per ottenere date in formato YYYY-MM-DD usando metodi locali (getFullYear, getMonth, getDate) invece di toISOString() che causa problemi di timezone. Usata in PrenotazioniPage per filtri date corretti.
- **Pattern filtri interattivi**: Card stats diventate filtri cliccabili con state management che resetta gli altri filtri quando si seleziona uno. Pattern riutilizzabile per altri filtri rapidi.
- **Validazione input numerico prezzo**: Validazione lato client con limiti min/max (0-1000) e controllo tipo durante digitazione. Toast errori per UX chiara.
- **Layout simbolo € prezzo**: Simbolo posizionato PRIMA del numero con flexbox (`<span>€</span> <input>`), non dopo. Pattern coerente con standard europei di formattazione valuta.

### **13 Gennaio 2026 - Sistema Professionisti e Ottimizzazioni Bundle**

#### **1. Database Professionisti Esteso**
**Decisione**: Aggiunta colonna `is_partner` e colonne per ricerca/filtri.

**Motivazioni**:
- Necessità di distinguere professionisti abbonati (Partner) da non abbonati
- Richiesta funzionalità ricerca avanzata con filtri multipli
- Supporto per sistema match basato su preferenze utente

**Implementazione**:
- Colonna `is_partner` BOOLEAN nella tabella `professionals`
- Colonne aggiuntive: bio, foto_url, specializzazioni[], zona, modalita, prezzo_fascia, rating, reviews_count
- Ordinamento query: is_partner DESC, rating DESC, reviews_count DESC

#### **2. Lazy Loading Database GIF**
**Decisione**: Spostato database GIF da inline object a JSON esterno con lazy loading.

**Motivazioni**:
- Ridurre bundle size iniziale (273KB → ~30KB)
- Caricare dati solo quando necessario (quando utente apre modal GIF)
- Migliorare performance iniziale app

**Implementazione**:
- Database GIF in `public/data/exerciseGifs.json`
- Funzione async `getExerciseGifs()` con caching
- Caricamento on-demand in `ExerciseGifLink` component

#### **3. Dynamic Import PDF.js**
**Decisione**: Convertito import statico PDF.js in dynamic import.

**Motivazioni**:
- PDF.js è grande (466KB) e usato raramente
- Ridurre bundle size iniziale
- Caricare solo quando necessario (analisi PDF)

**Implementazione**:
- Dynamic import dentro funzione `extractPDFText()`
- Worker configuration dentro funzione
- Bundle PDF.js separato e lazy-loaded

#### **4. Scroll Position Management**
**Decisione**: Implementato sistema salvataggio/ripristino posizione scroll con sessionStorage.

**Motivazioni**:
- Migliorare UX quando utente naviga tra lista e dettaglio
- Mantenere contesto visivo utente
- Evitare scroll animation visibile

**Implementazione**:
- Salvataggio posizione prima di navigare a dettaglio
- Ripristino dopo caricamento professionisti con requestAnimationFrame
- Visibility hidden durante ripristino per evitare animazione

---

### **1 Ottobre 2025 - Standardizzazione Nomi Esercizi**

#### **1. Eliminazione Sistema Alias**
**Decisione**: Rimosso completamente sistema alias per nomi esercizi.

**Motivazioni**:
- Sistema alias era una soluzione temporanea per gestire mismatch tra file
- Aumentava complessità e manutenzione del codice
- Creava confusione su quale fosse la fonte di verità
- Standardizzazione completa elimina necessità di alias

**Implementazione**:
- Rinominati tutti gli esercizi in `exerciseGifs.ts` (fonte di verità)
- Rinominati tutti gli esercizi in `exerciseDetails.ts` per matchare
- Rinominati tutti gli esercizi in `workoutGenerator.ts` per matchare
- Rimossa mappa `exerciseAliases` (~64 righe)
- Semplificata funzione `getExerciseDetails()` a match esatto + case-insensitive

**Risultato**:
- Una sola fonte di verità: `exerciseGifs.ts`
- Codice più semplice e manutenibile
- Zero debito tecnico

#### **2. Standardizzazione Nomenclatura**
**Decisione**: Usare nomi inglesi standardizzati per tutti gli esercizi.

**Motivazioni**:
- Coerenza con standard internazionali fitness
- Facilità manutenzione e ricerca
- Compatibilità con API esterne future
- Nomi più descrittivi e professionali

**Implementazione**:
- 59 esercizi rinominati seguendo pattern inglese
- Esempi: "Scalatori" → "Mountain Climbers", "Pike Flessioni" → "Pike Push-up"
- Mantenuta struttura categorie (FORZA, CARDIO, HIIT, MOBILITÀ)

**Risultato**:
- Nomenclatura coerente e professionale
- Facile ricerca e manutenzione

### **12 Dicembre 2025 - Switch Landing Page e Redesign Features**

#### **1. Rimozione Sistema A/B Testing**
**Decisione**: Eliminato completamente sistema A/B testing per landing page.

**Motivazioni**:
- La nuova landing page è stata testata e validata
- Sistema A/B testing aggiungeva complessità non necessaria
- Mantenere due versioni della landing page aumenta manutenzione

**Implementazione**:
- Rimossi file: `FeatureFlagDebug.tsx`, `useFeatureFlag.ts`, `features.ts`
- Rimossa logica condizionale da `App.tsx`
- `NewLandingPage` ora è la landing page principale (route `/`)

#### **2. Gestione Screenshot Dinamica**
**Decisione**: Implementato sistema dinamico per caricamento screenshot PrimeBot con fallback.

**Motivazioni**:
- Import statico fallisce se file non esiste (errore build)
- Necessario gestire caso file mancante senza rompere build
- Placeholder elegante durante sviluppo

**Implementazione**:
- Uso di `new URL()` con `import.meta.url` per path dinamico
- Gestione errori con `onError` handler su `<img>`
- Placeholder visivo quando screenshot non disponibile

#### **3. Componenti iPhone Mockup Riutilizzabili**
**Decisione**: Creato componente `IPhoneMockup` riutilizzabile con animazioni Framer Motion.

**Motivazioni**:
- 3 mockup iPhone con contenuti diversi ma stesso frame
- Evitare duplicazione codice
- Animazioni consistenti tra tutti i mockup

**Implementazione**:
- Componente `IPhoneMockup` con prop `screen` per contenuto
- Animazioni scroll reveal e hover effects 3D
- Layout responsive: desktop (staggered), tablet (row), mobile (column)
- Screen components separati: `PrimeBotScreen`, `PlanScreen`, `ProgressScreen`

---

### **28 Novembre 2025 - Fix Sistema Limitazioni e PrimeBot**

#### **1. Flag per Controllo Flusso Conversazionale**
**Decisione**: Aggiunto flag `skipFallbackCheck` per controllare il flusso tra blocchi conversazionali e fallback.

**Motivazioni**:
- Quando l'utente esce da un blocco conversazionale (es. `waitingForPainPlanConfirmation`), il messaggio deve andare direttamente all'LLM
- Il fallback non deve intercettare messaggi validi che provengono da blocchi conversazionali
- Necessario distinguere tra messaggi nuovi e messaggi che continuano un flusso

**Implementazione**:
- Flag `skipFallbackCheck` settato quando si esce da `waitingForPainPlanConfirmation` caso `else`
- Controllo flag nel blocco fallback prima di chiamare `getPrimeBotFallbackResponse()`
- Reset automatico dopo uso per evitare effetti collaterali

#### **2. Pulizia Dati Residui nel Database**
**Decisione**: Quando `ha_limitazioni = false`, forzare tutti i campi relativi a `null`/array vuoto.

**Motivazioni**:
- Dati residui nel database possono causare disallineamento tra UI e AI
- L'AI può vedere dati vecchi anche se l'utente ha detto "Nessuna limitazione"
- Necessario garantire coerenza tra stato dichiarato e dati effettivi

**Implementazione**:
- FIX 1: Forzatura `limitations/zones/medicalConditions` a `null` in `getSmartLimitationsCheck()` quando `hasExistingLimitations = false`
- FIX 2: Pulizia completa database in `parseAndSaveLimitationsFromChat()` quando `hasLimitations = false`
- FIX 3: Controllo `ha_limitazioni` prima del fallback in `getUserPains()` per evitare lettura dati residui

#### **3. Riconoscimento "Dolore Risolto" nel Fallback**
**Decisione**: Aggiungere riconoscimento esplicito di keywords "dolore risolto" PRIMA del check `painKeywords`.

**Motivazioni**:
- Il fallback intercettava messaggi come "il dolore mi è passato" perché contenevano "dolore"
- Questi messaggi devono passare all'LLM per gestione intelligente
- Necessario distinguere tra dolore presente e dolore risolto

**Implementazione**:
- Lista `painResolvedKeywords` con 10+ varianti di "dolore risolto"
- Check PRIMA di `painKeywords` per ritornare `null` e passare all'LLM
- Logging per tracciare quando viene riconosciuto dolore risolto

---

### **1 Ottobre 2025 - Sistema Limitazioni Fisiche**

#### **1. BLACKLIST vs WHITELIST per Esercizi**
**Decisione**: Implementato sistema BLACKLIST (escludi esercizi vietati) con filtro post-generazione.

**Motivazioni**:
- OpenAI può generare varianti di esercizi non nella lista
- Matching per nome esercizio non sempre affidabile
- Necessario filtro post-generazione per sicurezza

**Limitazioni Identificate**:
- OpenAI genera nomi in italiano che non matchano blacklist
- OpenAI può inventare varianti non nella lista
- Filtro post-generazione non cattura tutte le varianti

**Soluzione Futura**:
- Passare a WHITELIST (usa SOLO esercizi sicuri garantiti)
- Sostituire esercizi generati da OpenAI con quelli dalla whitelist
- Garantire sicurezza al 100% per utenti con dolori

#### **2. Forzatura Consigli Terapeutici**
**Decisione**: Dopo parsing risposta OpenAI, forzare consigli terapeutici pre-calcolati.

**Motivazioni**:
- OpenAI può ignorare istruzioni e generare consigli errati
- Consigli devono essere sempre corretti per la zona specifica
- Necessario garantire coerenza tra limitazione e consigli

**Implementazione**:
- Funzione `getTherapeuticAdvice()` con database pre-calcolato
- Funzione `detectBodyPart()` per estrarre zona dalla limitazione
- Sovrascrittura `plan.therapeuticAdvice` e `plan.safetyNotes` dopo parsing

#### **3. Logging Completo per Debug**
**Decisione**: Aggiungere logging dettagliato in ogni step del flusso.

**Motivazioni**:
- Tracciare dove si perde la limitazione
- Verificare che matching funzioni correttamente
- Debug facilitato per problemi futuri

**Implementazione**:
- Log in `parseAndSaveLimitationsFromChat()` per messaggio utente
- Log in `getStructuredWorkoutPlan()` per limitazione ricevuta
- Log in `getExcludedExercises()` e `getTherapeuticAdvice()` per matching
- Log finale prima di inviare prompt a OpenAI

---

### **Sessione 16 - Edge Functions SuperAdmin (12/11/2025)**

#### **1. Edge Functions vs Service Role Key lato frontend**
**Decisione**: Spostare tutte le operazioni amministrative su Edge Functions (`admin-stats`, `admin-users`) e rimuovere `supabaseAdmin` dal bundle.

**Motivazioni**:
- Evitare esposizione della Service Role Key (`service_role`) in client pubblico.
- Applicare controlli di autorizzazione consistenti lato server (ruolo `super_admin` verificato su Supabase).
- Limitare payload a metodi supportati (GET/PATCH/DELETE) con single entry point e logging centralizzato.
- Consentire evoluzione futura (audit logging, rate limiting) senza rilasci frontend.

**Implementazione**:
- Edge Function `admin-users` con multi-switch su HTTP verb e validazione payload.
- Helper `src/lib/adminApi.ts` con fetch autenticato (Bearer token) e mapping profili → `AdminUser`.
- Migrazione `AdminUsers`/`UserManagementTable` a chiamate fetch + Sonner toast + stati loading.
- Aggiornamento `supabase/config.toml` al formato CLI 2.x + redeploy funzioni.

### **Sessione Onboarding e Landing - 01/10/2025**

#### **1. Zustand vs Context API**
**Decisione**: Scelto Zustand per state management onboarding

**Motivazioni**:
- Persistenza automatica con middleware `persist`
- Performance migliore (meno re-render rispetto a Context API)
- API più semplice e diretta
- Meno boilerplate code

**Implementazione**:
- Store con `create` da zustand
- Middleware `persist` per localStorage
- `partialize` per salvare solo dati necessari

#### **2. Framer Motion vs CSS Animations**
**Decisione**: Scelto Framer Motion per animazioni

**Motivazioni**:
- Animazioni più complesse e fluide
- Scroll-triggered animations con `useInView` hook
- Gestione transizioni tra componenti con `AnimatePresence`
- API dichiarativa più leggibile
- Performance ottimizzate con GPU acceleration

**Implementazione**:
- `motion.div` per elementi animati
- `AnimatePresence` per transizioni tra step
- `useInView` per animazioni scroll-triggered
- Varianti per animazioni riutilizzabili

#### **3. Feature Flags Custom vs Libreria**
**Decisione**: Implementato sistema custom per feature flags

**Motivazioni**:
- Controllo totale sulla logica A/B testing
- Nessuna dipendenza esterna
- Flessibilità per future estensioni
- Implementazione semplice e leggera

**Implementazione**:
- Config in `src/config/features.ts`
- Hook `useFeatureFlag` per logica A/B
- SessionStorage per consistenza variante
- URL override per testing

#### **4. Piano Giornaliero vs Settimanale**
**Decisione**: Scelto piano giornaliero per completion screen

**Motivazioni**:
- Focus su azione immediata (cosa fare oggi)
- Meno informazioni da processare per nuovo utente
- Migliore UX per primo utilizzo
- Può essere esteso a settimanale in futuro

**Implementazione**:
- Funzione `generateDailyWorkout()` che genera per giorno corrente
- Database esercizi per ogni combinazione obiettivo/luogo
- Serie/rip personalizzate per livello esperienza

---

## Pattern e Convenzioni

### **Navigazione Onboarding**
- Bottoni navigazione centralizzati in `OnboardingPage.tsx`
- `flex justify-between items-center` per allineamento perfetto
- Placeholder invisibile per mantenere layout quando non c'è bottone destro
- `size="lg"` e `h-12` per stessa altezza bottoni

### **Animazioni**
- `AnimatePresence mode="wait"` per transizioni tra step
- Delay progressivi per elementi multipli (`delay: index * 0.1`)
- `initial`, `animate`, `exit` per transizioni complete
- `useInView` per animazioni scroll-triggered

### **Background Management**
- Container principali senza background globale
- Background transparent per body/html/#root
- Ogni sezione gestisce il proprio background
- Evitare conflitti visivi con background globali

### **Contrasto Colori**
- Card scure = testo chiaro (bianco/grigio chiaro)
- Card chiare = testo scuro (nero/grigio scuro)
- Oro `#FFD700` per accenti e highlights
- Border con opacità completa per contrasto

---

## Performance Considerations

### **Bundle Size**
- Attualmente ~770KB (può essere ottimizzato)
- Framer Motion e Zustand aggiungono ~50KB ciascuno
- Considerare code splitting per onboarding se necessario

### **Animations**
- Uso di `transform` e `opacity` per GPU acceleration
- `will-change` per elementi animati
- Lazy loading per componenti pesanti

### **State Management**
- Zustand è leggero (~1KB)
- Persistenza localStorage per onboarding
- Cleanup automatico con `useEffect`

---

## Testing Considerations

### **Test Necessari**
1. **Onboarding Flow**:
   - Test completo flusso end-to-end
   - Test validazione ogni step
   - Test persistenza dati
   - Test navigazione avanti/indietro

2. **Feature Flags**:
   - Test A/B testing con diverse varianti
   - Test URL override
   - Test forced users
   - Test consistenza sessione

3. **Piano Generazione**:
   - Test tutte le combinazioni obiettivo/luogo/livello
   - Test piano giornaliero per ogni giorno settimana
   - Test fallback per dati mancanti

4. **Responsive**:
   - Test mobile/tablet/desktop
   - Test animazioni su diversi dispositivi
   - Test performance su device lenti

---

## Future Improvements

### **Short Term**
- [ ] Integrare generazione piano con backend API
- [ ] Aggiungere più esercizi al database (attualmente 5 per combinazione)
- [ ] Implementare salvataggio piano nel database Supabase
- [ ] Ottimizzare bundle size

### **Medium Term**
- [ ] Aggiungere progressione settimanale/mensile
- [ ] Implementare sistema notifiche per allenamenti
- [ ] Aggiungere video dimostrativi esercizi
- [ ] Implementare analytics completo eventi

### **Long Term**
- [ ] Sistema AI per generazione piano avanzata
- [ ] Integrazione con wearables (Apple Watch, Fitbit)
- [ ] Social features (condividere progressi)
- [ ] Marketplace professionisti

---

## Decisioni Architetturali - Sessione 17 (12/11/2025)

### **Focus su Sviluppo App Features**

**Decisione**: Dopo aver completato i fix critici di sicurezza e code quality, il focus si sposta sullo sviluppo di features per la crescita utenti.

**Motivazioni**:
- Progetto ora production-ready con security score 8.5/10
- Tutti i fix critici completati (TypeScript, ESLint, Secrets)
- Edge Functions implementate e pronte per deploy
- Bundle ottimizzato e performance migliorata
- Priorità ora è sviluppo features per acquisizione e retention utenti

**Prossimi Step**:
1. Deploy Edge Functions su Supabase (necessario per funzionamento)
2. Configurare secrets server-side (ADMIN_SECRET_KEY, N8N_WEBHOOK_SECRET)
3. Test completo workflow email e SuperAdmin
4. Focus su sviluppo features app per crescita utenti

**Note**:
- Vulnerabilità npm residue (9) sono dipendenze transitive e non bloccanti
- RLS Policies da verificare ma non critiche per deploy iniziale
- ESLint problems (232) possono essere ridotti gradualmente

---

### **6 Dicembre 2025 - Fix Critici PrimeBot: Gestione Dolori e Piani**

#### **1. Distinzione Contesto Dolore vs Target Body Part**
**Decisione**: Implementata funzione helper `isBodyPartForPain()` per distinguere quando una parte del corpo è menzionata come dolore vs target per workout.

**Motivazioni**:
- "petto" può significare "ho dolore al petto" o "creami un piano per il petto"
- Il sistema deve interpretare correttamente l'intento utente
- Necessario analizzare keywords nel messaggio per determinare contesto

**Implementazione**:
- Lista `painKeywords`: parole che indicano dolore (dolore, male, fastidio, etc.)
- Lista `targetKeywords`: parole che indicano target workout (piano per, allenamento per, voglio, etc.)
- Logica: se `painKeywords` presenti E non `targetKeywords` → DOLORE
- Logica: se `targetKeywords` presenti E non `painKeywords` → TARGET
- Logica: se entrambe presenti → DOLORE (priorità sicurezza)

#### **2. Intercettazione "passato" Fuori Stato Attivo**
**Decisione**: Aggiunto blocco sicurezza PRIMA del fallback per intercettare messaggi "passato" anche quando `waitingForPainResponse` non è attivo.

**Motivazioni**:
- Utente può dire "passato" in qualsiasi momento della conversazione
- Se lo stato non è attivo, il messaggio va all'LLM e viene interpretato come "passato emotivo"
- Necessario intercettare PRIMA del fallback per gestire correttamente

**Implementazione**:
- Blocco controllo `pains.length > 0` PRIMA del fallback
- Check keywords "passato", "meglio", "guarito", "sì", "si", "ok"
- Se keywords presenti, setta `waitingForPainResponse(true)` e processa rimozione dolore
- Evita interpretazione errata da parte dell'LLM

#### **3. Sincronizzazione Database dopo Rimozione Dolore**
**Decisione**: Aggiunto `await refreshPains()` dopo `handlePainGone()` e `handleAllPainsGone()` e reset `limitazioni_compilato_at: null` quando tutti i dolori rimossi.

**Motivazioni**:
- Stato locale UI deve essere sincronizzato con database
- `limitazioni_compilato_at` deve essere null quando non ci sono più dolori
- `getSmartLimitationsCheck()` usa `limitazioni_compilato_at` per determinare se chiedere limitazioni

**Implementazione**:
- `await refreshPains()` chiamato dopo ogni rimozione dolore
- `limitazioni_compilato_at: null` settato in `removePain()` e `removeAllPains()` quando array vuoto
- Fix `currentPainZone` per usare `pains[0].zona` se non settato

#### **4. Safety Note con Zone Database**
**Decisione**: Modificata generazione safety note per recuperare zone dal database invece di usare messaggio originale.

**Motivazioni**:
- Messaggio originale può contenere testo generico ("gia ti ho detto il mio dolore")
- Safety note deve mostrare zone specifiche dal database (es. "ginocchio sinistro")
- Fallback multi-livello per garantire sempre una zona mostrata

**Implementazione**:
- Import `getUserPains()` in `openai-service.ts`
- Tentativo recupero zone dal database con `getUserPains(userId)`
- Fallback 1: `detectBodyPartFromMessage(limitationsCheck.limitations)`
- Fallback 2: `limitationsCheck.limitations` originale
- Formattazione con preposizioni corrette per singola/multipla zona

---

*Ultimo aggiornamento: 6 Dicembre 2025 - Sessione Fix Critici PrimeBot*




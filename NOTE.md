# 📝 NOTE TECNICHE - PERFORMANCE PRIME PULSE

## Decisioni Architetturali

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

*Ultimo aggiornamento: 12 Novembre 2025 - Sessione 17*




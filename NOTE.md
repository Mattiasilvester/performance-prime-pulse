# 📝 NOTE TECNICHE - PERFORMANCE PRIME PULSE

## Decisioni Architetturali

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

*Ultimo aggiornamento: 12 Novembre 2025*




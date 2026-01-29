# 🔧 PROBLEMI COMUNI E SOLUZIONI - PERFORMANCE PRIME PULSE

**Ultimo aggiornamento:** 27 Gennaio 2025  
**Versione:** 1.0

---

## 📋 INDICE

1. [Problemi Mobile](#problemi-mobile)
2. [Problemi Stripe/Pagamenti](#problemi-stripepagamenti)
3. [Problemi Database Supabase](#problemi-database-supabase)
4. [Problemi UI/UX](#problemi-uiux)
5. [Problemi TypeScript](#problemi-typescript)
6. [Problemi Z-Index e Layout](#problemi-z-index-e-layout)
7. [Problemi Eventi e Interazioni](#problemi-eventi-e-interazioni)
8. [Problemi Performance](#problemi-performance)
9. [Problemi Build e Deploy](#problemi-build-e-deploy)

---

## 📱 PROBLEMI MOBILE

### **1. Scroll Bloccato su Mobile**
**Problema:** Scroll non funziona su dispositivi mobili (iOS Safari, Chrome Mobile, Android)  
**Sintomi:**
- Pagina non scrolla verticalmente
- Touch events non rispondono
- Layout bloccato

**Soluzione:**
```typescript
// File: src/components/MobileScrollFix.tsx
// File: src/styles/mobile-fix.css
// File: index.html (script mobile)

// CSS:
html, body, #root {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  height: auto;
  min-height: 100vh;
  touch-action: pan-y;
}

// JavaScript (index.html):
document.body.style.touchAction = 'pan-y';
document.body.style.webkitOverflowScrolling = 'touch';
document.body.style.overflowY = 'scroll';
document.body.style.position = 'relative';
```

**File Coinvolti:**
- `src/components/MobileScrollFix.tsx`
- `src/styles/mobile-fix.css`
- `index.html` (script mobile)

**Pattern:** Applicare sempre `touch-action: pan-y` e `-webkit-overflow-scrolling: touch` su mobile

---

### **2. Input Stripe Non Cliccabili su Mobile**
**Problema:** Su mobile, quando si tocca un input Stripe, il click non corrisponde all'input selezionato  
**Sintomi:**
- Touch su input seleziona input sbagliato
- Focus non va sull'input corretto
- A volte nessun input viene selezionato

**Soluzione:**
```typescript
// File: src/components/partner/settings/AddStripeCardModal.tsx

// 1. Rimuovere overflow-y-auto su mobile
<div 
  style={{
    ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
      maxHeight: 'none',
      overflowY: 'visible',
      height: 'auto',
      touchAction: 'pan-y',
      WebkitOverflowScrolling: 'touch',
    } : {
      maxHeight: '95vh',
      overflowY: 'auto',
    }),
  }}
>

// 2. Bloccare scroll body quando modal è aperto su mobile
useEffect(() => {
  if (!isOpen) return;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }
}, [isOpen]);
```

**File Coinvolti:**
- `src/components/partner/settings/AddStripeCardModal.tsx`
- `index.html` (script touchmove)

**Pattern:** 
- Su mobile: `overflow: visible` invece di `overflow-y-auto` per container con iframe Stripe
- Bloccare scroll body quando modal con iframe è aperto
- Gestire scroll a livello di body invece che container

---

### **3. Header/Footer Non Visibili su Mobile**
**Problema:** Header e Footer scompaiono su alcune pagine mobile  
**Sintomi:**
- Header non visibile
- Footer non visibile
- Elementi coperti da altri elementi

**Soluzione:**
```css
/* File: src/styles/mobile-fix.css */

header {
  position: fixed !important;
  top: 0 !important;
  z-index: 50 !important;
  display: block !important;
  visibility: visible !important;
}

.bottom-navigation {
  position: fixed !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  display: block !important;
  visibility: visible !important;
}
```

**File Coinvolti:**
- `src/styles/mobile-fix.css`
- `src/components/layout/Header.tsx`
- `src/components/layout/BottomNavigation.tsx`

**Pattern:** Usare `z-index: 9999` per header/footer e `!important` per garantire visibilità

---

### **4. Responsive Design Rotto**
**Problema:** Layout non responsive, elementi troppo grandi/piccoli su mobile  
**Sintomi:**
- Testo troppo piccolo/grande
- Card non si adattano
- Padding/margin eccessivi

**Soluzione:**
```tsx
// Pattern Tailwind responsive:
className="text-xs sm:text-sm md:text-base"
className="p-2 sm:p-4 md:p-6"
className="w-full sm:w-auto md:max-w-md"
className="space-y-3 sm:space-y-4 md:space-y-6"

// Breakpoints Tailwind:
// sm: 640px
// md: 768px
// lg: 1024px
```

**Pattern:** 
- Usare sempre classi responsive Tailwind (`sm:`, `md:`, `lg:`)
- Testare su mobile reale, non solo DevTools
- Padding/margin più piccoli su mobile

---

## 💳 PROBLEMI STRIPE/PAGAMENTI

### **5. Input Stripe Non Cliccabili (Desktop e Mobile)**
**Problema:** Gli input del PaymentElement non rispondono ai click  
**Sintomi:**
- Click su input non fa nulla
- Cursore non appare
- Non è possibile inserire dati

**Soluzione:**
```typescript
// File: src/components/partner/settings/AddStripeCardModal.tsx

// 1. NON usare stopPropagation sul container con iframe
// ❌ SBAGLIATO:
<div onClick={(e) => e.stopPropagation()}>

// ✅ CORRETTO:
<div onClick={(e) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
}}>

// 2. CSS per iframe Stripe
// File: src/index.css
.StripeElement,
.StripeElement iframe,
.__PrivateStripeElement,
.__PrivateStripeElement iframe {
  pointer-events: auto !important;
  z-index: 1 !important;
}

iframe[src*="js.stripe.com"],
iframe[src*="hooks.stripe.com"] {
  pointer-events: auto !important;
  z-index: 100000 !important;
  position: relative !important;
  touch-action: manipulation !important;
}

// 3. Container PaymentElement
<div 
  style={{ 
    position: 'relative',
    zIndex: 100000,
  }}
>
  <PaymentElement />
</div>
```

**File Coinvolti:**
- `src/components/partner/settings/AddStripeCardModal.tsx`
- `src/index.css`

**Pattern:** 
- **MAI** usare `stopPropagation()` sul container che contiene iframe Stripe
- Usare `e.target === e.currentTarget` per chiudere modal solo su click overlay
- Aggiungere CSS `pointer-events: auto !important` per iframe Stripe
- Z-index iframe più alto del modal

---

### **6. Errori 406 Supabase Database**
**Problema:** Errori 406 (Not Acceptable) per chiamate a tabelle Supabase  
**Sintomi:**
- Errori 406 in console
- Dati non caricati
- Query falliscono

**Soluzione:**
```typescript
// ❌ SBAGLIATO:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)
  .single(); // Fallisce se non c'è record

// ✅ CORRETTO:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)
  .maybeSingle(); // Restituisce null se non c'è record, non errore
```

**File Coinvolti:**
- `src/services/workoutStatsService.ts`
- `src/services/monthlyStatsService.ts`
- `src/components/workouts/ActiveWorkout.tsx`

**Pattern:** Usare sempre `.maybeSingle()` invece di `.single()` quando il record potrebbe non esistere

---

### **7. Stripe Customer ID Non Trovato**
**Problema:** Errore `column professionals.stripe_customer_id does not exist`  
**Sintomi:**
- Errori 500 in Edge Functions
- Query falliscono
- Subscription non funziona

**Soluzione:**
```typescript
// ❌ SBAGLIATO:
const { data } = await supabase
  .from('professionals')
  .select('id, email, stripe_customer_id, user_id')
  .eq('email', email)
  .single();

// ✅ CORRETTO:
const { data } = await supabase
  .from('professionals')
  .select('id, email, user_id') // stripe_customer_id non esiste in professionals
  .eq('email', email)
  .single();

// stripe_customer_id è in professional_subscriptions, non in professionals
```

**File Coinvolti:**
- `supabase/functions/stripe-reactivate-subscription/index.ts`
- Qualsiasi query a `professionals` che cerca `stripe_customer_id`

**Pattern:** 
- `stripe_customer_id` è in `professional_subscriptions`, NON in `professionals`
- Verificare sempre schema database prima di query
- Usare `.maybeSingle()` per gestire record mancanti

---

## 🗄️ PROBLEMI DATABASE SUPABASE

### **8. Query Falliscono con .single()**
**Problema:** Query con `.single()` falliscono quando non c'è record  
**Sintomi:**
- Errori 406
- App crasha
- Dati non caricati

**Soluzione:**
```typescript
// Pattern universale:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .maybeSingle(); // Usa sempre maybeSingle() se record potrebbe non esistere
```

**Pattern:** Usare `.maybeSingle()` invece di `.single()` quando:
- Il record potrebbe non esistere
- È la prima volta che l'utente accede
- Dati opzionali

---

### **9. RLS Policies Bloccano Query**
**Problema:** Query falliscono per permessi insufficienti  
**Sintomi:**
- Errori 403 Forbidden
- Dati non caricati
- Operazioni falliscono

**Soluzione:**
```sql
-- Verificare RLS policies in Supabase Dashboard
-- Assicurarsi che policies permettano:
-- 1. SELECT per utente autenticato sui propri dati
-- 2. INSERT per utente autenticato
-- 3. UPDATE per utente autenticato sui propri dati
-- 4. DELETE per utente autenticato sui propri dati

-- Esempio policy corretta:
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

**Pattern:** 
- Verificare sempre RLS policies in Supabase Dashboard
- Usare `auth.uid()` per filtrare dati per utente
- Testare query con utente autenticato

---

## 🎨 PROBLEMI UI/UX

### **10. Z-Index Conflicts**
**Problema:** Elementi coperti da altri elementi, z-index non funziona  
**Sintomi:**
- Modal coperto da bottoni
- Widget feedback coperto
- Menu dropdown non visibile

**Soluzione:**
```css
/* Gerarchia Z-Index corretta: */
/* File: src/index.css, src/styles/mobile-fix.css */

/* Widget/Menu: z-[99999] */
.feedback-widget,
[data-radix-dropdown-menu-content] {
  z-index: 99999 !important;
}

/* Modal: z-50 */
.modal-overlay {
  z-index: 50;
}

/* Bottoni: z-0 (default) */
.btn-avvia,
.btn-completato {
  z-index: 0;
}

/* Iframe Stripe: z-100000 (sopra tutto) */
iframe[src*="js.stripe.com"] {
  z-index: 100000 !important;
}
```

**File Coinvolti:**
- `src/index.css`
- `src/styles/mobile-fix.css`
- Componenti con modal/widget

**Pattern:** 
- Widget/Menu: `z-[99999]`
- Modal: `z-50`
- Bottoni: `z-0` (default)
- Iframe Stripe: `z-100000`

---

### **11. Colori Non Rispettati (Appuntamenti)**
**Problema:** Colore assegnato a un appuntamento non viene rispettato  
**Sintomi:**
- Colore cambia dopo salvataggio
- Colore diverso da quello selezionato
- Colore predefinito invece di custom

**Soluzione:**
```typescript
// File: src/pages/partner/dashboard/OverviewPage.tsx

// 1. Query deve includere color dalla tabella bookings
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    service:professional_services(id, name, color),
    client:clients(id, first_name, last_name, email, phone)
  `)
  // Aggiungere color direttamente da bookings
  .select('color'); // Se color è in bookings

// 2. Rendering deve prioritizzare booking.color
const serviceColor = booking.color || booking.service?.color || '#EEBA2B';
```

**File Coinvolti:**
- `src/pages/partner/dashboard/OverviewPage.tsx`
- `src/components/workouts/BookingDetailModal.tsx`

**Pattern:** 
- Query sempre `color` da tabella `bookings` se esiste
- Rendering: `booking.color || booking.service?.color || default`
- Verificare che `AddBookingModal` salvi `color` in `bookings.color`

---

### **12. Modal Non Si Apre al Click**
**Problema:** Click su elemento non apre modal con dettagli  
**Sintomi:**
- Click non fa nulla
- Modal non appare
- Nessun feedback visivo

**Soluzione:**
```typescript
// Pattern per modal con dettagli:

// 1. State management
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
const [showModal, setShowModal] = useState(false);
const [details, setDetails] = useState<any>(null);
const [detailsLoading, setDetailsLoading] = useState(false);

// 2. Click handler
const handleItemClick = async (item: Item) => {
  setSelectedItem(item);
  setShowModal(true);
  setDetailsLoading(true);
  
  // Fetch dettagli completi
  const { data } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', item.id)
    .single();
  
  setDetails(data);
  setDetailsLoading(false);
};

// 3. Rendering con onClick
<div onClick={() => handleItemClick(item)}>
  {/* Contenuto */}
</div>

// 4. Modal con createPortal
{showModal && selectedItem && (
  <Modal>
    {detailsLoading ? <Loader /> : <Details data={details} />}
  </Modal>
)}
```

**Pattern:** 
- State per `selectedItem`, `showModal`, `details`, `detailsLoading`
- Click handler che fetcha dettagli completi
- Modal con `createPortal` per rendering fuori DOM flow
- Loading state durante fetch

---

## 🔷 PROBLEMI TYPESCRIPT

### **13. Errori TypeScript Touch Events**
**Problema:** Conflitto tra `MouseEvent` e `TouchEvent`  
**Sintomi:**
- Errori compilazione TypeScript
- Handler non funzionano
- Type mismatch

**Soluzione:**
```typescript
// ❌ SBAGLIATO:
const handleClick = (e: MouseEvent | TouchEvent) => {
  // TypeScript si lamenta
};

// ✅ CORRETTO:
const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
  // Funziona
};

// OPPURE funzioni separate:
const handleClick = (e: React.MouseEvent) => { /* ... */ };
const handleTouch = (e: React.TouchEvent) => { /* ... */ };
```

**File Coinvolti:**
- `src/components/workouts/CustomWorkoutDisplay.tsx`
- Qualsiasi componente con touch events

**Pattern:** Usare `React.MouseEvent` e `React.TouchEvent` invece di `MouseEvent` e `TouchEvent` globali

---

### **14. Props Non Supportate**
**Problema:** Prop passata a componente non esiste nell'interfaccia  
**Sintomi:**
- Errori TypeScript
- Warning in console
- Prop ignorata

**Soluzione:**
```typescript
// 1. Verificare interfaccia componente
interface ComponentProps {
  // Props supportate
}

// 2. Rimuovere prop non supportate
// ❌ SBAGLIATO:
<Component unsupportedProp={value} />

// ✅ CORRETTO:
<Component supportedProp={value} />
```

**Pattern:** 
- Verificare sempre interfaccia TypeScript del componente
- Rimuovere props non supportate
- Usare solo props documentate

---

## 🎯 PROBLEMI Z-INDEX E LAYOUT

### **15. Bottoni Coprono Widget/Modal**
**Problema:** Bottoni "AVVIA" o "COMPLETA" coprono widget feedback o modal  
**Sintomi:**
- Widget feedback non cliccabile
- Menu dropdown coperto
- Modal non visibile

**Soluzione:**
```css
/* File: src/index.css, src/styles/mobile-fix.css */

/* Aumentare z-index widget/menu invece di abbassare bottoni */
.feedback-widget {
  z-index: 99999 !important;
}

[data-radix-dropdown-menu-content] {
  z-index: 99999 !important;
}

/* Bottoni rimangono z-0 (default) */
```

**Pattern:** 
- **NON** abbassare z-index bottoni
- **AUMENTARE** z-index widget/menu a `z-[99999]`
- Widget/Menu devono essere sempre accessibili

---

### **16. Footer Cambia Colore al Refresh**
**Problema:** Footer perde effetto vetro dopo refresh pagina  
**Sintomi:**
- Footer nero invece di vetro
- Stile cambia dopo reload
- CSS non applicato

**Soluzione:**
```css
/* File: src/index.css */

/* Esclusione esplicita per bottom-navigation */
.bottom-navigation {
  /* Non applicare regole globali */
}

/* Rimuovere override eccessivi da mobile-fix.css */
```

**File Coinvolti:**
- `src/index.css`
- `src/styles/mobile-fix.css`
- `src/components/layout/BottomNavigation.tsx`

**Pattern:** 
- Escludere esplicitamente elementi protetti da regole globali
- Usare classi specifiche invece di selettori generici
- Verificare che CSS non si sovrascriva

---

## 🖱️ PROBLEMI EVENTI E INTERAZIONI

### **17. stopPropagation Blocca Iframe**
**Problema:** `stopPropagation()` blocca eventi su iframe Stripe/PayPal  
**Sintomi:**
- Input Stripe non cliccabili
- Iframe non riceve eventi
- Modal non chiude correttamente

**Soluzione:**
```typescript
// ❌ SBAGLIATO:
<div onClick={(e) => e.stopPropagation()}>

// ✅ CORRETTO:
<div onClick={(e) => {
  // Chiudi solo se click diretto su overlay
  if (e.target === e.currentTarget) {
    onClose();
  }
}}>

// Per iframe Stripe:
onClick={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('iframe[src*="js.stripe.com"]')) {
    return; // Non chiudere, lascia gestire all'iframe
  }
  if (e.target === e.currentTarget) {
    onClose();
  }
}}
```

**Pattern:** 
- **MAI** usare `stopPropagation()` sul container con iframe
- Usare `e.target === e.currentTarget` per chiudere modal
- Escludere iframe dal click handler

---

### **18. Touch Events Bloccati su Mobile**
**Problema:** Script `touchmove` blocca eventi touch su iframe  
**Sintomi:**
- Input Stripe non funzionano su mobile
- Touch events non arrivano agli iframe
- Scroll bloccato

**Soluzione:**
```javascript
// File: index.html

// ❌ SBAGLIATO:
document.body.addEventListener('touchmove', function(e) {
  if (e.target === document.body) {
    e.stopPropagation();
  }
}, { passive: true });

// ✅ CORRETTO:
document.body.addEventListener('touchmove', function(e) {
  // NON bloccare se l'evento proviene da un iframe Stripe
  const target = e.target;
  if (target && target.closest) {
    const stripeIframe = target.closest('iframe[src*="js.stripe.com"]');
    if (stripeIframe) {
      return; // Lascia passare l'evento
    }
  }
  if (e.target === document.body) {
    e.stopPropagation();
  }
}, { passive: true });
```

**Pattern:** 
- Escludere sempre iframe Stripe/PayPal da `stopPropagation()`
- Verificare `target.closest()` prima di bloccare eventi
- Usare `{ passive: true }` per performance

---

## ⚡ PROBLEMI PERFORMANCE

### **19. Console Log Inquinano Console**
**Problema:** Troppi `console.log` in produzione  
**Sintomi:**
- Console piena di log
- Performance degradata
- Debug difficile

**Soluzione:**
```typescript
// ❌ SBAGLIATO:
console.log('Debug message');

// ✅ CORRETTO:
// Rimuovere tutti i console.log prima di produzione
// Mantenere solo console.error e console.warn per errori critici

// Pattern per debug condizionale:
if (import.meta.env.DEV) {
  console.log('Debug message');
}
```

**Pattern:** 
- Rimuovere tutti i `console.log` prima di produzione
- Mantenere solo `console.error` e `console.warn`
- Usare `import.meta.env.DEV` per debug condizionale

---

### **20. Query Multiple invece di Batch**
**Problema:** Loop con N query separate invece di query batch  
**Sintomi:**
- Performance lente
- Troppe chiamate database
- Timeout query

**Soluzione:**
```typescript
// ❌ SBAGLIATO:
const results = await Promise.all(
  ids.map(id => 
    supabase.from('table').select('*').eq('id', id).single()
  )
);

// ✅ CORRETTO:
const { data } = await supabase
  .from('table')
  .select('*')
  .in('id', ids); // Query batch singola
```

**Pattern:** 
- Usare sempre `.in()` per query batch invece di loop
- Riduce chiamate database del 70-95%
- Migliora performance significativamente

---

## 🏗️ PROBLEMI BUILD E DEPLOY

### **21. Build Fallisce con Errori TypeScript**
**Problema:** Build fallisce per errori TypeScript  
**Sintomi:**
- Build non completa
- Errori compilazione
- Deploy fallisce

**Soluzione:**
```bash
# Verificare errori TypeScript:
npx tsc --noEmit

# Fix errori prima di build:
# 1. Correggere errori TypeScript
# 2. Verificare import corretti
# 3. Verificare tipi corretti

# Build dopo fix:
npm run build
```

**Pattern:** 
- Sempre eseguire `npx tsc --noEmit` prima di build
- Fixare tutti gli errori TypeScript
- Verificare build prima di deploy

---

### **22. Variabili d'Ambiente Mancanti**
**Problema:** Build fallisce per variabili d'ambiente mancanti  
**Sintomi:**
- Errori `import.meta.env.VITE_*` undefined
- Build fallisce
- App non funziona

**Soluzione:**
```typescript
// File: src/config/env.ts

// Validazione variabili:
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  // ...
];

requiredVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required env var: ${varName}`);
  }
});
```

**Pattern:** 
- Centralizzare variabili in `src/config/env.ts`
- Validare variabili richieste
- Fornire fallback quando possibile

---

## 🔄 PROBLEMI STATO E SINCRONIZZAZIONE

### **23. localStorage Non Sincronizzato**
**Problema:** Dati localStorage non sincronizzati tra componenti  
**Sintomi:**
- Stato diverso tra componenti
- Dati non aggiornati
- Inconsistenze UI

**Soluzione:**
```typescript
// Pattern utility condivisa:
// File: src/utils/challengeTracking.ts

export const getChallengeData = () => {
  const data = localStorage.getItem('challenge_data');
  return data ? JSON.parse(data) : null;
};

export const setChallengeData = (data: any) => {
  localStorage.setItem('challenge_data', JSON.stringify(data));
  // Dispatch event per sincronizzare altri componenti
  window.dispatchEvent(new Event('storage'));
};

// In componenti:
useEffect(() => {
  const handleStorage = () => {
    // Aggiorna stato quando localStorage cambia
    setData(getChallengeData());
  };
  
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}, []);
```

**Pattern:** 
- Utility functions condivise per localStorage
- Event `storage` per sincronizzazione
- Hook personalizzato per gestione stato

---

## 📝 REGOLE GENERALI

### **Principio Fondamentale: "Se Funziona, Non Romperlo"**

1. **ZERO BREAKING CHANGES**
   - Mai modificare logiche funzionanti senza richiesta esplicita
   - Mai cambiare comportamenti UX consolidati
   - Mai rimuovere funzionalità esistenti

2. **ANALISI PRIMA DI MODIFICARE**
   - Analizzare componente prima di modificare
   - Verificare dipendenze e usi
   - Identificare rischi potenziali

3. **TEST DOPO OGNI MODIFICA**
   - `npx tsc --noEmit` → deve passare
   - `npm run build` → deve passare
   - Test visivo componente
   - Test funzionale (click, navigation, forms)
   - Test mobile responsive

4. **MODIFICHE GRADUALI**
   - Una modifica alla volta
   - Test dopo ogni modifica
   - Rollback immediato se qualcosa si rompe

---

## 🎯 QUANDO APPLICARE QUESTE SOLUZIONI

### **Checklist Pre-Modifica:**
- [ ] Ho analizzato il componente?
- [ ] Ho verificato le dipendenze?
- [ ] Ho identificato i rischi?
- [ ] Ho un piano di rollback?

### **Checklist Post-Modifica:**
- [ ] TypeScript compila senza errori?
- [ ] Build funziona?
- [ ] Test visivo passato?
- [ ] Test funzionale passato?
- [ ] Test mobile passato?
- [ ] Console pulita (no errori)?

---

**Ultimo aggiornamento:** 27 Gennaio 2025  
**Mantenuto da:** AI Assistant + Mattia Silvestrelli

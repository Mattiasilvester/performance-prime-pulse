# 📋 FASI IMPLEMENTAZIONE - SEZIONE "ABBONAMENTO"

**Data:** 27 Gennaio 2025  
**Obiettivo:** Creare nuova pagina "Abbonamento" nella sidebar partner con gestione completa subscription

---

## 🎯 OBIETTIVI FINALI

1. ✅ Nuova voce "Abbonamento" nella sidebar partner
2. ✅ Pagina dedicata con tutte le informazioni subscription
3. ✅ Creazione automatica subscription quando trial scaduto + carta aggiunta
4. ✅ Visualizzazione prossimo addebito
5. ✅ Messaggi errore specifici
6. ✅ Cancellazione abbonamento

---

## 📝 FASI DI IMPLEMENTAZIONE

### **FASE 1: Setup Base - Pagina e Routing** 🟡

#### **1.1 Aggiungere voce "Abbonamento" nella Sidebar**
**File:** `src/components/partner/dashboard/PartnerSidebar.tsx`

**Modifiche:**
```typescript
// Aggiungere import icona
import { CreditCard } from 'lucide-react'; // o un'icona più appropriata

// Aggiungere voce nel menuItems array (dopo "Recensioni")
const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/partner/dashboard' },
  { icon: Calendar, label: 'Calendario', path: '/partner/dashboard/calendario' },
  { icon: ClipboardList, label: 'Prenotazioni', path: '/partner/dashboard/prenotazioni' },
  { icon: UserCircle, label: 'Profilo', path: '/partner/dashboard/profilo' },
  { icon: Briefcase, label: 'Servizi e Tariffe', path: '/partner/dashboard/servizi' },
  { icon: Star, label: 'Recensioni', path: '/partner/dashboard/recensioni' },
  { icon: CreditCard, label: 'Abbonamento', path: '/partner/dashboard/abbonamento' }, // ✅ NUOVO
];
```

**Checklist:**
- [ ] Import icona `CreditCard` (o altra icona appropriata)
- [ ] Aggiungere voce in `menuItems` array
- [ ] Verificare che il link funzioni correttamente

---

#### **1.2 Creare Pagina AbbonamentoPage**
**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx` (NUOVO)

**Struttura base:**
```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreditCard, Loader2, Calendar, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import AddStripeCardModal from '@/components/partner/settings/AddStripeCardModal';
import { createSubscription } from '@/services/subscriptionService';
import { getStripeErrorMessage } from '@/utils/stripeErrors';

export default function AbbonamentoPage() {
  // State management
  // Fetch subscription data
  // Render sections
}
```

**Checklist:**
- [ ] Creare file `AbbonamentoPage.tsx`
- [ ] Setup base con state management
- [ ] Import componenti necessari

---

#### **1.3 Aggiungere Route in App.tsx**
**File:** `src/App.tsx`

**Modifiche:**
```typescript
// Aggiungere import
import AbbonamentoPage from '@/pages/partner/dashboard/AbbonamentoPage'

// Aggiungere route dentro <Route path="/partner/dashboard" element={<PartnerDashboard />}>
<Route path="abbonamento" element={<AbbonamentoPage />} />
```

**Checklist:**
- [ ] Import `AbbonamentoPage`
- [ ] Aggiungere route `/partner/dashboard/abbonamento`
- [ ] Verificare che la navigazione funzioni

---

### **FASE 2: Sezione Informazioni Abbonamento** 🟡

#### **2.1 Componente SubscriptionInfo Completo**
**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`

**Funzionalità:**
- Visualizzazione piano attuale (Prime Business €50/mese)
- Status badge (trial, active, past_due, cancelled)
- **Prossimo addebito** (solo se `status === 'active'`)
- Importo prossimo pagamento
- Countdown giorni rimanenti (se in trial)
- Alert trial scaduto (se trial scaduto e carta non aggiunta)

**Checklist:**
- [ ] Fetch dati subscription da `professional_subscriptions`
- [ ] Calcolare prossimo addebito da `current_period_end`
- [ ] Calcolare giorni rimanenti trial
- [ ] Render status badge con colori appropriati
- [ ] Render card "Prossimo addebito" (solo se active)
- [ ] Render alert trial scaduto (se necessario)

---

#### **2.2 Gestione Stati Subscription**
**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`

**Stati da gestire:**
- `trialing` → Mostra countdown e messaggio trial
- `active` → Mostra prossimo addebito e bottone cancella
- `past_due` → Mostra alert errore pagamento
- `canceled` → Mostra messaggio cancellazione
- `incomplete` → Mostra messaggio subscription incompleta

**Checklist:**
- [ ] Mapping stati Stripe → stati UI
- [ ] Badge colorati per ogni stato
- [ ] Messaggi informativi per ogni stato

---

### **FASE 3: Creazione Subscription Automatica (Trial Scaduto)** 🔴 CRITICO

#### **3.1 Logica Trial Scaduto in AddStripeCardModal**
**File:** `src/components/partner/settings/AddStripeCardModal.tsx`

**Modifiche:**
Dopo successo salvataggio carta (linea ~160), aggiungere:

```typescript
// Dopo toast.success('Carta aggiunta con successo!');
// Verifica se trial è scaduto
const { data: subscription } = await supabase
  .from('professional_subscriptions')
  .select('trial_end, status')
  .eq('professional_id', professionalId)
  .maybeSingle();

if (subscription?.trial_end) {
  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const isTrialExpired = now > trialEnd;

  // Se trial scaduto e ancora in trialing, crea subscription
  if (isTrialExpired && subscription.status === 'trialing') {
    try {
      toast.info('Creazione abbonamento in corso...');
      await createSubscription();
      toast.success('Abbonamento attivato con successo!');
    } catch (err: any) {
      console.error('Errore creazione subscription:', err);
      toast.error(getStripeErrorMessage(err));
      // Non bloccare, la carta è stata salvata comunque
    }
  }
}
```

**Checklist:**
- [ ] Import `createSubscription` da `subscriptionService`
- [ ] Import `getStripeErrorMessage` da `stripeErrors`
- [ ] Aggiungere logica verifica trial scaduto
- [ ] Chiamare `createSubscription()` se trial scaduto
- [ ] Gestire errori con messaggi specifici
- [ ] Testare flusso completo

---

### **FASE 4: Messaggi Errore Specifici** 🟡

#### **4.1 Creare Utility Stripe Errors**
**File:** `src/utils/stripeErrors.ts` (NUOVO)

**Funzionalità:**
- Mapping codici errore Stripe → messaggi italiani
- Fallback per errori sconosciuti
- Supporto per errori nested

**Checklist:**
- [ ] Creare file `stripeErrors.ts`
- [ ] Implementare `getStripeErrorMessage(error)`
- [ ] Aggiungere mapping per errori comuni:
  - `card_declined`
  - `expired_card`
  - `insufficient_funds`
  - `invalid_number`
  - `processing_error`
  - `subscription_creation_failed`
  - Altri errori rilevanti
- [ ] Testare con vari tipi di errore

---

#### **4.2 Integrare Messaggi Errore**
**File:** `src/components/partner/settings/AddStripeCardModal.tsx`

**Modifiche:**
```typescript
import { getStripeErrorMessage } from '@/utils/stripeErrors';

// In catch block:
catch (err: any) {
  const errorMessage = getStripeErrorMessage(err);
  setError(errorMessage);
  toast.error(errorMessage);
}
```

**Checklist:**
- [ ] Import `getStripeErrorMessage`
- [ ] Sostituire messaggi errore generici
- [ ] Testare con errori reali

---

### **FASE 5: Cancellazione Abbonamento** 🟡

#### **5.1 Creare Edge Function Cancellazione**
**File:** `supabase/functions/stripe-cancel-subscription/index.ts` (NUOVO)

**Funzionalità:**
- Cancella subscription in Stripe
- Supporta `cancel_at_period_end` (fine periodo) vs cancellazione immediata
- Aggiorna database con nuovo status

**Checklist:**
- [ ] Creare file Edge Function
- [ ] Implementare logica cancellazione Stripe
- [ ] Supportare `cancel_at_period_end` flag
- [ ] Aggiornare `professional_subscriptions` nel database
- [ ] Gestire errori e validazioni
- [ ] Testare con subscription di test

---

#### **5.2 Implementare Bottone Cancella in AbbonamentoPage**
**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`

**Funzionalità:**
- Bottone "Cancella Abbonamento" (solo se `status === 'active'`)
- Modal conferma con due opzioni:
  - "Cancella alla fine del periodo" (consigliato)
  - "Cancella immediatamente"
- Chiamata Edge Function
- Feedback utente

**Checklist:**
- [ ] Aggiungere bottone (solo se active)
- [ ] Creare modal conferma
- [ ] Implementare `handleCancelSubscription()`
- [ ] Chiamare Edge Function `stripe-cancel-subscription`
- [ ] Gestire risposta e aggiornare UI
- [ ] Mostrare toast di conferma

---

### **FASE 6: Sezione Metodo di Pagamento** 🟢

#### **6.1 Integrare PaymentMethodCard**
**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`

**Funzionalità:**
- Mostrare carta salvata (o placeholder dev)
- Bottone "Aggiungi carta" se non presente
- Bottone "Modifica carta" se presente
- Bottone "Rimuovi carta" se presente

**Checklist:**
- [ ] Import `PaymentMethodCard` da `PaymentsModal.tsx` (o creare componente condiviso)
- [ ] Integrare nella pagina
- [ ] Gestire stati (loading, error, success)
- [ ] Testare flussi aggiunta/modifica/rimozione

---

### **FASE 7: Sezione Storico Fatture** 🟢

#### **7.1 Integrare InvoicesList**
**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`

**Funzionalità:**
- Lista fatture ordinate per data
- Download PDF fattura
- Visualizzazione importo e stato

**Checklist:**
- [ ] Import `InvoicesList` da `PaymentsModal.tsx` (o creare componente condiviso)
- [ ] Fetch fatture da `subscription_invoices`
- [ ] Integrare nella pagina
- [ ] Testare download PDF

---

### **FASE 8: UI/UX e Polish** 🟢

#### **8.1 Responsive Design**
**Checklist:**
- [ ] Testare su mobile
- [ ] Ottimizzare layout per schermi piccoli
- [ ] Assicurare touch-friendly buttons

---

#### **8.2 Loading States**
**Checklist:**
- [ ] Skeleton loaders per dati subscription
- [ ] Loading specifici per ogni azione
- [ ] Disabilitare bottoni durante operazioni

---

#### **8.3 Animazioni e Transizioni**
**Checklist:**
- [ ] Smooth transitions per cambio stato
- [ ] Animazioni successo/errore
- [ ] Feedback visivo per azioni

---

## 📊 PRIORITÀ IMPLEMENTAZIONE

### **🔴 CRITICO (Fare subito)**
1. ✅ Fase 1: Setup Base - Pagina e Routing
2. ✅ Fase 3: Creazione Subscription Automatica (Trial Scaduto)
3. ✅ Fase 2: Sezione Informazioni Abbonamento (base)

### **🟡 IMPORTANTE (Questa settimana)**
4. ✅ Fase 4: Messaggi Errore Specifici
5. ✅ Fase 5: Cancellazione Abbonamento
6. ✅ Fase 2: Sezione Informazioni Abbonamento (completa)

### **🟢 MIGLIORAMENTI (Prossimo mese)**
7. ✅ Fase 6: Sezione Metodo di Pagamento
8. ✅ Fase 7: Sezione Storico Fatture
9. ✅ Fase 8: UI/UX e Polish

---

## 🎯 STRUTTURA FINALE PAGINA

```
┌─────────────────────────────────────────┐
│  ABBONAMENTO                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  INFORMAZIONI ABBONAMENTO          │ │
│  │  - Piano: Prime Business (€50/mese)│ │
│  │  - Status: [Badge]                 │ │
│  │  - Prossimo addebito: [Data]       │ │
│  │  - [Cancella Abbonamento]          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  METODO DI PAGAMENTO              │ │
│  │  - Carta salvata o "Aggiungi"     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  STORICO FATTURE                  │ │
│  │  - Lista fatture                   │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 NOTE TECNICHE

### **Dati da Recuperare**
```typescript
interface SubscriptionData {
  // Da professional_subscriptions
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_method_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}
```

### **Edge Functions Necessarie**
1. ✅ `stripe-create-customer` (esiste)
2. ✅ `stripe-create-subscription` (esiste)
3. ❌ `stripe-cancel-subscription` (da creare)

### **Servizi da Usare**
- ✅ `subscriptionService.ts` - `createSubscription()`, `getSubscription()`
- ✅ `stripeErrors.ts` (da creare) - `getStripeErrorMessage()`

---

## ✅ CHECKLIST FINALE

### **Setup Base**
- [ ] Voce "Abbonamento" in sidebar
- [ ] Pagina `AbbonamentoPage.tsx` creata
- [ ] Route `/partner/dashboard/abbonamento` aggiunta
- [ ] Navigazione funzionante

### **Funzionalità Core**
- [ ] Fetch dati subscription
- [ ] Visualizzazione piano e status
- [ ] Prossimo addebito (se active)
- [ ] Creazione subscription automatica (trial scaduto)
- [ ] Messaggi errore specifici
- [ ] Cancellazione abbonamento

### **Componenti UI**
- [ ] Sezione Informazioni Abbonamento
- [ ] Sezione Metodo di Pagamento
- [ ] Sezione Storico Fatture
- [ ] Modal conferma cancellazione

### **Backend**
- [ ] Edge Function `stripe-cancel-subscription`
- [ ] Utility `stripeErrors.ts`

### **Testing**
- [ ] Test flusso trial → subscription
- [ ] Test aggiunta carta
- [ ] Test cancellazione
- [ ] Test errori pagamento
- [ ] Test responsive

---

## 🚀 PRONTO PER INIZIARE DOMANI!

Tutte le fasi sono documentate e pronte per l'implementazione. Buon lavoro! 🎉

---

## ❌ FASI CHE MANCANO (Da implementare in futuro)

### **FASE 9: Notifiche Proattive** 🔵
**Priorità:** Bassa  
**Descrizione:** Notifiche automatiche per:
- 7 giorni prima scadenza trial
- 3 giorni prima prossimo pagamento
- Carte in scadenza (2 mesi prima)

**File da creare:**
- `src/services/subscriptionNotifications.ts`
- Hook `useSubscriptionNotifications.tsx`

**Checklist:**
- [ ] Sistema notifiche email/push per scadenze
- [ ] Calcolo giorni rimanenti
- [ ] Trigger automatici

---

### **FASE 10: Export Fatture** 🔵
**Priorità:** Bassa  
**Descrizione:** Export multiplo fatture in CSV/PDF

**Checklist:**
- [ ] Bottone "Export Fatture"
- [ ] Generazione CSV con tutte le fatture
- [ ] Generazione PDF multiplo
- [ ] Filtri per periodo

---

### **FASE 11: Analytics Pagamenti** 🔵
**Priorità:** Bassa  
**Descrizione:** Grafici e statistiche pagamenti

**Checklist:**
- [ ] Grafico spese mensili
- [ ] Storico pagamenti annuale
- [ ] Confronto costi per periodo

---

### **FASE 12: Gestione Multi-Carta** 🔵
**Priorità:** Bassa  
**Descrizione:** Aggiungere più carte e selezionare predefinita

**Checklist:**
- [ ] Lista multiple carte
- [ ] Selezione carta predefinita
- [ ] Storico pagamenti per carta

---

### **FASE 13: Supporto PayPal Completo** 🔵
**Priorità:** Bassa  
**Descrizione:** Integrazione PayPal completa (attualmente solo UI)

**Checklist:**
- [ ] Integrazione PayPal API
- [ ] Switch tra Stripe e PayPal
- [ ] Gestione subscription PayPal

---

## 📊 RIEPILOGO FASI

### **✅ FASI DA IMPLEMENTARE DOMANI (8 fasi)**
1. ✅ Fase 1: Setup Base - Pagina e Routing
2. ✅ Fase 2: Sezione Informazioni Abbonamento
3. ✅ Fase 3: Creazione Subscription Automatica (Trial Scaduto)
4. ✅ Fase 4: Messaggi Errore Specifici
5. ✅ Fase 5: Cancellazione Abbonamento
6. ✅ Fase 6: Sezione Metodo di Pagamento
7. ✅ Fase 7: Sezione Storico Fatture
8. ✅ Fase 8: UI/UX e Polish

### **❌ FASI FUTURE (5 fasi)**
9. Notifiche Proattive
10. Export Fatture
11. Analytics Pagamenti
12. Gestione Multi-Carta
13. Supporto PayPal Completo

---

## 🎯 ORDINE DI IMPLEMENTAZIONE CONSIGLIATO

**Giorno 1:**
1. Fase 1 (Setup Base) - 2-3 ore
2. Fase 2 (Info Abbonamento base) - 2-3 ore
3. Fase 3 (Creazione Subscription) - 2-3 ore

**Giorno 2:**
4. Fase 4 (Messaggi Errore) - 1-2 ore
5. Fase 5 (Cancellazione) - 3-4 ore
6. Fase 6 (Metodo Pagamento) - 2-3 ore

**Giorno 3:**
7. Fase 7 (Storico Fatture) - 2-3 ore
8. Fase 8 (UI/UX Polish) - 2-3 ore
9. Testing completo - 2-3 ore

**Totale stimato:** 18-24 ore (3 giorni di lavoro)

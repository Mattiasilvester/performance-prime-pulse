# 📋 PROPOSTA IMPLEMENTAZIONE - PAGAMENTI E FATTURE

**Data:** 27 Gennaio 2025  
**Basato su feedback utente**

---

## ✅ ANALISI FEEDBACK

### 1. **Flusso Trial → Subscription** ✅
**Requisito:** Alla scadenza dei 3 mesi di prova, il professionista deve inserire il metodo di pagamento e così parte la subscription.

**Flusso corretto:**
1. Utente in trial (3 mesi)
2. Trial scade → Utente deve aggiungere carta
3. Utente aggiunge carta → **Creare subscription automaticamente** (solo se trial scaduto)
4. Subscription parte con pagamento automatico

**Implementazione:**
- In `AddStripeCardModal.tsx`, dopo successo aggiunta carta:
  - Verificare se `trial_end` è passato (trial scaduto)
  - Se sì, chiamare `createSubscription()` automaticamente
  - Se no (ancora in trial), solo salvare la carta

### 2. **Sezione "Abbonamento"** ✅
**Requisito:** Creare sezione dedicata "Abbonamento" con:
- Data prossimo addebito (`current_period_end`)
- Bottone "Cancella abbonamento"

**Struttura proposta:**
```
┌─────────────────────────────────────┐
│  INFORMAZIONI ABBONAMENTO           │
├─────────────────────────────────────┤
│  Piano: Prime Business (€50/mese)   │
│  Status: [Badge]                    │
│                                     │
│  Prossimo addebito:                 │
│  15 Febbraio 2025                   │
│  Importo: €50,00                    │
│                                     │
│  [Cancella Abbonamento] (solo se    │
│   active, non in trial)             │
└─────────────────────────────────────┘
```

### 3. **Messaggi Errore Specifici** ✅
**Requisito:** Messaggi errore dettagliati per ogni tipo di problema.

**Implementazione:**
- Funzione helper `getErrorMessage(error)` che mappa codici Stripe a messaggi italiani
- Mostrare messaggi specifici in `AddStripeCardModal` e `PaymentsModal`

### 4. **Cancella Abbonamento** ✅
**Requisito:** Bottone nella sezione "Abbonamento".

**Implementazione:**
- Solo visibile se `status === 'active'` (non in trial)
- Modal conferma con opzioni:
  - "Cancella alla fine del periodo" (consigliato)
  - "Cancella immediatamente"
- Edge Function `stripe-cancel-subscription`

### 5. **Cambio Piano** ❌
**Non necessario:** C'è solo un piano (Prime Business).

---

## 🎯 STRUTTURA PROPOSTA

### **Sezione "Abbonamento" (nuova)**

Trasformare `SubscriptionInfo` in una sezione più completa:

```typescript
const SubscriptionSection = ({ settings, onCancelSubscription }) => {
  // Calcola prossimo addebito
  const nextPaymentDate = settings.subscription_current_period_end
    ? new Date(settings.subscription_current_period_end).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Mostra bottone cancella solo se active (non in trial)
  const showCancelButton = settings.subscription_status === 'active';

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
      {/* Piano e Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500 block mb-1">Piano attuale</span>
          <p className="font-semibold text-gray-900 text-lg">
            {plan.name} <span className="text-gray-500 font-normal text-base">(€{plan.price}/mese)</span>
          </p>
        </div>
        <StatusBadge status={settings.subscription_status} />
      </div>

      {/* Prossimo Addebito (solo se active) */}
      {settings.subscription_status === 'active' && nextPaymentDate && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Prossimo addebito</p>
              <p className="font-semibold text-gray-900">{nextPaymentDate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Importo</p>
              <p className="font-semibold text-gray-900">€{plan.price},00</p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Info */}
      {settings.subscription_status === 'trial' && trialEndsAt && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-medium mb-1">Periodo di prova attivo</p>
            <p className="text-sm text-blue-700">
              Il periodo di prova termina il <strong>{trialEndsAt}</strong>. 
              Aggiungi un metodo di pagamento per continuare dopo la scadenza.
            </p>
          </div>
        </div>
      )}

      {/* Past Due Alert */}
      {settings.subscription_status === 'past_due' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium mb-1">Pagamento in ritardo</p>
            <p className="text-sm text-red-700 mb-3">
              Il pagamento dell'abbonamento è fallito. Aggiorna il metodo di pagamento per continuare a usare PrimePro.
            </p>
            <button className="text-sm text-red-700 font-medium hover:text-red-800 underline">
              Aggiorna metodo di pagamento
            </button>
          </div>
        </div>
      )}

      {/* Bottone Cancella (solo se active) */}
      {showCancelButton && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={onCancelSubscription}
            className="w-full px-4 py-2.5 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 hover:border-red-400 transition"
          >
            Cancella Abbonamento
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🔧 IMPLEMENTAZIONI SPECIFICHE

### **1. Creazione Subscription Automatica (Trial Scaduto)**

**File:** `AddStripeCardModal.tsx`

```typescript
// Dopo successo salvataggio carta (linea ~160)
const handleCardAdded = async () => {
  // ... codice esistente salvataggio carta ...

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

    // Se trial scaduto, crea subscription automaticamente
    if (isTrialExpired && subscription.status === 'trialing') {
      try {
        toast.info('Creazione abbonamento in corso...');
        await createSubscription();
        toast.success('Abbonamento attivato con successo!');
      } catch (err: any) {
        console.error('Errore creazione subscription:', err);
        toast.error(getErrorMessage(err));
        // Non bloccare, la carta è stata salvata comunque
      }
    }
  }

  onSuccess();
  onClose();
};
```

### **2. Messaggi Errore Specifici**

**File:** `src/utils/stripeErrors.ts` (nuovo)

```typescript
export function getStripeErrorMessage(error: any): string {
  const errorCode = error?.code || error?.type || '';
  const errorMessage = error?.message || '';

  // Mappa codici Stripe a messaggi italiani
  const errorMessages: Record<string, string> = {
    // Errori carta
    'card_declined': 'La carta è stata rifiutata. Controlla i dati o prova un\'altra carta.',
    'expired_card': 'La carta è scaduta. Aggiungi una nuova carta.',
    'incorrect_cvc': 'Il codice di sicurezza (CVC) non è corretto. Controlla e riprova.',
    'insufficient_funds': 'Fondi insufficienti sulla carta. Verifica il saldo disponibile.',
    'invalid_expiry_month': 'Il mese di scadenza non è valido.',
    'invalid_expiry_year': 'L\'anno di scadenza non è valido.',
    'invalid_number': 'Il numero di carta non è valido. Controlla e riprova.',
    'processing_error': 'Si è verificato un errore durante l\'elaborazione. Riprova più tardi.',
    
    // Errori subscription
    'subscription_creation_failed': 'Impossibile creare l\'abbonamento. Riprova o contatta il supporto.',
    'payment_method_required': 'È necessario aggiungere un metodo di pagamento per attivare l\'abbonamento.',
    
    // Errori generici
    'authentication_required': 'Autenticazione richiesta. Effettua il login e riprova.',
    'rate_limit': 'Troppe richieste. Attendi qualche istante e riprova.',
  };

  // Cerca messaggio specifico
  for (const [code, message] of Object.entries(errorMessages)) {
    if (errorCode.includes(code) || errorMessage.toLowerCase().includes(code)) {
      return message;
    }
  }

  // Fallback: messaggio generico ma informativo
  if (errorMessage) {
    return `Errore: ${errorMessage}`;
  }

  return 'Si è verificato un errore durante l\'operazione. Riprova più tardi o contatta il supporto.';
}
```

**Uso in `AddStripeCardModal.tsx`:**
```typescript
import { getStripeErrorMessage } from '@/utils/stripeErrors';

// In catch block:
catch (err: any) {
  const errorMessage = getStripeErrorMessage(err);
  setError(errorMessage);
  toast.error(errorMessage);
}
```

### **3. Cancellazione Subscription**

**File:** `PaymentsModal.tsx`

```typescript
const handleCancelSubscription = async () => {
  if (!professionalId) {
    toast.error('Errore: professionista non trovato');
    return;
  }

  // Modal conferma
  const cancelType = window.confirm(
    'Vuoi cancellare l\'abbonamento?\n\n' +
    'OK = Cancella alla fine del periodo corrente (consigliato)\n' +
    'Annulla = Cancella immediatamente'
  );

  if (!cancelType) {
    // Cancella immediatamente
    const confirmed = window.confirm(
      'Sei sicuro di voler cancellare l\'abbonamento immediatamente? ' +
      'Perderai l\'accesso a PrimePro subito.'
    );
    if (!confirmed) return;
  }

  try {
    setLoading(true);
    
    // Chiama Edge Function per cancellare subscription
    const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
      body: {
        cancel_immediately: !cancelType, // true = cancella subito, false = fine periodo
      },
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.error || 'Errore durante la cancellazione');
    }

    toast.success(
      cancelType 
        ? 'Abbonamento verrà cancellato alla fine del periodo corrente.'
        : 'Abbonamento cancellato immediatamente.'
    );
    
    fetchSettings(); // Ricarica dati
  } catch (err: any) {
    console.error('Errore cancellazione subscription:', err);
    toast.error(getStripeErrorMessage(err));
  } finally {
    setLoading(false);
  }
};
```

**Edge Function da creare:** `supabase/functions/stripe-cancel-subscription/index.ts`

---

## 📍 POSIZIONAMENTO SEZIONE "ABBONAMENTO"

**Proposta:** Sostituire `SubscriptionInfo` con `SubscriptionSection` più completa.

**Ordine sezioni in `PaymentsModal`:**
1. **Metodo di Pagamento** (esistente)
2. **Storico Fatture** (esistente)
3. **Informazioni Abbonamento** → **Rinominare in "Abbonamento"** e espandere

---

## 🎨 UI/UX SUGGERIMENTI

### **1. Prossimo Addebito - Card Dedicata**
```tsx
<div className="bg-gradient-to-r from-[#EEBA2B]/10 to-[#EEBA2B]/5 border-2 border-[#EEBA2B]/20 rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prossimo addebito</p>
      <p className="text-lg font-bold text-gray-900">{nextPaymentDate}</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Importo</p>
      <p className="text-lg font-bold text-[#EEBA2B]">€{plan.price},00</p>
    </div>
  </div>
</div>
```

### **2. Countdown Giorni Trial**
```tsx
{settings.subscription_status === 'trial' && trialEndsAt && (
  const daysRemaining = Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
    <p className="text-sm text-blue-800">
      <strong>{daysRemaining} giorni</strong> rimanenti nel periodo di prova
    </p>
  </div>
)}
```

### **3. Bottone Cancella - Styling**
```tsx
<button
  onClick={handleCancelSubscription}
  className="w-full px-4 py-2.5 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 hover:border-red-400 transition flex items-center justify-center gap-2"
>
  <X className="w-4 h-4" />
  Cancella Abbonamento
</button>
```

---

## ✅ CHECKLIST IMPLEMENTAZIONE

### **Fase 1: Flusso Trial → Subscription**
- [ ] Verificare `trial_end` in `AddStripeCardModal` dopo aggiunta carta
- [ ] Chiamare `createSubscription()` automaticamente se trial scaduto
- [ ] Gestire errori creazione subscription

### **Fase 2: Sezione Abbonamento**
- [ ] Trasformare `SubscriptionInfo` in `SubscriptionSection`
- [ ] Aggiungere visualizzazione `current_period_end` (prossimo addebito)
- [ ] Aggiungere importo prossimo pagamento
- [ ] Aggiungere bottone "Cancella Abbonamento" (solo se active)

### **Fase 3: Messaggi Errore**
- [ ] Creare `src/utils/stripeErrors.ts`
- [ ] Implementare `getStripeErrorMessage()`
- [ ] Integrare in `AddStripeCardModal` e `PaymentsModal`

### **Fase 4: Cancellazione Subscription**
- [ ] Creare Edge Function `stripe-cancel-subscription`
- [ ] Implementare `handleCancelSubscription()` in `PaymentsModal`
- [ ] Aggiungere modal conferma con opzioni

---

## 🎯 CONCLUSIONE

**La proposta è ottima e ben strutturata!**

**Punti di forza:**
- ✅ Flusso trial → subscription chiaro e logico
- ✅ Sezione "Abbonamento" completa e informativa
- ✅ Messaggi errore specifici migliorano UX
- ✅ Cancellazione subscription ben posizionata

**Raccomandazioni:**
1. **Prossimo addebito:** Mostrarlo solo se `status === 'active'` (non in trial)
2. **Cancella abbonamento:** Solo se `status === 'active'` (non in trial o già cancellato)
3. **Trial scaduto:** Alert prominente se trial scaduto e carta non aggiunta

Vuoi che proceda con l'implementazione?

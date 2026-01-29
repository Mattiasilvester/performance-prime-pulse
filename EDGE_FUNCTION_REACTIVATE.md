# ✅ EDGE FUNCTION: stripe-reactivate-subscription

**Data:** 27 Gennaio 2025  
**Stato:** ✅ Creata e integrata

---

## 🎯 COSA FA

La Edge Function `stripe-reactivate-subscription` permette di **riattivare un abbonamento che è stato cancellato ma non ancora scaduto**.

### **Scenario d'uso:**
1. Utente cancella abbonamento → `cancel_at_period_end = true`
2. Abbonamento rimane attivo fino a `current_period_end`
3. Utente cambia idea e vuole riattivare
4. Chiama questa funzione → `cancel_at_period_end = false`
5. Abbonamento continua normalmente dopo `current_period_end`

---

## 📋 FUNZIONALITÀ

### **1. Verifica Autenticazione**
- ✅ Verifica JWT token
- ✅ Verifica che l'utente esista
- ✅ Verifica che il professional esista

### **2. Verifica Subscription**
- ✅ Verifica che la subscription esista
- ✅ Verifica che appartenga al professional
- ✅ Verifica che `cancel_at_period_end = true` (altrimenti errore)

### **3. Riattivazione Stripe**
- ✅ Chiama `stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })`
- ✅ Rimuove la cancellazione programmata

### **4. Aggiornamento Database**
- ✅ Aggiorna `cancel_at_period_end = false`
- ✅ Rimuove `cancellation_reason` (opzionale, ora null)
- ✅ Aggiorna `status` se necessario

### **5. Notifica Utente**
- ✅ Crea notifica "Abbonamento riattivato"
- ✅ Tipo: `subscription_reactivated`
- ✅ Gestione errori non bloccante

---

## 🔧 INTEGRAZIONE

### **Frontend:**
- ✅ `AbbonamentoPage.tsx` → `handleReactivateSubscription()`
- ✅ `ManageSubscriptionCard.tsx` → Bottone "Riattiva abbonamento"
- ✅ Bottone visibile solo se `cancel_at_period_end = true`

### **Backend:**
- ✅ Edge Function: `supabase/functions/stripe-reactivate-subscription/index.ts`
- ✅ Config: `supabase/functions/stripe-reactivate-subscription/deno.json`

---

## 📝 API

### **Request:**
```typescript
POST /functions/v1/stripe-reactivate-subscription
Headers:
  Authorization: Bearer <JWT_TOKEN>
Body:
  {
    "subscription_id": "sub_xxxxx" // stripe_subscription_id
  }
```

### **Response Success:**
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxx",
    "status": "active",
    "cancel_at_period_end": false
  }
}
```

### **Response Error:**
```typescript
{
  "success": false,
  "error": "Subscription is not scheduled for cancellation",
  "details": "..."
}
```

---

## 🧪 TEST

### **Test 1: Riattivazione Successo**
1. Cancella abbonamento (con motivo)
2. Verifica che `cancel_at_period_end = true`
3. Clicca "Riattiva abbonamento"
4. Verifica che `cancel_at_period_end = false`
5. Verifica notifica creata

### **Test 2: Errore - Subscription Non Cancellata**
1. Prova a riattivare subscription con `cancel_at_period_end = false`
2. Verifica errore: "Subscription is not scheduled for cancellation"

### **Test 3: Errore - Subscription Non Appartiene a Professional**
1. Prova con `subscription_id` di altro professional
2. Verifica errore: "Subscription not found or does not belong to this professional"

---

## ✅ CHECKLIST

- [x] Edge Function creata
- [x] `deno.json` configurato
- [x] Verifica autenticazione
- [x] Verifica subscription
- [x] Chiamata Stripe API
- [x] Aggiornamento database
- [x] Notifica creazione
- [x] Gestione errori
- [x] Integrazione frontend (`AbbonamentoPage.tsx`)
- [x] Integrazione componente (`ManageSubscriptionCard.tsx`)
- [ ] **Deploy su Supabase** (da fare)
- [ ] **Test con subscription reale** (da fare)

---

## 🚀 PROSSIMI STEP

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy stripe-reactivate-subscription
   ```

2. **Test Manuale:**
   - Cancella abbonamento
   - Riattiva abbonamento
   - Verifica notifica

3. **Verifica Database:**
   ```sql
   SELECT 
     id,
     professional_id,
     cancel_at_period_end,
     cancellation_reason,
     status
   FROM professional_subscriptions
   WHERE cancel_at_period_end = false
     AND cancellation_reason IS NULL;
   ```

---

## 📊 FLUSSO COMPLETO

```
Utente → Cancella Abbonamento
  ↓
cancel_at_period_end = true
cancellation_reason = "motivo"
  ↓
[Utente cambia idea]
  ↓
Utente → Riattiva Abbonamento
  ↓
Edge Function → stripe.subscriptions.update({ cancel_at_period_end: false })
  ↓
Database → cancel_at_period_end = false, cancellation_reason = null
  ↓
Notifica → "Abbonamento riattivato"
  ↓
Abbonamento continua normalmente dopo current_period_end
```

---

**Edge Function pronta per il deploy! 🚀**

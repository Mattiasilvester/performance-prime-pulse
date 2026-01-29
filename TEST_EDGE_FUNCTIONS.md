# 🧪 TEST EDGE FUNCTIONS - NOTIFICHE STRIPE

**Data:** 27 Gennaio 2025  
**Stato:** Modifiche completate, pronte per test

---

## ✅ MODIFICHE COMPLETATE

### 1. **Edge Function: stripe-webhook**
**File:** `supabase/functions/stripe-webhook/index.ts`

**Modifiche:**
- ✅ Aggiunto handler `handleSubscriptionCreated` per evento `customer.subscription.created`
- ✅ Aggiunta funzione helper `sendSubscriptionNotification` per creare notifiche
- ✅ Integrata notifica in `handleSubscriptionUpdated` quando `cancel_at_period_end` diventa `true`
- ✅ Integrata notifica in `handleSubscriptionDeleted` per cancellazione
- ✅ Integrata notifica in `handleInvoicePaymentFailed` per pagamento fallito

**Eventi gestiti:**
- `customer.subscription.created` → Notifica "Abbonamento attivato"
- `customer.subscription.updated` → Notifica "Abbonamento in cancellazione" (se cancel_at_period_end = true)
- `customer.subscription.deleted` → Notifica "Abbonamento cancellato"
- `invoice.payment_failed` → Notifica "Pagamento fallito"

### 2. **Edge Function: stripe-create-subscription**
**File:** `supabase/functions/stripe-create-subscription/index.ts`

**Modifiche:**
- ✅ Aggiunta creazione notifica dopo creazione subscription
- ✅ Notifica differenziata per trial vs active
- ✅ Gestione errori non bloccante

**Notifiche create:**
- Trial → "Il tuo abbonamento Prime Business è stato attivato! Stai iniziando il periodo di prova gratuito di 3 mesi."
- Active → "Il tuo abbonamento Prime Business è stato attivato con successo! Benvenuto nella community PrimePro."

### 3. **Edge Function: stripe-cancel-subscription**
**File:** `supabase/functions/stripe-cancel-subscription/index.ts`

**Modifiche:**
- ✅ Aggiunta creazione notifica dopo cancellazione
- ✅ Notifica differenziata per cancellazione immediata vs fine periodo
- ✅ Incluso `cancellation_reason` nel campo `data` della notifica
- ✅ Gestione errori non bloccante

**Notifiche create:**
- Cancellazione immediata → "Il tuo abbonamento Prime Business è stato cancellato immediatamente. Grazie per aver utilizzato PrimePro!"
- Fine periodo → "Il tuo abbonamento Prime Business verrà cancellato il [data]. Continuerai ad avere accesso fino a quella data."

---

## 🧪 COME TESTARE

### **Test 1: Creazione Subscription**
1. Aggiungi una carta Stripe (test: 4242 4242 4242 4242)
2. Attendi creazione subscription
3. Verifica che appaia notifica "Abbonamento attivato" nel sistema notifiche

### **Test 2: Cancellazione Subscription**
1. Vai su pagina Abbonamento
2. Clicca "Cancella abbonamento"
3. Inserisci motivo obbligatorio
4. Conferma cancellazione
5. Verifica che appaia notifica "Abbonamento in cancellazione" o "Abbonamento cancellato"

### **Test 3: Pagamento Fallito**
1. Simula pagamento fallito in Stripe Dashboard (usa carta di test che fallisce)
2. Verifica che appaia notifica "Pagamento fallito"

### **Test 4: Webhook Stripe**
1. Invia evento test da Stripe Dashboard → Webhooks → Send test webhook
2. Eventi da testare:
   - `customer.subscription.created`
   - `customer.subscription.updated` (con cancel_at_period_end = true)
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

---

## 📋 CHECKLIST VERIFICA

- [x] Funzione `sendSubscriptionNotification` creata
- [x] Handler `handleSubscriptionCreated` creato
- [x] Evento `customer.subscription.created` gestito
- [x] Notifiche integrate in `stripe-create-subscription`
- [x] Notifiche integrate in `stripe-cancel-subscription`
- [x] Notifiche integrate in webhook per tutti gli eventi
- [x] Gestione errori non bloccante implementata
- [x] Tipo notifica: `'custom'` con `notification_type` nel campo `data`

---

## 🔍 VERIFICA MANUALE

### **Controlla che le notifiche vengano create:**

```sql
-- Verifica notifiche subscription create
SELECT 
  id,
  professional_id,
  type,
  title,
  message,
  data->>'notification_type' as notification_type,
  created_at
FROM professional_notifications
WHERE type = 'custom'
  AND data->>'notification_type' LIKE 'subscription_%'
ORDER BY created_at DESC
LIMIT 10;
```

### **Controlla che i motivi di cancellazione siano salvati:**

```sql
-- Verifica motivi cancellazione
SELECT 
  id,
  professional_id,
  cancellation_reason,
  canceled_at,
  cancel_at_period_end,
  status
FROM professional_subscriptions
WHERE cancellation_reason IS NOT NULL
ORDER BY canceled_at DESC
LIMIT 10;
```

---

## ⚠️ NOTE IMPORTANTI

1. **Le notifiche vengono create nel database** `professional_notifications`
2. **Le notifiche rispettano le preferenze utente** (se ha disabilitato le notifiche, non vengono create)
3. **Gli errori di notifica non bloccano il flusso principale** (gestione graceful)
4. **Le notifiche appaiono nel sistema notifiche dell'app** (campanello)
5. **Per inviare anche email**, serve integrare sistema email (n8n webhook) che invia email quando vengono create le notifiche

---

## 🚀 PROSSIMI STEP

1. **Deploy Edge Functions** su Supabase
2. **Test manuale** con eventi Stripe reali
3. **Verifica notifiche** nel database e nell'app
4. **Integrazione email** (se necessario) tramite n8n webhook

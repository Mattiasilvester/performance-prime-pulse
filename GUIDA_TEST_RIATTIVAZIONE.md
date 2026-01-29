# 🧪 GUIDA TEST MANUALE - RIATTIVAZIONE ABBONAMENTO

**Data:** 27 Gennaio 2025  
**Edge Function:** `stripe-reactivate-subscription` ✅ Deploy completato

---

## ✅ STATO DEPLOY

- ✅ Edge Function deployata con successo
- ✅ Warning Docker (non critico per deploy remoto)
- ✅ Funzione disponibile su Supabase

---

## 🧪 TEST 1: RIATTIVAZIONE ABBONAMENTO (PRINCIPALE)

### **Prerequisiti:**
- Utente con abbonamento attivo (`status: 'active'` o `'trialing'`)
- Accesso alla pagina "Abbonamento" (`/abbonamento`)

### **Passi:**

1. **Vai alla pagina Abbonamento**
   - URL: `/abbonamento`
   - Verifica che la card "Gestione Abbonamento" sia visibile

2. **Cancella l'abbonamento**
   - Clicca su "Cancella abbonamento"
   - Inserisci un motivo (es: "Test riattivazione")
   - Conferma la cancellazione
   - ✅ **Verifica:** Toast "Abbonamento verrà cancellato alla fine del periodo corrente"
   - ✅ **Verifica:** Card mostra banner giallo "Abbonamento in cancellazione"

3. **Riattiva l'abbonamento**
   - ✅ **Verifica:** Bottone "Riattiva abbonamento" visibile nel banner giallo
   - Clicca su "Riattiva abbonamento"
   - ✅ **Verifica:** Bottone mostra "Riattivazione..." durante il loading
   - ✅ **Verifica:** Toast "Abbonamento riattivato con successo!"

4. **Verifica stato finale**
   - ✅ **Verifica:** Banner giallo scompare
   - ✅ **Verifica:** Card torna allo stato normale (con bottone "Cancella abbonamento")
   - ✅ **Verifica:** Notifica "Abbonamento riattivato" appare nel sistema notifiche (campanello)

---

## 🧪 TEST 2: VERIFICA DATABASE

### **Query SQL da eseguire:**

```sql
-- 1. Verifica che cancel_at_period_end sia false dopo riattivazione
SELECT 
  id,
  professional_id,
  status,
  cancel_at_period_end,
  cancellation_reason,
  updated_at
FROM professional_subscriptions
WHERE professional_id = 'YOUR_PROFESSIONAL_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- Risultato atteso:
-- cancel_at_period_end: false
-- cancellation_reason: null (rimosso dopo riattivazione)
```

```sql
-- 2. Verifica notifica creata
SELECT 
  id,
  professional_id,
  type,
  title,
  message,
  data->>'notification_type' as notification_type,
  created_at
FROM professional_notifications
WHERE professional_id = 'YOUR_PROFESSIONAL_ID'
  AND data->>'notification_type' = 'subscription_reactivated'
ORDER BY created_at DESC
LIMIT 1;

-- Risultato atteso:
-- title: "Abbonamento riattivato"
-- notification_type: "subscription_reactivated"
```

---

## 🧪 TEST 3: VERIFICA STRIPE DASHBOARD

### **Passi:**

1. **Vai su Stripe Dashboard**
   - URL: https://dashboard.stripe.com
   - Sezione: Customers → [Il tuo customer] → Subscriptions

2. **Verifica subscription**
   - ✅ **Verifica:** Subscription ha `Cancel at period end: No` (dopo riattivazione)
   - ✅ **Verifica:** Status è `active` o `trialing`
   - ✅ **Verifica:** `Cancel at period end` era `Yes` prima della riattivazione

3. **Verifica eventi webhook** (opzionale)
   - Sezione: Developers → Events
   - Cerca eventi `customer.subscription.updated`
   - ✅ **Verifica:** Evento con `cancel_at_period_end: false`

---

## 🧪 TEST 4: CASI D'ERRORE

### **Test 4.1: Riattivazione senza cancellazione**
- **Scenario:** Prova a riattivare subscription con `cancel_at_period_end = false`
- **Risultato atteso:** Errore "Subscription is not scheduled for cancellation"
- **Come testare:** 
  - Se hai già riattivato, il bottone non dovrebbe essere visibile
  - Se provi via API direttamente, dovresti ricevere errore 400

### **Test 4.2: Subscription non trovata**
- **Scenario:** Prova con `subscription_id` inesistente
- **Risultato atteso:** Errore "Subscription not found or does not belong to this professional"
- **Come testare:** Modifica temporaneamente il codice per passare ID errato

### **Test 4.3: Autenticazione mancante**
- **Scenario:** Chiama API senza token
- **Risultato atteso:** Errore 401 "Missing authorization header"
- **Come testare:** Usa Postman/curl senza header Authorization

---

## 🧪 TEST 5: FLUSSO COMPLETO END-TO-END

### **Scenario completo:**

1. **Stato iniziale:** Abbonamento attivo
   - ✅ Verifica: Card mostra "Cancella abbonamento"

2. **Cancellazione:**
   - Cancella con motivo "Test completo"
   - ✅ Verifica: Banner giallo appare
   - ✅ Verifica: Bottone "Riattiva abbonamento" visibile
   - ✅ Verifica: Database: `cancel_at_period_end = true`, `cancellation_reason = "Test completo"`

3. **Riattivazione:**
   - Clicca "Riattiva abbonamento"
   - ✅ Verifica: Toast successo
   - ✅ Verifica: Banner giallo scompare
   - ✅ Verifica: Database: `cancel_at_period_end = false`, `cancellation_reason = null`
   - ✅ Verifica: Notifica creata

4. **Stato finale:**
   - ✅ Verifica: Card torna allo stato normale
   - ✅ Verifica: Bottone "Cancella abbonamento" di nuovo disponibile

---

## 📋 CHECKLIST TEST

### **Test Funzionali:**
- [ ] Cancellazione abbonamento funziona
- [ ] Banner "Abbonamento in cancellazione" appare
- [ ] Bottone "Riattiva abbonamento" visibile
- [ ] Riattivazione funziona
- [ ] Toast successo appare
- [ ] Banner giallo scompare dopo riattivazione
- [ ] Card torna allo stato normale

### **Test Database:**
- [ ] `cancel_at_period_end` diventa `false` dopo riattivazione
- [ ] `cancellation_reason` diventa `null` dopo riattivazione
- [ ] Notifica `subscription_reactivated` creata

### **Test Stripe:**
- [ ] Stripe Dashboard mostra `Cancel at period end: No`
- [ ] Subscription status corretto

### **Test UX:**
- [ ] Loading state durante riattivazione
- [ ] Messaggi di errore chiari (se applicabile)
- [ ] Notifica appare nel sistema notifiche

---

## 🔍 VERIFICA LOGS

### **Supabase Dashboard:**
1. Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions
2. Clicca su `stripe-reactivate-subscription`
3. Sezione: **Logs**
4. ✅ **Verifica:** Log con messaggi:
   - `[STRIPE REACTIVATE] Function called`
   - `[STRIPE REACTIVATE] User authenticated`
   - `[STRIPE REACTIVATE] Subscription reactivated in Stripe`
   - `[STRIPE REACTIVATE] Database updated`
   - `[STRIPE REACTIVATE] Notifica riattivazione inviata`

---

## ⚠️ NOTE IMPORTANTI

1. **Docker Warning:** Non è critico per il deploy remoto. La funzione funziona su Supabase.

2. **Test in Development:**
   - Se usi placeholder data (`import.meta.env.DEV`), potresti non vedere la riattivazione
   - Per test completo, usa dati reali o disabilita temporaneamente placeholder

3. **Stripe Test Mode:**
   - Assicurati di essere in Stripe Test Mode per i test
   - Usa carte di test: `4242 4242 4242 4242`

4. **Notifiche:**
   - Le notifiche appaiono nel sistema notifiche dell'app (campanello)
   - Verifica che l'utente abbia le notifiche abilitate

---

## 🚀 PROSSIMI STEP DOPO TEST

Se tutti i test passano:
1. ✅ Edge Function funzionante
2. ✅ Integrazione frontend completa
3. ✅ Notifiche funzionanti
4. ✅ Database aggiornato correttamente

**Prossimo task:** STEP 3 - Visibilità `ManageSubscriptionCard` per status `'incomplete'` o `'past_due'`

---

**Buon testing! 🧪**

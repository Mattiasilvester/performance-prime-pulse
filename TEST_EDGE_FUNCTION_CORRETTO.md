# 🧪 TEST CORRETTO - stripe-reactivate-subscription

**Data:** 27 Gennaio 2025  
**Problema:** Errore 400 nel test dashboard Supabase

---

## ✅ SPIEGAZIONE ERRORE 400

L'errore 400 è **normale** quando testi dalla dashboard con un body sbagliato.

**Body attuale (sbagliato):**
```json
{
  "name": "Functions"
}
```

**Body corretto (richiesto dalla funzione):**
```json
{
  "subscription_id": "sub_xxxxx"
}
```

---

## 🧪 COME TESTARE CORRETTAMENTE

### **Opzione 1: Test dalla Dashboard Supabase**

1. Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions/stripe-reactivate-subscription
2. **Request Body:** Sostituisci con:
   ```json
   {
     "subscription_id": "sub_1Qxxxxx"
   }
   ```
   (Sostituisci `sub_1Qxxxxx` con un `stripe_subscription_id` reale dal database)

3. **Headers:** Aggiungi:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```
   (Puoi ottenere il token dalla console del browser quando sei loggato)

4. Clicca "Send Request"

### **Opzione 2: Test dall'App (CONSIGLIATO)**

Il test più realistico è dall'app stessa:

1. Vai su `/abbonamento`
2. Apri console browser (F12)
3. Clicca "Riattiva abbonamento"
4. Controlla i log:
   - `[REACTIVATE] Chiamata Edge Function con: {...}`
   - `[REACTIVATE] Risposta Edge Function: {...}`

---

## 🔍 VERIFICA DATI NEL DATABASE

Per ottenere un `subscription_id` valido per il test:

```sql
SELECT 
  id,
  professional_id,
  stripe_subscription_id,
  cancel_at_period_end,
  status
FROM professional_subscriptions
WHERE cancel_at_period_end = true
  AND status IN ('active', 'trialing')
LIMIT 1;
```

Usa il valore di `stripe_subscription_id` nel body del test.

---

## ⚠️ NOTA IMPORTANTE

**L'errore 400 nel test dashboard è normale se:**
- Il body non contiene `subscription_id`
- Il `subscription_id` non esiste
- Il `subscription_id` non appartiene a una subscription con `cancel_at_period_end = true`

**Il test reale deve essere fatto dall'app**, dove:
- Il body viene passato correttamente
- L'autenticazione è gestita automaticamente
- I dati sono reali

---

## 📋 CHECKLIST

- [ ] Test dalla dashboard con body corretto (opzionale)
- [ ] **Test dall'app** (CONSIGLIATO)
- [ ] Verifica logs console browser
- [ ] Verifica logs Supabase
- [ ] Verifica che la riattivazione funzioni

---

**L'errore 400 è normale nel test dashboard. Testa dall'app per vedere se funziona realmente! 🚀**

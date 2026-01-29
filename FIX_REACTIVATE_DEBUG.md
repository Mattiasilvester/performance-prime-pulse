# 🔧 FIX DEBUG - stripe-reactivate-subscription

**Data:** 27 Gennaio 2025  
**Problema:** Errore 400 "Missing subscription_id"

---

## ✅ MODIFICHE APPLICATE

### **1. Frontend (`AbbonamentoPage.tsx`):**
- ✅ Aggiunto logging dettagliato prima della chiamata
- ✅ Log di `subscription_id` e `cancel_at_period_end`
- ✅ Log della risposta dalla Edge Function
- ✅ Gestione errori migliorata con messaggi più dettagliati

### **2. Edge Function (`stripe-reactivate-subscription/index.ts`):**
- ✅ Aggiunto logging di method, headers, raw body
- ✅ Parsing body migliorato con gestione errori
- ✅ Log del body parsato
- ✅ Messaggio errore più dettagliato con `received_body`

---

## 🚀 PROSSIMI STEP

### **1. Deploy Edge Function Aggiornata:**
```bash
supabase functions deploy stripe-reactivate-subscription
```

### **2. Test:**
1. Vai su `/abbonamento`
2. Apri la console del browser (F12 → Console)
3. Clicca "Riattiva abbonamento"
4. Controlla i log nella console:
   - `[REACTIVATE] Chiamata Edge Function con: {...}`
   - `[REACTIVATE] Risposta Edge Function: {...}`

### **3. Verifica Logs Supabase:**
1. Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions
2. Clicca su `stripe-reactivate-subscription`
3. Tab "Logs"
4. Cerca:
   - `[STRIPE REACTIVATE] Function called`
   - `[STRIPE REACTIVATE] Raw body: ...`
   - `[STRIPE REACTIVATE] Parsed body: ...`

---

## 🔍 COSA VERIFICARE

### **Nel Browser Console:**
- ✅ `subscription_id` esiste e ha un valore?
- ✅ Il body viene inviato correttamente?
- ✅ Quale errore viene restituito?

### **Nei Logs Supabase:**
- ✅ Il body arriva alla funzione?
- ✅ Il body è vuoto o contiene dati?
- ✅ Quale errore viene generato?

---

## ⚠️ POSSIBILI CAUSE

1. **`subscription.stripe_subscription_id` è null/undefined**
   - Verifica nei log del browser
   - Potrebbe essere che la subscription non ha `stripe_subscription_id`

2. **Body non viene serializzato correttamente**
   - Verifica nei logs Supabase cosa arriva
   - Potrebbe essere un problema con come Supabase client invia il body

3. **Cache del browser**
   - Prova a fare hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
   - Pulisci cache del browser

---

## 📋 CHECKLIST

- [ ] Deploy Edge Function aggiornata
- [ ] Test con console browser aperta
- [ ] Verifica logs Supabase
- [ ] Identifica causa problema dai logs
- [ ] Fix problema identificato

---

**Dopo il deploy, prova di nuovo e condividi i logs! 🔍**

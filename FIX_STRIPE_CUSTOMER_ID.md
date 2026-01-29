# 🔧 FIX ERRORE: column professionals.stripe_customer_id does not exist

**Data:** 27 Gennaio 2025  
**Problema:** Errore 500 nella funzione `stripe-reactivate-subscription`

---

## 🔍 ANALISI ERRORE

### **Errore nei Logs Supabase:**
```
[STRIPE REACTIVATE] Professional query error: {
 code: "42703",
 message: "column professionals.stripe_customer_id does not exist"
}
```

### **Causa:**
La funzione `stripe-reactivate-subscription` sta cercando di selezionare `stripe_customer_id` dalla tabella `professionals`, ma questa colonna **non esiste** nel database.

### **Confronto con altre funzioni:**
- `stripe-cancel-subscription` seleziona solo: `id, user_id` ✅
- `stripe-reactivate-subscription` selezionava: `id, email, stripe_customer_id, user_id` ❌

---

## ✅ SOLUZIONE APPLICATA

**Rimosso `stripe_customer_id` dalla SELECT:**

**Prima:**
```typescript
.select('id, email, stripe_customer_id, user_id')
```

**Dopo:**
```typescript
.select('id, email, user_id')
```

---

## 🚀 PROSSIMI STEP

### **1. Deploy Funzione Aggiornata:**
```bash
supabase functions deploy stripe-reactivate-subscription
```

### **2. Test:**
1. Vai su `/abbonamento`
2. Clicca "Riattiva abbonamento"
3. Verifica che non ci sia più errore 500
4. Verifica che la riattivazione funzioni

### **3. Verifica Logs:**
Dopo il deploy, nei logs Supabase dovresti vedere:
- `[STRIPE REACTIVATE] Professional query result: { professional: {...}, error: null }`
- `[STRIPE REACTIVATE] Professional found: ...`
- Nessun errore "column does not exist"

---

## 📋 CHECKLIST

- [x] Rimosso `stripe_customer_id` dalla SELECT
- [ ] **Deploy funzione aggiornata** (da fare)
- [ ] Test riattivazione dall'app
- [ ] Verifica logs Supabase
- [ ] Verifica che la riattivazione funzioni correttamente

---

**Problema risolto! Deploy la funzione aggiornata e testa! 🚀**

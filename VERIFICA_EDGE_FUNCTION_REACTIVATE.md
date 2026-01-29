# 🔍 VERIFICA EDGE FUNCTION: stripe-reactivate-subscription

**Data:** 27 Gennaio 2025  
**Problema:** Errore 404 quando si clicca "Riattiva abbonamento"

---

## ✅ VERIFICA COMPLETATA

### **1. File Esistono Localmente:**
- ✅ `supabase/functions/stripe-reactivate-subscription/index.ts` - Esiste
- ✅ `supabase/functions/stripe-reactivate-subscription/deno.json` - Esiste

### **2. Nome Funzione Corretto:**
- ✅ Frontend chiama: `stripe-reactivate-subscription`
- ✅ Nome file: `stripe-reactivate-subscription`
- ✅ Match corretto ✅

### **3. Problema Identificato:**
- ❌ **Errore 404** = Edge Function non deployata o non accessibile su Supabase
- ❌ La funzione esiste localmente ma potrebbe non essere deployata

---

## 🚀 SOLUZIONE: DEPLOY EDGE FUNCTION

### **Comando Deploy:**
```bash
supabase functions deploy stripe-reactivate-subscription
```

### **Verifica Deploy:**
1. Vai su Supabase Dashboard
2. URL: `https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions`
3. Verifica che `stripe-reactivate-subscription` sia presente nella lista
4. Clicca sulla funzione per vedere i logs

---

## 📋 CHECKLIST VERIFICA

- [x] File funzione esiste localmente
- [x] Nome funzione corretto nel frontend
- [ ] **Edge Function deployata su Supabase** ← DA FARE
- [ ] Test funzionamento dopo deploy

---

## 🔍 COME VERIFICARE DOPO DEPLOY

### **1. Supabase Dashboard:**
- Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions
- Cerca `stripe-reactivate-subscription`
- Verifica che sia presente e attiva

### **2. Test Manuale:**
1. Vai su `/abbonamento`
2. Cancella abbonamento (se non già cancellato)
3. Clicca "Riattiva abbonamento"
4. Verifica che non ci siano più errori 404

### **3. Verifica Logs:**
- Supabase Dashboard → Functions → `stripe-reactivate-subscription` → Logs
- Dovresti vedere:
  - `[STRIPE REACTIVATE] Function called`
  - `[STRIPE REACTIVATE] User authenticated`
  - `[STRIPE REACTIVATE] Subscription reactivated in Stripe`

---

## ⚠️ POSSIBILI CAUSE ERRORE 404

1. **Funzione non deployata** (più probabile)
2. **Nome funzione errato** (verificato: corretto)
3. **Progetto Supabase non linkato** (verifica con `supabase link`)
4. **Permessi insufficienti** (verifica Service Role Key)

---

## 🎯 PROSSIMI STEP

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy stripe-reactivate-subscription
   ```

2. **Verifica Deploy:**
   - Controlla Supabase Dashboard
   - Verifica che la funzione sia presente

3. **Test Funzionamento:**
   - Prova a riattivare abbonamento
   - Verifica logs per eventuali errori

---

**Il problema è che la Edge Function non è deployata. Deploy e testa! 🚀**

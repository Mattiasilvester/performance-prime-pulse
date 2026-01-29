# 🔧 FIX ERRORE 404 - stripe-reactivate-subscription

**Data:** 27 Gennaio 2025  
**Problema:** Errore 404 quando si chiama la funzione dall'app

---

## 🔍 ANALISI ERRORE

Dai log della console:
- ✅ Frontend chiama correttamente: `subscription_id: 'sub_1StyvWDCV0v9uV0BJjdzHfoN'`
- ❌ **Errore 404:** `POST https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-reactivate-subscription 404 (Not Found)`

**Causa:** La Edge Function non è deployata o non è accessibile su Supabase.

---

## 🚀 SOLUZIONE: VERIFICA E REDEPLOY

### **Step 1: Verifica Deploy**

1. Vai su Supabase Dashboard:
   https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions

2. Verifica che `stripe-reactivate-subscription` sia presente nella lista

3. Se **NON è presente** → Deploy necessario
4. Se **è presente** → Potrebbe essere un problema di cache o configurazione

### **Step 2: Redeploy Forzato**

```bash
# Assicurati di essere nella directory del progetto
cd /Users/mattiasilvestrelli/Prime-puls-HUB

# Verifica che il progetto sia linkato
supabase link --project-ref kfxoyucatvvcgmqalxsg

# Deploy forzato della funzione
supabase functions deploy stripe-reactivate-subscription --no-verify-jwt
```

### **Step 3: Verifica Deploy**

Dopo il deploy, verifica:

1. **Supabase Dashboard:**
   - Vai su Functions
   - Cerca `stripe-reactivate-subscription`
   - Verifica che sia presente e attiva

2. **Test dalla Dashboard:**
   - Clicca sulla funzione
   - Tab "Test"
   - Body: `{ "subscription_id": "sub_1StyvWDCV0v9uV0BJjdzHfoN" }`
   - Header: `Authorization: Bearer YOUR_TOKEN`
   - Clicca "Send Request"

3. **Test dall'App:**
   - Ricarica la pagina (hard refresh: Ctrl+Shift+R)
   - Prova di nuovo "Riattiva abbonamento"
   - Verifica che non ci sia più errore 404

---

## ⚠️ POSSIBILI CAUSE

1. **Funzione non deployata**
   - Soluzione: Deploy la funzione

2. **Nome funzione errato**
   - Verificato: Nome corretto ✅

3. **Progetto non linkato**
   - Soluzione: `supabase link --project-ref kfxoyucatvvcgmqalxsg`

4. **Cache del browser**
   - Soluzione: Hard refresh (Ctrl+Shift+R o Cmd+Shift+R)

5. **Permessi insufficienti**
   - Verifica che l'utente abbia i permessi per chiamare Edge Functions

---

## 📋 CHECKLIST

- [ ] Verifica Supabase Dashboard che la funzione esista
- [ ] Se non esiste → Deploy: `supabase functions deploy stripe-reactivate-subscription`
- [ ] Se esiste → Redeploy forzato: `supabase functions deploy stripe-reactivate-subscription --no-verify-jwt`
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test dall'app
- [ ] Verifica che non ci sia più errore 404

---

## 🔍 VERIFICA LOGS DOPO DEPLOY

Dopo il deploy, quando chiami la funzione dall'app, dovresti vedere nei logs Supabase:

1. Vai su: Functions → `stripe-reactivate-subscription` → Logs
2. Dovresti vedere:
   - `[STRIPE REACTIVATE] Function called`
   - `[STRIPE REACTIVATE] Raw body: {"subscription_id":"sub_1StyvWDCV0v9uV0BJjdzHfoN"}`
   - `[STRIPE REACTIVATE] Parsed body: {subscription_id: "sub_1StyvWDCV0v9uV0BJjdzHfoN"}`

Se non vedi questi log, la funzione non è stata chiamata (ancora problema 404).

---

**Il problema è che la funzione non è deployata. Fai il deploy e testa di nuovo! 🚀**

# ✅ Checklist Configurazione PayPal - Verifica Completa

## 📋 **STATO CONFIGURAZIONE**

### **1. Piano PayPal Configurato (✅ Dalle immagini)**
- [x] **Trial 3 mesi gratis** (€0) - ✅ Configurato
- [x] **Prezzo ricorrente €50/mese** - ✅ Configurato
- [x] **Cicli illimitati** - ✅ Configurato
- [x] **Fatturazione automatica pagamenti insoluti** - ✅ Attivata

---

## 🔧 **VARIABILI D'AMBIENTE - File `.env` (Frontend)**

**File:** `/Users/mattiasilvestrelli/Prime-puls-HUB/.env`

### **Stato Attuale:**
```env
VITE_PAYPAL_CLIENT_ID=il_tuo_client_id          ⚠️ DA SOSTITUIRE
VITE_PAYPAL_PLAN_ID=il_tuo_plan_id              ⚠️ DA SOSTITUIRE
VITE_PAYPAL_MODE=sandbox                        ✅ OK (o 'live' per produzione)
```

### **Cosa fare:**
1. **VITE_PAYPAL_CLIENT_ID**: 
   - Vai su [developer.paypal.com](https://developer.paypal.com)
   - App "Prime Business" → Credenziali → **Client ID** (non Secret!)
   - Sostituisci `il_tuo_client_id` con il valore reale

2. **VITE_PAYPAL_PLAN_ID**:
   - Vai su [paypal.com/billing/plans](https://paypal.com/billing/plans)
   - Trova il piano "Prime Business" che hai creato
   - Copia il **Plan ID** (es. `P-XXXXXXXXXXXXX`)
   - Sostituisci `il_tuo_plan_id` con il valore reale

3. **VITE_PAYPAL_MODE**:
   - `sandbox` per test (attuale) ✅
   - `live` per produzione (cambia quando vai in produzione)

---

## 🔐 **SUPABASE SECRETS (Edge Functions)**

**Dove:** Dashboard Supabase → Project Settings → Edge Functions → Secrets

### **Secrets Richiesti:**

| Secret Name | Valore | Dove Trovarlo | Stato |
|------------|--------|---------------|-------|
| `PAYPAL_CLIENT_ID` | Client ID PayPal | developer.paypal.com → App → Credenziali | ⚠️ DA INSERIRE |
| `PAYPAL_CLIENT_SECRET` | Client Secret PayPal | developer.paypal.com → App → Credenziali | ⚠️ DA INSERIRE |
| `PAYPAL_PLAN_ID` | Plan ID del piano | paypal.com/billing/plans → Piano → ID | ⚠️ DA INSERIRE |
| `PAYPAL_MODE` | `sandbox` o `live` | `sandbox` per test, `live` per produzione | ⚠️ DA INSERIRE |

### **Come inserire i Secrets:**
1. Vai su [supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona progetto `kfxoyucatvvcgmqalxsg`
3. Settings → Edge Functions → Secrets
4. Aggiungi ogni secret con il pulsante "Add new secret"

**⚠️ IMPORTANTE:**
- `PAYPAL_CLIENT_SECRET` è **diverso** da `VITE_PAYPAL_CLIENT_ID` (non va nel frontend!)
- Il Secret va **solo** nelle Edge Functions (Supabase Secrets)
- Il Client ID va **sia** nel `.env` (frontend) **che** nei Supabase Secrets (Edge Functions)

---

## 🌐 **WEBHOOK PAYPAL**

**URL Webhook:** `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/paypal-webhook`

### **Come configurare:**
1. Vai su [developer.paypal.com](https://developer.paypal.com)
2. App "Prime Business" → Webhooks
3. Aggiungi webhook con URL: `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/paypal-webhook`
4. Eventi da ascoltare:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`
   - `PAYMENT.SALE.REFUNDED`

**⚠️ IMPORTANTE:**
- Per **sandbox**: configura webhook nell'app sandbox
- Per **produzione**: configura webhook nell'app live (quando passi a `PAYPAL_MODE=live`)

---

## 🚀 **DEPLOY EDGE FUNCTIONS**

### **Edge Functions da deployare:**
1. `paypal-create-subscription` - Crea subscription PayPal
2. `paypal-cancel-subscription` - Cancella subscription PayPal
3. `paypal-webhook` - Gestisce eventi PayPal

### **Come deployare:**
```bash
# Dalla root del progetto
cd /Users/mattiasilvestrelli/Prime-puls-HUB

# Deploy singola function
supabase functions deploy paypal-create-subscription
supabase functions deploy paypal-cancel-subscription
supabase functions deploy paypal-webhook

# Oppure deploy tutte insieme
supabase functions deploy
```

**⚠️ IMPORTANTE:**
- Deploy **dopo** aver inserito i Secrets in Supabase
- Verifica che le Edge Functions abbiano accesso ai Secrets

---

## ✅ **VERIFICA FINALE**

### **Checklist Completa:**

#### **Frontend (.env):**
- [ ] `VITE_PAYPAL_CLIENT_ID` = Client ID reale (non placeholder)
- [ ] `VITE_PAYPAL_PLAN_ID` = Plan ID reale (non placeholder)
- [ ] `VITE_PAYPAL_MODE` = `sandbox` o `live`

#### **Supabase Secrets:**
- [ ] `PAYPAL_CLIENT_ID` = Client ID (stesso del frontend)
- [ ] `PAYPAL_CLIENT_SECRET` = Client Secret (solo backend!)
- [ ] `PAYPAL_PLAN_ID` = Plan ID (stesso del frontend)
- [ ] `PAYPAL_MODE` = `sandbox` o `live`

#### **Webhook PayPal:**
- [ ] Webhook configurato su developer.paypal.com
- [ ] URL: `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/paypal-webhook`
- [ ] Eventi selezionati (vedi lista sopra)

#### **Edge Functions:**
- [ ] `paypal-create-subscription` deployata
- [ ] `paypal-cancel-subscription` deployata
- [ ] `paypal-webhook` deployata

#### **Test:**
- [ ] Frontend: bottone PayPal appare e funziona
- [ ] Test subscription: crea subscription PayPal (sandbox)
- [ ] Verifica database: subscription salvata con `status: 'trialing'`
- [ ] Verifica webhook: test evento da PayPal dashboard

---

## 📝 **NOTE IMPORTANTI**

1. **Sandbox vs Live:**
   - **Sandbox**: Usa account PayPal sandbox per test
   - **Live**: Usa account PayPal reali (solo in produzione)

2. **Client ID vs Client Secret:**
   - **Client ID**: Pubblico, va nel frontend (`.env`) e backend (Secrets)
   - **Client Secret**: Privato, va **solo** nel backend (Supabase Secrets)

3. **Plan ID:**
   - Deve essere lo **stesso** nel frontend (`.env`) e backend (Secrets)
   - Formato: `P-XXXXXXXXXXXXX`

4. **Trial 3 mesi:**
   - Configurato nel piano PayPal (✅ fatto)
   - Edge Function `paypal-create-subscription` salva `trial_end` a 90 giorni
   - Allo scadere, PayPal addebita automaticamente e webhook aggiorna a `active`

---

## 🐛 **TROUBLESHOOTING**

### **Problema: "PayPal non è configurato"**
- **Causa**: `VITE_PAYPAL_CLIENT_ID` o `VITE_PAYPAL_PLAN_ID` sono placeholder
- **Soluzione**: Sostituisci con valori reali nel `.env`

### **Problema: "PayPal auth failed"**
- **Causa**: `PAYPAL_CLIENT_ID` o `PAYPAL_CLIENT_SECRET` errati nei Supabase Secrets
- **Soluzione**: Verifica Secrets in Supabase Dashboard

### **Problema: "Webhook non riceve eventi"**
- **Causa**: Webhook non configurato o URL errato
- **Soluzione**: Verifica URL webhook su developer.paypal.com

### **Problema: "Subscription non si aggiorna dopo trial"**
- **Causa**: Webhook non configurato o eventi non selezionati
- **Soluzione**: Verifica che `PAYMENT.SALE.COMPLETED` sia selezionato negli eventi webhook

---

**Ultimo aggiornamento:** 28 Gennaio 2025
**Stato:** ⚠️ In attesa inserimento valori reali in `.env` e Supabase Secrets

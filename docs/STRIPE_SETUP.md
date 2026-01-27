# 🔐 CONFIGURAZIONE STRIPE - ABBONAMENTI PRIMEPRO

**Data creazione:** 26 Gennaio 2025  
**Versione:** 1.0

---

## 📋 OVERVIEW

Questo documento descrive come configurare le variabili d'ambiente necessarie per l'integrazione Stripe per gli abbonamenti PrimePro dei professionisti.

**Account Stripe:** Gurfa Digital Solutions  
**Uso:** Solo abbonamenti mensili professionisti (NON pagamenti clienti→professionisti)

---

## 🔑 VARIABILI D'AMBIENTE RICHIESTE

### 1. Stripe API Keys

#### **STRIPE_SECRET_KEY**
- **Descrizione:** Chiave segreta Stripe per operazioni server-side
- **Dove trovarla:** https://dashboard.stripe.com/apikeys
- **Formato:** `sk_test_...` (test) o `sk_live_...` (produzione)
- **Usata in:** Edge Functions (stripe-create-customer, stripe-create-subscription, stripe-webhook)

#### **VITE_STRIPE_PUBLISHABLE_KEY**
- **Descrizione:** Chiave pubblica Stripe per operazioni client-side
- **Dove trovarla:** https://dashboard.stripe.com/apikeys
- **Formato:** `pk_test_...` (test) o `pk_live_...` (produzione)
- **Usata in:** Frontend (PaymentsModal.tsx per Stripe Elements)

---

### 2. Stripe Webhook Secret

#### **STRIPE_WEBHOOK_SECRET**
- **Descrizione:** Secret per verificare la firma dei webhook Stripe
- **Dove trovarla:** Dopo aver creato l'endpoint webhook (vedi sezione Webhook)
- **Formato:** `whsec_...`
- **Usata in:** Edge Function stripe-webhook

---

### 3. Stripe Price ID

#### **STRIPE_PRICE_BUSINESS**
- **Descrizione:** Price ID per piano Business (€50/mese)
- **Dove trovarla:** Dopo aver creato il Product e Price in Stripe Dashboard
- **Formato:** `price_...`
- **Usata in:** Edge Function stripe-create-subscription

---

## 📝 CONFIGURAZIONE LOCALE (.env.local)

Crea o aggiorna il file `.env.local` nella root del progetto:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price ID
STRIPE_PRICE_BUSINESS=price_...
```

**⚠️ IMPORTANTE:**
- Non committare mai il file `.env.local` nel repository
- Usa chiavi `sk_test_` e `pk_test_` per sviluppo
- Usa chiavi `sk_live_` e `pk_live_` solo in produzione

---

## 🚀 CONFIGURAZIONE SUPABASE (Edge Functions)

Le variabili d'ambiente per le Edge Functions devono essere configurate come **Secrets** in Supabase:

```bash
# Dalla root del progetto
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_BUSINESS=price_...
```

**Nota:** `VITE_STRIPE_PUBLISHABLE_KEY` NON va in Supabase secrets (è solo per frontend).

---

## 📦 CONFIGURAZIONE VERCEL (Produzione)

Se usi Vercel per il deploy, aggiungi le variabili nel dashboard Vercel:

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto
3. Settings → Environment Variables
4. Aggiungi tutte le variabili (incluse quelle con prefisso `VITE_`)

---

## 🛠️ SETUP STRIPE DASHBOARD

### Step 1: Creare Product e Price

1. Vai su https://dashboard.stripe.com/products
2. Clicca "Add product"
3. Crea il prodotto:

   **Prodotto: Prime Business**
   - Name: `Prime Business`
   - Description: `Piano Business per professionisti PrimePro`
   - Pricing: `Recurring` → `Monthly` → `€50.00 EUR`
   - Clicca "Save"
   - Copia il **Price ID** (inizia con `price_`) → questo è `STRIPE_PRICE_BUSINESS`

### Step 2: Ottenere API Keys

1. Vai su https://dashboard.stripe.com/apikeys
2. Assicurati di essere in **Test mode** (toggle in alto a destra)
3. Copia:
   - **Publishable key** (inizia con `pk_test_`)
   - **Secret key** (clicca "Reveal test key", inizia con `sk_test_`)

### Step 3: Creare Webhook Endpoint

1. Vai su https://dashboard.stripe.com/webhooks
2. Clicca "Add endpoint"
3. **Endpoint URL:** `https://[PROJECT-REF].supabase.co/functions/v1/stripe-webhook`
   - Sostituisci `[PROJECT-REF]` con il tuo Supabase project reference
4. **Events to send:**
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Clicca "Add endpoint"
6. Copia il **Signing secret** (inizia con `whsec_`)

---

## ✅ CHECKLIST CONFIGURAZIONE

- [ ] Account Stripe creato/configurato (Gurfa Digital Solutions)
- [ ] Product creato (Business)
- [ ] Price creato (€50 mensile)
- [ ] Price ID copiato (`STRIPE_PRICE_BUSINESS`)
- [ ] API Keys copiate (`STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`)
- [ ] Webhook endpoint creato
- [ ] Webhook secret copiato (`STRIPE_WEBHOOK_SECRET`)
- [ ] Variabili aggiunte a `.env.local` (sviluppo)
- [ ] Secrets configurati in Supabase (produzione)
- [ ] Variabili aggiunte a Vercel (se usato)

---

## 🧪 TEST MODE

Per sviluppo, usa sempre **Test mode** in Stripe Dashboard:

- **Carta test:** `4242 4242 4242 4242`
- **Data scadenza:** Qualsiasi data futura (es. 12/25)
- **CVC:** Qualsiasi 3 cifre (es. 123)
- **ZIP:** Qualsiasi 5 cifre (es. 12345)

**Altri numeri carta test:**
- Declinata: `4000 0000 0000 0002`
- Richiede autenticazione: `4000 0025 0000 3155`

---

## 📚 RISORSE

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Docs:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Stripe Webhooks:** https://stripe.com/docs/webhooks

---

## ⚠️ SICUREZZA

1. **Mai committare** chiavi reali nel repository
2. **Usa Test mode** per sviluppo
3. **Verifica webhook signature** in produzione
4. **Ruota le chiavi** se compromesse
5. **Monitora** le transazioni nel dashboard Stripe

---

**Ultimo aggiornamento:** 26 Gennaio 2025

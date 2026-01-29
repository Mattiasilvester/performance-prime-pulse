# 🚀 Guida Setup PayPal Developer Account

Guida completa per creare account PayPal Developer e configurare subscription per Prime Business.

---

## STEP 1: Crea Account PayPal Developer

1. Vai su **https://developer.paypal.com**
2. Clicca **"Sign Up"** (in alto a destra)
3. Compila il form:
   - Email (puoi usare la stessa del tuo account PayPal personale o crearne uno nuovo)
   - Password
   - Nome e Cognome
   - Paese: **Italia**
4. Conferma email e completa la registrazione

**Nota:** Se hai già un account PayPal personale, puoi usare quello stesso per accedere a developer.paypal.com.

---

## STEP 2: Accedi al Dashboard

1. Vai su **https://developer.paypal.com/dashboard**
2. Accedi con le credenziali appena create

---

## STEP 3: Crea App PayPal (Sandbox)

1. Nel dashboard, vai su **"Apps & Credentials"** (menu laterale)
2. Clicca **"Create App"**
3. Compila:
   - **App Name:** `Prime Business` (o nome a tua scelta)
   - **Merchant:** Seleziona il tuo account sandbox (o creane uno nuovo)
   - **Features:** Seleziona **"Subscriptions"**
4. Clicca **"Create App"**

5. **Copia e salva:**
   - **Client ID** (es. `AeA1QIZXiflr1_-...`)
   - **Secret** (clicca "Show" per vedere) - **IMPORTANTE: copialo subito, lo vedrai solo una volta!**

---

## STEP 4: Crea Piano Subscription

1. Nel dashboard, vai su **"Products"** → **"Subscriptions"** (o direttamente **"Subscriptions"** → **"Plans"**)
2. Clicca **"Create Plan"**
3. Compila:

   **Basic Information:**
   - **Plan Name:** `Prime Business`
   - **Description:** `Abbonamento mensile Prime Business - €50/mese`
   - **Plan ID:** PayPal lo genera automaticamente (es. `P-5ML4271244454362WXNWU5NQ`)

   **Pricing:**
   - **Billing Cycle:** `Monthly`
   - **Price:** `50.00`
   - **Currency:** `EUR`
   - **Trial Period (opzionale):** Se vuoi un trial gratuito, aggiungi:
     - **Trial Length:** `180` giorni
     - **Trial Price:** `0.00`

   **Payment Preferences:**
   - **Setup Fee:** `0.00`
   - **Payment Failure Action:** `Continue on failure` (o `Cancel subscription`)

4. Clicca **"Create Plan"**

5. **Copia il Plan ID** (es. `P-5ML4271244454362WXNWU5NQ`) - ti servirà per:
   - File `.env` → `VITE_PAYPAL_PLAN_ID`
   - Supabase Secrets → `PAYPAL_PLAN_ID`

---

## STEP 5: Crea Account Sandbox (per test)

1. Nel dashboard, vai su **"Accounts"** → **"Sandbox"**
2. Clicca **"Create Account"**
3. Scegli tipo:
   - **Personal** (per testare come utente)
   - **Business** (per testare come merchant)
4. PayPal crea automaticamente:
   - Email sandbox (es. `sb-xxx@business.example.com`)
   - Password sandbox
   - Account con credito virtuale per test

**Nota:** Puoi creare più account sandbox per testare diversi scenari.

---

## STEP 6: Configura Webhook

1. Nel dashboard, vai su **"Apps & Credentials"** → seleziona la tua app
2. Scorri fino a **"Webhooks"**
3. Clicca **"Add Webhook"**
4. Compila:
   - **Webhook URL:**  
     ```
     https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/paypal-webhook
     ```
   - **Event Types:** Seleziona almeno:
     - ✅ `BILLING.SUBSCRIPTION.ACTIVATED`
     - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
     - ✅ `BILLING.SUBSCRIPTION.SUSPENDED`
     - ✅ `PAYMENT.SALE.COMPLETED`
     - ✅ `PAYMENT.SALE.DENIED`
     - ✅ `PAYMENT.SALE.REFUNDED`
5. Clicca **"Save"**

**Nota:** Il webhook funzionerà solo dopo che hai deployato l'Edge Function `paypal-webhook` su Supabase.

---

## STEP 7: Configura Variabili Ambiente

### File `.env` (locale)

Aggiungi queste righe al file `.env` nella root del progetto:

```env
# PayPal (Sandbox per sviluppo)
VITE_PAYPAL_CLIENT_ID=il_tuo_client_id_qui
VITE_PAYPAL_PLAN_ID=il_tuo_plan_id_qui
VITE_PAYPAL_MODE=sandbox
```

**Sostituisci:**
- `il_tuo_client_id_qui` → Client ID copiato al **STEP 3**
- `il_tuo_plan_id_qui` → Plan ID copiato al **STEP 4**

---

## STEP 8: Configura Secrets Supabase

1. Vai su **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Aggiungi questi secrets:

| Nome | Valore | Da dove |
|------|--------|---------|
| `PAYPAL_CLIENT_ID` | Client ID della tua app | STEP 3 |
| `PAYPAL_CLIENT_SECRET` | Secret della tua app | STEP 3 |
| `PAYPAL_PLAN_ID` | Plan ID del piano subscription | STEP 4 |
| `PAYPAL_MODE` | `sandbox` | Per test, usa `sandbox` |

**Nota:** `PAYPAL_CLIENT_SECRET` lo vedi solo una volta quando crei l'app. Se l'hai perso, devi rigenerarlo (Dashboard PayPal → App → "Regenerate Secret").

---

## STEP 9: Test Sandbox

1. **Avvia l'app locale:**
   ```bash
   npm run dev
   ```

2. **Login come partner** → **Abbonamento**

3. **Clicca "Aggiungi carta"** → Dovresti vedere il selettore **Stripe / PayPal**

4. **Scegli PayPal** → Si apre il popup PayPal sandbox

5. **Login con account sandbox** (creato al STEP 5):
   - Email: `sb-xxx@business.example.com` (o quello che hai creato)
   - Password: quella generata da PayPal

6. **Approva il pagamento** → Dovresti vedere:
   - Toast "Abbonamento PayPal attivato con successo!"
   - Badge **PayPal** sulla card piano
   - Subscription salvata nel DB con `payment_provider: 'paypal'`

---

## Checklist Finale

- [ ] Account PayPal Developer creato
- [ ] App PayPal creata con Client ID e Secret salvati
- [ ] Piano subscription creato con Plan ID salvato
- [ ] Account sandbox creato per test
- [ ] Webhook configurato con URL Supabase
- [ ] Variabili `.env` configurate (Client ID, Plan ID, Mode)
- [ ] Secrets Supabase configurati (Client ID, Secret, Plan ID, Mode)
- [ ] Edge Functions PayPal deployate
- [ ] Test flusso PayPal completato con successo

---

## Passaggio a Produzione (Live)

Quando sei pronto per produzione:

1. **Crea app Live** (non Sandbox) su PayPal Dashboard
2. **Crea piano Live** (non Sandbox)
3. **Aggiorna `.env`:**
   ```env
   VITE_PAYPAL_MODE=live
   ```
4. **Aggiorna Secrets Supabase:**
   - `PAYPAL_CLIENT_ID` → Client ID app Live
   - `PAYPAL_CLIENT_SECRET` → Secret app Live
   - `PAYPAL_PLAN_ID` → Plan ID piano Live
   - `PAYPAL_MODE` → `live`
5. **Aggiorna webhook URL** (stesso URL, ma PayPal lo verificherà in produzione)

---

## Troubleshooting

### "PayPal non è configurato"
- Verifica che `.env` abbia `VITE_PAYPAL_CLIENT_ID` e `VITE_PAYPAL_PLAN_ID`
- Riavvia il dev server dopo aver modificato `.env`

### "Errore PayPal approval"
- Verifica che i Secrets Supabase siano corretti
- Controlla i log Edge Function `paypal-create-subscription` su Supabase

### "Webhook non riceve eventi"
- Verifica che l'Edge Function `paypal-webhook` sia deployata
- Controlla che l'URL webhook sia corretto nel dashboard PayPal
- Verifica i log Edge Function su Supabase

---

**Buon setup! 🚀**

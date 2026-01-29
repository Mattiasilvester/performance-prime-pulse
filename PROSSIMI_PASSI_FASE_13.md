# Prossimi passi dopo migrazioni DB

Le migrazioni **cancellation_reason** e **paypal_support** sono applicate. Ecco cosa fare ora.

---

## 1. Variabili ambiente (locale)

Aggiungi al file **`.env`** (nella root del progetto):

```env
# PayPal (Sandbox per sviluppo)
VITE_PAYPAL_CLIENT_ID=il_tuo_client_id_paypal
VITE_PAYPAL_PLAN_ID=il_tuo_plan_id_paypal
VITE_PAYPAL_MODE=sandbox
```

- **VITE_PAYPAL_CLIENT_ID**: da [developer.paypal.com](https://developer.paypal.com/dashboard/applications) → App → Client ID  
- **VITE_PAYPAL_PLAN_ID**: lo crei al punto 4 (Piano subscription)  
- **VITE_PAYPAL_MODE**: `sandbox` per test, `live` per produzione  

Senza queste variabili il selettore PayPal non compare nel modal “Aggiungi carta”.

---

## 2. Deploy Edge Functions PayPal

Nel terminale:

```bash
npx supabase functions deploy paypal-create-subscription --project-ref kfxoyucatvvcgmqalxsg
npx supabase functions deploy paypal-cancel-subscription --project-ref kfxoyucatvvcgmqalxsg
npx supabase functions deploy paypal-webhook --project-ref kfxoyucatvvcgmqalxsg
```

Oppure in un solo comando:

```bash
npx supabase functions deploy paypal-create-subscription --project-ref kfxoyucatvvcgmqalxsg && \
npx supabase functions deploy paypal-cancel-subscription --project-ref kfxoyucatvvcgmqalxsg && \
npx supabase functions deploy paypal-webhook --project-ref kfxoyucatvvcgmqalxsg
```

---

## 3. Secrets Edge Functions (Supabase)

Nel **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets** aggiungi:

| Nome | Valore | Note |
|------|--------|------|
| `PAYPAL_CLIENT_ID` | Il tuo Client ID | Stesso della app PayPal |
| `PAYPAL_CLIENT_SECRET` | Il tuo Client Secret | Da dashboard PayPal → App |
| `PAYPAL_PLAN_ID` | ID del piano subscription | Lo crei al punto 4 |
| `PAYPAL_MODE` | `sandbox` o `live` | `sandbox` per test |

Senza questi secrets le Edge Functions PayPal non possono chiamare l’API PayPal.

---

## 4. Piano subscription su PayPal

1. Vai su [developer.paypal.com](https://developer.paypal.com) → **Dashboard** → **Apps & Credentials**.  
2. Usa l’app in modalità **Sandbox** per i test.  
3. Vai in **Products** → **Subscriptions** (o **Subscriptions** → **Plans**).  
4. **Crea un piano**:
   - Nome: es. **Prime Business**
   - Prezzo: **€50,00/mese**
   - Trial: opzionale (es. 180 giorni)
5. Copia l’**ID del piano** (es. `P-xxx`) e usalo in:
   - `.env` → `VITE_PAYPAL_PLAN_ID`
   - Supabase Secrets → `PAYPAL_PLAN_ID`

---

## 5. Webhook PayPal

1. Dashboard PayPal → **Apps** → la tua app → **Webhooks**.  
2. **Aggiungi webhook**:
   - **URL:**  
     `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/paypal-webhook`
   - **Eventi** (almeno):
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `PAYMENT.SALE.COMPLETED`
     - `PAYMENT.SALE.DENIED`
     - `PAYMENT.SALE.REFUNDED`

Così gli eventi PayPal aggiornano subscription e fatture nel DB.

---

## 6. Test in app

1. Avvia l’app: `npm run dev`  
2. Login come **partner** → **Abbonamento**  
3. Clicca **Aggiungi carta** (o **Aggiungi nuova carta**).  
4. Se le variabili PayPal sono impostate, vedi il **selettore Stripe / PayPal**.  
5. Scegli **PayPal** e completa il flusso in sandbox.  
6. Verifica:
   - Badge **PayPal** sulla card piano
   - Possibilità di **cancellare** l’abbonamento PayPal (flusso dedicato)

---

## Riepilogo ordine

| # | Cosa | Dove |
|---|------|------|
| 1 | Variabili PayPal | `.env` |
| 2 | Deploy 3 Edge Functions PayPal | Terminale |
| 3 | Secrets (Client ID, Secret, Plan ID, Mode) | Supabase Dashboard |
| 4 | Piano subscription | Dashboard PayPal |
| 5 | Webhook URL + eventi | Dashboard PayPal |
| 6 | Test flusso PayPal | App locale |

Dopo questi passi, PayPal è configurato e utilizzabile in sandbox; per produzione basterà usare credenziali **live** e `PAYPAL_MODE=live`.

# Guida: creare piano PayPal Sandbox (Opzione A)

Segui questi passi **in ordine** dal terminale. Ti servono:
- **Client ID Sandbox** (già in `.env`: `VITE_PAYPAL_CLIENT_ID`)
- **Client Secret Sandbox** (lo trovi in [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials → la tua app → **Sandbox** → "Secret" oppure in Supabase → Project Settings → Edge Functions → Secrets)

---

## Passo 1: Ottieni l’access token Sandbox

Nel terminale (sostituisci `TUO_CLIENT_SECRET_SANDBOX` con il Secret reale):

```bash
curl -s -X POST "https://api-m.sandbox.paypal.com/v1/oauth2/token" \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "Aa6_QY9Tbf1MUoC1LrelysvocheczgFjHk51HpGxYqnK1D0IhTueA1qWk5wyzSsN1li5OIwO5hTJho2w:TUO_CLIENT_SECRET_SANDBOX" \
  -d "grant_type=client_credentials"
```

Dalla risposta JSON copia il valore di **`access_token`** (stringa lunga). Ti serve per i passi 2 e 3.

Esempio risposta:
```json
{"scope":"...","access_token":"A21AAL...","token_type":"Bearer","app_id":"...","expires_in":32400}
```

---

## Passo 2: Crea il Product in Sandbox

Sostituisci `ACCESS_TOKEN` con il token copiato al passo 1:

```bash
curl -s -X POST "https://api-m.sandbox.paypal.com/v1/catalog/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "name": "Prime Business",
    "description": "Abbonamento Prime Business - 3 mesi trial, poi 50 EUR/mese",
    "type": "SERVICE"
  }'
```

Dalla risposta JSON copia l’**`id`** del product (es. `PROD-6XR12345AB67890CD`). Ti serve per il passo 3.

Esempio risposta:
```json
{"id":"PROD-6XR12345AB67890CD","name":"Prime Business",...}
```

---

## Passo 3: Crea il Piano (Plan) in Sandbox

- Sostituisci **`ACCESS_TOKEN`** con l’access token del passo 1.
- Sostituisci **`PROD-XXX`** con l’**id del product** ottenuto al passo 2 (es. `PROD-6XR12345AB67890CD`).

```bash
curl -s -X POST "https://api-m.sandbox.paypal.com/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "product_id": "PROD-XXX",
    "name": "Prime Business Sandbox",
    "description": "Piano test: 3 mesi trial gratuito, poi 50 EUR/mese",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": { "interval_unit": "MONTH", "interval_count": 3 },
        "tenure_type": "TRIAL",
        "sequence": 1,
        "total_cycles": 1,
        "pricing_scheme": { "fixed_price": { "value": "0", "currency_code": "EUR" } }
      },
      {
        "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
        "tenure_type": "REGULAR",
        "sequence": 2,
        "total_cycles": 0,
        "pricing_scheme": { "fixed_price": { "value": "50", "currency_code": "EUR" } }
      }
    ],
    "payment_preferences": { "auto_bill_outstanding": true }
  }'
```

Dalla risposta JSON copia l’**`id`** del piano (es. `P-1AB23456CD789012EF`). È il **Plan ID Sandbox** da usare nell’app.

Esempio risposta:
```json
{"id":"P-1AB23456CD789012EF","name":"Prime Business Sandbox",...}
```

---

## Passo 4: Aggiorna il progetto con il Plan ID Sandbox

1. **File `.env`**  
   Imposta il Plan ID ottenuto al passo 3:
   ```env
   VITE_PAYPAL_PLAN_ID=P-xxx
   ```
   (sostituisci `P-xxx` con l’id reale, es. `P-1AB23456CD789012EF`)

2. **Supabase Secrets** (opzionale ma consigliato)  
   Se le Edge Functions usano `PAYPAL_PLAN_ID`:
   - Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Aggiungi o aggiorna: `PAYPAL_PLAN_ID` = stesso Plan ID (es. `P-1AB23456CD789012EF`)

3. **Riavvia l’app**  
   Riavvia il dev server (`npm run dev`) così legge il nuovo `VITE_PAYPAL_PLAN_ID`.

---

## Riepilogo

| Cosa | Dove prenderlo / dove metterlo |
|------|-------------------------------|
| Client ID Sandbox | Già in `.env` come `VITE_PAYPAL_CLIENT_ID` |
| Client Secret Sandbox | developer.paypal.com (app Sandbox) o Supabase Secrets |
| Access token | Passo 1 (curl) → campo `access_token` |
| Product ID | Passo 2 (curl) → campo `id` (es. `PROD-...`) |
| Plan ID Sandbox | Passo 3 (curl) → campo `id` (es. `P-...`) |
| `.env` | `VITE_PAYPAL_PLAN_ID=<Plan ID del passo 3>` |

Dopo questi passi il bottone PayPal userà il piano Sandbox e l’errore RESOURCE_NOT_FOUND dovrebbe sparire.

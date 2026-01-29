# PayPal: errore RESOURCE_NOT_FOUND / INVALID_RESOURCE_ID

## Causa

L'errore **RESOURCE_NOT_FOUND** / **INVALID_RESOURCE_ID** compare quando il **Plan ID** usato dall'app **non esiste nell'ambiente** in cui gira PayPal.

- Il piano **Prime Business** (`P-72N65366H64854903NF5A6FY`) è stato creato su **paypal.com/billing** → ambiente **LIVE**.
- L'app usa **Sandbox** (Client ID Sandbox + `VITE_PAYPAL_MODE=sandbox`).
- In Sandbox quel Plan ID non esiste → PayPal risponde con RESOURCE_NOT_FOUND.

**Regola:** ogni Plan ID vale solo in un ambiente (Sandbox **oppure** Live). Non si può usare un piano Live in Sandbox o viceversa.

---

## Opzione 1: Usare Live (piano già creato)

Se vuoi usare subito il piano creato su paypal.com/billing:

1. **`.env`**
   - `VITE_PAYPAL_MODE=live`
   - `VITE_PAYPAL_CLIENT_ID` = **Client ID Live** (da developer.paypal.com, app in modalità **Live**)
   - `VITE_PAYPAL_PLAN_ID=P-72N65366H64854903NF5A6FY` (invariato)

2. **Supabase Secrets**
   - `PAYPAL_MODE=live`
   - `PAYPAL_CLIENT_ID` = stesso Client ID Live
   - `PAYPAL_CLIENT_SECRET` = **Secret Live** (dalla stessa app Live)
   - `PAYPAL_PLAN_ID=P-72N65366H64854903NF5A6FY`

3. **Webhook**
   - Su developer.paypal.com, passa alla modalità **Live** e aggiungi lo stesso URL webhook per l’app Live.

Attenzione: in Live i pagamenti sono reali. Usa solo se vuoi davvero andare in produzione.

---

## Opzione 2: Restare in Sandbox (test)

Per testare in Sandbox serve un **piano creato in Sandbox**. In Sandbox i piani non si creano da paypal.com/billing, ma via **API**.

### Creare un piano Sandbox via API

1. Ottieni un **access token Sandbox** (stesso Client ID e Secret Sandbox che usi nell’app):

```bash
curl -v -X POST "https://api-m.sandbox.paypal.com/v1/oauth2/token" \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "TUO_CLIENT_ID_SANDBOX:TUO_CLIENT_SECRET_SANDBOX" \
  -d "grant_type=client_credentials"
```

2. Crea il piano (sostituisci `ACCESS_TOKEN` con il token ottenuto):

```bash
curl -v -X POST "https://api-m.sandbox.paypal.com/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "product_id": "PROD-XXX",
    "name": "Prime Business Sandbox",
    "description": "Piano test 3 mesi trial + 50 EUR/mese",
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

**Nota:** in Sandbox serve prima un **Product**; si crea con `POST /v1/catalog/products` e il suo `id` va in `product_id`. Vedi [PayPal Subscriptions – Create Plan](https://developer.paypal.com/docs/api/subscriptions/v1/#plans_create).

3. Dalla risposta di creazione piano copia l’**ID del piano** (es. `P-1AB23456CD789012EF`) e mettilo in:
   - `.env`: `VITE_PAYPAL_PLAN_ID=P-xxx`
   - Supabase Secrets: `PAYPAL_PLAN_ID=P-xxx`

Resta in Sandbox (`VITE_PAYPAL_MODE=sandbox` e credenziali Sandbox): l’errore RESOURCE_NOT_FOUND sparirà perché il Plan ID sarà quello Sandbox.

---

## Riepilogo

| Ambiente | Dove è stato creato il piano | Cosa usare nell’app |
|--------|------------------------------|----------------------|
| **Sandbox** | Via API Sandbox (non paypal.com) | Client ID/Secret Sandbox + Plan ID Sandbox |
| **Live** | paypal.com/billing (il tuo attuale) | Client ID/Secret Live + `P-72N65366H64854903NF5A6FY` |

L’errore che vedi in console dipende dal fatto che stai usando un **Plan ID Live** mentre l’app è in **Sandbox**. Allinea ambiente e Plan ID (Opzione 1 o 2) e la chiamata andrà a buon fine.

# Dove creare il piano subscription PayPal (Plan ID)

PayPal ha rimosso "Products" dal menu del **Developer Dashboard**. Puoi creare il piano in due modi.

---

## Opzione 1: Dashboard Business PayPal (più semplice)

1. Vai su **https://www.paypal.com/billing/plans**  
   (oppure da paypal.com → accedi → Strumenti / Billing / Abbonamenti, se vedi la voce).

2. Accedi con il tuo **account Business** (lo stesso collegato all’app Developer, se possibile).

3. Cerca una sezione tipo **"Piani"** / **"Plans"** o **"Crea piano"** / **"Create plan"**.

4. Crea un piano:
   - Nome: **Prime Business**
   - Prezzo: **50,00 EUR** / mese
   - (Trial opzionale)

5. Dopo la creazione, **copia il Plan ID** (es. `P-5ML...`) e usalo in `.env` e nei Secrets Supabase.

**Se non trovi "Billing" o "Plans":** usa l’Opzione 2 (API).

---

## Opzione 2: Creare il piano via API (sempre funzionante)

Serve solo ottenere un **Access Token** e fare una chiamata alla API. Puoi farlo da terminale.

### Passo 1: Ottieni l’Access Token

Sostituisci `TUO_CLIENT_ID` e `TUO_CLIENT_SECRET` con quelli dell’app **Prime Business** (Sandbox).

```bash
curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "TUO_CLIENT_ID:TUO_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

Dalla risposta copia il valore di **`access_token`** (stringa lunga).

### Passo 2: Crea il prodotto (se richiesto) e poi il piano

**Solo per Sandbox**, puoi creare direttamente un piano con questo comando (sostituisci `ACCESS_TOKEN` con quello del passo 1):

```bash
curl -v -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "product_id": "PROD-XXX",
    "name": "Prime Business",
    "description": "Abbonamento mensile Prime Business - 50 EUR/mese",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": { "value": "50", "currency_code": "EUR" }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }'
```

**Nota:** alcuni account richiedono prima la creazione di un **Product** tramite Catalog Products API; dalla risposta si ottiene `product_id` da usare al posto di `PROD-XXX`. Se l’API restituisce errore tipo "product_id required", crea prima il prodotto con:

```bash
curl -v -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "name": "Prime Business",
    "description": "Abbonamento mensile Prime Business",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }'
```

Dalla risposta copia l’`id` del prodotto (es. `PROD-xxx`) e usalo in `product_id` nel corpo della creazione del piano.

### Passo 3: Copia il Plan ID

Dalla risposta della creazione del piano (`/v1/billing/plans`) copia il campo **`id`** (es. `P-5ML4271244454362WXNWU5NQ`). È il **Plan ID** da mettere in:

- `.env` → `VITE_PAYPAL_PLAN_ID=...`
- Supabase → Secret `PAYPAL_PLAN_ID`

---

## Riepilogo

| Dove sei ora | Cosa fare |
|-------------|-----------|
| Hai **Client ID** e **Secret** (app Prime Business) | Vai a **Opzione 1** (paypal.com/billing/plans) oppure **Opzione 2** (API) |
| Non trovi "Products" nel Developer Dashboard | È normale: i piani si creano da **Billing** (business) o via **API** |

Dopo aver ottenuto il **Plan ID**, inseriscilo in `.env` e nei Secrets Supabase come indicato nella guida principale.

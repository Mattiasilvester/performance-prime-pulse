# ANALISI — Stato attuale integrazione Stripe in PrimePro

**Data:** 16 Febbraio 2026  
**Scope:** Monorepo Prime-puls-HUB (focus app-pro e supabase/functions).  
**Nessuna modifica al codice: solo analisi.**

---

## 1. File che usano Stripe

Cercati: `stripe`, `STRIPE`, `pk_test`, `pk_live` (case insensitive, esclusi `.pnpm-store`).

### Frontend (packages/app-pro)

| File | Uso |
|------|-----|
| `package.json` | Dipendenze `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| `vite.config.ts` | Chunk `vendor-stripe`: `['@stripe/stripe-js', '@stripe/react-stripe-js']` (riga 23) |
| `src/components/partner/settings/AddStripeCardModal.tsx` | `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)`, Elements, PaymentElement, `confirmSetup`, salvataggio in `professional_subscriptions` (righe 24, 224–227, 331) |
| `src/components/partner/settings/PaymentsModal.tsx` | Carica/aggiorna dati da `professional_subscriptions` (Stripe/PayPal), chiamate list/set-default/detach (righe 408–410, 586–588) |
| `src/services/subscriptionService.ts` | `createCustomerAndSetupIntent()` → `stripe-create-customer`, `createSubscription()` → `stripe-create-subscription` (righe 54–96, 106–120) |
| `src/services/paymentMethodsService.ts` | Chiamate a `/functions/v1/stripe-list-payment-methods`, `stripe-set-default-payment-method`, `stripe-detach-payment-method` (righe 24, 54, 80) |
| `src/hooks/useSubscription.ts` | Lettura `professional_subscriptions` (riga 141), fallback `price_cents: 5000` (riga 63) |
| `src/integrations/supabase/types.ts` | Tipi per `professional_subscriptions` (stripe_customer_id, stripe_price_id, stripe_subscription_id) e `subscription_invoices` (stripe_invoice_id) (righe 1344–1346, 1373–1375, 1868) |
| `src/pages/partner/PartnerLandingPage.tsx` | Testo “poi €50/mese” (riga 484) |
| `src/pages/partner/dashboard/AbbonamentoPage.tsx` | Piano “Prime Business”, `formatPrice(subscription.price_cents ?? 5000)` (righe 287–288) |
| `src/pages/partner/Abbonamento.tsx` | Stesso pattern Prime Business / 5000 (righe 254–255) |
| `src/components/partner/subscription/ActivePlanCard.tsx` | UI prezzo “/mese” (riga 56) |
| `src/components/partner/subscription/ManageSubscriptionCard.tsx` | Testo “Prime Business” (riga 150) |
| `src/components/partner/subscription/PayPalSubscriptionButton.tsx` | `currency: 'EUR'` (riga 71) |
| `src/components/partner/settings/PaymentsModal.tsx` | `pro: { name: 'Prime Business', price: 50 }` (riga 59) |
| `src/pages/partner/legal/TermsConditions.tsx` | “€50,00 al mese” (riga 61) |
| `src/components/partner/TrialExpiredGate.tsx` | “€50/mese” (riga 54) |
| `src/utils/stripeErrors.ts` | `getStripeErrorMessage(error)` per messaggi Stripe in italiano (riga 2) |
| `src/vite-env.d.ts` | `VITE_STRIPE_PUBLISHABLE_KEY?: string` (riga 14) |

### Root / altri package

| File | Uso |
|------|-----|
| `package.json` (root) | Dipendenze Stripe (righe 66–67) |
| `env.example` | STRIPE_SECRET_KEY, VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_BUSINESS (righe 50–62) |
| `src/vite-env.d.ts` (root) | VITE_STRIPE_PUBLISHABLE_KEY (riga 14) |

### Edge Functions (supabase/functions)

| Function | File | Uso Stripe |
|----------|------|------------|
| stripe-webhook | `stripe-webhook/index.ts` | Verifica firma, gestione eventi subscription/invoice |
| stripe-create-customer | `stripe-create-customer/index.ts` | Crea customer Stripe, SetupIntent, aggiorna `professional_subscriptions.stripe_customer_id` |
| stripe-create-subscription | `stripe-create-subscription/index.ts` | Crea subscription con STRIPE_PRICE_BUSINESS, trial 3 mesi, aggiorna DB |
| stripe-cancel-subscription | `stripe-cancel-subscription/index.ts` | Cancella subscription Stripe (immediata o a fine periodo) |
| stripe-reactivate-subscription | `stripe-reactivate-subscription/index.ts` | Rimuove cancel_at_period_end |
| stripe-list-payment-methods | `stripe-list-payment-methods/index.ts` | Lista payment methods del customer |
| stripe-set-default-payment-method | `stripe-set-default-payment-method/index.ts` | Imposta default payment method su customer e subscription |
| stripe-detach-payment-method | `stripe-detach-payment-method/index.ts` | Stacca payment method |
| stripe-update-payment-method | `stripe-update-payment-method/index.ts` | Aggiorna payment method e campi carta in `professional_subscriptions` |
| stripe-health-check | `stripe-health-check/index.ts` | Verifica presenza STRIPE_SECRET_KEY |
| stripe-test-import | `stripe-test-import/index.ts` | Test import Stripe e env |
| subscription-reminders | `subscription-reminders/index.ts` | Commenti “coerente con stripe-webhook” (tipo notifiche), nessun import Stripe |

---

## 2. Flusso attuale di pagamento

### Onboarding / trial

1. **ensure-partner-subscription** (Edge Function): al primo accesso partner, se non esiste riga in `professional_subscriptions`, inserisce una subscription con `status: 'trialing'`, trial 90 giorni, `price_cents: 5000`, senza chiamate Stripe.  
   File: `supabase/functions/ensure-partner-subscription/index.ts` (righe 51–127).

2. **Trigger DB** (opzionale): la doc e le migration citano trigger che creano/aggiornano `professional_subscriptions`; il flusso principale di “prima subscription” è la Edge Function sopra.

### Aggiunta carta e attivazione abbonamento (Stripe)

1. **Aggiungi carta (modal)**  
   - Utente apre “Pagamenti” / “Aggiungi carta” → `AddStripeCardModal`.  
   - Frontend chiama **stripe-create-customer** (via `subscriptionService.createCustomerAndSetupIntent()`): crea (se manca) Stripe Customer e SetupIntent, salva `stripe_customer_id` in `professional_subscriptions`.  
   - Frontend usa **Stripe Elements** (PaymentElement) con `setup_intent_client_secret`, poi `stripe.confirmSetup()`.  
   - In caso di nuovo payment method, frontend chiama **stripe-update-payment-method** con `payment_method_id` e dettagli carta, che aggiorna `professional_subscriptions` (payment_method_id, card_*).  
   File: `AddStripeCardModal.tsx` (righe 79–120, 220–240), `subscriptionService.ts` (54–96), `stripe-create-customer/index.ts`, `stripe-update-payment-method/index.ts`.

2. **Creazione subscription Stripe**  
   - Dopo aver salvato la carta, l’utente può “Attiva abbonamento” (o flusso equivalente).  
   - Frontend chiama **stripe-create-subscription** (via `subscriptionService.createSubscription()`).  
   - La Edge Function: legge `professional_subscriptions` (stripe_customer_id, eventuale stripe_subscription_id), usa `STRIPE_PRICE_BUSINESS`, crea subscription Stripe (con trial 3 mesi se configurato), aggiorna `professional_subscriptions` (stripe_subscription_id, stripe_price_id, status, period_*, trial_end), crea notifica in-app.  
   File: `stripe-create-subscription/index.ts` (righe 67–197, 199–224), `subscriptionService.ts` (106–120).

3. **Webhook Stripe**  
   - Eventi `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed` vengono ricevuti da **stripe-webhook**, che aggiorna `professional_subscriptions` e (dove previsto) `subscription_invoices` e notifiche.  
   Vedi sotto punto 5.

### Cancellazione / riattivazione

- **Cancellazione:** frontend chiama **stripe-cancel-subscription** (con body che indica se cancellare subito o a fine periodo). La function cancella/aggiorna la subscription in Stripe e aggiorna il DB; crea notifica.  
  File: `stripe-cancel-subscription/index.ts`.

- **Riattivazione:** frontend chiama **stripe-reactivate-subscription** con `subscription_id` (Stripe subscription id). La function rimuove `cancel_at_period_end` in Stripe e aggiorna il DB; crea notifica.  
  File: `stripe-reactivate-subscription/index.ts`.

### Gestione carte (multi-carta)

- **Lista:** `paymentMethodsService` → **stripe-list-payment-methods** (legge stripe_customer_id da `professional_subscriptions`).  
- **Default:** **stripe-set-default-payment-method** (aggiorna customer e subscription Stripe + eventuale aggiornamento lato DB).  
- **Rimozione:** **stripe-detach-payment-method**.  
  File: `paymentMethodsService.ts`, `PaymentsModal.tsx`.

---

## 3. Edge Functions che gestiscono Stripe

Tutte sotto `supabase/functions/`:

| Function | Scopo |
|----------|--------|
| **stripe-webhook** | Riceve webhook Stripe, verifica signature, gestisce subscription created/updated/deleted e invoice paid/payment_failed. |
| **stripe-create-customer** | Crea Stripe Customer (se assente), SetupIntent; aggiorna `professional_subscriptions.stripe_customer_id`. |
| **stripe-create-subscription** | Crea subscription Stripe con STRIPE_PRICE_BUSINESS; aggiorna `professional_subscriptions` e notifiche. |
| **stripe-cancel-subscription** | Cancella subscription Stripe (immediata o a fine periodo); aggiorna DB e notifiche. |
| **stripe-reactivate-subscription** | Riattiva subscription (rimuove cancel_at_period_end); aggiorna DB e notifiche. |
| **stripe-list-payment-methods** | Lista payment methods del customer (legge customer da `professional_subscriptions`). |
| **stripe-set-default-payment-method** | Imposta default payment method su Stripe customer e subscription. |
| **stripe-detach-payment-method** | Stacca payment method dal customer. |
| **stripe-update-payment-method** | Aggiorna payment method e campi carta in `professional_subscriptions`. |
| **stripe-health-check** | Controlla presenza STRIPE_SECRET_KEY. |
| **stripe-test-import** | Test import Stripe e env. |

**subscription-reminders** non importa Stripe; usa solo tipo notifiche “custom” in linea con stripe-webhook.

---

## 4. Variabili d’ambiente Stripe usate

### Frontend (build-time, prefisso VITE_)

| Variabile | Dove | File / righe |
|-----------|------|----------------|
| **VITE_STRIPE_PUBLISHABLE_KEY** | Load Stripe.js e Elements | `AddStripeCardModal.tsx` 24, `env.example` 54, `src/vite-env.d.ts` 14, `docs/STRIPE_SETUP.md` |

### Edge Functions (Supabase secrets)

| Variabile | Dove | File / righe |
|-----------|------|----------------|
| **STRIPE_SECRET_KEY** | Client Stripe server-side | stripe-create-customer 67, stripe-create-subscription 107, stripe-cancel-subscription 98, stripe-reactivate-subscription 161, stripe-webhook 14, stripe-list-payment-methods 21, stripe-set-default-payment-method 33, stripe-detach-payment-method 27, stripe-health-check 19, stripe-test-import 27 |
| **STRIPE_WEBHOOK_SECRET** | Verifica firma webhook | stripe-webhook 15 |
| **STRIPE_PRICE_BUSINESS** | Price ID piano Business (€50/mese) | stripe-create-subscription 108 |

Documentazione: `env.example` (50–62), `docs/STRIPE_SETUP.md` (21–68, 84–89).

---

## 5. Webhook endpoint: dove e cosa gestisce

- **URL:** `https://[PROJECT-REF].supabase.co/functions/v1/stripe-webhook`  
  (es. `kfxoyucatvvcgmqalxsg.supabase.co` come da doc e audit).  
  Configurazione: Stripe Dashboard → Webhooks → Add endpoint, URL sopra; secret → `STRIPE_WEBHOOK_SECRET`.

- **File:** `supabase/functions/stripe-webhook/index.ts`.

- **Flusso:**  
  - OPTIONS: risposta CORS.  
  - Verifica header `stripe-signature` e `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.  
  - Switch su `event.type`:

| Evento | Handler | Azione |
|--------|---------|--------|
| `customer.subscription.created` | handleSubscriptionCreated | Notifica “Abbonamento attivato” (professional_id da `professional_subscriptions` per stripe_subscription_id). |
| `customer.subscription.updated` | handleSubscriptionUpdated | Aggiorna `professional_subscriptions`: status, current_period_*, cancel_at_period_end, canceled_at, payment method/card_*; se cancel_at_period_end === true invia notifica “Abbonamento in cancellazione”. |
| `customer.subscription.deleted` | handleSubscriptionDeleted | Aggiorna `professional_subscriptions`: status 'canceled', canceled_at; notifica “Abbonamento cancellato”. |
| `invoice.paid` | handleInvoicePaid | Upsert in `subscription_invoices` (subscription_id, stripe_invoice_id, amount_cents, currency, status, pdf/hosted url, date, paid_at). |
| `invoice.payment_failed` | handleInvoicePaymentFailed | Aggiorna `professional_subscriptions` a status 'past_due'; notifica “Pagamento fallito”. |
| Altri eventi | — | Log “Evento non gestito”. |

- **Supabase:** usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` per client admin (lettura/aggiornamento `professional_subscriptions`, insert `subscription_invoices`, insert `professional_notifications`).

---

## 6. Tabella professional_subscriptions: colonne e aggiornamenti

### Colonne (da `packages/app-pro/src/integrations/supabase/types.ts`, righe 1323–1415)

| Colonna | Tipo | Note |
|---------|------|------|
| id | string | PK |
| professional_id | string | FK → professionals.id |
| plan | string | es. 'business' |
| status | string | trialing | active | past_due | canceled | incomplete | unpaid |
| price_cents | number | es. 5000 (€50) |
| currency | string | es. 'EUR' |
| stripe_customer_id | string \| null | |
| stripe_price_id | string \| null | |
| stripe_subscription_id | string \| null | |
| trial_start | string \| null | ISO |
| trial_end | string \| null | ISO |
| current_period_start | string \| null | ISO |
| current_period_end | string \| null | ISO |
| cancel_at_period_end | boolean \| null | |
| canceled_at | string \| null | ISO |
| cancellation_reason | string \| null | |
| payment_method_id | string \| null | |
| card_last4 | string \| null | |
| card_brand | string \| null | |
| card_exp_month | number \| null | |
| card_exp_year | number \| null | |
| payment_provider | string \| null | Stripe vs PayPal |
| paypal_subscription_id | string \| null | |
| paypal_plan_id | string \| null | |
| created_at | string \| null | |
| updated_at | string \| null | |

### Chi aggiorna la tabella

| Fonte | Colonne aggiornate / operazione |
|--------|----------------------------------|
| **ensure-partner-subscription** | INSERT: professional_id, plan, status 'trialing', price_cents 5000, trial_*, current_period_*, currency, cancel_at_period_end. |
| **stripe-create-customer** | UPDATE: stripe_customer_id (per professional_id). |
| **stripe-create-subscription** | UPDATE: stripe_subscription_id, stripe_price_id, status, current_period_start/end, trial_end. |
| **stripe-cancel-subscription** | UPDATE: status, cancel_at_period_end, canceled_at (e notifiche). |
| **stripe-reactivate-subscription** | UPDATE: cancel_at_period_end, canceled_at (e notifiche). |
| **stripe-webhook** | UPDATE su riga con stesso stripe_subscription_id: status, current_period_*, cancel_at_period_end, canceled_at, payment_method_id, card_* (in updated); in deleted: status 'canceled', canceled_at; in payment_failed: status 'past_due'. |
| **stripe-update-payment-method** | UPDATE: payment_method_id, card_*, eventualmente stripe_customer_id. |
| **AddStripeCardModal** (frontend) | UPDATE dopo confirmSetup: payment_method_id e card_* (anche via stripe-update-payment-method). |
| **PaymentsModal** (frontend) | Lettura e possibile rimozione/aggiornamento payment method (logica che può toccare subscription; dettaglio in PaymentsModal). |
| **Trigger/security definer** | Migration `20260201140000_create_trial_subscription_security_definer.sql`: funzione che può inserire in `professional_subscriptions` (trial). |

---

## 7. Checkout: Stripe Checkout (redirect) vs Stripe Elements (embedded)

- **Utilizzato:** **Stripe Elements (embedded)**.
- **Dettaglio:**  
  - `AddStripeCardModal.tsx` usa `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)`, `Elements`, `PaymentElement`, `useStripe()`, `useElements()`, `stripe.confirmSetup()` con `redirect: 'if_required'`.  
  - Nessun redirect a Stripe Checkout Hosted Page; il form carta resta in-app (modal).  
- **Flusso pagamento subscription:** la subscription viene creata lato server con **stripe-create-subscription** dopo che il payment method è stato associato al customer tramite SetupIntent + Elements. Non c’è “Checkout Session” redirect per il pagamento ricorrente.

---

## 8. Prezzi/prodotti: hardcodati vs da Stripe

- **Price ID:** preso da **variabile d’ambiente** `STRIPE_PRICE_BUSINESS` (formato `price_...`), usata solo in **stripe-create-subscription**. Non c’è fetch da Stripe API per elencare prezzi o prodotti; un solo price, configurato in env.
- **Importi mostrati in UI:** **hardcodati** in frontend e fallback:
  - **5000 centesimi (€50)** e “Prime Business” in: `useSubscription.ts` (63–64), `PaymentsModal.tsx` (59), `AbbonamentoPage.tsx` / `Abbonamento.tsx` (287–288, 254–255 con `subscription.price_cents ?? 5000`), `ensure-partner-subscription` (price_cents: 5000), `PartnerLandingPage.tsx` (“poi €50/mese”), `TermsConditions.tsx`, `TrialExpiredGate.tsx`.
- **subscription_invoices:** gli importi delle fatture arrivano dal webhook (`invoice.amount_paid`) e vengono salvati in DB; non sono hardcodati nel codice.

**Riepilogo:** un solo piano/price (Prime Business, €50/mese) con price ID da env; importi e label “€50”/“Prime Business” ripetuti in più punti nel codice. Nessun fetch dinamico di prezzi o prodotti da Stripe.

---

## Riferimenti rapidi (file e righe)

- **Webhook:** `supabase/functions/stripe-webhook/index.ts` (1–118 handler, 121–416 helper e mapStripeStatus).
- **Creazione subscription:** `supabase/functions/stripe-create-subscription/index.ts` (107–108 env, 141–188 creazione e update DB).
- **Tabella subscription:** `packages/app-pro/src/integrations/supabase/types.ts` 1323–1415.
- **Flusso UI carta + subscription:** `packages/app-pro/src/components/partner/settings/AddStripeCardModal.tsx` (24, 79–120, 220–240), `packages/app-pro/src/services/subscriptionService.ts` (54–120).
- **Variabili env:** `env.example` 50–62, `docs/STRIPE_SETUP.md`.

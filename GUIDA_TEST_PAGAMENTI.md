# 🧪 Guida Test Pagamenti - Stripe e PayPal

## 📋 **PREREQUISITI**

Prima di iniziare, verifica:

- [ ] Server dev in esecuzione (`npm run dev`)
- [ ] Account professionista creato e loggato
- [ ] Accesso a Supabase Dashboard (per verificare database)
- [ ] Accesso a Stripe Dashboard (per verificare subscription)
- [ ] Accesso a PayPal Developer Dashboard (per verificare eventi)

---

## 🟦 **TEST 1: STRIPE SUBSCRIPTION**

### **Step 1: Preparazione**

1. **Apri l'app** su `http://localhost:8080/partner/dashboard/abbonamento`
2. **Apri la console del browser** (F12 → Console)
3. **Apri Supabase Dashboard** → Database → Table Editor → `professional_subscriptions`

### **Step 2: Aggiungi Carta Stripe**

1. Clicca su **"Aggiungi carta"** o **"Aggiungi metodo di pagamento"**
2. Nel modal, seleziona **"Stripe - Carta di credito"**
3. Inserisci una **carta di test Stripe**:
   - **Numero:** `4242 4242 4242 4242`
   - **Scadenza:** Qualsiasi data futura (es. `12/25`)
   - **CVC:** Qualsiasi 3 cifre (es. `123`)
   - **Nome:** Qualsiasi nome
   - **CAP:** Qualsiasi CAP (es. `12345`)

4. Clicca **"Salva carta"** o **"Conferma"**

### **Step 3: Verifica Database (Dopo aggiunta carta)**

Controlla in Supabase → `professional_subscriptions`:

- [ ] Record creato/aggiornato per il tuo `professional_id`
- [ ] `stripe_customer_id` presente (formato `cus_xxxxx`)
- [ ] `payment_method_id` presente (formato `pm_xxxxx`)
- [ ] `status` = `'incomplete'` o `'trialing'` (dipende se subscription creata automaticamente)

### **Step 4: Verifica Subscription Creata**

Se la subscription non è stata creata automaticamente:

1. **Opzione A:** Clicca su **"Attiva abbonamento"** o bottone simile nella pagina Abbonamento
2. **Opzione B:** Verifica se c'è un bottone per creare subscription manualmente

**Dopo la creazione subscription, verifica:**

- [ ] `stripe_subscription_id` presente (formato `sub_xxxxx`)
- [ ] `status` = `'trialing'`
- [ ] `trial_start` presente (data di oggi)
- [ ] `trial_end` presente (data tra 90 giorni)
- [ ] `current_period_start` presente
- [ ] `current_period_end` = `trial_end` (circa)

### **Step 5: Verifica Stripe Dashboard**

1. Vai su [dashboard.stripe.com](https://dashboard.stripe.com/test/subscriptions)
2. Cerca la subscription con ID `sub_xxxxx` (quello nel database)
3. Verifica:
   - [ ] Status = **"Trialing"**
   - [ ] Trial ends = **90 giorni da oggi**
   - [ ] Customer = il customer ID dal database
   - [ ] Payment method = la carta aggiunta

### **Step 6: Verifica Webhook Stripe**

1. Vai su Stripe Dashboard → **Developers** → **Webhooks**
2. Trova il webhook configurato per Supabase
3. Clicca su **"Events"** o **"Logs"**
4. Verifica che ci siano eventi:
   - [ ] `customer.subscription.created` (quando subscription creata)
   - [ ] `customer.subscription.updated` (quando status cambia)
   - [ ] `invoice.created` (quando invoice creata)

### **Step 7: Verifica UI App**

Torna alla pagina Abbonamento e verifica:

- [ ] Card "Piano attuale" mostra **"Periodo di prova"** o **"Trialing"**
- [ ] Giorni rimanenti trial mostrati correttamente (circa 90 giorni)
- [ ] Badge status verde/giallo con "Periodo di prova"
- [ ] Progress bar trial visibile (se presente)

### **Step 8: Verifica Notifiche**

1. Controlla in Supabase → `professional_notifications`
2. Verifica che ci sia una notifica:
   - [ ] `type` = `'subscription'` o `'custom'`
   - [ ] `title` contiene "Abbonamento" o "Subscription"
   - [ ] `message` descrive subscription creata
   - [ ] `is_read` = `false`

---

## 🟧 **TEST 2: PAYPAL SUBSCRIPTION**

### **⚠️ IMPORTANTE: Risolvi prima il problema Plan ID**

Prima di testare PayPal, devi risolvere il problema **RESOURCE_NOT_FOUND**:

**Opzione A: Usa Live (piano già creato)**
- Cambia `.env`: `VITE_PAYPAL_MODE=live`
- Usa Client ID/Secret **Live** (da developer.paypal.com in modalità Live)
- Aggiorna Supabase Secrets con valori Live
- **Attenzione:** Pagamenti reali!

**Opzione B: Crea piano Sandbox**
- Crea un piano Sandbox via API (vedi `PAYPAL_SANDBOX_VS_LIVE.md`)
- Usa quel Plan ID in `.env` e Supabase Secrets
- Resta in Sandbox (`VITE_PAYPAL_MODE=sandbox`)

---

### **Step 1: Preparazione PayPal**

1. **Verifica configurazione:**
   - [ ] `.env` ha `VITE_PAYPAL_CLIENT_ID` corretto
   - [ ] `.env` ha `VITE_PAYPAL_PLAN_ID` corretto (Sandbox o Live)
   - [ ] `.env` ha `VITE_PAYPAL_MODE` corretto (`sandbox` o `live`)
   - [ ] Supabase Secrets hanno tutti i valori PayPal

2. **Riavvia il dev server** (per caricare nuove variabili):
   ```bash
   # Ferma il server (Ctrl+C) e riavvia
   npm run dev
   ```

3. **Apri l'app** su `http://localhost:8080/partner/dashboard/abbonamento`
4. **Apri la console del browser** (F12 → Console)
5. **Apri Supabase Dashboard** → Database → `professional_subscriptions`

### **Step 2: Aggiungi Subscription PayPal**

1. Clicca su **"Aggiungi carta"** o **"Aggiungi metodo di pagamento"**
2. Nel modal, seleziona **"PayPal - Account PayPal"**
3. Dovresti vedere il **bottone giallo "PayPal Abbonati"**
4. Clicca sul bottone PayPal

### **Step 3: Approva Subscription PayPal**

1. **Se in Sandbox:**
   - Verrai reindirizzato a `sandbox.paypal.com`
   - Accedi con un **account PayPal Sandbox** (crea su developer.paypal.com → Sandbox → Accounts)
   - Approva l'abbonamento

2. **Se in Live:**
   - Verrai reindirizzato a `paypal.com`
   - Accedi con un **account PayPal reale**
   - Approva l'abbonamento (pagamento reale!)

3. Dopo l'approvazione, verrai reindirizzato all'app

### **Step 4: Verifica Database (Dopo approvazione PayPal)**

Controlla in Supabase → `professional_subscriptions`:

- [ ] Record creato/aggiornato per il tuo `professional_id`
- [ ] `paypal_subscription_id` presente (formato `I-xxxxx` o simile)
- [ ] `paypal_plan_id` = Plan ID che hai configurato
- [ ] `payment_provider` = `'paypal'`
- [ ] `status` = `'trialing'`
- [ ] `trial_start` presente (data di oggi)
- [ ] `trial_end` presente (data tra 90 giorni)
- [ ] `current_period_start` presente
- [ ] `current_period_end` = `trial_end` (circa)

### **Step 5: Verifica PayPal Dashboard**

1. **Se in Sandbox:**
   - Vai su [sandbox.paypal.com/billing/subscriptions](https://www.sandbox.paypal.com/billing/subscriptions)
   - Accedi con account Sandbox
   - Verifica subscription attiva

2. **Se in Live:**
   - Vai su [paypal.com/billing/subscriptions](https://www.paypal.com/billing/subscriptions)
   - Accedi con account reale
   - Verifica subscription attiva

3. Verifica:
   - [ ] Subscription status = **"Active"** o **"Approved"**
   - [ ] Trial period = **3 mesi**
   - [ ] Next billing = **dopo 3 mesi**

### **Step 6: Verifica Webhook PayPal**

1. Vai su [developer.paypal.com](https://developer.paypal.com) → **Event Logs**
2. Verifica che ci siano eventi inviati al webhook:
   - [ ] `BILLING.SUBSCRIPTION.ACTIVATED` (quando subscription approvata)
   - [ ] `PAYMENT.SALE.COMPLETED` (quando trial scade e addebita)

3. **Verifica Supabase Logs:**
   - Vai su Supabase Dashboard → **Edge Functions** → `paypal-webhook` → **Logs**
   - Verifica che ci siano log di eventi ricevuti

### **Step 7: Verifica UI App**

Torna alla pagina Abbonamento e verifica:

- [ ] Card "Piano attuale" mostra **"Periodo di prova"** o **"Trialing"**
- [ ] Badge mostra **"PayPal"** come provider
- [ ] Giorni rimanenti trial mostrati correttamente (circa 90 giorni)
- [ ] Progress bar trial visibile (se presente)

### **Step 8: Verifica Notifiche**

1. Controlla in Supabase → `professional_notifications`
2. Verifica che ci sia una notifica:
   - [ ] `type` = `'subscription'`
   - [ ] `title` = "Abbonamento PayPal attivato"
   - [ ] `message` descrive subscription PayPal
   - [ ] `is_read` = `false`

---

## ✅ **CHECKLIST FINALE**

### **Stripe**
- [ ] Carta aggiunta con successo
- [ ] Customer Stripe creato
- [ ] Subscription creata (`status: 'trialing'`)
- [ ] Trial 90 giorni configurato correttamente
- [ ] Webhook riceve eventi
- [ ] UI mostra stato corretto
- [ ] Notifica creata

### **PayPal**
- [ ] Plan ID corretto (Sandbox o Live)
- [ ] Bottone PayPal funziona
- [ ] Subscription approvata
- [ ] Subscription salvata nel database (`status: 'trialing'`)
- [ ] Trial 90 giorni configurato correttamente
- [ ] Webhook riceve eventi
- [ ] UI mostra stato corretto
- [ ] Notifica creata

---

## 🐛 **TROUBLESHOOTING**

### **Stripe: "Payment method not found"**
- **Causa:** Customer non creato o payment method non salvato
- **Soluzione:** Verifica che `stripe_customer_id` esista nel database

### **Stripe: "Subscription already exists"**
- **Causa:** Subscription già creata
- **Soluzione:** Cancella subscription esistente o usa un altro account professionista

### **PayPal: "RESOURCE_NOT_FOUND"**
- **Causa:** Plan ID non esiste nell'ambiente (Sandbox vs Live)
- **Soluzione:** Vedi `PAYPAL_SANDBOX_VS_LIVE.md`

### **PayPal: "Webhook not receiving events"**
- **Causa:** Webhook non configurato o URL errato
- **Soluzione:** Verifica URL webhook su developer.paypal.com

### **Database: Subscription non creata**
- **Causa:** Edge Function fallita o errore nel codice
- **Soluzione:** Controlla Supabase Logs → Edge Functions per errori

---

## 📝 **NOTE IMPORTANTI**

1. **Sandbox vs Live:**
   - **Sandbox:** Test gratuito, nessun pagamento reale
   - **Live:** Pagamenti reali, usa solo per produzione

2. **Trial Period:**
   - Stripe: 90 giorni configurati automaticamente
   - PayPal: 90 giorni configurati nel piano PayPal

3. **Webhook:**
   - Stripe: Configurato in Stripe Dashboard
   - PayPal: Configurato in developer.paypal.com

4. **Test Account:**
   - Stripe: Usa carte di test (4242 4242 4242 4242)
   - PayPal: Crea account Sandbox su developer.paypal.com

---

**Ultimo aggiornamento:** 28 Gennaio 2025
**Stato:** Guida completa per test pagamenti Stripe e PayPal

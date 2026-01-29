# Test cron Subscription Reminders

## 1. Da GitHub Actions (consigliato)

1. Vai su **GitHub** → repo **Prime-puls-HUB** → tab **Actions**.
2. Nel menu a sinistra seleziona **"Subscription Reminders Cron"**.
3. A destra clicca **"Run workflow"** → **"Run workflow"** (dropdown).
4. Attendi il termine del job (pochi secondi).
5. Clicca sul run appena completato e apri il job **send-reminders**.
6. Nella log del step **"Call Subscription Reminders Edge Function"** verifica:
   - **HTTP Status: 200**
   - **Response** con `"success": true` e un oggetto `summary` (es. `created`, `skipped`, `errors`, `date`).
   - Messaggio finale: **✅ Subscription reminders sent successfully**.

**Secrets richiesti nel repo:**  
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` devono essere configurati in  
Settings → Secrets and variables → Actions.

---

## 2. Da terminale (curl)

Per testare l’Edge Function senza GitHub:

```bash
# Sostituisci con i tuoi valori da .env / Supabase dashboard
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

curl -s -X POST \
  "$SUPABASE_URL/functions/v1/subscription-reminders" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Risposta attesa: JSON con `success: true` e `summary`.

---

## 3. Verificare le notifiche in-app

Dopo il test:

1. Supabase Dashboard → **Table Editor** → tabella **professional_notifications**.
2. Ordina per **created_at** DESC e controlla le righe recenti.
3. Criteri per cui vengono create notifiche:
   - **Trial** in scadenza tra 3 giorni o oggi (`status = trialing`, `trial_end` in range).
   - **Pagamento** in scadenza tra 3 giorni o oggi (`status = active`, `current_period_end` in range).
   - **Carta** in scadenza questo mese (Stripe, `card_exp_month` / `card_exp_year` = mese/anno corrente).

Se non ci sono subscription che rientrano in questi casi, `summary.created` può essere 0 e `skipped` può essere 0: è normale. Il cron è comunque “ok” se risponde 200 e `success: true`.

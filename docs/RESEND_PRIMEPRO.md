# Resend per PrimePro – Email benvenuto e reminder trial

PrimePro invia email tramite **Resend** per:

1. **Benvenuto** – quando il professionista attiva il trial (primo accesso alla dashboard, creazione subscription).
2. **Reminder trial** – 3 giorni prima della scadenza e il giorno stesso (cron giornaliero `subscription-reminders`).

Le notifiche in-app (tabella `professional_notifications`) restano invariate; le email sono un canale aggiuntivo.

---

## 1. Configurazione Resend

1. Vai su [resend.com](https://resend.com) e crea un account (o fai login).
2. Dal dashboard: **API Keys** → **Create API Key** → dai un nome (es. "PrimePro") e copia la chiave (inizia con `re_`). Conservala in modo sicuro; viene mostrata una sola volta.
3. (Consigliato) **Domains** → aggiungi il dominio da cui inviare (es. `primepro.it`) e configura i record DNS che Resend indica (SPF/DKIM) per ridurre il rischio spam.

---

## 2. Variabili d’ambiente (Supabase Edge Functions)

Imposta questi **secrets** per le Edge Functions (Supabase Dashboard → Project Settings → Edge Functions → Secrets):

| Secret | Obbligatorio | Descrizione |
|--------|--------------|-------------|
| `RESEND_API_KEY` | Sì (per inviare) | API key Resend (es. `re_xxxxx`). Se assente, le email non vengono inviate (no-op, log in console). |
| `RESEND_FROM_EMAIL` | No | Indirizzo mittente (es. `noreply@primepro.it`). Default: `noreply@primepro.it`. |
| `RESEND_FROM_NAME` | No | Nome mittente (es. `PrimePro`). Default: `PrimePro`. |

**CLI esempio:**

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=noreply@primepro.it
supabase secrets set RESEND_FROM_NAME=PrimePro
```

Dopo aver impostato i secrets, ridistribuisci le Edge Functions `ensure-partner-subscription` e `subscription-reminders`.

---

## 3. Dove vengono usate

| Funzione | Quando | Email |
|----------|--------|--------|
| **ensure-partner-subscription** | Creazione **nuova** subscription (trial 90 gg) | Benvenuto su PrimePro. |
| **subscription-reminders** (cron) | Ogni giorno; per trial in scadenza tra 3 gg o oggi | Reminder trial (titolo + messaggio + link abbonamento). |

---

## 4. Test

- **Benvenuto**: nuovo professionista, primo accesso alla dashboard partner → email di benvenuto (se `RESEND_API_KEY` è impostata).
- **Reminder trial**: esegui il cron (GitHub Actions → "Subscription Reminders Cron" → Run workflow); in risposta controlla `summary.emails_sent`.

### Test Resend senza creare un nuovo account

Puoi inviare un’email di test con l’Edge Function **send-test-email** (protetta da Service Role Key):

1. Ridistribuisci la funzione:  
   `supabase functions deploy send-test-email`
2. Da terminale (sostituisci `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e l’email):

```bash
curl -X POST "$SUPABASE_URL/functions/v1/send-test-email" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"tua@email.com"}'
```

Se la risposta è `{"ok":true,"message":"Email di test inviata a tua@email.com"}` e ricevi l’email, Resend è configurato correttamente.

---

## 5. File coinvolti

- `supabase/functions/_shared/resend.ts` – helper `sendTransactional()` (chiamata API Resend).
- `supabase/functions/ensure-partner-subscription/index.ts` – invio email benvenuto dopo insert subscription.
- `supabase/functions/subscription-reminders/index.ts` – invio email reminder trial (3 giorni prima + giorno stesso).

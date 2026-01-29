# ✅ FASE 9: NOTIFICHE PROATTIVE - IMPLEMENTAZIONE COMPLETA

**Data:** 27 Gennaio 2025  
**Stato:** ✅ Implementato e pronto per deploy

---

## 📋 FILE CREATI

### 1. Edge Function
- ✅ `supabase/functions/subscription-reminders/index.ts`
- ✅ `supabase/functions/subscription-reminders/deno.json`

### 2. Cron Job GitHub Actions
- ✅ `.github/workflows/subscription-reminders-cron.yml`

---

## 🚀 DEPLOY EDGE FUNCTION

### Comandi da eseguire:

```bash
# 1. Assicurati di essere nella directory del progetto
cd /Users/mattiasilvestrelli/Prime-puls-HUB

# 2. Deploy Edge Function
npx supabase functions deploy subscription-reminders --project-ref [TUO_PROJECT_REF]

# Oppure se hai già configurato il link:
npx supabase functions deploy subscription-reminders
```

**Nota:** Sostituisci `[TUO_PROJECT_REF]` con il tuo Project Reference di Supabase (es. `kfxoyucatvvcgmqalxsg`)

---

## ⚙️ CONFIGURAZIONE GITHUB SECRETS

Assicurati che i seguenti secrets siano configurati nel repository GitHub:

1. **`SUPABASE_URL`**: URL completo del progetto Supabase
   - Esempio: `https://kfxoyucatvvcgmqalxsg.supabase.co`

2. **`SUPABASE_SERVICE_ROLE_KEY`**: Service Role Key (NON anon key)
   - **IMPORTANTE**: Deve essere la Service Role Key, non l'anon key
   - Si trova in: Supabase Dashboard → Settings → API → `service_role` key

**Come configurare:**
1. Vai su GitHub → Repository → Settings → Secrets and variables → Actions
2. Aggiungi/verifica i secrets sopra

---

## 🧪 TEST MANUALE

### Test Edge Function:

```bash
curl -X POST \
  "https://[TUO_PROJECT_REF].supabase.co/functions/v1/subscription-reminders" \
  -H "Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "success": true,
  "summary": {
    "total_checked": 5,
    "created": 3,
    "skipped": 0,
    "errors": 0,
    "date": "2025-01-27"
  }
}
```

### Test Database:

```sql
-- Verifica notifiche create
SELECT 
  id,
  professional_id,
  type,
  title,
  message,
  created_at,
  data->>'reminder_key' as reminder_key,
  data->>'notification_type' as notification_type
FROM professional_notifications
WHERE type = 'custom'
  AND data->>'notification_type' = 'subscription_reminder'
ORDER BY created_at DESC
LIMIT 20;

-- Verifica subscription con trial in scadenza
SELECT 
  id,
  professional_id,
  status,
  trial_end,
  current_period_end,
  card_exp_month,
  card_exp_year
FROM professional_subscriptions
WHERE status = 'trialing'
  AND trial_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
ORDER BY trial_end;
```

---

## 📊 LOGICA IMPLEMENTATA

### 1. Trial in Scadenza
- **3 giorni prima**: Notifica quando `trial_end` è esattamente tra 3 giorni
- **Giorno stesso**: Notifica quando `trial_end` è oggi
- **Query**: `status = 'trialing'` AND `trial_end` tra oggi e 3 giorni

### 2. Pagamento in Scadenza
- **3 giorni prima**: Notifica quando `current_period_end` è tra 3 giorni
- **Giorno stesso**: Notifica quando `current_period_end` è oggi
- **Query**: `status = 'active'` AND `current_period_end` tra oggi e 3 giorni
- **Prezzo**: Formattato come `€50,00` da `price_cents`

### 3. Carta in Scadenza
- **Questo mese**: Notifica quando `card_exp_month = currentMonth` AND `card_exp_year = currentYear`
- **Query**: `status IN ('trialing', 'active')` AND carta scade questo mese
- **Info carta**: Mostra brand e ultime 4 cifre (es. "Visa •••• 4242")

### 4. Deduplicazione
- Verifica se notifica con stesso `reminder_key` esiste già
- Query: recupera notifiche `type = 'custom'` e `professional_id`, poi filtra per `reminder_key` in JavaScript
- Previene notifiche duplicate se cron job esegue più volte

---

## 🔍 VERIFICA FINALE

Dopo il deploy, verifica che:

- [ ] Edge Function deployata senza errori
- [ ] GitHub Actions workflow creato (visibile in Actions tab)
- [ ] Secrets GitHub configurati (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Test manuale funziona (curl restituisce success: true)
- [ ] Notifiche create nella tabella `professional_notifications`
- [ ] Deduplicazione funziona (eseguendo 2 volte non crea duplicati)
- [ ] Cron job esegue automaticamente ogni giorno alle 09:00 UTC

---

## 📝 NOTE TECNICHE

### Tipo Notifica
- **Tipo usato**: `'custom'` (non `'subscription'`)
- **Motivo**: Il tipo `'subscription'` non è nel CHECK constraint del database
- **Coerenza**: Stesso approccio usato in `stripe-webhook/index.ts`

### Data JSON
- **`reminder_key`**: Chiave univoca per deduplicazione (es. `trial_3d_2025-01-30`)
- **`notification_type`**: `'subscription_reminder'` per identificare tipo notifica

### Service Role Key
- **Perché necessario**: Bypassa RLS per query `professional_subscriptions` e creazione notifiche
- **Sicurezza**: Edge Function è server-side, Service Role Key non esposta al client

### Cron Job Timing
- **Esegue**: Ogni giorno alle 09:00 UTC (10:00 ora italiana)
- **Frequenza**: Una volta al giorno (sufficiente per notifiche 3 giorni prima + oggi)

---

## 🐛 TROUBLESHOOTING

### Problema: Edge Function restituisce 401
**Causa**: Service Role Key mancante o errata  
**Soluzione**: Verifica che `SUPABASE_SERVICE_ROLE_KEY` sia configurato correttamente in GitHub Secrets

### Problema: Nessuna notifica creata
**Causa**: Nessuna subscription con date rilevanti  
**Soluzione**: Verifica che ci siano subscription con `trial_end` o `current_period_end` tra oggi e 3 giorni

### Problema: Notifiche duplicate
**Causa**: Deduplicazione non funziona  
**Soluzione**: Verifica che `reminder_key` sia univoco e che la query di deduplicazione funzioni

### Problema: Cron job non esegue
**Causa**: Secrets GitHub non configurati  
**Soluzione**: Verifica che `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` siano configurati in GitHub Secrets

---

## ✅ STATO IMPLEMENTAZIONE

- ✅ Edge Function creata e pronta per deploy
- ✅ Cron Job GitHub Actions creato
- ✅ Logica completa per tutte e 3 le tipologie di notifiche
- ✅ Deduplicazione implementata
- ✅ Error handling robusto
- ✅ Logging dettagliato per debugging

**Prossimo step**: Deploy Edge Function e configurazione GitHub Secrets

---

**Ultimo aggiornamento:** 27 Gennaio 2025

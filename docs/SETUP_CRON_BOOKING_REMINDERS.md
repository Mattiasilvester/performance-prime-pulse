# ⏰ SETUP CRON JOB PER PROMEMORIA PRENOTAZIONI

## 📋 Opzioni Disponibili

Supabase non ha scheduling integrato per Edge Functions. Ecco le alternative:

---

## 🎯 OPZIONE 1: GitHub Actions (CONSIGLIATA - Gratuita)

### Setup:

1. **Aggiungi Secret a GitHub:**
   - Vai su: https://github.com/Mattiasilvester/performance-prime-pulse/settings/secrets/actions
   - Clicca "New repository secret"
   - Name: `SUPABASE_ANON_KEY`
   - Value: La tua anon key (da Supabase Dashboard → Settings → API)

2. **Il file `.github/workflows/booking-reminders-cron.yml` è già creato**

3. **Commit e push:**
   ```bash
   git add .github/workflows/booking-reminders-cron.yml
   git commit -m "Add cron job for booking reminders"
   git push
   ```

4. **Verifica:**
   - Vai su GitHub → Actions
   - Dovresti vedere il workflow "Booking Reminders Cron"
   - Si eseguirà automaticamente ogni 15 minuti

**Vantaggi:**
- ✅ Gratuito
- ✅ Affidabile
- ✅ Log completi
- ✅ Esecuzione manuale disponibile

---

## 🎯 OPZIONE 2: Vercel Cron (Se usi Vercel)

Se il progetto è deployato su Vercel:

1. Crea file `vercel.json` (se non esiste):
```json
{
  "crons": [{
    "path": "/api/cron/booking-reminders",
    "schedule": "*/15 * * * *"
  }]
}
```

2. Crea API route `api/cron/booking-reminders.ts`:
```typescript
export default async function handler(req, res) {
  const response = await fetch(
    'https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
```

---

## 🎯 OPZIONE 3: n8n (Hai già n8n configurato)

1. Vai su: https://gurfadigitalsolution.app.n8n.cloud
2. Crea nuovo workflow
3. Aggiungi trigger "Cron" (ogni 15 minuti)
4. Aggiungi nodo "HTTP Request":
   - Method: POST
   - URL: `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders`
   - Headers: `Authorization: Bearer YOUR_ANON_KEY`
5. Salva e attiva workflow

---

## 🎯 OPZIONE 4: Servizio Esterno (EasyCron, Cron-job.org, ecc.)

1. Vai su: https://cron-job.org (o servizio simile)
2. Crea nuovo cron job
3. URL: `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders`
4. Method: POST
5. Headers: `Authorization: Bearer YOUR_ANON_KEY`
6. Schedule: `*/15 * * * *` (ogni 15 minuti)

---

## 🎯 OPZIONE 5: pg_cron (Supabase Database)

Se hai accesso a pg_cron su Supabase:

```sql
-- Abilita estensione (se disponibile)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crea funzione SQL che chiama Edge Function
CREATE OR REPLACE FUNCTION call_booking_reminders()
RETURNS void AS $$
BEGIN
  -- Chiama Edge Function tramite http extension
  PERFORM net.http_post(
    url := 'https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedula esecuzione ogni 15 minuti
SELECT cron.schedule(
  'booking-reminders',
  '*/15 * * * *',
  $$SELECT call_booking_reminders();$$
);
```

**Nota:** pg_cron potrebbe non essere disponibile su tutti i piani Supabase.

---

## ✅ RACCOMANDAZIONE

**Usa GitHub Actions (Opzione 1)** - È la più semplice, gratuita e affidabile.

---

## 🧪 TEST MANUALE

Dopo aver configurato il cron, puoi sempre testare manualmente:

```bash
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

**Ultimo aggiornamento**: 23 Gennaio 2025

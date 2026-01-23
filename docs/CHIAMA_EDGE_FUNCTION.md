# 🚀 COME CHIAMARE L'EDGE FUNCTION booking-reminders

## ⚠️ IMPORTANTE

**L'Edge Function NON si esegue automaticamente!** Deve essere chiamata manualmente o tramite cron job.

---

## 📋 METODO 1: Supabase Dashboard (PIÙ SEMPLICE)

1. Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions
2. Clicca su **`booking-reminders`**
3. Clicca su **"Invoke"** o **"Test"** (in alto a destra)
4. Metodo: **POST**
5. Body: (lascia vuoto o `{}`)
6. Clicca **"Run"** o **"Invoke"**
7. Controlla la risposta nella sezione "Response"

**Risposta attesa:**
```json
{
  "success": true,
  "processed": 1,
  "remindersCreated": 1,
  "remindersSkipped": 0
}
```

---

## 📋 METODO 2: cURL (Terminal)

```bash
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY" \
  -H "Content-Type: application/json"
```

---

## 📋 METODO 3: Script Bash

```bash
cd /Users/mattiasilvestrelli/Prime-puls-HUB
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY"
./scripts/test-booking-reminders.sh
```

---

## 🔍 VERIFICA DOPO LA CHIAMATA

### 1. Controlla Risposta Edge Function

Se vedi `"remindersCreated": 1` → ✅ Notifica creata!

### 2. Verifica Notifica nell'App

1. Apri app come professionista
2. Clicca bottone notifiche (campanella)
3. Dovresti vedere "Promemoria appuntamento"

### 3. Verifica Database

```sql
-- Verifica notifiche promemoria
SELECT 
  id,
  title,
  message,
  created_at
FROM professional_notifications
WHERE type = 'booking_reminder'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🐛 SE NON FUNZIONA

### Problema: `remindersCreated: 0`

**Possibili cause:**

1. **Prenotazione non confermata**
   ```sql
   UPDATE bookings 
   SET status = 'confirmed' 
   WHERE client_name = 'Cliente Test';
   ```

2. **Non siamo nella finestra temporale**
   - Se appuntamento tra 2h e promemoria 2h prima
   - Finestra: tra 1.5h e 2.5h prima
   - Se appuntamento tra 3h → troppo presto
   - Se appuntamento tra 1h → troppo tardi

3. **Preferenze disabilitate**
   ```sql
   UPDATE professional_settings
   SET notify_booking_reminder = true,
       reminder_hours_before = ARRAY[2]::INTEGER[]
   WHERE professional_id IN (
     SELECT id FROM professionals WHERE user_id = auth.uid()
   );
   ```

4. **Promemoria già inviato**
   ```sql
   -- Verifica
   SELECT * FROM booking_reminders
   WHERE booking_id = 'ID_PRENOTAZIONE';
   
   -- Elimina per testare di nuovo
   DELETE FROM booking_reminders
   WHERE booking_id = 'ID_PRENOTAZIONE';
   ```

---

## 📊 LOG DETTAGLIATI

Dopo aver chiamato la funzione, controlla i log in:
- Supabase Dashboard → Edge Functions → booking-reminders → Logs

Cerca messaggi che iniziano con `[BOOKING-REMINDERS]` per vedere cosa sta succedendo.

---

**Prova il METODO 1 (Dashboard) - è il più semplice!**

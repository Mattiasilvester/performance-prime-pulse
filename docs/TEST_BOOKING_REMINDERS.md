# 🧪 TEST RAPIDO PROMEMORIA PRENOTAZIONI

## ⚠️ IMPORTANTE

**L'Edge Function NON si esegue automaticamente!** Deve essere chiamata manualmente o tramite cron job.

---

## 🔍 STEP 1: Verifica Prenotazione

Esegui in Supabase SQL Editor:

```sql
-- Verifica la tua prenotazione
SELECT 
  id,
  professional_id,
  booking_date,
  booking_time,
  status,
  client_name,
  -- Calcola ore rimanenti
  EXTRACT(EPOCH FROM (
    (booking_date + booking_time::time)::timestamp - NOW()
  )) / 3600 as hours_until_booking
FROM bookings
WHERE booking_date >= CURRENT_DATE
ORDER BY booking_date, booking_time DESC
LIMIT 5;
```

**Verifica:**
- ✅ `status` = `'confirmed'` (deve essere confermata!)
- ✅ `hours_until_booking` tra 1.5h e 2.5h (per promemoria 2h)

---

## 🔍 STEP 2: Verifica Impostazioni

```sql
-- Verifica preferenze promemoria
SELECT 
  notify_booking_reminder,
  reminder_hours_before
FROM professional_settings
WHERE professional_id = 'TUO_PROFESSIONAL_ID';
```

**Verifica:**
- ✅ `notify_booking_reminder` = `true`
- ✅ `reminder_hours_before` contiene `2` (es. `[24, 2]`)

---

## 🚀 STEP 3: Chiama Edge Function Manualmente

### Opzione A: Supabase Dashboard

1. Vai su **Supabase Dashboard** → **Edge Functions** → **booking-reminders**
2. Clicca su **"Invoke"** o **"Test"**
3. Metodo: **POST**
4. Clicca **"Run"**

### Opzione B: cURL (Terminal)

```bash
# Sostituisci YOUR_ANON_KEY con la tua anon key
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Dove trovare ANON_KEY:**
- Supabase Dashboard → Settings → API → `anon` `public` key

### Opzione C: Script Bash

```bash
# Imposta variabile
export SUPABASE_ANON_KEY="your_anon_key_here"

# Esegui script
./scripts/test-booking-reminders.sh
```

---

## 📊 STEP 4: Verifica Risultato

### Risposta Attesa:

```json
{
  "success": true,
  "processed": 1,
  "remindersCreated": 1,
  "remindersSkipped": 0
}
```

### Se `remindersCreated: 0`, controlla:

1. **Prenotazione confermata?**
   ```sql
   UPDATE bookings 
   SET status = 'confirmed' 
   WHERE id = 'ID_PRENOTAZIONE';
   ```

2. **Siamo nella finestra temporale?**
   - Se `reminder_hours_before = [2]` e appuntamento tra 1.5h-2.5h → ✅
   - Se appuntamento tra 3h → ❌ (troppo presto)
   - Se appuntamento tra 1h → ❌ (troppo tardi)

3. **Preferenze abilitate?**
   ```sql
   UPDATE professional_settings
   SET notify_booking_reminder = true
   WHERE professional_id = 'TUO_PROFESSIONAL_ID';
   ```

---

## 🔍 STEP 5: Verifica Notifica Creata

```sql
-- Verifica notifiche promemoria
SELECT 
  id,
  title,
  message,
  created_at,
  data->>'booking_id' as booking_id,
  data->>'hours_before' as hours_before
FROM professional_notifications
WHERE type = 'booking_reminder'
ORDER BY created_at DESC
LIMIT 5;
```

**Dovresti vedere:**
- Notifica con `title = 'Promemoria appuntamento'`
- `hours_before = 2` (o il valore configurato)
- `created_at` = ora corrente

---

## 🐛 TROUBLESHOOTING

### Problema: "Nessuna prenotazione futura trovata"

**Causa:** Nessuna prenotazione `status = 'confirmed'` e futura

**Soluzione:**
```sql
-- Verifica prenotazioni
SELECT id, status, booking_date, booking_time
FROM bookings
WHERE booking_date >= CURRENT_DATE;

-- Se status != 'confirmed', confermala
UPDATE bookings 
SET status = 'confirmed'
WHERE id = 'ID_PRENOTAZIONE';
```

---

### Problema: "remindersCreated: 0"

**Possibili cause:**

1. **Non siamo nella finestra temporale**
   - Se `reminder_hours_before = [2]`, l'appuntamento deve essere tra 1.5h e 2.5h da ora
   - **Soluzione:** Crea appuntamento più vicino o modifica `reminder_hours_before`

2. **Promemoria già inviato**
   ```sql
   -- Verifica se già inviato
   SELECT * FROM booking_reminders
   WHERE booking_id = 'ID_PRENOTAZIONE';
   
   -- Se esiste, elimina per testare di nuovo
   DELETE FROM booking_reminders
   WHERE booking_id = 'ID_PRENOTAZIONE';
   ```

3. **Preferenze disabilitate**
   ```sql
   -- Abilita promemoria
   UPDATE professional_settings
   SET notify_booking_reminder = true
   WHERE professional_id = 'TUO_PROFESSIONAL_ID';
   ```

---

### Problema: "Errore nella chiamata"

**Causa:** Edge Function non deployata o URL errato

**Soluzione:**
```bash
# Deploy Edge Function
supabase functions deploy booking-reminders

# Verifica URL corretto
# Dovrebbe essere: https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders
```

---

## ✅ TEST RAPIDO (2 minuti)

1. **Crea prenotazione confermata tra 2h:**
   ```sql
   -- Trova il tuo professional_id
   SELECT id FROM professionals WHERE user_id = auth.uid();
   
   -- Crea prenotazione di test (sostituisci professional_id)
   INSERT INTO bookings (
     professional_id,
     user_id,
     booking_date,
     booking_time,
     status,
     client_name,
     duration_minutes
   ) VALUES (
     'TUO_PROFESSIONAL_ID',
     auth.uid(),
     CURRENT_DATE,
     (NOW() + INTERVAL '2 hours')::time,
     'confirmed',
     'Cliente Test',
     60
   );
   ```

2. **Imposta promemoria a 2h:**
   ```sql
   UPDATE professional_settings
   SET reminder_hours_before = ARRAY[2]::INTEGER[],
       notify_booking_reminder = true
   WHERE professional_id = 'TUO_PROFESSIONAL_ID';
   ```

3. **Chiama Edge Function:**
   ```bash
   curl -X POST \
     https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/booking-reminders \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

4. **Verifica notifica:**
   - Apri app → Notifiche → Dovresti vedere "Promemoria appuntamento"

---

## 📝 NOTE IMPORTANTI

- ⚠️ **La funzione NON si esegue automaticamente** - devi chiamarla manualmente o configurare cron
- ⚠️ **Finestra temporale**: ±30 minuti di tolleranza (es. per 2h: tra 1.5h e 2.5h)
- ⚠️ **Solo prenotazioni confermate** (`status = 'confirmed'`)
- ⚠️ **Solo prenotazioni future** (non passate)

---

**Ultimo aggiornamento**: 23 Gennaio 2025

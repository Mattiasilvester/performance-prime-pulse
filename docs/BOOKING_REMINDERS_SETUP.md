# 🔔 SETUP PROMEMORIA PRENOTAZIONI AUTOMATICI

## 📋 Panoramica

Sistema automatico per inviare promemoria ai professionisti prima degli appuntamenti confermati.

**Funzionalità:**
- Promemoria automatici X ore prima dell'appuntamento
- Configurabile per professionista (default: 24h e 2h prima)
- Evita duplicati con sistema di tracking
- Rispetta preferenze utente (`notify_booking_reminder`)

---

## 🗄️ Database

### Migrazioni da eseguire:

1. **`20250123_add_booking_reminders.sql`**
   - Aggiunge colonna `reminder_hours_before` a `professional_settings`
   - Crea tabella `booking_reminders` per tracking

```bash
# Esegui in Supabase SQL Editor
supabase/migrations/20250123_add_booking_reminders.sql
```

### Struttura:

- **`professional_settings.reminder_hours_before`**: Array di ore (es. `[24, 2]`)
- **`booking_reminders`**: Tabella tracking per evitare duplicati

---

## ⚙️ Edge Function

### Deploy:

```bash
# Deploy Edge Function
supabase functions deploy booking-reminders
```

### Configurazione Cron Job:

**Opzione 1: Supabase Dashboard (Consigliato)**

1. Vai su Supabase Dashboard → Edge Functions → `booking-reminders`
2. Clicca su "Schedule" o "Cron"
3. Configura:
   - **Schedule**: `*/15 * * * *` (ogni 15 minuti)
   - **Method**: `POST`
   - **Headers**: (opzionale)

**Opzione 2: Supabase CLI**

```bash
# Crea cron job (ogni 15 minuti)
supabase functions schedule booking-reminders \
  --cron "*/15 * * * *" \
  --method POST
```

**Opzione 3: External Cron (GitHub Actions, Vercel Cron, ecc.)**

```bash
# Chiama Edge Function ogni 15 minuti
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/booking-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🧪 Test Manuale

### Test Edge Function:

```bash
# Chiama manualmente la funzione
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/booking-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "success": true,
  "processed": 5,
  "remindersCreated": 2,
  "remindersSkipped": 0
}
```

### Test Database:

```sql
-- Verifica promemoria creati
SELECT 
  br.*,
  b.booking_date,
  b.booking_time,
  b.client_name
FROM booking_reminders br
JOIN bookings b ON b.id = br.booking_id
ORDER BY br.sent_at DESC
LIMIT 10;

-- Verifica notifiche promemoria
SELECT 
  id,
  title,
  message,
  created_at
FROM professional_notifications
WHERE type = 'booking_reminder'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⚙️ Configurazione Professionista

### Default:
- **Tempi promemoria**: `[24, 2]` (24 ore e 2 ore prima)
- **Abilitato**: `true` (se `notify_booking_reminder = true`)

### Personalizzazione (SQL):

```sql
-- Cambia tempi promemoria per un professionista
UPDATE professional_settings
SET reminder_hours_before = ARRAY[48, 24, 2]::INTEGER[]
WHERE professional_id = 'UUID_PROFESSIONISTA';

-- Disabilita promemoria
UPDATE professional_settings
SET notify_booking_reminder = false
WHERE professional_id = 'UUID_PROFESSIONISTA';
```

---

## 🔍 Logica Funzionamento

1. **Cron job esegue ogni 15 minuti**
2. **Trova prenotazioni confermate future** (status = 'confirmed', booking_date >= oggi)
3. **Per ogni prenotazione:**
   - Calcola ore rimanenti fino all'appuntamento
   - Recupera tempi promemoria configurati (default: [24, 2])
   - Per ogni tempo configurato:
     - Verifica se siamo nella finestra temporale (es. 24h ± 30min)
     - Controlla se promemoria già inviato (tabella `booking_reminders`)
     - Se non inviato: crea notifica e salva tracking
4. **Rispetta preferenze utente** (`notify_booking_reminder`)

---

## 🛡️ Sicurezza

- ✅ **RLS abilitato** su `booking_reminders`
- ✅ **Service Role Key** per Edge Function (bypass RLS necessario)
- ✅ **Tracking duplicati** previene notifiche multiple
- ✅ **Gestione errori** robusta (non blocca se un booking fallisce)

---

## 📊 Monitoraggio

### Log Edge Function:

```bash
# Vedi log in Supabase Dashboard
# Edge Functions → booking-reminders → Logs
```

### Query Monitoraggio:

```sql
-- Statistiche promemoria ultimi 7 giorni
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as reminders_sent,
  COUNT(DISTINCT booking_id) as unique_bookings
FROM booking_reminders
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- Promemoria per professionista
SELECT 
  p.first_name || ' ' || p.last_name as professional,
  COUNT(*) as reminders_sent
FROM booking_reminders br
JOIN professionals p ON p.id = br.professional_id
WHERE br.sent_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.first_name, p.last_name
ORDER BY reminders_sent DESC;
```

---

## ⚠️ Troubleshooting

### Promemoria non vengono creati:

1. **Verifica cron job attivo** (Supabase Dashboard)
2. **Controlla log Edge Function** per errori
3. **Verifica prenotazioni confermate future** esistono
4. **Controlla preferenze utente** (`notify_booking_reminder = true`)
5. **Verifica tempi promemoria** configurati correttamente

### Promemoria duplicati:

- Sistema di tracking previene duplicati
- Se vedi duplicati, verifica tabella `booking_reminders`

### Performance:

- Edge Function processa max 100 prenotazioni per esecuzione
- Se hai molti professionisti, considera aumentare frequenza cron (ogni 10 minuti)

---

## ✅ Checklist Setup

- [ ] Eseguita migrazione `20250123_add_booking_reminders.sql`
- [ ] Deploy Edge Function `booking-reminders`
- [ ] Configurato cron job (ogni 15 minuti)
- [ ] Testato manualmente Edge Function
- [ ] Verificato creazione notifiche promemoria
- [ ] Monitorato log per errori

---

**Ultimo aggiornamento**: 23 Gennaio 2025

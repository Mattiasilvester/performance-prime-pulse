# 🧪 GUIDA TEST NOTIFICHE PROGRAMMATE

## ✅ STEP 1: Verifica Migration

### 1.1 Verifica Tabella Creata

Esegui in Supabase SQL Editor:

```sql
-- Verifica che la tabella esista
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'scheduled_notifications';
```

**Risultato atteso:** `scheduled_notifications`

### 1.2 Verifica Struttura

```sql
-- Verifica colonne
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'scheduled_notifications'
ORDER BY ordinal_position;
```

**Risultato atteso:** Dovresti vedere tutte le colonne (id, professional_id, type, title, message, scheduled_for, status, ecc.)

---

## ✅ STEP 2: Deploy Edge Function

### 2.1 Deploy con Supabase CLI

```bash
cd /Users/mattiasilvestrelli/Prime-puls-HUB

# Deploy Edge Function
supabase functions deploy send-scheduled-notifications
```

**Risultato atteso:** `Deployed Function send-scheduled-notifications`

### 2.2 Verifica Deploy

Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions

Dovresti vedere `send-scheduled-notifications` nella lista.

---

## ✅ STEP 3: Test Creazione Notifica Programmata (Frontend)

### 3.1 Apri l'App

1. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

2. Accedi come professionista:
   - Vai su `/partner/dashboard`
   - Assicurati di essere loggato

### 3.2 Crea Notifica Programmata

1. Vai su **Overview** (dashboard partner)
2. Nella sezione **"Attività recenti"**, clicca **"Programma Notifica"**
3. Compila il form:
   - **Titolo**: `Test Notifica Programmata`
   - **Messaggio**: `Questa è una notifica di test programmata`
   - **Data**: Scegli una data futura (es. domani)
   - **Ora**: Scegli un'ora tra 5-10 minuti da ora (es. se sono le 15:00, metti 15:05 o 15:10)
4. Clicca **"Programma Notifica"**

**Risultato atteso:** 
- ✅ Toast di successo: "Notifica programmata creata con successo!"
- ✅ Modal si chiude

### 3.3 Verifica nel Database

Esegui in Supabase SQL Editor:

```sql
-- Verifica notifica creata
SELECT 
  id,
  title,
  message,
  scheduled_for,
  status,
  created_at
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals 
  WHERE user_id = auth.uid()
)
ORDER BY scheduled_for DESC
LIMIT 1;
```

**Risultato atteso:**
- ✅ `status = 'pending'`
- ✅ `scheduled_for` = data/ora che hai scelto
- ✅ `title` e `message` corrispondono a quello che hai inserito

---

## ✅ STEP 4: Test Invio Automatico

### 4.1 Opzione A: Test Manuale (IMMEDIATO)

Chiama manualmente l'Edge Function:

**Metodo 1: Supabase Dashboard**
1. Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions
2. Clicca su `send-scheduled-notifications`
3. Clicca **"Invoke"** o **"Test"**
4. Metodo: **POST**
5. Body: `{}` (vuoto)
6. Clicca **"Run"**

**Risultato atteso:**
```json
{
  "success": true,
  "processed": 1,
  "sent": 1,
  "failed": 0
}
```

**Metodo 2: cURL**

```bash
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY" \
  -H "Content-Type: application/json"
```

### 4.2 Verifica Notifica Inviata

Esegui in Supabase SQL Editor:

```sql
-- Verifica notifica inviata
SELECT 
  id,
  title,
  scheduled_for,
  sent_at,
  status
FROM scheduled_notifications
WHERE id = 'ID_DELLA_TUA_NOTIFICA' -- Sostituisci con l'ID reale
```

**Risultato atteso:**
- ✅ `status = 'sent'`
- ✅ `sent_at` popolato con timestamp

### 4.3 Verifica Notifica in `professional_notifications`

```sql
-- Verifica notifica creata in professional_notifications
SELECT 
  id,
  type,
  title,
  message,
  is_read,
  created_at
FROM professional_notifications
WHERE professional_id = (
  SELECT id FROM professionals 
  WHERE user_id = auth.uid()
)
ORDER BY created_at DESC
LIMIT 1;
```

**Risultato atteso:**
- ✅ Notifica con `type = 'custom'`
- ✅ `title` e `message` corrispondono a quello programmato
- ✅ `is_read = false`

### 4.4 Verifica nell'App

1. Vai su **Overview** (dashboard partner)
2. Clicca sul bottone **notifiche** (campanella) nella sidebar
3. Dovresti vedere la notifica programmata nella lista

**Risultato atteso:**
- ✅ Notifica visibile nella lista
- ✅ Badge "non letta" (pallino giallo)
- ✅ Se suoni abilitati, dovresti sentire il suono

---

## ✅ STEP 5: Test Cron Job Automatico (OPZIONALE)

### 5.1 Verifica Workflow GitHub Actions

1. Vai su: https://github.com/Mattiasilvester/performance-prime-pulse/actions
2. Cerca workflow **"Scheduled Notifications Cron"**
3. Verifica che sia attivo

### 5.2 Test Esecuzione Manuale

1. Vai su: https://github.com/Mattiasilvester/performance-prime-pulse/actions/workflows/scheduled-notifications-cron.yml
2. Clicca **"Run workflow"** → **"Run workflow"**
3. Attendi completamento (pochi secondi)
4. Controlla i log

**Risultato atteso:**
- ✅ Workflow completato con successo
- ✅ Log mostrano chiamata a Edge Function

---

## 🐛 TROUBLESHOOTING

### Problema: Notifica non viene creata

**Verifica:**
1. Controlla console browser per errori
2. Verifica che `professionalId` sia valido:
   ```sql
   SELECT id FROM professionals WHERE user_id = auth.uid();
   ```
3. Controlla RLS policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'scheduled_notifications';
   ```

### Problema: Edge Function non invia notifica

**Verifica:**
1. Controlla log Edge Function:
   - Supabase Dashboard → Edge Functions → send-scheduled-notifications → Logs
2. Verifica che `scheduled_for` sia nel passato (o entro 5 minuti):
   ```sql
   SELECT 
     scheduled_for,
     NOW() as current_time,
     scheduled_for <= NOW() + INTERVAL '5 minutes' as should_send
   FROM scheduled_notifications
   WHERE status = 'pending';
   ```

### Problema: Notifica marcata come 'failed'

**Verifica:**
```sql
SELECT error_message 
FROM scheduled_notifications 
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 1;
```

**Possibili cause:**
- `professional_id` non valido
- Errore creazione notifica in `professional_notifications`
- Problemi RLS

---

## ✅ CHECKLIST FINALE

- [ ] Migration eseguita con successo
- [ ] Edge Function deployata
- [ ] Notifica programmata creata dal frontend
- [ ] Notifica visibile nel database con `status = 'pending'`
- [ ] Edge Function invia notifica (manuale o automatica)
- [ ] Notifica marcata come `status = 'sent'`
- [ ] Notifica visibile in `professional_notifications`
- [ ] Notifica visibile nell'app (campanella)
- [ ] Suono/vibrazione funzionano (se abilitati)

---

**Ultimo aggiornamento**: 23 Gennaio 2025

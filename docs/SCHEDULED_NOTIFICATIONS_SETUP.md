# ⏰ SETUP NOTIFICHE PROGRAMMATE

## 📋 Panoramica

Sistema completo per creare e inviare notifiche programmate in futuro. Permette ai professionisti di creare promemoria personalizzati che vengono inviati automaticamente alla data/ora specificata.

**Funzionalità:**
- Creazione notifiche programmate con data/ora personalizzata
- Invio automatico alla data/ora specificata
- Supporto per tutti i tipi di notifiche (incluso 'custom')
- Integrazione con sistema notifiche esistente (push, suoni, vibrazioni)

---

## 🗄️ Database

### Migrazioni da eseguire:

1. **`20250123_create_scheduled_notifications.sql`**
   - Crea tabella `scheduled_notifications`
   - Indici per performance
   - RLS policies per sicurezza

```bash
# Esegui in Supabase SQL Editor
supabase/migrations/20250123_create_scheduled_notifications.sql
```

### Struttura:

- **`scheduled_notifications`**: Tabella per notifiche programmate
  - `scheduled_for`: Data/ora in cui inviare
  - `status`: `pending`, `sent`, `cancelled`, `failed`
  - `sent_at`: Quando è stata effettivamente inviata

---

## ⚙️ Edge Function

### Deploy:

```bash
# Deploy Edge Function
supabase functions deploy send-scheduled-notifications
```

### Configurazione Cron Job:

**Opzione 1: GitHub Actions (Consigliata)**

Il file `.github/workflows/scheduled-notifications-cron.yml` è già creato. Si eseguirà automaticamente ogni 5 minuti.

**Opzione 2: Manuale**

Puoi chiamare manualmente la funzione:

```bash
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 🎨 Frontend

### Componenti:

1. **`ScheduleNotificationModal.tsx`**
   - Modal per creare notifiche programmate
   - Form con titolo, messaggio, data e ora
   - Validazione: data deve essere nel futuro

2. **`scheduledNotificationService.ts`**
   - Servizio per creare/gestire notifiche programmate
   - Helper functions per casi comuni

### Utilizzo:

1. Vai su Overview (dashboard partner)
2. Clicca "Programma Notifica" (bottone nella sezione "Attività recenti")
3. Compila il form:
   - Titolo (es. "Ricorda di chiamare il cliente")
   - Messaggio (es. "Chiama Mario Rossi per follow-up")
   - Data e ora (deve essere nel futuro)
4. Clicca "Programma Notifica"
5. La notifica verrà inviata automaticamente alla data/ora specificata

---

## 🧪 Test

### 1. Crea Notifica Programmata

1. Vai su Overview
2. Clicca "Programma Notifica"
3. Crea una notifica per tra 5-10 minuti
4. Clicca "Programma Notifica"

### 2. Verifica nel Database

```sql
-- Verifica notifiche programmate
SELECT 
  id,
  professional_id,
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
ORDER BY scheduled_for ASC;
```

Dovresti vedere la notifica con `status: 'pending'`.

### 3. Test Invio Automatico

1. Attendi che passi la data/ora programmata
2. Il cron job (ogni 5 minuti) invierà automaticamente la notifica
3. Verifica che:
   - `status` sia cambiato a `'sent'`
   - `sent_at` sia popolato
   - Una notifica sia stata creata in `professional_notifications`

### 4. Test Manuale (Edge Function)

Puoi testare manualmente chiamando l'Edge Function:

```bash
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "success": true,
  "processed": 1,
  "sent": 1,
  "failed": 0
}
```

---

## 📝 Note Importanti

### Tolleranza Temporale

L'Edge Function invia notifiche con una tolleranza di ±5 minuti:
- Se programmata per le 10:00, verrà inviata tra le 9:55 e le 10:05
- Questo evita che notifiche vengano perse se il cron è leggermente in ritardo

### Precisione

- **Cron Job**: Esegue ogni 5 minuti (più frequente dei booking reminders)
- **Tolleranza**: ±5 minuti dalla data programmata
- **Risultato**: Notifiche inviate con precisione di ~5 minuti

### Integrazione Completa

Le notifiche programmate si integrano con:
- ✅ Sistema notifiche esistente
- ✅ Push notifications (se abilitate)
- ✅ Suoni e vibrazioni (se abilitate)
- ✅ Notifiche raggruppate

---

## 🐛 Troubleshooting

### Notifica non viene inviata

1. Verifica che `status = 'pending'`:
   ```sql
   SELECT * FROM scheduled_notifications 
   WHERE id = 'YOUR_ID' AND status = 'pending';
   ```

2. Verifica che `scheduled_for` sia nel passato (o entro 5 minuti):
   ```sql
   SELECT 
     id,
     scheduled_for,
     NOW() as current_time,
     scheduled_for <= NOW() + INTERVAL '5 minutes' as should_send
   FROM scheduled_notifications 
   WHERE id = 'YOUR_ID';
   ```

3. Controlla i log dell'Edge Function:
   - Supabase Dashboard → Edge Functions → send-scheduled-notifications → Logs

### Notifica marcata come 'failed'

1. Controlla `error_message` nella tabella:
   ```sql
   SELECT error_message FROM scheduled_notifications WHERE id = 'YOUR_ID';
   ```

2. Possibili cause:
   - `professional_id` non valido
   - Errore creazione notifica in `professional_notifications`
   - Problemi di permessi RLS

---

**Ultimo aggiornamento**: 23 Gennaio 2025

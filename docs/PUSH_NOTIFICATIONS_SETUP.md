# Setup Notifiche Push Professionali

## 📋 Panoramica

Sistema completo di notifiche push per professionisti PrimePro che funziona anche quando l'app è chiusa.

## ✅ Implementazione Completata

### 1. Service Worker (`public/sw.js`)
- Gestisce notifiche push anche quando l'app è chiusa
- Mostra notifiche con icona e badge
- Gestisce click su notifiche per aprire l'app

### 2. Database (`push_subscriptions`)
- Tabella per salvare subscription push dei professionisti
- Supporta multi-device (un professionista può avere più subscription)
- RLS policies per sicurezza

### 3. Frontend (`pushNotificationService.ts`)
- Riabilitato service worker (senza rompere mobile refresh)
- Salvataggio subscription nel database
- Integrazione con `useProfessionalId`

### 4. Edge Function (`send-push-notification`)
- Invia push quando arrivano nuove notifiche professionali
- Supporta multi-device
- Gestione errori robusta

### 5. Integrazione Automatica
- Quando viene creata una notifica professionale, viene automaticamente inviata una push
- Non blocca il flusso principale se push fallisce

## 🔧 Configurazione Richiesta

### 1. Esegui Migration Database

```bash
# Esegui la migration
supabase migration up 20250123_create_push_subscriptions
```

### 2. Configura VAPID Keys (Opzionale - per produzione)

Per una implementazione completa delle push notifications, serve configurare le VAPID keys:

1. **Genera VAPID keys** (usa `web-push` npm package):
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Aggiungi come Secrets in Supabase Dashboard**:
   - Vai su: Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Aggiungi:
     - `VAPID_PUBLIC_KEY`: La chiave pubblica generata
     - `VAPID_PRIVATE_KEY`: La chiave privata generata
     - `VAPID_SUBJECT`: Email o URL (es. `mailto:your-email@example.com`)

3. **Aggiorna `pushNotificationService.ts`**:
   - Sostituisci `VAPID_PUBLIC_KEY` con la tua chiave pubblica

### 3. Deploy Edge Function

```bash
# Deploy della funzione
supabase functions deploy send-push-notification
```

## 🧪 Test

### 1. Test Attivazione Push

1. Vai su Impostazioni → Notifiche
2. Clicca "Attiva Notifiche Push"
3. Accetta i permessi del browser
4. Verifica che la subscription sia salvata in `push_subscriptions`

### 2. Test Invio Push

1. Crea una nuova prenotazione (o qualsiasi azione che genera notifica)
2. Verifica che arrivi la notifica push
3. Clicca sulla notifica per aprire l'app

### 3. Verifica Database

```sql
-- Verifica subscription salvate
SELECT * FROM push_subscriptions WHERE is_active = true;

-- Verifica notifiche create
SELECT * FROM professional_notifications ORDER BY created_at DESC LIMIT 10;
```

## 📝 Note Importanti

### Service Worker e Mobile Refresh

Il service worker è stato riabilitato in modo sicuro:
- `main.tsx` NON deregistra `sw.js` (solo altri service worker)
- Cache per push notifications viene mantenuta
- Non interferisce con il mobile refresh fix

### Multi-Device Support

Un professionista può avere più subscription (es. PC + mobile):
- Ogni device ha la sua subscription
- Le push vengono inviate a tutte le subscription attive
- Se un device disattiva notifiche, solo quella subscription viene marcata come inattiva

### Fallback e Error Handling

- Se push fallisce, non blocca la creazione della notifica
- Le notifiche vengono sempre create nel database
- Push è un feature aggiuntivo, non obbligatorio

## 🚀 Prossimi Passi (Opzionali)

1. **Implementazione VAPID completa**: Usa libreria web-push per Deno
2. **Tracking errori**: Marca subscription come inattive dopo N errori
3. **Notifiche raggruppate**: Raggruppa notifiche simili
4. **Suoni e vibrazioni**: Aggiungi feedback audio/tattile
5. **Notifiche programmate**: Supporto per notifiche con delay

## 🐛 Troubleshooting

### Push non arrivano

1. Verifica che il service worker sia registrato:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log);
   ```

2. Verifica che la subscription sia salvata:
   ```sql
   SELECT * FROM push_subscriptions WHERE professional_id = 'YOUR_ID';
   ```

3. Controlla i log dell'Edge Function:
   - Supabase Dashboard → Edge Functions → send-push-notification → Logs

### Service Worker non si registra

1. Verifica che `sw.js` sia accessibile: `https://your-domain.com/sw.js`
2. Controlla la console del browser per errori
3. Verifica che non ci siano conflitti con altri service worker

### Notifiche duplicate

- Il sistema previene duplicati usando `tag` nelle notifiche
- Se vedi duplicati, verifica che non ci siano più subscription attive per lo stesso device

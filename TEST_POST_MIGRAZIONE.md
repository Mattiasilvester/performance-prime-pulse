# 🧪 TEST POST-MIGRAZIONE - CLEANUP FASE 1

**Data:** 21 Gennaio 2025  
**Migrazione:** Cleanup FASE 1 (Tabella users rimossa, campi deprecati rimossi, colonne bookings separate)

---

## 📋 CHECKLIST TEST COMPLETA

### ✅ VERIFICA 1: DATABASE SCHEMA

- [ ] **Tabella `users` rimossa**
  ```sql
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  );
  ```
  **Risultato atteso:** `false` (tabella non esiste)

- [ ] **Campi deprecati rimossi da `professionals`**
  ```sql
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'professionals'
  AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at');
  ```
  **Risultato atteso:** 0 righe

- [ ] **Nuove colonne presenti in `bookings`**
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name IN ('client_name', 'client_email', 'client_phone', 'service_type', 'color')
  ORDER BY column_name;
  ```
  **Risultato atteso:** 5 righe (tutte le colonne presenti)

- [ ] **Indici creati**
  ```sql
  SELECT indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename = 'bookings'
  AND indexname IN ('idx_bookings_client_name', 'idx_bookings_client_email', 'idx_bookings_service_type');
  ```
  **Risultato atteso:** 3 indici presenti

---

### ✅ VERIFICA 2: DATI MIGRATI

- [ ] **Prenotazioni esistenti hanno dati nelle nuove colonne**
  ```sql
  SELECT 
    id,
    client_name,
    client_email,
    service_type,
    color,
    LEFT(notes, 50) as notes_preview
  FROM bookings 
  WHERE client_name IS NOT NULL 
  OR service_type IS NOT NULL
  LIMIT 5;
  ```
  **Risultato atteso:** Record con colonne popolate

- [ ] **Nessuna inconsistenza**
  ```sql
  SELECT COUNT(*) as count_inconsistenze
  FROM bookings 
  WHERE client_name IS NOT NULL 
  AND (notes IS NULL OR notes !~ '^\s*\{');
  ```
  **Risultato atteso:** 0 (nessuna inconsistenza)

---

### ✅ VERIFICA 3: APP - CALENDARIO (AgendaView.tsx)

#### Test 3.1: Visualizzazione Appuntamenti Esistenti
- [ ] Apri `/partner/dashboard/calendario` → Tab "Agenda"
- [ ] Verifica che gli appuntamenti esistenti vengano visualizzati correttamente
- [ ] Verifica che il nome cliente sia corretto (da colonna `client_name`)
- [ ] Verifica che il colore sia corretto (da colonna `color`)
- [ ] Verifica che le note siano visualizzate correttamente

#### Test 3.2: Creazione Nuovo Appuntamento
- [ ] Clicca su uno slot vuoto nel calendario (Day/Week view)
- [ ] Compila il form:
  - Nome cliente: "Mario Rossi"
  - Email: "mario@example.com"
  - Telefono: "+39 123 456 7890"
  - Note: "Test post-migrazione"
  - Colore: Seleziona un colore
- [ ] Salva l'appuntamento
- [ ] Verifica che l'appuntamento appaia nel calendario
- [ ] Verifica nel database:
  ```sql
  SELECT client_name, client_email, client_phone, color, notes
  FROM bookings 
  WHERE client_name = 'Mario Rossi'
  ORDER BY created_at DESC
  LIMIT 1;
  ```
  **Risultato atteso:** 
  - `client_name` = "Mario Rossi"
  - `client_email` = "mario@example.com"
  - `client_phone` = "+39 123 456 7890"
  - `color` = Colore selezionato
  - `notes` = Solo note testuali (non JSON completo)

#### Test 3.3: Modifica Appuntamento
- [ ] Clicca su un appuntamento esistente
- [ ] Modifica nome cliente, email, colore
- [ ] Salva le modifiche
- [ ] Verifica che le modifiche siano visibili nel calendario
- [ ] Verifica nel database che le colonne siano aggiornate

#### Test 3.4: Eliminazione Appuntamento
- [ ] Clicca su un appuntamento
- [ ] Clicca "Elimina" e conferma
- [ ] Verifica che l'appuntamento scompaia dal calendario

#### Test 3.5: Drag & Drop Appuntamento
- [ ] Trascina un appuntamento in un altro slot
- [ ] Verifica che la data/ora sia aggiornata correttamente
- [ ] Verifica che i dati (nome, email, etc.) rimangano invariati

#### Test 3.6: Resize Appuntamento
- [ ] Clicca e trascina il bordo superiore/inferiore di un appuntamento
- [ ] Verifica che la durata sia aggiornata correttamente
- [ ] Verifica che i dati (nome, email, etc.) rimangano invariati

---

### ✅ VERIFICA 4: APP - PRENOTAZIONI PAGE (PrenotazioniPage.tsx)

#### Test 4.1: Visualizzazione Lista Prenotazioni
- [ ] Apri `/partner/dashboard/prenotazioni`
- [ ] Verifica che le prenotazioni vengano visualizzate correttamente
- [ ] Verifica che:
  - Nome cliente sia corretto (da `client_name`)
  - Email cliente sia corretta (da `client_email`)
  - Tipo servizio sia corretto (da `service_type`)
  - Status badge sia visualizzato correttamente

#### Test 4.2: Filtri
- [ ] Test filtro "Oggi" → Verifica che mostri solo prenotazioni di oggi
- [ ] Test filtro "Questa settimana" → Verifica che mostri solo prenotazioni della settimana
- [ ] Test filtro per status → Verifica che filtri correttamente
- [ ] Test filtro per modalità → Verifica che filtri correttamente
- [ ] Test ricerca per nome → Verifica che funzioni con `client_name`

#### Test 4.3: Modifica Prenotazione
- [ ] Clicca "Modifica" su una prenotazione
- [ ] Modifica nome, email, tipo servizio, data, ora
- [ ] Salva le modifiche
- [ ] Verifica che:
  - Le modifiche siano visibili nella lista
  - Le colonne database siano aggiornate correttamente

#### Test 4.4: Conferma Rapida (Pending → Confirmed)
- [ ] Seleziona una prenotazione con status "pending"
- [ ] Clicca "Conferma"
- [ ] Verifica che lo status cambi a "confirmed"
- [ ] Verifica che i dati (nome, email, etc.) rimangano invariati

#### Test 4.5: Eliminazione Prenotazione
- [ ] Clicca "Cancella" su una prenotazione
- [ ] Conferma l'eliminazione
- [ ] Verifica che la prenotazione scompaia dalla lista
- [ ] Verifica che lo status sia cambiato a "cancelled" nel database

---

### ✅ VERIFICA 5: APP - CLIENTI PAGE (ClientiPage.tsx)

#### Test 5.1: Visualizzazione Clienti con Statistiche
- [ ] Apri `/partner/dashboard/clienti`
- [ ] Verifica che i clienti vengano visualizzati correttamente
- [ ] Verifica che le statistiche (Totale, Attivi, Abbonati PP) siano corrette
- [ ] Verifica che il numero di sessioni per cliente sia corretto (contato da `bookings` con matching su `client_email`)

#### Test 5.2: Dettaglio Cliente - Tab Prenotazioni
- [ ] Clicca su un cliente
- [ ] Vai al tab "Prenotazioni"
- [ ] Verifica che le prenotazioni vengano visualizzate correttamente
- [ ] Verifica che il matching funzioni correttamente:
  - Per clienti con `user_id`: match su `bookings.user_id`
  - Per clienti senza `user_id`: match su `bookings.client_email`

---

### ✅ VERIFICA 6: APP - MODAL CREAZIONE PRENOTAZIONE (AddBookingModal.tsx)

#### Test 6.1: Creazione da ClientiPage
- [ ] Apri `/partner/dashboard/clienti`
- [ ] Clicca su un cliente
- [ ] Clicca "Prenota" nel footer
- [ ] Verifica che il modal si apra con cliente pre-selezionato
- [ ] Compila data, ora, durata, tipo servizio
- [ ] Salva
- [ ] Verifica nel database:
  ```sql
  SELECT client_name, client_email, service_type, notes
  FROM bookings 
  ORDER BY created_at DESC 
  LIMIT 1;
  ```
  **Risultato atteso:**
  - `client_name` = Nome cliente pre-selezionato
  - `client_email` = Email cliente (se disponibile)
  - `service_type` = Tipo servizio selezionato
  - `notes` = Solo note testuali (non JSON completo)

#### Test 6.2: Creazione da AgendaView
- [ ] Apri `/partner/dashboard/calendario` → Tab "Agenda"
- [ ] Clicca su uno slot vuoto
- [ ] Compila tutti i campi (nome, email, telefono, note, colore)
- [ ] Salva
- [ ] Verifica che l'appuntamento appaia nel calendario
- [ ] Verifica nel database che tutte le colonne siano popolate correttamente

---

### ✅ VERIFICA 7: RETROCOMPATIBILITÀ (Dati Vecchi con JSON)

#### Test 7.1: Appuntamento con Solo Notes JSON (Nessuna Colonna)
- [ ] Crea manualmente nel database un appuntamento con solo `notes` JSON:
  ```sql
  INSERT INTO bookings (
    professional_id, user_id, booking_date, booking_time, 
    duration_minutes, status, notes
  ) VALUES (
    'PROFESSIONAL_ID', 'USER_ID', CURRENT_DATE, '10:00',
    60, 'confirmed',
    '{"client_name":"Test Retro","client_email":"test@example.com","service_type":"Personal Training","color":"#FF0000","original_notes":"Test note"}'
  );
  ```
- [ ] Verifica nell'app che:
  - Il nome cliente venga visualizzato correttamente (da JSON)
  - L'email venga visualizzata correttamente (da JSON)
  - Il tipo servizio venga visualizzato correttamente (da JSON)
  - Il colore venga visualizzato correttamente (da JSON)

#### Test 7.2: Modifica Appuntamento con Solo JSON
- [ ] Modifica l'appuntamento creato nel test 7.1
- [ ] Verifica che dopo il salvataggio, le colonne separate siano popolate
- [ ] Verifica che `notes` contenga solo le note testuali

---

### ✅ VERIFICA 8: QUERY E PERFORMANCE

#### Test 8.1: Query con Filtri sulle Nuove Colonne
- [ ] Esegui query per filtrare per `client_name`:
  ```sql
  SELECT COUNT(*) 
  FROM bookings 
  WHERE client_name ILIKE '%mario%';
  ```
  **Risultato atteso:** Conteggio corretto con indice utilizzato

- [ ] Esegui query per filtrare per `service_type`:
  ```sql
  SELECT COUNT(*) 
  FROM bookings 
  WHERE service_type = 'Personal Training';
  ```
  **Risultato atteso:** Conteggio corretto con indice utilizzato

#### Test 8.2: Query per Email Cliente
- [ ] Esegui query per trovare prenotazioni di un cliente:
  ```sql
  SELECT * 
  FROM bookings 
  WHERE client_email = 'mario@example.com'
  ORDER BY booking_date DESC;
  ```
  **Risultato atteso:** Lista corretta con indice utilizzato

---

## 🐛 PROBLEMI NOTI / DA VERIFICARE

1. **Gestione Notes JSON vs Colonne Separate**
   - ✅ Risolto: Fallback intelligente implementato
   - Verifica che i dati vecchi funzionino ancora

2. **Performance Query**
   - Verifica che gli indici siano utilizzati correttamente
   - Verifica che le query non siano lente

3. **Consistenza Dati**
   - Verifica che non ci siano appuntamenti con dati duplicati (sia in colonne che in JSON)

---

## 📊 RISULTATI TEST

### Test Database: ✅ / ❌
### Test UI Calendario: ✅ / ❌
### Test UI Prenotazioni: ✅ / ❌
### Test UI Clienti: ✅ / ❌
### Test Retrocompatibilità: ✅ / ❌
### Test Performance: ✅ / ❌

---

## 🔍 QUERY SQL DI SUPPORTO

### Verifica Stato Completo Database
```sql
-- Statistiche generali
SELECT 
  'Totale prenotazioni' AS metrica,
  COUNT(*)::TEXT AS valore
FROM bookings

UNION ALL

SELECT 
  'Prenotazioni con client_name',
  COUNT(*)::TEXT
FROM bookings WHERE client_name IS NOT NULL

UNION ALL

SELECT 
  'Prenotazioni con solo notes JSON',
  COUNT(*)::TEXT
FROM bookings 
WHERE notes IS NOT NULL 
AND notes ~ '^\s*\{'
AND client_name IS NULL

UNION ALL

SELECT 
  'Prenotazioni con colonne separate',
  COUNT(*)::TEXT
FROM bookings 
WHERE client_name IS NOT NULL 
OR client_email IS NOT NULL
OR service_type IS NOT NULL;
```

### Trova Inconsistenze
```sql
-- Prenotazioni con dati sia in colonne che in JSON (potenziale duplicazione)
SELECT 
  id,
  client_name,
  LEFT(notes, 100) as notes_json_preview
FROM bookings 
WHERE client_name IS NOT NULL 
AND notes IS NOT NULL 
AND notes ~ '^\s*\{'
AND notes::jsonb ? 'client_name';
```

---

**Buona fortuna con i test! 🚀**


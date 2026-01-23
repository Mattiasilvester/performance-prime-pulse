-- =============================================
-- VERIFICA PRENOTAZIONE DI TEST
-- =============================================
-- Esegui questo per verificare che la prenotazione sia corretta
-- =============================================

-- 1. Verifica prenotazione creata
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
  )) / 3600 as hours_until_booking,
  -- Calcola data/ora completa appuntamento
  (booking_date + booking_time::time)::timestamp as booking_datetime,
  NOW() as current_time
FROM bookings
WHERE client_name = 'Cliente Test'
  AND booking_date >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verifica impostazioni professionista
SELECT 
  p.id as professional_id,
  p.first_name || ' ' || p.last_name as professional_name,
  ps.notify_booking_reminder,
  ps.reminder_hours_before
FROM professionals p
LEFT JOIN professional_settings ps ON ps.professional_id = p.id
WHERE p.user_id = auth.uid();

-- 3. Verifica se promemoria già inviato
SELECT 
  br.*,
  b.booking_date,
  b.booking_time,
  b.client_name
FROM booking_reminders br
JOIN bookings b ON b.id = br.booking_id
WHERE b.client_name = 'Cliente Test'
ORDER BY br.sent_at DESC;

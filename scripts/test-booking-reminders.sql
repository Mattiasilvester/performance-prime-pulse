-- =============================================
-- SCRIPT DI TEST PROMEMORIA PRENOTAZIONI
-- =============================================
-- Esegui questo script per verificare lo stato
-- =============================================

-- 1. Verifica prenotazioni confermate future
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
WHERE status = 'confirmed'
  AND booking_date >= CURRENT_DATE
  AND (booking_date + booking_time::time)::timestamp > NOW()
ORDER BY booking_date, booking_time
LIMIT 10;

-- 2. Verifica impostazioni professionista
SELECT 
  p.id as professional_id,
  p.first_name || ' ' || p.last_name as professional_name,
  ps.notify_booking_reminder,
  ps.reminder_hours_before
FROM professionals p
LEFT JOIN professional_settings ps ON ps.professional_id = p.id
WHERE p.id IN (
  SELECT DISTINCT professional_id 
  FROM bookings 
  WHERE status = 'confirmed' 
    AND booking_date >= CURRENT_DATE
)
LIMIT 10;

-- 3. Verifica promemoria già inviati
SELECT 
  br.*,
  b.booking_date,
  b.booking_time,
  b.client_name,
  b.status as booking_status
FROM booking_reminders br
JOIN bookings b ON b.id = br.booking_id
ORDER BY br.sent_at DESC
LIMIT 10;

-- 4. Verifica notifiche promemoria create
SELECT 
  id,
  professional_id,
  title,
  message,
  created_at,
  data->>'booking_id' as booking_id,
  data->>'hours_before' as hours_before
FROM professional_notifications
WHERE type = 'booking_reminder'
ORDER BY created_at DESC
LIMIT 10;

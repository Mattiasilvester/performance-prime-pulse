-- =============================================
-- DIAGNOSTICA PROMEMORIA - Perché remindersCreated: 0?
-- =============================================

-- 1. Verifica prenotazioni processate (le 6 che ha trovato)
SELECT 
  b.id,
  b.professional_id,
  b.status,
  b.booking_date,
  b.booking_time,
  b.client_name,
  -- Calcola ore rimanenti
  ROUND(EXTRACT(EPOCH FROM (
    (b.booking_date + b.booking_time::time)::timestamp - NOW()
  )) / 3600, 2) as hours_until_booking,
  -- Data/ora completa appuntamento
  (b.booking_date + b.booking_time::time)::timestamp as booking_datetime,
  NOW() as current_time
FROM bookings b
WHERE b.status = 'confirmed'
  AND b.booking_date >= CURRENT_DATE
  AND (b.booking_date + b.booking_time::time)::timestamp > NOW()
ORDER BY b.booking_date, b.booking_time
LIMIT 10;

-- 2. Verifica impostazioni per ogni professionista
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

-- 3. Calcola se siamo nella finestra temporale
-- (per promemoria 2h: deve essere tra 1.5h e 2.5h prima)
SELECT 
  b.id,
  b.client_name,
  b.booking_date,
  b.booking_time,
  ROUND(EXTRACT(EPOCH FROM (
    (b.booking_date + b.booking_time::time)::timestamp - NOW()
  )) / 3600, 2) as hours_until,
  -- Per promemoria 2h prima
  ROUND(EXTRACT(EPOCH FROM (
    (b.booking_date + b.booking_time::time)::timestamp - NOW()
  )) / 3600, 2) - 2 as target_time_2h,
  -- Finestra: -0.5 a 0.5
  CASE 
    WHEN ROUND(EXTRACT(EPOCH FROM (
      (b.booking_date + b.booking_time::time)::timestamp - NOW()
    )) / 3600, 2) - 2 BETWEEN -0.5 AND 0.5 
    THEN '✅ NELLA FINESTRA'
    ELSE '❌ FUORI FINESTRA'
  END as in_window_2h
FROM bookings b
WHERE b.status = 'confirmed'
  AND b.booking_date >= CURRENT_DATE
  AND (b.booking_date + b.booking_time::time)::timestamp > NOW()
ORDER BY b.booking_date, b.booking_time
LIMIT 10;

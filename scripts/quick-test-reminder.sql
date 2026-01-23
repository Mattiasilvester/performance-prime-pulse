-- =============================================
-- TEST RAPIDO PROMEMORIA - VERIFICA E SETUP
-- =============================================

-- 1. VERIFICA PRENOTAZIONE CREATA
SELECT 
  id,
  professional_id,
  booking_date,
  booking_time,
  status,
  client_name,
  -- Calcola ore rimanenti
  ROUND(EXTRACT(EPOCH FROM (
    (booking_date + booking_time::time)::timestamp - NOW()
  )) / 3600, 2) as hours_until_booking
FROM bookings
WHERE client_name = 'Cliente Test'
  AND booking_date >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- 2. VERIFICA/IMPOSTA PREFERENZE PROMEMORIA
-- (Esegui solo se necessario)
UPDATE professional_settings
SET 
  notify_booking_reminder = true,
  reminder_hours_before = ARRAY[2]::INTEGER[]
WHERE professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
)
RETURNING professional_id, notify_booking_reminder, reminder_hours_before;

-- 3. VERIFICA STATO FINALE
SELECT 
  'Prenotazione' as tipo,
  b.id,
  b.status,
  b.client_name,
  b.booking_date,
  b.booking_time,
  ROUND(EXTRACT(EPOCH FROM (
    (b.booking_date + b.booking_time::time)::timestamp - NOW()
  )) / 3600, 2) as hours_until
FROM bookings b
WHERE b.client_name = 'Cliente Test'
  AND b.booking_date >= CURRENT_DATE
ORDER BY b.created_at DESC
LIMIT 1

UNION ALL

SELECT 
  'Impostazioni' as tipo,
  ps.professional_id::text as id,
  ps.notify_booking_reminder::text as status,
  '' as client_name,
  NULL::date as booking_date,
  NULL::time as booking_time,
  NULL::numeric as hours_until
FROM professional_settings ps
WHERE ps.professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
);

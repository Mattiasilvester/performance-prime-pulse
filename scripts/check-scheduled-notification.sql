-- =============================================
-- VERIFICA PROMEMORIA PROGRAMMATO
-- =============================================
-- Usa questo script per verificare se un promemoria
-- è pronto per essere inviato

-- 1. Verifica promemoria creato
SELECT 
  id,
  title,
  message,
  scheduled_for,
  status,
  NOW() as current_time,
  -- Calcola se è entro la finestra di tolleranza (±5 minuti)
  scheduled_for <= NOW() + INTERVAL '5 minutes' as within_upper_limit,
  scheduled_for >= NOW() - INTERVAL '5 minutes' as within_lower_limit,
  -- Verifica se dovrebbe essere inviato
  (scheduled_for <= NOW() + INTERVAL '5 minutes' 
   AND scheduled_for >= NOW() - INTERVAL '5 minutes'
   AND status = 'pending') as should_be_sent,
  created_at
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals 
  WHERE user_id = auth.uid()
)
ORDER BY scheduled_for DESC
LIMIT 1;

-- 2. Verifica tutte le notifiche pending
SELECT 
  id,
  title,
  scheduled_for,
  status,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (scheduled_for - NOW())) / 60 as minutes_until_scheduled
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals 
  WHERE user_id = auth.uid()
)
AND status = 'pending'
ORDER BY scheduled_for ASC;

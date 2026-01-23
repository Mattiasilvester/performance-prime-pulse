-- =============================================
-- DEBUG NOTIFICA PROGRAMMATA
-- =============================================
-- Usa questo script per diagnosticare perché la notifica non arriva

-- 1. Verifica promemoria più recente
SELECT 
  id,
  professional_id,
  title,
  message,
  scheduled_for,
  status,
  sent_at,
  error_message,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (scheduled_for - NOW())) / 60 as minutes_until_scheduled,
  -- Verifica se dovrebbe essere inviato
  (scheduled_for <= NOW() + INTERVAL '5 minutes' 
   AND scheduled_for >= NOW() - INTERVAL '5 minutes'
   AND status = 'pending') as should_be_sent
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals WHERE user_id = auth.uid()
)
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verifica se la notifica è stata creata in professional_notifications
SELECT 
  pn.id,
  pn.type,
  pn.title,
  pn.message,
  pn.is_read,
  pn.created_at
FROM professional_notifications pn
WHERE pn.professional_id = (
  SELECT id FROM professionals WHERE user_id = auth.uid()
)
AND pn.type = 'custom'
ORDER BY pn.created_at DESC
LIMIT 5;

-- 3. Verifica tutti i promemoria (anche quelli inviati)
SELECT 
  id,
  title,
  scheduled_for,
  status,
  sent_at,
  error_message,
  created_at
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals WHERE user_id = auth.uid()
)
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verifica il tuo professional_id
SELECT 
  p.id as professional_id,
  u.email,
  p.first_name,
  p.last_name
FROM professionals p
JOIN auth.users u ON u.id = p.user_id
WHERE u.id = auth.uid();

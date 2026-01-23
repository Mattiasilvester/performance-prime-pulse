-- =============================================
-- SCRIPT DI TEST NOTIFICHE PROGRAMMATE
-- =============================================
-- Usa questo script per verificare e testare le notifiche programmate

-- 1. VERIFICA TABELLA CREATA
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'scheduled_notifications'
ORDER BY ordinal_position;

-- 2. VERIFICA NOTIFICHE PROGRAMMATE ESISTENTI
SELECT 
  id,
  professional_id,
  type,
  title,
  message,
  scheduled_for,
  status,
  sent_at,
  created_at
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals 
  WHERE user_id = auth.uid()
)
ORDER BY scheduled_for ASC;

-- 3. VERIFICA NOTIFICHE DA INVIARE (pending e scadute)
SELECT 
  id,
  title,
  scheduled_for,
  NOW() as current_time,
  scheduled_for <= NOW() + INTERVAL '5 minutes' as should_send,
  status
FROM scheduled_notifications
WHERE status = 'pending'
  AND scheduled_for <= NOW() + INTERVAL '5 minutes'
ORDER BY scheduled_for ASC;

-- 4. VERIFICA NOTIFICHE INVIATE
SELECT 
  id,
  title,
  scheduled_for,
  sent_at,
  status,
  error_message
FROM scheduled_notifications
WHERE status = 'sent'
ORDER BY sent_at DESC
LIMIT 10;

-- 5. VERIFICA NOTIFICHE FALLITE
SELECT 
  id,
  title,
  scheduled_for,
  status,
  error_message
FROM scheduled_notifications
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 10;

-- 6. CONTA NOTIFICHE PER STATO
SELECT 
  status,
  COUNT(*) as count
FROM scheduled_notifications
WHERE professional_id = (
  SELECT id FROM professionals 
  WHERE user_id = auth.uid()
)
GROUP BY status;

-- =============================================
-- DIAGNOSTICA PROMEMORIA
-- =============================================
-- Usa questo script per diagnosticare problemi con i promemoria

-- 1. Verifica che la tabella esista e abbia dati
SELECT 
  COUNT(*) as total_scheduled_notifications,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count
FROM scheduled_notifications;

-- 2. Verifica tutti i promemoria (senza filtri)
SELECT 
  id,
  professional_id,
  title,
  scheduled_for,
  status,
  created_at
FROM scheduled_notifications
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verifica il tuo professional_id
SELECT 
  p.id as professional_id,
  p.user_id,
  u.email,
  p.first_name,
  p.last_name
FROM professionals p
JOIN auth.users u ON u.id = p.user_id
WHERE u.id = auth.uid();

-- 4. Verifica promemoria per il tuo professional_id (se lo conosci)
-- Sostituisci 'YOUR_PROFESSIONAL_ID' con l'ID reale dalla query sopra
/*
SELECT 
  id,
  title,
  scheduled_for,
  status,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (scheduled_for - NOW())) / 60 as minutes_until_scheduled
FROM scheduled_notifications
WHERE professional_id = 'YOUR_PROFESSIONAL_ID'
ORDER BY scheduled_for DESC;
*/

-- 5. Verifica se ci sono promemoria per qualsiasi professional_id
SELECT 
  sn.id,
  sn.professional_id,
  sn.title,
  sn.scheduled_for,
  sn.status,
  p.first_name || ' ' || p.last_name as professional_name
FROM scheduled_notifications sn
LEFT JOIN professionals p ON p.id = sn.professional_id
ORDER BY sn.created_at DESC
LIMIT 10;

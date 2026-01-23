-- =============================================
-- TROVA TUTTI I PROMEMORIA (SENZA FILTRI)
-- =============================================
-- Usa questo script per vedere TUTTI i promemoria nella tabella

-- 1. Conta tutti i promemoria (senza filtri)
SELECT 
  COUNT(*) as total_scheduled_notifications,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM scheduled_notifications;

-- 2. Mostra TUTTI i promemoria (ultimi 10)
SELECT 
  id,
  professional_id,
  title,
  scheduled_for,
  status,
  created_at
FROM scheduled_notifications
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verifica il tuo professional_id
SELECT 
  p.id as professional_id,
  u.email,
  p.first_name,
  p.last_name
FROM professionals p
JOIN auth.users u ON u.id = p.user_id
WHERE u.id = auth.uid();

-- 4. Verifica se ci sono promemoria per il tuo professional_id (usando l'ID dalla query sopra)
-- Sostituisci 'YOUR_PROFESSIONAL_ID' con l'ID reale dalla query 3
/*
SELECT 
  id,
  title,
  scheduled_for,
  status,
  created_at
FROM scheduled_notifications
WHERE professional_id = 'YOUR_PROFESSIONAL_ID'
ORDER BY created_at DESC;
*/

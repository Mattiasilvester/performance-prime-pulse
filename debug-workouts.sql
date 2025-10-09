-- =====================================================
-- DEBUG WORKOUTS - VERIFICA ALLENAMENTI NEL DATABASE
-- =====================================================
-- Script per verificare tutti gli allenamenti completati

-- 1. Conta tutti gli allenamenti completati per utente
SELECT 
    'TOTALE ALLENAMENTI COMPLETATI' as sezione,
    user_id,
    COUNT(*) as total_workouts,
    SUM(total_duration) as total_minutes,
    MIN(created_at) as primo_allenamento,
    MAX(created_at) as ultimo_allenamento
FROM custom_workouts 
WHERE completed = true
GROUP BY user_id
ORDER BY total_workouts DESC;

-- 2. Dettagli di tutti gli allenamenti completati
SELECT 
    'DETTAGLI ALLENAMENTI' as sezione,
    id,
    user_id,
    title,
    workout_type,
    scheduled_date,
    created_at,
    completed_at,
    total_duration,
    completed
FROM custom_workouts 
WHERE completed = true
ORDER BY created_at DESC;

-- 3. Allenamenti per data (ultimi 7 giorni)
SELECT 
    'ALLENAMENTI ULTIMI 7 GIORNI' as sezione,
    DATE(created_at) as data,
    COUNT(*) as allenamenti_giorno,
    STRING_AGG(title, ', ') as titoli
FROM custom_workouts 
WHERE completed = true 
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 4. Verifica user_workout_stats
SELECT 
    'STATISTICHE UTENTE' as sezione,
    user_id,
    total_workouts,
    total_hours,
    created_at,
    updated_at
FROM user_workout_stats
ORDER BY updated_at DESC;

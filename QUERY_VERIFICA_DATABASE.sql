-- ============================================
-- QUERY DI VERIFICA DATABASE - PERFORMANCE PRIME PULSE
-- Data: 23 Gennaio 2025
-- Scopo: Verificare stato database per pulizia e ordinamento
-- ============================================
-- 
-- ISTRUZIONI:
-- 1. Copia e incolla queste query in Supabase SQL Editor
-- 2. Esegui una query alla volta o tutte insieme
-- 3. Controlla i risultati e confronta con ANALISI_COMPLETA_DATABASE.md
-- ============================================

-- ============================================
-- VERIFICA 1: TABELLA users (LEGACY - DA RIMUOVERE)
-- ============================================
-- Se restituisce TRUE, la tabella esiste ancora e va rimossa
-- Se restituisce FALSE, la tabella è già stata rimossa ✅

SELECT 
    'VERIFICA 1: Tabella users' as verifica,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) AS users_table_exists,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN '⚠️ ESISTE - DA RIMUOVERE (eseguire 20250121_cleanup_fase1.sql)'
        ELSE '✅ RIMOSSA - OK'
    END as azione_richiesta;

-- ============================================
-- VERIFICA 2: CAMPI DEPRECATI IN professionals
-- ============================================
-- Se restituisce righe, i campi esistono ancora e vanno rimossi
-- Se restituisce 0 righe, i campi sono già stati rimossi ✅

SELECT 
    'VERIFICA 2: Campi deprecati professionals' as verifica,
    column_name,
    data_type,
    '⚠️ DA RIMUOVERE' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')
ORDER BY column_name;

-- Se la query sopra restituisce 0 righe:
SELECT 
    'VERIFICA 2: Campi deprecati professionals' as verifica,
    '✅ TUTTI I CAMPI DEPRECATI RIMOSSI' as status;

-- ============================================
-- VERIFICA 3: TABELLA profiles (DEVE ESISTERE)
-- ============================================
-- Se restituisce TRUE, la tabella esiste ✅
-- Se restituisce FALSE, c'è un problema ❌

SELECT 
    'VERIFICA 3: Tabella profiles' as verifica,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) AS profiles_table_exists,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '✅ ESISTE - OK'
        ELSE '❌ MANCANTE - PROBLEMA CRITICO'
    END as status;

-- ============================================
-- VERIFICA 4: COLONNE profiles (VERIFICA COMPLETA)
-- ============================================
-- Verifica tutte le colonne della tabella profiles

SELECT 
    'VERIFICA 4: Colonne profiles' as verifica,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- VERIFICA 5: TABELLE NON UTILIZZATE (DA VERIFICARE)
-- ============================================
-- Verifica se queste tabelle esistono (potrebbero essere legacy)

SELECT 
    'VERIFICA 5: Tabelle non utilizzate' as verifica,
    table_name,
    CASE 
        WHEN table_name = 'users' THEN '❌ LEGACY - DA RIMUOVERE'
        WHEN table_name = 'professional_applications' THEN '⚠️ NON USATA - DA VERIFICARE'
        WHEN table_name = 'reviews' THEN '⚠️ NON USATA - DECISIONE NECESSARIA (codice usa DEMO_REVIEWS)'
        WHEN table_name = 'waiting_list' THEN '⚠️ NON USATA - DA VERIFICARE'
        WHEN table_name = 'escalations' THEN '⚠️ NON USATA - DA VERIFICARE'
        WHEN table_name = 'custom_workouts' THEN '⚠️ NON USATA - DA VERIFICARE'
        ELSE '⚠️ DA VERIFICARE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN (
    'users',
    'professional_applications',
    'reviews',
    'waiting_list',
    'escalations',
    'custom_workouts'
)
ORDER BY table_name;

-- ============================================
-- VERIFICA 6: LISTA COMPLETA TUTTE LE TABELLE
-- ============================================
-- Mostra tutte le tabelle esistenti nel database

SELECT 
    'VERIFICA 6: Lista completa tabelle' as verifica,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- VERIFICA 7: TABELLE UTILIZZATE (VERIFICA ESISTENZA)
-- ============================================
-- Verifica che tutte le tabelle utilizzate nel codice esistano

SELECT 
    'VERIFICA 7: Tabelle utilizzate' as verifica,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) THEN '✅ ESISTE'
        ELSE '❌ MANCANTE'
    END as status
FROM (VALUES
    ('profiles'),
    ('professionals'),
    ('bookings'),
    ('professional_availability'),
    ('professional_blocked_periods'),
    ('professional_services'),
    ('professional_settings'),
    ('professional_languages'),
    ('subscription_invoices'),
    ('clients'),
    ('projects'),
    ('workout_diary'),
    ('workout_attachments'),
    ('user_objectives'),
    ('user_workout_stats'),
    ('monthly_workout_stats'),
    ('notes'),
    ('user_onboarding_responses'),
    ('health_disclaimer_acknowledgments'),
    ('primebot_interactions'),
    ('primebot_preferences'),
    ('admin_audit_logs'),
    ('admin_sessions'),
    ('admin_settings')
) AS t(table_name)
ORDER BY table_name;

-- ============================================
-- VERIFICA 8: REPORT COMPLETO STATO DATABASE
-- ============================================
-- Report completo con tutte le informazioni

SELECT 
    'REPORT COMPLETO' as sezione,
    'TABELLE TOTALI' as metrica,
    COUNT(*)::text as valore
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'REPORT COMPLETO' as sezione,
    'TABELLA users ESISTE' as metrica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN 'SÌ ⚠️'
        ELSE 'NO ✅'
    END as valore

UNION ALL

SELECT 
    'REPORT COMPLETO' as sezione,
    'CAMPI DEPRECATI professionals' as metrica,
    COUNT(*)::text || ' campi da rimuovere' as valore
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')

UNION ALL

SELECT 
    'REPORT COMPLETO' as sezione,
    'TABELLA profiles ESISTE' as metrica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN 'SÌ ✅'
        ELSE 'NO ❌'
    END as valore;

-- ============================================
-- VERIFICA 9: TABELLA reviews (DECISIONE NECESSARIA)
-- ============================================
-- Verifica se la tabella reviews esiste e conta i record

SELECT 
    'VERIFICA 9: Tabella reviews' as verifica,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews'
    ) AS reviews_table_exists,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
        ) THEN (
            SELECT COUNT(*)::text || ' recensioni nel database'
            FROM reviews
        )
        ELSE 'Tabella non esiste'
    END as record_count,
    '⚠️ DECISIONE NECESSARIA: Codice usa DEMO_REVIEWS, tabella esiste ma non usata' as nota;

-- ============================================
-- VERIFICA 10: PROFESSIONAL_CLIENTS vs CLIENTS
-- ============================================
-- Verifica se entrambe le tabelle esistono (potrebbero essere duplicate)

SELECT 
    'VERIFICA 10: Tabelle clienti' as verifica,
    table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
    ) AS esiste,
    CASE 
        WHEN table_name = 'clients' THEN '✅ USATA nel codice'
        WHEN table_name = 'professional_clients' THEN '⚠️ NON TROVATA nel codice - Potrebbe essere legacy'
        ELSE '⚠️ DA VERIFICARE'
    END as status
FROM (VALUES ('clients'), ('professional_clients')) AS t(table_name);

-- ============================================
-- FINE QUERY DI VERIFICA
-- ============================================
-- 
-- DOPO AVER ESEGUITO LE QUERY:
-- 1. Controlla i risultati
-- 2. Confronta con ANALISI_COMPLETA_DATABASE.md
-- 3. Se necessario, esegui migrazione cleanup:
--    - File: supabase/migrations/20250121_cleanup_fase1.sql
-- 4. Aggiorna DATABASE_SCHEMA.md con risultati
-- ============================================

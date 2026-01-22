-- ============================================
-- QUERY DI VERIFICA RAPIDA - PERFORMANCE PRIME PULSE
-- Data: 23 Gennaio 2025
-- Scopo: Verifica rapida delle criticità principali
-- ============================================
-- 
-- ISTRUZIONI:
-- 1. Copia e incolla in Supabase SQL Editor
-- 2. Esegui tutte le query insieme
-- 3. Controlla i risultati
-- ============================================

-- ============================================
-- VERIFICA RAPIDA 1: TABELLA users (LEGACY)
-- ============================================
SELECT 
    '1. Tabella users (LEGACY)' as verifica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN '⚠️ ESISTE - DA RIMUOVERE'
        ELSE '✅ RIMOSSA - OK'
    END as risultato;

-- ============================================
-- VERIFICA RAPIDA 2: CAMPI DEPRECATI professionals
-- ============================================
SELECT 
    '2. Campi deprecati professionals' as verifica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')
        ) THEN '⚠️ ESISTONO - DA RIMUOVERE'
        ELSE '✅ RIMOSSI - OK'
    END as risultato,
    (
        SELECT COUNT(*)::text || ' campi da rimuovere'
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals'
        AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')
    ) as dettaglio;

-- ============================================
-- VERIFICA RAPIDA 3: TABELLA profiles
-- ============================================
SELECT 
    '3. Tabella profiles' as verifica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '✅ ESISTE - OK'
        ELSE '❌ MANCANTE - PROBLEMA CRITICO'
    END as risultato;

-- ============================================
-- VERIFICA RAPIDA 4: TABELLA reviews
-- ============================================
SELECT 
    '4. Tabella reviews' as verifica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
        ) THEN '⚠️ ESISTE - MA NON USATA (codice usa DEMO_REVIEWS)'
        ELSE '✅ NON ESISTE - OK'
    END as risultato;

-- ============================================
-- VERIFICA RAPIDA 5: TABELLE NON UTILIZZATE
-- ============================================
SELECT 
    '5. Tabelle non utilizzate' as verifica,
    string_agg(table_name, ', ') as tabelle_trovate,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*)::text || ' tabelle da verificare'
        ELSE '✅ Nessuna tabella non utilizzata trovata'
    END as risultato
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN (
    'professional_applications',
    'waiting_list',
    'escalations',
    'custom_workouts'
);

-- ============================================
-- REPORT FINALE RAPIDO
-- ============================================
SELECT 
    'REPORT FINALE' as sezione,
    'Stato Database' as metrica,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN '⚠️ RICHIEDE CLEANUP (tabella users esiste)'
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')
        ) THEN '⚠️ RICHIEDE CLEANUP (campi deprecati esistono)'
        WHEN NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '❌ PROBLEMA CRITICO (tabella profiles mancante)'
        ELSE '✅ DATABASE PULITO'
    END as stato;

-- ============================================
-- FINE VERIFICA RAPIDA
-- ============================================
-- 
-- Se il report finale mostra "⚠️ RICHIEDE CLEANUP":
-- 1. Esegui migrazione: supabase/migrations/20250121_cleanup_fase1.sql
-- 2. Riesegui queste query per verificare
-- 
-- Se il report finale mostra "✅ DATABASE PULITO":
-- 1. Procedi con aggiornamento DATABASE_SCHEMA.md
-- 2. Verifica tabelle non utilizzate manualmente
-- ============================================

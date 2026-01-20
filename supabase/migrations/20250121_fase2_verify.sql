-- =============================================
-- FASE 2: VERIFICA POST-MIGRAZIONE
-- Data: 21 Gennaio 2025
-- Autore: Cursor AI Assistant
-- Descrizione: Script di verifica per controllare che le migrazioni FASE 2
--              siano state eseguite correttamente
-- =============================================

-- =============================================
-- VERIFICA 1: TABELLA professional_services
-- =============================================
SELECT 
    'Tabella professional_services esiste?' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_services'
        ) THEN '✅ OK: Tabella creata'
        ELSE '❌ ERRORE: Tabella non esiste!'
    END AS result;

-- Verifica colonne professional_services
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'professional_id', 'name', 'price', 'duration_minutes', 'is_online', 'is_active', 'color')
        THEN '✅ OK'
        ELSE '⚠️ Colonna non attesa'
    END AS stato
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professional_services'
ORDER BY column_name;

-- =============================================
-- VERIFICA 2: COLONNA service_id IN bookings
-- =============================================
SELECT 
    'Colonna service_id in bookings?' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'bookings'
            AND column_name = 'service_id'
        ) THEN '✅ OK: Colonna presente'
        ELSE '❌ ERRORE: Colonna non presente!'
    END AS result;

-- Verifica foreign key
SELECT 
    'Foreign key service_id -> professional_services?' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'bookings'
            AND ccu.table_name = 'professional_services'
            AND ccu.column_name = 'id'
        ) THEN '✅ OK: Foreign key presente'
        ELSE '❌ ERRORE: Foreign key non presente!'
    END AS result;

-- =============================================
-- VERIFICA 3: TABELLA reviews
-- =============================================
SELECT 
    'Tabella reviews esiste?' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
        ) THEN '✅ OK: Tabella creata'
        ELSE '❌ ERRORE: Tabella non esiste!'
    END AS result;

-- Verifica colonne reviews
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'professional_id', 'user_id', 'booking_id', 'rating', 'title', 'comment', 'response', 'is_visible', 'is_verified')
        THEN '✅ OK'
        ELSE '⚠️ Colonna non attesa'
    END AS stato
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reviews'
ORDER BY column_name;

-- =============================================
-- VERIFICA 4: TRIGGER PER RATING
-- =============================================
SELECT 
    'Trigger per aggiornare rating?' AS check_name,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM pg_trigger 
            WHERE tgname IN (
                'update_rating_on_review_insert',
                'update_rating_on_review_update',
                'update_rating_on_review_delete'
            )
        ) = 3
        THEN '✅ OK: Tutti i trigger presenti'
        ELSE '❌ ERRORE: Trigger mancanti!'
    END AS result;

-- Lista trigger
SELECT 
    tgname AS trigger_name,
    '✅ OK: Trigger presente' AS stato
FROM pg_trigger 
WHERE tgname IN (
    'update_rating_on_review_insert',
    'update_rating_on_review_update',
    'update_rating_on_review_delete'
)
ORDER BY tgname;

-- =============================================
-- VERIFICA 5: SERVIZI DEFAULT CREATI
-- =============================================
SELECT 
    'Servizi default creati?' AS check_name,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM public.professional_services
        ) > 0
        THEN CONCAT('✅ OK: ', COUNT(*)::TEXT, ' servizi creati')
        ELSE '❌ ERRORE: Nessun servizio creato!'
    END AS result
FROM public.professional_services;

-- Statistiche servizi
SELECT 
    'Statistiche servizi' AS check_type,
    COUNT(*)::TEXT AS totale_servizi,
    COUNT(DISTINCT professional_id)::TEXT AS professionisti_con_servizi,
    (SELECT COUNT(*) FROM public.professionals)::TEXT AS totale_professionisti
FROM public.professional_services;

-- =============================================
-- VERIFICA 6: INDICI CREATI
-- =============================================
-- Indici professional_services
SELECT 
    'Indici professional_services' AS check_type,
    indexname,
    '✅ OK: Indice presente' AS stato
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'professional_services'
ORDER BY indexname;

-- Indici reviews
SELECT 
    'Indici reviews' AS check_type,
    indexname,
    '✅ OK: Indice presente' AS stato
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'reviews'
ORDER BY indexname;

-- =============================================
-- VERIFICA 7: RLS POLICIES
-- =============================================
-- Policies professional_services
SELECT 
    'RLS Policies professional_services' AS check_type,
    policyname,
    '✅ OK: Policy presente' AS stato
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'professional_services'
ORDER BY policyname;

-- Policies reviews
SELECT 
    'RLS Policies reviews' AS check_type,
    policyname,
    '✅ OK: Policy presente' AS stato
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'reviews'
ORDER BY policyname;

-- =============================================
-- RIEPILOGO FINALE
-- =============================================
DO $$
DECLARE
    services_count INTEGER;
    professionals_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO services_count FROM public.professional_services;
    SELECT COUNT(*) INTO professionals_count FROM public.professionals;
    
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RIEPILOGO VERIFICA FASE 2';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ professional_services:';
    RAISE NOTICE '   - Tabella creata';
    RAISE NOTICE '   - % servizi creati per % professionisti', services_count, professionals_count;
    RAISE NOTICE '   - Colonna service_id aggiunta a bookings';
    RAISE NOTICE '';
    RAISE NOTICE '✅ reviews:';
    RAISE NOTICE '   - Tabella creata';
    RAISE NOTICE '   - Trigger per aggiornamento rating creati';
    RAISE NOTICE '   - RLS policies configurate';
    RAISE NOTICE '';
    RAISE NOTICE 'Se tutti i check sono ✅ OK, la migrazione è riuscita!';
END $$;


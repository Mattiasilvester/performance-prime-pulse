-- =============================================
-- VERIFICA COMPLETA POST-MIGRAZIONI
-- Data: 21 Gennaio 2025
-- Descrizione: Test completo di tutte le migrazioni effettuate
-- =============================================

-- =============================================
-- 1. VERIFICA FASE 1: CLEANUP DATABASE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE '1. VERIFICA FASE 1: CLEANUP';
    RAISE NOTICE '=========================================';
END $$;

-- Verifica 1.1: Tabella users rimossa
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        RAISE NOTICE '✅ Tabella users rimossa correttamente';
    ELSE
        RAISE WARNING '⚠️ Tabella users ESISTE ANCORA (dovrebbe essere rimossa)';
    END IF;
END $$;

-- Verifica 1.2: Colonne deprecate rimosse da professionals
SELECT 
    'Colonne deprecate in professionals' AS check_name,
    CASE 
        WHEN NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name = 'password_hash'
        ) THEN '✅ password_hash rimossa'
        ELSE '❌ password_hash ESISTE ANCORA'
    END AS password_hash,
    CASE 
        WHEN NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name = 'password_salt'
        ) THEN '✅ password_salt rimossa'
        ELSE '❌ password_salt ESISTE ANCORA'
    END AS password_salt;

-- Verifica 1.3: Nuove colonne in bookings
SELECT 
    'Nuove colonne in bookings' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'bookings'
            AND column_name = 'client_name'
        ) THEN '✅ client_name presente'
        ELSE '❌ client_name MANCANTE'
    END AS client_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'bookings'
            AND column_name = 'service_type'
        ) THEN '✅ service_type presente'
        ELSE '❌ service_type MANCANTE'
    END AS service_type;

-- =============================================
-- 2. VERIFICA FASE 2.1: PROFESSIONAL_SERVICES
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '2. VERIFICA FASE 2.1: PROFESSIONAL_SERVICES';
    RAISE NOTICE '=========================================';
END $$;

-- Verifica 2.1: Tabella professional_services esiste
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'professional_services'
    ) THEN
        RAISE NOTICE '✅ Tabella professional_services creata';
    ELSE
        RAISE WARNING '❌ Tabella professional_services MANCANTE';
    END IF;
END $$;

-- Verifica 2.2: Colonna service_id in bookings
SELECT 
    'Colonna service_id in bookings' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'bookings'
            AND column_name = 'service_id'
        ) THEN '✅ service_id presente'
        ELSE '❌ service_id MANCANTE'
    END AS result;

-- Verifica 2.3: Statistiche servizi creati
SELECT 
    'Statistiche professional_services' AS check_name,
    COUNT(*) AS totale_servizi,
    COUNT(DISTINCT professional_id) AS professionisti_con_servizi
FROM public.professional_services;

-- =============================================
-- 3. VERIFICA FASE 2.2: REVIEWS
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '3. VERIFICA FASE 2.2: REVIEWS';
    RAISE NOTICE '=========================================';
END $$;

-- Verifica 3.1: Tabella reviews esiste
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews'
    ) THEN
        RAISE NOTICE '✅ Tabella reviews creata';
    ELSE
        RAISE WARNING '❌ Tabella reviews MANCANTE';
    END IF;
END $$;

-- Verifica 3.2: Trigger per aggiornamento rating
SELECT 
    'Trigger update_professional_rating' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_trigger 
            WHERE tgname = 'update_rating_on_review'
        ) THEN '✅ Trigger presente'
        ELSE '❌ Trigger MANCANTE'
    END AS result;

-- =============================================
-- 4. VERIFICA PREZZO_SEDUTA
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '4. VERIFICA PREZZO_SEDUTA';
    RAISE NOTICE '=========================================';
END $$;

-- Verifica 4.1: Colonna prezzo_seduta esiste
SELECT 
    'Colonna prezzo_seduta' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name = 'prezzo_seduta'
        ) THEN '✅ prezzo_seduta presente'
        ELSE '❌ prezzo_seduta MANCANTE'
    END AS result;

-- Verifica 4.2: Statistiche prezzo_seduta
SELECT 
    'Statistiche prezzo_seduta' AS check_name,
    COUNT(*) AS totale_professionisti,
    COUNT(prezzo_seduta) AS con_prezzo,
    COUNT(*) FILTER (WHERE prezzo_seduta IS NULL) AS senza_prezzo,
    ROUND(AVG(prezzo_seduta) FILTER (WHERE prezzo_seduta IS NOT NULL), 2) AS prezzo_medio,
    MIN(prezzo_seduta) FILTER (WHERE prezzo_seduta IS NOT NULL) AS prezzo_min,
    MAX(prezzo_seduta) FILTER (WHERE prezzo_seduta IS NOT NULL) AS prezzo_max
FROM public.professionals;

-- =============================================
-- 5. VERIFICA TABELLE SETTINGS
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '5. VERIFICA TABELLE SETTINGS';
    RAISE NOTICE '=========================================';
END $$;

-- Verifica 5.1: Tabella professional_settings
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'professional_settings'
    ) THEN
        RAISE NOTICE '✅ Tabella professional_settings creata';
    ELSE
        RAISE WARNING '❌ Tabella professional_settings MANCANTE';
    END IF;
END $$;

-- Verifica 5.2: Colonne social links
SELECT 
    'Colonne social links' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings'
            AND column_name = 'instagram_url'
        ) THEN '✅ instagram_url presente'
        ELSE '❌ instagram_url MANCANTE'
    END AS instagram,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings'
            AND column_name = 'tiktok_url'
        ) THEN '✅ tiktok_url presente'
        ELSE '❌ tiktok_url MANCANTE'
    END AS tiktok,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings'
            AND column_name = 'facebook_url'
        ) THEN '✅ facebook_url presente'
        ELSE '❌ facebook_url MANCANTE'
    END AS facebook;

-- Verifica 5.3: Tabella professional_languages
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'professional_languages'
    ) THEN
        RAISE NOTICE '✅ Tabella professional_languages creata';
    ELSE
        RAISE WARNING '❌ Tabella professional_languages MANCANTE';
    END IF;
END $$;

-- =============================================
-- 6. RIEPILOGO FINALE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RIEPILOGO FINALE';
    RAISE NOTICE '=========================================';
END $$;

SELECT 
    'Tabelle totali' AS metrica,
    COUNT(*) AS valore
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Mostra tutte le tabelle principali
SELECT 
    table_name AS tabella,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) AS colonne
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN (
    'professionals', 'bookings', 'clients', 'projects',
    'professional_services', 'reviews', 'professional_settings',
    'professional_languages', 'professional_availability'
)
ORDER BY table_name;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verifica completata!';
    RAISE NOTICE '';
    RAISE NOTICE 'Se tutti i check sono ✅, il database è pronto.';
    RAISE NOTICE 'Se vedi ⚠️ o ❌, controlla le migrazioni corrispondenti.';
END $$;


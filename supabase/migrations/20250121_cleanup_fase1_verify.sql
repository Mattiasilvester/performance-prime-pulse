-- =============================================
-- FASE 1: VERIFICA POST-MIGRAZIONE
-- Data: 21 Gennaio 2025
-- Autore: Cursor AI Assistant
-- Descrizione: Script di verifica per controllare che la migrazione cleanup_fase1.sql
--              sia stata eseguita correttamente
-- =============================================

-- =============================================
-- VERIFICA 1: TABELLA `users` NON ESISTE PIÙ
-- =============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN '❌ ERRORE: Tabella users esiste ancora!'
        ELSE '✅ OK: Tabella users rimossa correttamente'
    END AS verifica_users;

-- =============================================
-- VERIFICA 2: CAMPI DEPRECATI RIMOSSI DA `professionals`
-- =============================================
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at') 
        THEN '❌ ERRORE: Campo deprecato ancora presente!'
        ELSE '✅ OK'
    END AS stato
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at');

-- Se non ci sono risultati, significa che i campi sono stati rimossi correttamente
DO $$
DECLARE
    deprecated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO deprecated_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals'
    AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at');
    
    IF deprecated_count = 0 THEN
        RAISE NOTICE '✅ OK: Tutti i campi deprecati rimossi da professionals';
    ELSE
        RAISE WARNING '❌ ERRORE: Trovati % campi deprecati ancora presenti in professionals', deprecated_count;
    END IF;
END $$;

-- =============================================
-- VERIFICA 3: NUOVE COLONNE ESISTONO IN `bookings`
-- =============================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    CASE 
        WHEN column_name IN ('client_name', 'client_email', 'client_phone', 'service_type', 'color') 
        THEN '✅ OK: Colonna presente'
        ELSE '⚠️ Colonna non attesa'
    END AS stato
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bookings'
AND column_name IN ('client_name', 'client_email', 'client_phone', 'service_type', 'color')
ORDER BY column_name;

-- Verifica che tutte le 5 colonne siano presenti
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY['client_name', 'client_email', 'client_phone', 'service_type', 'color'];
    found_columns TEXT[];
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name ORDER BY column_name) INTO found_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings'
    AND column_name = ANY(expected_columns);
    
    SELECT ARRAY_AGG(col) INTO missing_columns
    FROM unnest(expected_columns) AS col
    WHERE col <> ALL(COALESCE(found_columns, ARRAY[]::TEXT[]));
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ OK: Tutte le 5 colonne sono presenti in bookings';
    ELSE
        RAISE WARNING '❌ ERRORE: Colonne mancanti: %', array_to_string(missing_columns, ', ');
    END IF;
END $$;

-- =============================================
-- VERIFICA 4: INDICI CREATI CORRETTAMENTE
-- =============================================
SELECT 
    indexname,
    CASE 
        WHEN indexname IN ('idx_bookings_client_name', 'idx_bookings_client_email', 'idx_bookings_service_type')
        THEN '✅ OK: Indice presente'
        ELSE '⚠️ Indice non atteso'
    END AS stato
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
AND indexname IN ('idx_bookings_client_name', 'idx_bookings_client_email', 'idx_bookings_service_type')
ORDER BY indexname;

-- =============================================
-- VERIFICA 5: DATI MIGRATI CORRETTAMENTE
-- =============================================
-- Statistiche sulla migrazione
SELECT 
    'Totale prenotazioni' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings

UNION ALL

SELECT 
    'Prenotazioni con notes JSON' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings 
WHERE notes IS NOT NULL 
AND notes ~ '^\s*\{'

UNION ALL

SELECT 
    'Prenotazioni con client_name' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings 
WHERE client_name IS NOT NULL

UNION ALL

SELECT 
    'Prenotazioni con client_email' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings 
WHERE client_email IS NOT NULL

UNION ALL

SELECT 
    'Prenotazioni con client_phone' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings 
WHERE client_phone IS NOT NULL

UNION ALL

SELECT 
    'Prenotazioni con service_type' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings 
WHERE service_type IS NOT NULL

UNION ALL

SELECT 
    'Prenotazioni con color personalizzato' AS metrica,
    COUNT(*)::TEXT AS valore
FROM public.bookings 
WHERE color IS NOT NULL 
AND color != '#EEBA2B'

ORDER BY metrica;

-- =============================================
-- VERIFICA 6: ESEMPIO DATI MIGRATI
-- =============================================
-- Mostra alcuni esempi di record migrati per verifica manuale
SELECT 
    id,
    booking_date,
    booking_time,
    client_name,
    client_email,
    service_type,
    color,
    -- Mostra anche le notes originali per confronto
    LEFT(notes, 100) AS notes_preview
FROM public.bookings 
WHERE client_name IS NOT NULL 
OR service_type IS NOT NULL
ORDER BY booking_date DESC, booking_time DESC
LIMIT 10;

-- =============================================
-- VERIFICA 7: CONTROLLO COERENZA DATI
-- =============================================
-- Verifica che non ci siano inconsistenze (es: client_name presente ma notes JSON mancante)
SELECT 
    'Prenotazioni con client_name ma notes non-JSON' AS verifica,
    COUNT(*)::TEXT AS conteggio
FROM public.bookings 
WHERE client_name IS NOT NULL 
AND (notes IS NULL OR notes !~ '^\s*\{');

-- =============================================
-- RIEPILOGO FINALE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RIEPILOGO VERIFICA MIGRAZIONE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Controlla i risultati sopra per verificare che:';
    RAISE NOTICE '1. ✅ Tabella users non esiste più';
    RAISE NOTICE '2. ✅ Campi deprecati rimossi da professionals';
    RAISE NOTICE '3. ✅ Nuove colonne presenti in bookings';
    RAISE NOTICE '4. ✅ Indici creati correttamente';
    RAISE NOTICE '5. ✅ Dati migrati correttamente';
    RAISE NOTICE '';
    RAISE NOTICE 'Se tutti i controlli sono ✅ OK, la migrazione è riuscita!';
END $$;


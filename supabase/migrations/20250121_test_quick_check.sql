-- =============================================
-- QUICK CHECK - STATO DATABASE POST-MIGRAZIONE
-- Esegui questo script per verificare rapidamente lo stato
-- =============================================

-- 1. VERIFICA STRUTTURA DATABASE
SELECT '=== VERIFICA STRUTTURA ===' AS check_type;

-- Tabella users esiste ancora?
SELECT 
  'Tabella users esiste?' AS check_name,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN '❌ ERRORE: Tabella users esiste ancora!'
    ELSE '✅ OK: Tabella users rimossa'
  END AS result;

-- Campi deprecati in professionals?
SELECT 
  'Campi deprecati in professionals?' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'professionals'
      AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')
    )
    THEN '❌ ERRORE: Campi deprecati ancora presenti!'
    ELSE '✅ OK: Campi deprecati rimossi'
  END AS result;

-- Colonne nuove in bookings?
SELECT 
  'Colonne nuove in bookings?' AS check_name,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bookings'
      AND column_name IN ('client_name', 'client_email', 'client_phone', 'service_type', 'color')
    ) = 5
    THEN '✅ OK: Tutte le 5 colonne presenti'
    ELSE '❌ ERRORE: Colonne mancanti!'
  END AS result;

-- Indici creati?
SELECT 
  'Indici creati?' AS check_name,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'bookings'
      AND indexname IN ('idx_bookings_client_name', 'idx_bookings_client_email', 'idx_bookings_service_type')
    ) = 3
    THEN '✅ OK: Tutti gli indici presenti'
    ELSE '❌ ERRORE: Indici mancanti!'
  END AS result;

-- 2. VERIFICA DATI
SELECT '' AS separator;
SELECT '=== VERIFICA DATI ===' AS check_type;

-- Statistiche prenotazioni
SELECT 
  'Totale prenotazioni' AS metrica,
  COUNT(*)::TEXT AS valore
FROM bookings

UNION ALL

SELECT 
  'Prenotazioni con client_name',
  COUNT(*)::TEXT
FROM bookings WHERE client_name IS NOT NULL

UNION ALL

SELECT 
  'Prenotazioni con client_email',
  COUNT(*)::TEXT
FROM bookings WHERE client_email IS NOT NULL

UNION ALL

SELECT 
  'Prenotazioni con service_type',
  COUNT(*)::TEXT
FROM bookings WHERE service_type IS NOT NULL

UNION ALL

SELECT 
  'Prenotazioni con color personalizzato',
  COUNT(*)::TEXT
FROM bookings WHERE color IS NOT NULL AND color != '#EEBA2B'

UNION ALL

SELECT 
  'Prenotazioni con notes JSON',
  COUNT(*)::TEXT
FROM bookings 
WHERE notes IS NOT NULL AND notes ~ '^\s*\{'

ORDER BY metrica;

-- 3. VERIFICA COERENZA
SELECT '' AS separator;
SELECT '=== VERIFICA COERENZA ===' AS check_type;

-- Inconsistenze (client_name presente ma notes non-JSON)
SELECT 
  'Inconsistenze trovate' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM bookings 
      WHERE client_name IS NOT NULL 
      AND (notes IS NULL OR notes !~ '^\s*\{')
    )
    THEN '⚠️ ATTENZIONE: Trovate inconsistenze (client_name senza notes JSON)'
    ELSE '✅ OK: Nessuna inconsistenza'
  END AS result;

-- Esempi record migrati
SELECT '' AS separator;
SELECT '=== ESEMPI RECORD MIGRATI (ultimi 3) ===' AS check_type;

SELECT 
  id,
  booking_date,
  booking_time,
  client_name,
  client_email,
  service_type,
  color,
  LEFT(notes, 50) AS notes_preview
FROM bookings 
WHERE client_name IS NOT NULL 
OR service_type IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 4. RIEPILOGO FINALE
SELECT '' AS separator;
SELECT '=== RIEPILOGO ===' AS check_type;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'QUICK CHECK COMPLETATO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Controlla i risultati sopra.';
  RAISE NOTICE 'Tutti i check devono mostrare ✅ OK';
  RAISE NOTICE '';
  RAISE NOTICE 'Se ci sono ❌ ERRORE, consulta TEST_POST_MIGRAZIONE.md';
  RAISE NOTICE 'per i dettagli dei test completi.';
END $$;


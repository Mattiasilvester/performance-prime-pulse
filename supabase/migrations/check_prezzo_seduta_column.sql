-- =============================================
-- VERIFICA COLONNA prezzo_seduta
-- Data: 21 Gennaio 2025
-- Descrizione: Verifica se la colonna prezzo_seduta esiste in professionals
-- =============================================

-- Verifica 1: La colonna esiste?
SELECT 
    'Colonna prezzo_seduta esiste?' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name = 'prezzo_seduta'
        ) THEN '✅ SI: La colonna esiste'
        ELSE '❌ NO: La colonna NON esiste'
    END AS result;

-- Verifica 2: Dettagli colonna (se esiste)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name = 'prezzo_seduta';

-- Verifica 3: Esistono altri campi prezzo?
SELECT 
    'Altre colonne prezzo trovate' AS check_name,
    STRING_AGG(column_name, ', ') AS colonne_prezzo
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
AND column_name LIKE '%prezzo%'
AND column_name != 'prezzo_seduta';

-- Verifica 4: Valori attuali (se la colonna esiste)
DO $$
DECLARE
    total_count INTEGER;
    with_price_count INTEGER;
    without_price_count INTEGER;
    avg_price DECIMAL;
    min_price INTEGER;
    max_price INTEGER;
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals'
        AND column_name = 'prezzo_seduta'
    ) THEN
        -- Usa EXECUTE per query dinamica (evita errori di compilazione)
        EXECUTE 'SELECT COUNT(*) FROM public.professionals' INTO total_count;
        EXECUTE 'SELECT COUNT(*) FROM public.professionals WHERE prezzo_seduta IS NOT NULL' INTO with_price_count;
        EXECUTE 'SELECT COUNT(*) FROM public.professionals WHERE prezzo_seduta IS NULL' INTO without_price_count;
        EXECUTE 'SELECT ROUND(AVG(prezzo_seduta), 2) FROM public.professionals WHERE prezzo_seduta IS NOT NULL' INTO avg_price;
        EXECUTE 'SELECT MIN(prezzo_seduta) FROM public.professionals WHERE prezzo_seduta IS NOT NULL' INTO min_price;
        EXECUTE 'SELECT MAX(prezzo_seduta) FROM public.professionals WHERE prezzo_seduta IS NOT NULL' INTO max_price;
        
        RAISE NOTICE '=========================================';
        RAISE NOTICE 'STATISTICHE COLONNA prezzo_seduta';
        RAISE NOTICE '=========================================';
        RAISE NOTICE 'Totale professionisti: %', total_count;
        RAISE NOTICE 'Professionisti con prezzo_seduta: %', with_price_count;
        RAISE NOTICE 'Professionisti senza prezzo_seduta: %', without_price_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Prezzo medio: € %', avg_price;
        RAISE NOTICE 'Prezzo minimo: € %', min_price;
        RAISE NOTICE 'Prezzo massimo: € %', max_price;
    ELSE
        RAISE NOTICE '⚠️ La colonna prezzo_seduta NON esiste nella tabella professionals.';
        RAISE NOTICE '';
        RAISE NOTICE 'POSSIBILI SOLUZIONI:';
        RAISE NOTICE '1. La colonna non è mai stata creata';
        RAISE NOTICE '2. È stata rimossa in una migrazione precedente';
        RAISE NOTICE '3. Verifica se esiste "prezzo_fascia" invece';
    END IF;
END $$;

-- Mostra esempio professionisti con prezzo (se colonna esiste)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals'
        AND column_name = 'prezzo_seduta'
    ) THEN
        -- Se la colonna esiste, mostra esempi
        RAISE NOTICE '';
        RAISE NOTICE '=========================================';
        RAISE NOTICE 'ESEMPI PROFESSIONISTI CON PREZZO';
        RAISE NOTICE '=========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'La colonna prezzo_seduta non esiste, non posso mostrare esempi.';
    END IF;
END $$;


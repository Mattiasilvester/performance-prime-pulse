-- =============================================
-- AGGIUNTA COLONNA prezzo_seduta
-- Data: 21 Gennaio 2025
-- Descrizione: Aggiunge colonna prezzo_seduta (INTEGER) alla tabella professionals
-- =============================================

-- Verifica se la colonna esiste già
DO $$
BEGIN
    -- Aggiungi colonna prezzo_seduta se non esiste
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals'
        AND column_name = 'prezzo_seduta'
    ) THEN
        ALTER TABLE public.professionals 
        ADD COLUMN prezzo_seduta INTEGER;
        
        RAISE NOTICE '✅ Colonna prezzo_seduta creata con successo';
    ELSE
        RAISE NOTICE 'ℹ️ La colonna prezzo_seduta esiste già';
    END IF;
END $$;

-- Migrazione opzionale: Converti prezzo_fascia in prezzo_seduta (solo per riferimento)
-- NOTA: Questa è una conversione approssimativa. 
-- I valori di default sono solo per esempio e dovrebbero essere configurati manualmente.
DO $$
BEGIN
    -- Solo se prezzo_seduta è NULL e prezzo_fascia ha un valore
    -- Converti le fasce in valori numerici approssimativi
    UPDATE public.professionals
    SET prezzo_seduta = CASE 
        WHEN prezzo_fascia = '€' THEN 30  -- Economico
        WHEN prezzo_fascia = '€€' THEN 50  -- Medio
        WHEN prezzo_fascia = '€€€' THEN 80  -- Premium
        ELSE NULL
    END
    WHERE prezzo_seduta IS NULL 
    AND prezzo_fascia IS NOT NULL;
    
    RAISE NOTICE '✅ Migrazione valori da prezzo_fascia a prezzo_seduta completata (solo riferimento)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANTE: I valori migrati sono solo approssimativi.';
    RAISE NOTICE '   Verifica e aggiorna manualmente i prezzi se necessario.';
END $$;

-- Verifica finale
SELECT 
    'Verifica colonna prezzo_seduta' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professionals'
            AND column_name = 'prezzo_seduta'
        ) THEN '✅ Colonna creata con successo'
        ELSE '❌ Errore nella creazione'
    END AS result;

-- Mostra statistiche
SELECT 
    'Statistiche prezzo_seduta' AS check_name,
    COUNT(*) AS totale_professionisti,
    COUNT(prezzo_seduta) AS con_prezzo,
    COUNT(*) FILTER (WHERE prezzo_seduta IS NULL) AS senza_prezzo
FROM public.professionals;


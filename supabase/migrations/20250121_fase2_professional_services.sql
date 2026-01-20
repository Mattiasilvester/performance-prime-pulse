-- =============================================
-- FASE 2.1: TABELLA PROFESSIONAL_SERVICES
-- Data: 21 Gennaio 2025
-- Autore: Cursor AI Assistant
-- Descrizione: Crea tabella professional_services per gestire servizi multipli
--              per ogni professionista (Personal Training, Consulenza, etc.)
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: CREARE TABELLA professional_services
-- =============================================

CREATE TABLE IF NOT EXISTS public.professional_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Riferimento professionista
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    
    -- Dettagli servizio
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    
    -- Configurazione servizio
    is_online BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#EEBA2B',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincolo: nome unico per professionista
    CONSTRAINT unique_service_name_per_professional UNIQUE (professional_id, name)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_professional_services_professional 
    ON public.professional_services(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_services_active 
    ON public.professional_services(professional_id, is_active) 
    WHERE is_active = TRUE;

-- Commenti
COMMENT ON TABLE public.professional_services IS 
    'Servizi offerti dai professionisti (Personal Training, Consulenza, etc.)';

COMMENT ON COLUMN public.professional_services.name IS 
    'Nome del servizio (es: "Personal Training", "Consulenza Online")';

COMMENT ON COLUMN public.professional_services.price IS 
    'Prezzo del servizio in EUR';

COMMENT ON COLUMN public.professional_services.is_online IS 
    'Se il servizio può essere erogato online';

COMMENT ON COLUMN public.professional_services.color IS 
    'Colore per visualizzazione calendario';

-- =============================================
-- STEP 2: AGGIUNGERE service_id A bookings
-- =============================================

-- Aggiungi colonna service_id (opzionale, per retrocompatibilità manteniamo service_type)
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.professional_services(id) ON DELETE SET NULL;

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_bookings_service_id 
    ON public.bookings(service_id) 
    WHERE service_id IS NOT NULL;

COMMENT ON COLUMN public.bookings.service_id IS 
    'Riferimento a professional_services (nuovo sistema). Se NULL, usa service_type per retrocompatibilità.';

-- =============================================
-- STEP 3: TRIGGER PER updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_professional_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_services_updated_at
    BEFORE UPDATE ON public.professional_services
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_services_updated_at();

-- =============================================
-- STEP 4: RLS POLICIES
-- =============================================

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

-- Policy: I professionisti possono vedere solo i propri servizi
CREATE POLICY "Professionals can view their own services"
    ON public.professional_services
    FOR SELECT
    USING (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
    );

-- Policy: I professionisti possono inserire solo i propri servizi
CREATE POLICY "Professionals can insert their own services"
    ON public.professional_services
    FOR INSERT
    WITH CHECK (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
    );

-- Policy: I professionisti possono aggiornare solo i propri servizi
CREATE POLICY "Professionals can update their own services"
    ON public.professional_services
    FOR UPDATE
    USING (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
    );

-- Policy: I professionisti possono eliminare solo i propri servizi
CREATE POLICY "Professionals can delete their own services"
    ON public.professional_services
    FOR DELETE
    USING (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
    );

-- Policy: Utenti autenticati possono vedere servizi pubblici (per marketplace futuro)
CREATE POLICY "Authenticated users can view active services"
    ON public.professional_services
    FOR SELECT
    USING (
        is_active = TRUE
        AND professional_id IN (
            SELECT id FROM public.professionals WHERE attivo = TRUE
        )
    );

-- =============================================
-- STEP 5: CREARE SERVIZI DEFAULT PER PROFESSIONISTI ESISTENTI
-- =============================================

-- Crea un servizio default per ogni professionista
-- Verifica se prezzo_seduta esiste, altrimenti usa 0
DO $$
DECLARE
    prof_record RECORD;
    default_price DECIMAL(10,2) := 0;
    prezzo_seduta_exists BOOLEAN;
    query_text TEXT;
BEGIN
    -- Verifica se la colonna prezzo_seduta esiste
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals'
        AND column_name = 'prezzo_seduta'
    ) INTO prezzo_seduta_exists;
    
    IF prezzo_seduta_exists THEN
        -- Se la colonna esiste, usa quella
        FOR prof_record IN 
            SELECT id, prezzo_seduta 
            FROM public.professionals
        LOOP
            BEGIN
                -- Usa prezzo_seduta se disponibile e valido, altrimenti 0
                IF prof_record.prezzo_seduta IS NOT NULL THEN
                    BEGIN
                        default_price := prof_record.prezzo_seduta::DECIMAL(10,2);
                    EXCEPTION WHEN OTHERS THEN
                        default_price := 0;
                    END;
                ELSE
                    default_price := 0;
                END IF;
                
                -- Crea servizio default
                INSERT INTO public.professional_services (
                    professional_id,
                    name,
                    description,
                    duration_minutes,
                    price,
                    is_online,
                    is_active,
                    color
                ) VALUES (
                    prof_record.id,
                    'Personal Training',
                    'Sessione di allenamento personalizzata',
                    60,
                    default_price,
                    FALSE,
                    TRUE,
                    '#EEBA2B'
                )
                ON CONFLICT (professional_id, name) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Errore creazione servizio default per professionista %: %', prof_record.id, SQLERRM;
            END;
        END LOOP;
    ELSE
        -- Se la colonna non esiste, usa 0 per tutti
        RAISE NOTICE 'Colonna prezzo_seduta non trovata. Uso prezzo default 0 per tutti i servizi.';
        FOR prof_record IN 
            SELECT id 
            FROM public.professionals
        LOOP
            BEGIN
                INSERT INTO public.professional_services (
                    professional_id,
                    name,
                    description,
                    duration_minutes,
                    price,
                    is_online,
                    is_active,
                    color
                ) VALUES (
                    prof_record.id,
                    'Personal Training',
                    'Sessione di allenamento personalizzata',
                    60,
                    0,
                    FALSE,
                    TRUE,
                    '#EEBA2B'
                )
                ON CONFLICT (professional_id, name) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Errore creazione servizio default per professionista %: %', prof_record.id, SQLERRM;
            END;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Servizi default creati per tutti i professionisti.';
END $$;

COMMIT;

-- =============================================
-- VERIFICA POST-MIGRAZIONE
-- =============================================

DO $$
DECLARE
    services_count INTEGER;
    professionals_count INTEGER;
BEGIN
    -- Verifica che la tabella esista
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'professional_services'
    ) THEN
        RAISE WARNING '❌ ERRORE: Tabella professional_services non creata!';
    ELSE
        RAISE NOTICE '✅ OK: Tabella professional_services creata.';
    END IF;
    
    -- Verifica colonna service_id in bookings
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
        AND column_name = 'service_id'
    ) THEN
        RAISE WARNING '❌ ERRORE: Colonna service_id non aggiunta a bookings!';
    ELSE
        RAISE NOTICE '✅ OK: Colonna service_id aggiunta a bookings.';
    END IF;
    
    -- Statistiche
    SELECT COUNT(*) INTO services_count FROM public.professional_services;
    SELECT COUNT(*) INTO professionals_count FROM public.professionals;
    
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'STATISTICHE MIGRAZIONE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Totale professionisti: %', professionals_count;
    RAISE NOTICE 'Totale servizi creati: %', services_count;
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRAZIONE COMPLETATA CON SUCCESSO!';
END $$;


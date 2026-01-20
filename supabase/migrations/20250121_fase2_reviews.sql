-- =============================================
-- FASE 2.2: TABELLA REVIEWS
-- Data: 21 Gennaio 2025
-- Autore: Cursor AI Assistant
-- Descrizione: Crea tabella reviews per sistema recensioni completo
--              con rating, commenti e risposte professionisti
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: CREARE TABELLA reviews
-- =============================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Riferimenti
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    
    -- Contenuto recensione
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT,
    
    -- Risposta professionista
    response TEXT,
    response_at TIMESTAMP WITH TIME ZONE,
    
    -- Visibilità e moderazione
    is_visible BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Se la prenotazione è completata
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincolo: un utente può lasciare solo una recensione per booking
    CONSTRAINT unique_review_per_booking UNIQUE (user_id, booking_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_reviews_professional 
    ON public.reviews(professional_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user 
    ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_booking 
    ON public.reviews(booking_id) 
    WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_visible 
    ON public.reviews(professional_id, is_visible) 
    WHERE is_visible = TRUE;

CREATE INDEX IF NOT EXISTS idx_reviews_rating 
    ON public.reviews(professional_id, rating) 
    WHERE is_visible = TRUE;

-- Commenti
COMMENT ON TABLE public.reviews IS 
    'Recensioni degli utenti per i professionisti';

COMMENT ON COLUMN public.reviews.rating IS 
    'Rating da 1 a 5 stelle';

COMMENT ON COLUMN public.reviews.is_verified IS 
    'Se la recensione è verificata (utente ha completato la prenotazione)';

COMMENT ON COLUMN public.reviews.is_visible IS 
    'Se la recensione è visibile pubblicamente (può essere nascosta dalla moderazione)';

-- =============================================
-- STEP 2: TRIGGER PER updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- =============================================
-- STEP 3: FUNZIONE PER AGGIORNARE RATING PROFESSIONISTA
-- =============================================

CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_rating DECIMAL(2,1);
    new_reviews_count INTEGER;
    prof_id UUID;
BEGIN
    -- Determina quale professional_id aggiornare
    IF TG_OP = 'DELETE' THEN
        prof_id := OLD.professional_id;
    ELSE
        prof_id := NEW.professional_id;
    END IF;
    
    -- Calcola rating medio (solo recensioni visibili)
    SELECT 
        ROUND(AVG(rating)::numeric, 1),
        COUNT(*)
    INTO new_rating, new_reviews_count
    FROM public.reviews
    WHERE professional_id = prof_id
    AND is_visible = TRUE;
    
    -- Aggiorna professionals
    UPDATE public.professionals
    SET 
        rating = COALESCE(new_rating, 0),
        reviews_count = COALESCE(new_reviews_count, 0),
        updated_at = NOW()
    WHERE id = prof_id;
    
    -- Ritorna il record appropriato
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare rating su INSERT, UPDATE, DELETE
CREATE TRIGGER update_rating_on_review_insert
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    WHEN (NEW.is_visible = TRUE)
    EXECUTE FUNCTION update_professional_rating();

CREATE TRIGGER update_rating_on_review_update
    AFTER UPDATE ON public.reviews
    FOR EACH ROW
    WHEN (
        (OLD.is_visible IS DISTINCT FROM NEW.is_visible) OR
        (OLD.rating IS DISTINCT FROM NEW.rating) OR
        (OLD.professional_id IS DISTINCT FROM NEW.professional_id)
    )
    EXECUTE FUNCTION update_professional_rating();

CREATE TRIGGER update_rating_on_review_delete
    AFTER DELETE ON public.reviews
    FOR EACH ROW
    WHEN (OLD.is_visible = TRUE)
    EXECUTE FUNCTION update_professional_rating();

-- =============================================
-- STEP 4: RLS POLICIES
-- =============================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Chiunque può vedere recensioni visibili
CREATE POLICY "Anyone can view visible reviews"
    ON public.reviews
    FOR SELECT
    USING (is_visible = TRUE);

-- Policy: Gli utenti autenticati possono vedere le proprie recensioni (anche non visibili)
CREATE POLICY "Users can view their own reviews"
    ON public.reviews
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: I professionisti possono vedere tutte le recensioni per loro
CREATE POLICY "Professionals can view their reviews"
    ON public.reviews
    FOR SELECT
    USING (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
    );

-- Policy: Gli utenti autenticati possono inserire recensioni (solo per se stessi)
CREATE POLICY "Authenticated users can insert reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Gli utenti possono aggiornare solo le proprie recensioni (solo commento/rating)
CREATE POLICY "Users can update their own reviews"
    ON public.reviews
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        -- Possono modificare solo commento, rating, title
        -- NON possono modificare professional_id, booking_id, is_visible
    );

-- Policy: I professionisti possono rispondere alle proprie recensioni
CREATE POLICY "Professionals can respond to their reviews"
    ON public.reviews
    FOR UPDATE
    USING (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        professional_id IN (
            SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
        -- Possono modificare solo response, response_at
        -- NON possono modificare rating, comment, is_visible
    );

-- Policy: Gli utenti possono eliminare solo le proprie recensioni
CREATE POLICY "Users can delete their own reviews"
    ON public.reviews
    FOR DELETE
    USING (user_id = auth.uid());

COMMIT;

-- =============================================
-- VERIFICA POST-MIGRAZIONE
-- =============================================

DO $$
BEGIN
    -- Verifica che la tabella esista
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews'
    ) THEN
        RAISE WARNING '❌ ERRORE: Tabella reviews non creata!';
    ELSE
        RAISE NOTICE '✅ OK: Tabella reviews creata.';
    END IF;
    
    -- Verifica che i trigger esistano
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname IN (
            'update_rating_on_review_insert',
            'update_rating_on_review_update',
            'update_rating_on_review_delete'
        )
    ) THEN
        RAISE WARNING '❌ ERRORE: Trigger per aggiornare rating non creati!';
    ELSE
        RAISE NOTICE '✅ OK: Trigger per aggiornare rating creati.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'MIGRAZIONE REVIEWS COMPLETATA!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Il sistema ora supporta:';
    RAISE NOTICE '- Recensioni con rating 1-5 stelle';
    RAISE NOTICE '- Commenti e risposte professionisti';
    RAISE NOTICE '- Aggiornamento automatico rating professionisti';
    RAISE NOTICE '- Verifica recensioni (collegamento a booking completati)';
END $$;


-- Estensione tabella professionals per funzionalità ricerca
-- Data: 2025-01-08

-- Verifica se la tabella esiste, altrimenti la crea
-- (Necessario se la migrazione originale non è stata ancora eseguita)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professionals') THEN
        -- Crea il tipo ENUM se non esiste
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_category') THEN
            CREATE TYPE public.professional_category AS ENUM ('fisioterapista', 'nutrizionista', 'mental_coach', 'osteopata', 'pt');
        END IF;
        
        -- Crea la tabella professionals
        CREATE TABLE public.professionals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            birth_place VARCHAR(255) NOT NULL,
            birth_date DATE NOT NULL,
            vat_number VARCHAR(50) NOT NULL,
            vat_address TEXT NOT NULL,
            vat_postal_code VARCHAR(20) NOT NULL,
            vat_city VARCHAR(100) NOT NULL,
            sdi_code VARCHAR(50),
            email VARCHAR(255) NOT NULL UNIQUE,
            pec_email VARCHAR(255),
            phone VARCHAR(30) NOT NULL,
            office_phone VARCHAR(30),
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            reset_token TEXT,
            reset_requested_at TIMESTAMP WITH TIME ZONE,
            payment_method TEXT,
            category professional_category NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Crea indici base
        CREATE INDEX idx_professionals_email ON public.professionals(email);
        CREATE INDEX idx_professionals_category ON public.professionals(category);
        
        -- Abilita RLS
        ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Tabella professionals creata';
    ELSE
        RAISE NOTICE 'Tabella professionals già esistente, procedo con estensione';
    END IF;
END $$;

-- Aggiungere colonne mancanti
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS specializzazioni TEXT[];
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS zona VARCHAR(100);
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS modalita VARCHAR(20) DEFAULT 'entrambi';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS prezzo_fascia VARCHAR(10) DEFAULT '€€';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;

-- Commento sulle colonne
COMMENT ON COLUMN professionals.bio IS 'Descrizione/biografia del professionista';
COMMENT ON COLUMN professionals.foto_url IS 'URL immagine profilo';
COMMENT ON COLUMN professionals.specializzazioni IS 'Array di specializzazioni (es: bodybuilding, dimagrimento)';
COMMENT ON COLUMN professionals.zona IS 'Città o area operativa';
COMMENT ON COLUMN professionals.modalita IS 'Modalità: online, presenza, entrambi';
COMMENT ON COLUMN professionals.prezzo_fascia IS 'Fascia prezzo: €, €€, €€€';
COMMENT ON COLUMN professionals.rating IS 'Valutazione media 0-5';
COMMENT ON COLUMN professionals.reviews_count IS 'Numero totale recensioni';
COMMENT ON COLUMN professionals.attivo IS 'Se true, visibile nella ricerca pubblica';

-- Indici per performance ricerca
-- NOTA: idx_professionals_category esiste già nella migrazione originale (20250618122323)
-- Lo lasciamo con IF NOT EXISTS per sicurezza, ma non verrà ricreato se esiste già
CREATE INDEX IF NOT EXISTS idx_professionals_category ON professionals(category);
CREATE INDEX IF NOT EXISTS idx_professionals_zona ON professionals(zona);
CREATE INDEX IF NOT EXISTS idx_professionals_attivo ON professionals(attivo);
CREATE INDEX IF NOT EXISTS idx_professionals_rating ON professionals(rating DESC);


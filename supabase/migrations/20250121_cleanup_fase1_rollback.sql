-- =============================================
-- FASE 1: ROLLBACK CLEANUP DATABASE
-- Data: 21 Gennaio 2025
-- Autore: Cursor AI Assistant
-- Descrizione: Script di rollback per annullare le modifiche della migrazione cleanup_fase1.sql
-- ⚠️ ATTENZIONE: Questo script ripristina lo stato precedente. Usa con cautela.
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: RIMUOVERE COLONNE E INDICI DA `bookings`
-- =============================================
-- Rimuovi gli indici creati
DROP INDEX IF EXISTS public.idx_bookings_client_name;
DROP INDEX IF EXISTS public.idx_bookings_client_email;
DROP INDEX IF EXISTS public.idx_bookings_service_type;

-- Rimuovi le colonne aggiunte
ALTER TABLE public.bookings 
    DROP COLUMN IF EXISTS client_name,
    DROP COLUMN IF EXISTS client_email,
    DROP COLUMN IF EXISTS client_phone,
    DROP COLUMN IF EXISTS service_type,
    DROP COLUMN IF EXISTS color;

DO $$ BEGIN
    RAISE NOTICE 'Colonne rimosse da bookings.';
END $$;

-- =============================================
-- STEP 2: RIPRISTINARE CAMPI DEPRECATI IN `professionals`
-- =============================================
-- Ripristina i campi deprecati (con valori di default per evitare errori NOT NULL)

ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'deprecated',
    ADD COLUMN IF NOT EXISTS password_salt TEXT DEFAULT 'deprecated';

-- Aggiungi NOT NULL dopo aver aggiunto le colonne con default
ALTER TABLE public.professionals 
    ALTER COLUMN password_hash SET NOT NULL,
    ALTER COLUMN password_salt SET NOT NULL;
    ADD COLUMN IF NOT EXISTS reset_token TEXT,
    ADD COLUMN IF NOT EXISTS reset_requested_at TIMESTAMP WITH TIME ZONE;

DO $$ BEGIN
    RAISE NOTICE 'Campi deprecati ripristinati in professionals.';
END $$;

-- =============================================
-- STEP 3: RIPRISTINARE TABELLA `users`
-- =============================================
-- Ripristina la tabella users (se esisteva prima)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    payment_method TEXT,
    category user_category NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    reset_token TEXT,
    reset_requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ripristina gli indici
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_category ON public.users(category);

COMMIT;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ROLLBACK COMPLETATO';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '⚠️ NOTA: I dati originali non sono stati ripristinati.';
    RAISE NOTICE 'Se necessario, ripristina i dati da un backup.';
END $$;


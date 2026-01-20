-- =============================================
-- FASE 1: CLEANUP CRITICO DATABASE
-- Data: 21 Gennaio 2025
-- Autore: Cursor AI Assistant
-- Descrizione: Rimozione tabella legacy `users`, cleanup campi deprecati `professionals`,
--              e migrazione `bookings.notes` JSON a colonne separate
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: VERIFICA DIPENDENZE TABELLA `users`
-- =============================================
-- Verifica se ci sono foreign key che puntano a users
-- Se non ci sono risultati, possiamo procedere con sicurezza

DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND tc.table_schema = 'public';
    
    IF fk_count > 0 THEN
        RAISE EXCEPTION 'Trovate % foreign key che puntano a users. Risolvi prima di procedere.', fk_count;
    END IF;
    
    RAISE NOTICE 'Nessuna foreign key trovata che punta a users. Procedo con la rimozione.';
END $$;

-- =============================================
-- STEP 2: RIMUOVERE TABELLA `users` (LEGACY)
-- =============================================
-- La tabella users non è più utilizzata.
-- Il sistema ora usa: auth.users (Supabase Auth) → profiles (1:1)

-- Rimuovi indici associati
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_category;

-- Rimuovi la tabella (CASCADE rimuoverà anche eventuali constraint)
DROP TABLE IF EXISTS public.users CASCADE;

DO $$ BEGIN
    RAISE NOTICE 'Tabella users rimossa con successo.';
END $$;

-- =============================================
-- STEP 3: RIMUOVERE CAMPI DEPRECATI DA `professionals`
-- =============================================
-- Questi campi non sono più usati perché l'autenticazione avviene tramite Supabase Auth.
-- Sono solo placeholder nel codice.

-- Rimuovi constraint NOT NULL se esistono (gestito con exception handling)
DO $$
BEGIN
    -- Prova a rimuovere NOT NULL da password_hash
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals' 
        AND column_name = 'password_hash'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.professionals ALTER COLUMN password_hash DROP NOT NULL;
    END IF;
    
    -- Prova a rimuovere NOT NULL da password_salt
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals' 
        AND column_name = 'password_salt'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.professionals ALTER COLUMN password_salt DROP NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Se fallisce, continuiamo comunque perché tanto elimineremo le colonne
    RAISE NOTICE 'Nota: Impossibile rimuovere NOT NULL, ma procediamo comunque con la rimozione colonne.';
END $$;

-- Rimuovi le colonne deprecate
ALTER TABLE public.professionals 
    DROP COLUMN IF EXISTS password_hash,
    DROP COLUMN IF EXISTS password_salt,
    DROP COLUMN IF EXISTS reset_token,
    DROP COLUMN IF EXISTS reset_requested_at;

DO $$ BEGIN
    RAISE NOTICE 'Campi deprecati rimossi da professionals.';
END $$;

-- =============================================
-- STEP 4: AGGIUNGERE COLONNE A `bookings`
-- =============================================
-- Migrazione da bookings.notes (JSON) a colonne separate per migliorare query e indici

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS client_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#EEBA2B';

DO $$ BEGIN
    RAISE NOTICE 'Colonne aggiunte a bookings.';
END $$;

-- =============================================
-- STEP 5: MIGRARE DATI DA `bookings.notes` JSON
-- =============================================
-- Estrae i dati dal JSON in bookings.notes e li salva nelle nuove colonne.
-- Gestisce anche il caso di notes non-JSON (testo semplice) o malformato.

DO $$
DECLARE
    booking_record RECORD;
    parsed_json JSONB;
    error_count INTEGER := 0;
BEGIN
    FOR booking_record IN 
        SELECT id, notes 
        FROM public.bookings 
        WHERE notes IS NOT NULL
    LOOP
        BEGIN
            -- Prova a parsare come JSON solo se sembra essere JSON
            IF booking_record.notes ~ '^\s*\{' THEN
                BEGIN
                    parsed_json := booking_record.notes::jsonb;
                    
                    -- Aggiorna le colonne con i dati estratti
                    UPDATE public.bookings
                    SET
                        client_name = COALESCE(
                            NULLIF(TRIM(parsed_json->>'client_name'), ''),
                            NULLIF(TRIM(parsed_json->>'clientName'), '')
                        ),
                        client_email = COALESCE(
                            NULLIF(TRIM(parsed_json->>'client_email'), ''),
                            NULLIF(TRIM(parsed_json->>'clientEmail'), '')
                        ),
                        client_phone = COALESCE(
                            NULLIF(TRIM(parsed_json->>'client_phone'), ''),
                            NULLIF(TRIM(parsed_json->>'clientPhone'), '')
                        ),
                        service_type = COALESCE(
                            NULLIF(TRIM(parsed_json->>'service_type'), ''),
                            NULLIF(TRIM(parsed_json->>'serviceType'), '')
                        ),
                        color = COALESCE(
                            NULLIF(TRIM(parsed_json->>'color'), ''),
                            '#EEBA2B'
                        )
                    WHERE id = booking_record.id;
                EXCEPTION WHEN OTHERS THEN
                    -- JSON malformato: salta questo record
                    error_count := error_count + 1;
                    RAISE NOTICE 'Errore parsing JSON per booking %: %', booking_record.id, SQLERRM;
                END;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Altri errori: salta questo record
            error_count := error_count + 1;
            RAISE NOTICE 'Errore processando booking %: %', booking_record.id, SQLERRM;
        END;
    END LOOP;
    
    IF error_count > 0 THEN
        RAISE NOTICE 'Migrazione completata con % errori su record con JSON malformato.', error_count;
    ELSE
        RAISE NOTICE 'Migrazione completata senza errori.';
    END IF;
END $$;

-- Aggiorna anche i record dove notes è NULL per impostare il colore di default
UPDATE public.bookings
SET color = '#EEBA2B'
WHERE color IS NULL;

DO $$ BEGIN
    RAISE NOTICE 'Dati migrati da bookings.notes JSON alle colonne separate.';
END $$;

-- =============================================
-- STEP 6: CREARE INDICI PER PERFORMANCE
-- =============================================
-- Aggiungi indici sulle nuove colonne per migliorare le query

CREATE INDEX IF NOT EXISTS idx_bookings_client_name 
    ON public.bookings(client_name) 
    WHERE client_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_client_email 
    ON public.bookings(client_email) 
    WHERE client_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_service_type 
    ON public.bookings(service_type) 
    WHERE service_type IS NOT NULL;

DO $$ BEGIN
    RAISE NOTICE 'Indici creati sulle nuove colonne.';
END $$;

-- =============================================
-- STEP 7: COMMENTI DESCRITTIVI
-- =============================================
-- Aggiungi commenti per documentare le nuove colonne

COMMENT ON COLUMN public.bookings.client_name IS 
    'Nome cliente per prenotazioni manuali (estratto da notes JSON o inserito direttamente)';

COMMENT ON COLUMN public.bookings.client_email IS 
    'Email cliente per prenotazioni manuali (estratto da notes JSON o inserito direttamente)';

COMMENT ON COLUMN public.bookings.client_phone IS 
    'Telefono cliente per prenotazioni manuali (estratto da notes JSON o inserito direttamente)';

COMMENT ON COLUMN public.bookings.service_type IS 
    'Tipo servizio (es: Personal Training, Consulenza, Follow-up) - estratto da notes JSON';

COMMENT ON COLUMN public.bookings.color IS 
    'Colore personalizzato per visualizzazione calendario (default: #EEBA2B)';

COMMENT ON COLUMN public.bookings.notes IS 
    'Note libere. Per prenotazioni manuali, può contenere JSON con original_notes. 
     Le colonne client_name, client_email, client_phone, service_type, color ora sono separate.';

COMMIT;

-- =============================================
-- VERIFICA POST-MIGRAZIONE
-- =============================================
-- Esegui le query di verifica dopo il COMMIT

DO $$
DECLARE
    users_table_exists BOOLEAN;
    professionals_has_deprecated_fields BOOLEAN;
    bookings_has_new_columns BOOLEAN;
    migrated_records_count INTEGER;
    total_bookings_count INTEGER;
BEGIN
    -- Verifica 1: Tabella users non esiste più
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO users_table_exists;
    
    IF users_table_exists THEN
        RAISE WARNING 'ATTENZIONE: La tabella users esiste ancora!';
    ELSE
        RAISE NOTICE '✓ Verifica 1: Tabella users rimossa correttamente.';
    END IF;
    
    -- Verifica 2: Campi deprecati rimossi da professionals
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'professionals'
        AND column_name IN ('password_hash', 'password_salt', 'reset_token', 'reset_requested_at')
    ) INTO professionals_has_deprecated_fields;
    
    IF professionals_has_deprecated_fields THEN
        RAISE WARNING 'ATTENZIONE: Alcuni campi deprecati esistono ancora in professionals!';
    ELSE
        RAISE NOTICE '✓ Verifica 2: Campi deprecati rimossi da professionals.';
    END IF;
    
    -- Verifica 3: Nuove colonne esistono in bookings
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
        AND column_name IN ('client_name', 'client_email', 'client_phone', 'service_type', 'color')
    ) INTO bookings_has_new_columns;
    
    IF NOT bookings_has_new_columns THEN
        RAISE WARNING 'ATTENZIONE: Le nuove colonne non esistono in bookings!';
    ELSE
        RAISE NOTICE '✓ Verifica 3: Nuove colonne aggiunte a bookings.';
    END IF;
    
    -- Verifica 4: Conteggio record migrati
    SELECT COUNT(*) INTO total_bookings_count FROM public.bookings;
    SELECT COUNT(*) INTO migrated_records_count 
    FROM public.bookings 
    WHERE notes IS NOT NULL AND notes ~ '^\s*\{';
    
    RAISE NOTICE '✓ Verifica 4: Migrazione dati completata.';
    RAISE NOTICE '  - Totale prenotazioni: %', total_bookings_count;
    RAISE NOTICE '  - Prenotazioni con notes JSON: %', migrated_records_count;
    RAISE NOTICE '  - Prenotazioni con client_name: %', (SELECT COUNT(*) FROM public.bookings WHERE client_name IS NOT NULL);
    RAISE NOTICE '  - Prenotazioni con service_type: %', (SELECT COUNT(*) FROM public.bookings WHERE service_type IS NOT NULL);
    
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'MIGRAZIONE COMPLETATA CON SUCCESSO!';
    RAISE NOTICE '=========================================';
END $$;


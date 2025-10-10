-- =====================================================
-- SCRIPT SICURO PER PULIZIA USER_METADATA ECCESSIVI
-- =====================================================
-- Data: $(date)
-- Scopo: Ridurre dimensioni token JWT rimuovendo metadata non essenziali
-- Sicurezza: Backup completo + rollback disponibile

-- =====================================================
-- 1. BACKUP DEI METADATA ORIGINALI
-- =====================================================

-- Crea tabella di backup per user_metadata
CREATE TABLE IF NOT EXISTS backup_user_metadata AS
SELECT 
    id,
    user_metadata,
    app_metadata,
    created_at,
    updated_at
FROM auth.users
WHERE user_metadata IS NOT NULL 
   OR app_metadata IS NOT NULL;

-- Crea tabella di backup per app_metadata
CREATE TABLE IF NOT EXISTS backup_app_metadata AS
SELECT 
    id,
    app_metadata,
    created_at,
    updated_at
FROM auth.users
WHERE app_metadata IS NOT NULL;

-- =====================================================
-- 2. ANALISI DIMENSIONI METADATA
-- =====================================================

-- Analizza dimensioni attuali user_metadata
SELECT 
    'ANALISI DIMENSIONI METADATA' as sezione,
    COUNT(*) as total_users,
    AVG(LENGTH(user_metadata::text)) as avg_user_metadata_size,
    MAX(LENGTH(user_metadata::text)) as max_user_metadata_size,
    AVG(LENGTH(app_metadata::text)) as avg_app_metadata_size,
    MAX(LENGTH(app_metadata::text)) as max_app_metadata_size
FROM auth.users
WHERE user_metadata IS NOT NULL OR app_metadata IS NOT NULL;

-- Mostra campi più comuni in user_metadata
SELECT 
    'CAMPI USER_METADATA' as sezione,
    key,
    COUNT(*) as frequency,
    AVG(LENGTH(value::text)) as avg_value_size
FROM auth.users,
LATERAL jsonb_each(user_metadata)
WHERE user_metadata IS NOT NULL
GROUP BY key
ORDER BY frequency DESC, avg_value_size DESC;

-- Mostra campi più comuni in app_metadata
SELECT 
    'CAMPI APP_METADATA' as sezione,
    key,
    COUNT(*) as frequency,
    AVG(LENGTH(value::text)) as avg_value_size
FROM auth.users,
LATERAL jsonb_each(app_metadata)
WHERE app_metadata IS NOT NULL
GROUP BY key
ORDER BY frequency DESC, avg_value_size DESC;

-- =====================================================
-- 3. PULIZIA USER_METADATA (MANTIENE SOLO CAMPI ESSENZIALI)
-- =====================================================

-- Funzione per pulire user_metadata mantenendo solo campi essenziali
CREATE OR REPLACE FUNCTION clean_user_metadata()
RETURNS TABLE(
    user_id uuid,
    original_size int,
    cleaned_size int,
    reduction_percent numeric
) AS $$
DECLARE
    user_record RECORD;
    original_metadata jsonb;
    cleaned_metadata jsonb;
    original_size int;
    cleaned_size int;
BEGIN
    FOR user_record IN 
        SELECT id, user_metadata 
        FROM auth.users 
        WHERE user_metadata IS NOT NULL
    LOOP
        original_metadata := user_record.user_metadata;
        original_size := LENGTH(original_metadata::text);
        
        -- Crea nuovo metadata con solo campi essenziali
        cleaned_metadata := jsonb_build_object();
        
        -- Mantieni solo questi campi essenziali
        IF original_metadata ? 'full_name' THEN
            cleaned_metadata := cleaned_metadata || jsonb_build_object('full_name', original_metadata->'full_name');
        END IF;
        
        IF original_metadata ? 'first_name' THEN
            cleaned_metadata := cleaned_metadata || jsonb_build_object('first_name', original_metadata->'first_name');
        END IF;
        
        IF original_metadata ? 'last_name' THEN
            cleaned_metadata := cleaned_metadata || jsonb_build_object('last_name', original_metadata->'last_name');
        END IF;
        
        IF original_metadata ? 'email' THEN
            cleaned_metadata := cleaned_metadata || jsonb_build_object('email', original_metadata->'email');
        END IF;
        
        -- Aggiorna il record
        UPDATE auth.users 
        SET user_metadata = cleaned_metadata,
            updated_at = NOW()
        WHERE id = user_record.id;
        
        cleaned_size := LENGTH(cleaned_metadata::text);
        
        -- Ritorna statistiche
        user_id := user_record.id;
        original_size := original_size;
        cleaned_size := cleaned_size;
        reduction_percent := CASE 
            WHEN original_size > 0 THEN 
                ROUND(((original_size - cleaned_size)::numeric / original_size * 100), 2)
            ELSE 0 
        END;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. PULIZIA APP_METADATA (RIMUOVE TUTTO)
-- =====================================================

-- Funzione per pulire app_metadata (rimuove tutto)
CREATE OR REPLACE FUNCTION clean_app_metadata()
RETURNS TABLE(
    user_id uuid,
    original_size int,
    cleaned_size int,
    reduction_percent numeric
) AS $$
DECLARE
    user_record RECORD;
    original_metadata jsonb;
    cleaned_metadata jsonb;
    original_size int;
    cleaned_size int;
BEGIN
    FOR user_record IN 
        SELECT id, app_metadata 
        FROM auth.users 
        WHERE app_metadata IS NOT NULL
    LOOP
        original_metadata := user_record.app_metadata;
        original_size := LENGTH(original_metadata::text);
        
        -- Rimuovi tutto app_metadata
        cleaned_metadata := '{}'::jsonb;
        
        -- Aggiorna il record
        UPDATE auth.users 
        SET app_metadata = cleaned_metadata,
            updated_at = NOW()
        WHERE id = user_record.id;
        
        cleaned_size := LENGTH(cleaned_metadata::text);
        
        -- Ritorna statistiche
        user_id := user_record.id;
        original_size := original_size;
        cleaned_size := cleaned_size;
        reduction_percent := CASE 
            WHEN original_size > 0 THEN 
                ROUND(((original_size - cleaned_size)::numeric / original_size * 100), 2)
            ELSE 0 
        END;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ESECUZIONE PULIZIA
-- =====================================================

-- Esegui pulizia user_metadata
SELECT 'PULIZIA USER_METADATA' as sezione;
SELECT * FROM clean_user_metadata();

-- Esegui pulizia app_metadata
SELECT 'PULIZIA APP_METADATA' as sezione;
SELECT * FROM clean_app_metadata();

-- =====================================================
-- 6. VERIFICA RISULTATI
-- =====================================================

-- Verifica dimensioni dopo pulizia
SELECT 
    'VERIFICA DOPO PULIZIA' as sezione,
    COUNT(*) as total_users,
    AVG(LENGTH(user_metadata::text)) as avg_user_metadata_size,
    MAX(LENGTH(user_metadata::text)) as max_user_metadata_size,
    AVG(LENGTH(app_metadata::text)) as avg_app_metadata_size,
    MAX(LENGTH(app_metadata::text)) as max_app_metadata_size
FROM auth.users
WHERE user_metadata IS NOT NULL OR app_metadata IS NOT NULL;

-- Mostra campi rimanenti in user_metadata
SELECT 
    'CAMPI RIMANENTI USER_METADATA' as sezione,
    key,
    COUNT(*) as frequency
FROM auth.users,
LATERAL jsonb_each(user_metadata)
WHERE user_metadata IS NOT NULL
GROUP BY key
ORDER BY frequency DESC;

-- =====================================================
-- 7. ROLLBACK (SE NECESSARIO)
-- =====================================================

-- Funzione per rollback completo
CREATE OR REPLACE FUNCTION rollback_metadata_cleanup()
RETURNS void AS $$
BEGIN
    -- Ripristina user_metadata
    UPDATE auth.users 
    SET user_metadata = backup.user_metadata,
        updated_at = NOW()
    FROM backup_user_metadata backup
    WHERE auth.users.id = backup.id;
    
    -- Ripristina app_metadata
    UPDATE auth.users 
    SET app_metadata = backup.app_metadata,
        updated_at = NOW()
    FROM backup_app_metadata backup
    WHERE auth.users.id = backup.id;
    
    RAISE NOTICE 'Rollback completato. Metadata ripristinati.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. PULIZIA TABELLE DI BACKUP (OPZIONALE)
-- =====================================================

-- ATTENZIONE: Esegui solo se sei sicuro che tutto funzioni
-- DROP TABLE IF EXISTS backup_user_metadata;
-- DROP TABLE IF EXISTS backup_app_metadata;

-- =====================================================
-- 9. ISTRUZIONI D'USO
-- =====================================================

/*
ISTRUZIONI D'USO:

1. BACKUP: Lo script crea automaticamente backup delle tabelle
2. ANALISI: Esegue analisi delle dimensioni attuali
3. PULIZIA: Rimuove metadata non essenziali
4. VERIFICA: Controlla i risultati
5. ROLLBACK: Se necessario, esegui: SELECT rollback_metadata_cleanup();

COMANDI RAPIDI:
- Esegui tutto: \i fix-user-metadata.sql
- Solo analisi: Esegui sezioni 1-2
- Solo pulizia: Esegui sezioni 1, 3-5
- Rollback: SELECT rollback_metadata_cleanup();

SICUREZZA:
- NON tocca: id, email, encrypted_password
- NON tocca: tabelle custom_workouts, user_objectives, profiles
- SOLO pulisce: user_metadata e app_metadata in auth.users
*/




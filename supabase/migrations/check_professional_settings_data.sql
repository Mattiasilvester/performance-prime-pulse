-- ============================================
-- VERIFICA DATI IN PROFESSIONAL_SETTINGS
-- Query per vedere i dati effettivi nella tabella
-- ============================================

-- Verifica quanti record ci sono
SELECT COUNT(*) as total_records
FROM professional_settings;

-- Mostra tutti i link social per tutti i professionisti
SELECT 
    ps.professional_id,
    p.first_name || ' ' || p.last_name as professional_name,
    ps.instagram_url,
    ps.linkedin_url,
    ps.youtube_url,
    ps.tiktok_url,
    ps.facebook_url,
    ps.website_url,
    ps.updated_at
FROM professional_settings ps
LEFT JOIN professionals p ON p.id = ps.professional_id
ORDER BY ps.updated_at DESC;

-- Mostra solo i professionisti che hanno almeno un link social compilato
SELECT 
    ps.professional_id,
    p.first_name || ' ' || p.last_name as professional_name,
    CASE WHEN ps.instagram_url IS NOT NULL AND ps.instagram_url != '' THEN 'Sì' ELSE 'No' END as has_instagram,
    CASE WHEN ps.linkedin_url IS NOT NULL AND ps.linkedin_url != '' THEN 'Sì' ELSE 'No' END as has_linkedin,
    CASE WHEN ps.youtube_url IS NOT NULL AND ps.youtube_url != '' THEN 'Sì' ELSE 'No' END as has_youtube,
    CASE WHEN ps.tiktok_url IS NOT NULL AND ps.tiktok_url != '' THEN 'Sì' ELSE 'No' END as has_tiktok,
    CASE WHEN ps.facebook_url IS NOT NULL AND ps.facebook_url != '' THEN 'Sì' ELSE 'No' END as has_facebook,
    CASE WHEN ps.website_url IS NOT NULL AND ps.website_url != '' THEN 'Sì' ELSE 'No' END as has_website
FROM professional_settings ps
LEFT JOIN professionals p ON p.id = ps.professional_id
WHERE ps.instagram_url IS NOT NULL 
    OR ps.linkedin_url IS NOT NULL 
    OR ps.youtube_url IS NOT NULL 
    OR ps.tiktok_url IS NOT NULL 
    OR ps.facebook_url IS NOT NULL 
    OR ps.website_url IS NOT NULL
ORDER BY ps.updated_at DESC;

-- Verifica per un professionista specifico (sostituisci 'USER_ID' con l'ID utente)
-- SELECT 
--     ps.*
-- FROM professional_settings ps
-- INNER JOIN professionals p ON p.id = ps.professional_id
-- WHERE p.user_id = 'USER_ID_HERE';


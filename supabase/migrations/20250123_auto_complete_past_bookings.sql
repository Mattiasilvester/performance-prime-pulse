-- =============================================
-- FUNZIONE: Auto-completa appuntamenti passati
-- =============================================

-- Elimina la vecchia funzione se esiste (con o senza parametri)
DROP FUNCTION IF EXISTS auto_complete_past_bookings();
DROP FUNCTION IF EXISTS auto_complete_past_bookings(UUID);

-- Crea la nuova funzione con parametro opzionale
CREATE OR REPLACE FUNCTION auto_complete_past_bookings(p_professional_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Aggiorna tutti gli appuntamenti confermati con data passata
  -- Se p_professional_id è fornito, filtra per quel professionista
  UPDATE bookings
  SET 
    status = 'completed',
    updated_at = now()
  WHERE 
    status = 'confirmed'
    AND booking_date < CURRENT_DATE
    AND (p_professional_id IS NULL OR professional_id = p_professional_id);
  
  -- Ritorna il numero di righe aggiornate
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTO PER DOCUMENTAZIONE
-- =============================================

COMMENT ON FUNCTION auto_complete_past_bookings IS 
  'Auto-completa gli appuntamenti confermati con data passata. Chiamare periodicamente (es. ogni notte) o all''accesso della pagina calendario.';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION auto_complete_past_bookings TO authenticated;

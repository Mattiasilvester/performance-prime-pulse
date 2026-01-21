-- =============================================
-- AGGIUNTA COLONNA PRICE A bookings
-- =============================================

-- Aggiungi colonna price (opzionale, può essere NULL)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) CHECK (price >= 0);

-- Commento per documentazione
COMMENT ON COLUMN bookings.price IS 'Prezzo personalizzato per questa prenotazione. Se NULL, usa il prezzo del servizio associato (professional_services.price). Ha priorità sul prezzo del servizio se entrambi sono presenti.';

-- =============================================
-- AGGIUNTA COLONNA session_price A clients
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Aggiunge colonna session_price (DECIMAL) alla tabella clients
--              per memorizzare il prezzo della seduta personalizzato per cliente
-- =============================================

-- Aggiungi colonna session_price (opzionale, può essere NULL)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS session_price DECIMAL(10,2) CHECK (session_price >= 0);

-- Commento per documentazione
COMMENT ON COLUMN clients.session_price IS 'Prezzo personalizzato della seduta per questo cliente. Se NULL, usa il prezzo del servizio associato o il prezzo generale del professionista.';

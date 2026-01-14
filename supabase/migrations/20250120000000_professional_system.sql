-- ============================================
-- SISTEMA PROFESSIONISTI CON SUPABASE AUTH
-- Data: 2025-01-20
-- ============================================
-- 
-- Questa migrazione implementa:
-- 1. Collegamento professionals -> Supabase Auth
-- 2. Sistema di approvazione richieste
-- 3. Disponibilità oraria
-- 4. Prenotazioni
-- 5. Relazione professionista-cliente
-- ============================================

-- ============================================
-- PARTE 1: MODIFICHE TABELLA PROFESSIONALS
-- ============================================

-- Aggiungere colonna user_id per collegare a auth.users
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Aggiungere campo per stato approvazione
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Aggiungere campo per data approvazione
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Aggiungere campo is_partner se non esiste
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;

-- NOTA: I campi password_hash, password_salt, reset_token, reset_requested_at
-- vengono mantenuti per retrocompatibilità ma non saranno più usati.
-- Possono essere rimossi in una migrazione futura dopo migrazione dati.

-- Indice su user_id
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);

-- Indice su approval_status per query rapide
CREATE INDEX IF NOT EXISTS idx_professionals_approval_status ON professionals(approval_status);

-- ============================================
-- PARTE 2: TABELLA PROFESSIONAL_APPLICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS professional_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dati personali
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  
  -- Dati professionali
  category VARCHAR(50) NOT NULL CHECK (category IN ('pt', 'nutrizionista', 'fisioterapista', 'mental_coach', 'osteopata', 'altro')),
  city VARCHAR(100) NOT NULL,
  bio TEXT,
  specializations TEXT[],
  
  -- Dati fiscali (opzionali in fase di richiesta)
  company_name VARCHAR(255),
  vat_number VARCHAR(50),
  
  -- Stato richiesta
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  
  -- Timestamp
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Se approvato, riferimento al professionista creato
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL
);

-- Indici per professional_applications
CREATE INDEX IF NOT EXISTS idx_applications_status ON professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON professional_applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_submitted ON professional_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_professional_id ON professional_applications(professional_id);

-- Commenti
COMMENT ON TABLE professional_applications IS 'Richieste di registrazione professionisti in attesa di approvazione';
COMMENT ON COLUMN professional_applications.status IS 'Stato richiesta: pending, approved, rejected';
COMMENT ON COLUMN professional_applications.professional_id IS 'Riferimento al professionista creato dopo approvazione';

-- ============================================
-- PARTE 3: TABELLA PROFESSIONAL_AVAILABILITY
-- ============================================

CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Giorno della settimana (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Orari
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Attivo
  is_available BOOLEAN DEFAULT true,
  
  -- Constraint: end > start
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  
  -- Unico per professionista + giorno + orario
  UNIQUE(professional_id, day_of_week, start_time)
);

-- Indici per professional_availability
CREATE INDEX IF NOT EXISTS idx_availability_professional ON professional_availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON professional_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_active ON professional_availability(is_available) WHERE is_available = true;

-- Commenti
COMMENT ON TABLE professional_availability IS 'Disponibilità oraria settimanale dei professionisti';
COMMENT ON COLUMN professional_availability.day_of_week IS '0 = Domenica, 1 = Lunedì, ..., 6 = Sabato';

-- ============================================
-- PARTE 4: TABELLA BOOKINGS
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Riferimenti
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Data e ora appuntamento
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INT DEFAULT 60 CHECK (duration_minutes > 0),
  
  -- Stato
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Dettagli
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Modalità (online/presenza)
  modalita VARCHAR(20) DEFAULT 'presenza' CHECK (modalita IN ('online', 'presenza')),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indici per bookings
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);

-- Unico: no doppia prenotazione stesso slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot 
ON bookings(professional_id, booking_date, booking_time) 
WHERE status NOT IN ('cancelled');

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Commenti
COMMENT ON TABLE bookings IS 'Prenotazioni appuntamenti tra utenti e professionisti';
COMMENT ON COLUMN bookings.status IS 'Stato prenotazione: pending, confirmed, cancelled, completed, no_show';

-- ============================================
-- PARTE 5: TABELLA PROFESSIONAL_CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS professional_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stato relazione
  status VARCHAR(20) DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'inactive', 'completed')),
  
  -- Dettagli
  first_contact_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  
  -- Conteggi
  total_sessions INT DEFAULT 0 CHECK (total_sessions >= 0),
  last_session_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unico: un cliente per professionista
  UNIQUE(professional_id, user_id)
);

-- Indici per professional_clients
CREATE INDEX IF NOT EXISTS idx_prof_clients_professional ON professional_clients(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_clients_user ON professional_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_prof_clients_status ON professional_clients(status);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_prof_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prof_clients_updated_at
  BEFORE UPDATE ON professional_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_prof_clients_updated_at();

-- Commenti
COMMENT ON TABLE professional_clients IS 'Relazione tra professionisti e loro clienti';
COMMENT ON COLUMN professional_clients.status IS 'Stato relazione: lead, active, inactive, completed';

-- ============================================
-- PARTE 6: RLS POLICIES
-- ============================================

-- ============================================
-- PROFESSIONAL_APPLICATIONS
-- ============================================

ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Users can view own application" ON professional_applications;
DROP POLICY IF EXISTS "Users can insert own application" ON professional_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON professional_applications;

-- Utente può vedere la propria richiesta (basata su email)
CREATE POLICY "Users can view own application" ON professional_applications
  FOR SELECT 
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Chiunque può inserire una richiesta
CREATE POLICY "Users can insert own application" ON professional_applications
  FOR INSERT 
  WITH CHECK (true);

-- Admin può vedere tutte (da implementare con ruolo admin)
-- CREATE POLICY "Admins can view all applications" ON professional_applications
--   FOR SELECT 
--   USING (auth.jwt()->>'role' = 'admin');

-- ============================================
-- PROFESSIONALS
-- ============================================

-- Rimuovi vecchie policies che usano auth.uid() = id
DROP POLICY IF EXISTS "Professionals can view own data only" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own data only" ON professionals;
DROP POLICY IF EXISTS "Authenticated users can view active professionals" ON professionals;
DROP POLICY IF EXISTS "Allow public read access to professionals" ON professionals;
DROP POLICY IF EXISTS "Users can view their own data" ON professionals;
DROP POLICY IF EXISTS "Users can update their own data" ON professionals;

-- Pubblico può vedere professionisti attivi e approvati
CREATE POLICY "Public can view active approved professionals" ON professionals
  FOR SELECT 
  USING (attivo = true AND approval_status = 'approved');

-- Professionista può vedere e modificare il proprio profilo
CREATE POLICY "Professional can view own profile" ON professionals
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Professional can update own profile" ON professionals
  FOR UPDATE 
  USING (user_id = auth.uid());

-- ============================================
-- PROFESSIONAL_AVAILABILITY
-- ============================================

ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Professional manages own availability" ON professional_availability;
DROP POLICY IF EXISTS "Public can view availability" ON professional_availability;

-- Professionista gestisce la propria disponibilità
CREATE POLICY "Professional manages own availability" ON professional_availability
  FOR ALL 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Pubblico può vedere disponibilità
CREATE POLICY "Public can view availability" ON professional_availability
  FOR SELECT 
  USING (true);

-- ============================================
-- BOOKINGS
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "User can manage own bookings" ON bookings;
DROP POLICY IF EXISTS "Professional can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Professional can update own bookings" ON bookings;

-- Utente può gestire le proprie prenotazioni
CREATE POLICY "User can manage own bookings" ON bookings
  FOR ALL 
  USING (user_id = auth.uid());

-- Professionista può vedere le prenotazioni per i suoi servizi
CREATE POLICY "Professional can view own bookings" ON bookings
  FOR SELECT 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Professionista può aggiornare le prenotazioni per i suoi servizi
CREATE POLICY "Professional can update own bookings" ON bookings
  FOR UPDATE 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Professionista può confermare/cancellare prenotazioni
CREATE POLICY "Professional can confirm/cancel bookings" ON bookings
  FOR UPDATE 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- ============================================
-- PROFESSIONAL_CLIENTS
-- ============================================

ALTER TABLE professional_clients ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Professional manages own clients" ON professional_clients;
DROP POLICY IF EXISTS "User can view own client relationships" ON professional_clients;

-- Professionista gestisce i propri clienti
CREATE POLICY "Professional manages own clients" ON professional_clients
  FOR ALL 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Utente può vedere le relazioni dove è cliente
CREATE POLICY "User can view own client relationships" ON professional_clients
  FOR SELECT 
  USING (user_id = auth.uid());

-- ============================================
-- FINE MIGRAZIONE
-- ============================================


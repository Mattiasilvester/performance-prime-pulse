-- RLS Policy e Dati Demo per professionals
-- Data: 2025-01-08

-- ============================================
-- PARTE 1: RLS POLICY PER RICERCA PUBBLICA
-- ============================================

-- Abilita RLS se non già abilitato
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Policy: utenti autenticati possono vedere professionisti attivi
-- (la policy esistente permette solo ai professionisti di vedere i propri dati)
CREATE POLICY "Authenticated users can view active professionals"
ON professionals
FOR SELECT
TO authenticated
USING (attivo = true);

-- ============================================
-- PARTE 2: DATI DEMO (6 PROFESSIONISTI)
-- ============================================

-- Inserisce professionisti demo (o aggiorna se email già esiste)
INSERT INTO professionals (
  first_name, 
  last_name, 
  company_name,
  category, 
  bio, 
  zona, 
  modalita, 
  prezzo_fascia, 
  rating, 
  reviews_count, 
  specializzazioni, 
  attivo, 
  email, 
  phone,
  birth_date,
  birth_place,
  vat_number,
  vat_address,
  vat_postal_code,
  vat_city,
  password_hash, 
  password_salt
)
VALUES 
  (
    'Marco', 
    'Rossi', 
    'Marco Rossi Personal Training',
    'pt', 
    'Personal trainer certificato con 10 anni di esperienza. Specializzato in bodybuilding e preparazione atletica per atleti di ogni livello.', 
    'Milano', 
    'entrambi', 
    '€€', 
    4.9, 
    127, 
    ARRAY['bodybuilding', 'preparazione atletica', 'dimagrimento', 'forza'], 
    true, 
    'marco.rossi.demo@performanceprime.it', 
    '+39000000001',
    '1985-03-15',
    'Milano',
    'IT00000000001',
    'Via Demo 1',
    '20100',
    'Milano',
    'demo_hash', 
    'demo_salt'
  ),
  (
    'Laura', 
    'Bianchi', 
    'Studio Nutrizione Laura Bianchi',
    'nutrizionista', 
    'Biologa nutrizionista specializzata in nutrizione sportiva e piani alimentari personalizzati. Approccio scientifico e sostenibile.', 
    'Online', 
    'online', 
    '€€', 
    4.8, 
    98, 
    ARRAY['nutrizione sportiva', 'dimagrimento', 'massa muscolare', 'intolleranze'], 
    true, 
    'laura.bianchi.demo@performanceprime.it', 
    '+39000000002',
    '1990-07-22',
    'Roma',
    'IT00000000002',
    'Via Demo 2',
    '00100',
    'Roma',
    'demo_hash', 
    'demo_salt'
  ),
  (
    'Paolo', 
    'Verdi', 
    'Centro Fisioterapia Sportiva Verdi',
    'fisioterapista', 
    'Fisioterapista sportivo con 15 anni di esperienza in riabilitazione post-infortunio e prevenzione. Collaboro con atleti professionisti.', 
    'Roma', 
    'presenza', 
    '€€€', 
    4.7, 
    156, 
    ARRAY['riabilitazione', 'terapia manuale', 'postura', 'infortuni sportivi'], 
    true, 
    'paolo.verdi.demo@performanceprime.it', 
    '+39000000003',
    '1978-11-08',
    'Napoli',
    'IT00000000003',
    'Via Demo 3',
    '00100',
    'Roma',
    'demo_hash', 
    'demo_salt'
  ),
  (
    'Sara', 
    'Neri', 
    'Sara Neri Mental Coaching',
    'mental_coach', 
    'Mental coach certificata ICF. Aiuto atleti e professionisti a superare blocchi mentali e raggiungere il massimo potenziale.', 
    'Torino', 
    'entrambi', 
    '€€', 
    4.6, 
    67, 
    ARRAY['motivazione', 'gestione stress', 'performance', 'mindset'], 
    true, 
    'sara.neri.demo@performanceprime.it', 
    '+39000000004',
    '1988-05-30',
    'Torino',
    'IT00000000004',
    'Via Demo 4',
    '10100',
    'Torino',
    'demo_hash', 
    'demo_salt'
  ),
  (
    'Luca', 
    'Ferrari', 
    'CrossFit & Functional Training Luca Ferrari',
    'pt', 
    'Istruttore CrossFit Level 2 e personal trainer. Specializzato in allenamenti funzionali ad alta intensità per tutti i livelli.', 
    'Online', 
    'online', 
    '€', 
    4.9, 
    203, 
    ARRAY['crossfit', 'functional training', 'HIIT', 'calisthenics'], 
    true, 
    'luca.ferrari.demo@performanceprime.it', 
    '+39000000005',
    '1992-09-12',
    'Bologna',
    'IT00000000005',
    'Via Demo 5',
    '40100',
    'Bologna',
    'demo_hash', 
    'demo_salt'
  ),
  (
    'Giulia', 
    'Romano', 
    'Studio Dietetico Giulia Romano',
    'nutrizionista', 
    'Dietista con approccio olistico e personalizzato. Creo piani alimentari sostenibili che si adattano al tuo stile di vita.', 
    'Napoli', 
    'entrambi', 
    '€', 
    4.5, 
    89, 
    ARRAY['dieta mediterranea', 'intolleranze', 'vegetariano', 'sport endurance'], 
    true, 
    'giulia.romano.demo@performanceprime.it', 
    '+39000000006',
    '1995-01-18',
    'Napoli',
    'IT00000000006',
    'Via Demo 6',
    '80100',
    'Napoli',
    'demo_hash', 
    'demo_salt'
  )
ON CONFLICT (email) DO UPDATE SET
  bio = EXCLUDED.bio,
  zona = EXCLUDED.zona,
  modalita = EXCLUDED.modalita,
  prezzo_fascia = EXCLUDED.prezzo_fascia,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  specializzazioni = EXCLUDED.specializzazioni,
  attivo = EXCLUDED.attivo;


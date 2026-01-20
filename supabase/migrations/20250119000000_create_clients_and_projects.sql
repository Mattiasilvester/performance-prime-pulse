-- ============================================
-- CREAZIONE TABELLE CLIENTS E PROJECTS
-- Data: 2025-01-19
-- ============================================
-- 
-- Questa migrazione crea:
-- 1. Tabella clients per gestire clienti dei professionisti
-- 2. Tabella projects per gestire progetti dei clienti
-- 3. RLS Policies per sicurezza
-- 4. Indici per performance
-- ============================================

-- ============================================
-- TABELLA CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_pp_subscriber BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: professionisti vedono solo i propri clienti
CREATE POLICY "Professionals can manage their clients" ON clients
  FOR ALL 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: professionisti vedono solo i propri progetti
CREATE POLICY "Professionals can manage their projects" ON projects
  FOR ALL 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_professional ON clients(professional_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_professional ON projects(professional_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================
-- TRIGGER PER UPDATED_AT
-- ============================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


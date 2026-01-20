-- ============================================
-- FIX RLS POLICIES PER TABELLA CLIENTS
-- Data: 2025-01-20
-- ============================================
-- 
-- Problema: Le policies hanno solo USING ma manca WITH CHECK
-- Questo impedisce gli INSERT perché RLS richiede entrambe le clausole
-- ============================================

-- Rimuovi policy esistente
DROP POLICY IF EXISTS "Professionals can manage their clients" ON clients;
DROP POLICY IF EXISTS "Professionals can manage their projects" ON projects;

-- Ricrea policy con USING + WITH CHECK per permettere INSERT/UPDATE/DELETE
CREATE POLICY "Professionals can manage their clients" ON clients
  FOR ALL 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy per progetti
CREATE POLICY "Professionals can manage their projects" ON projects
  FOR ALL 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );


-- =====================================================
-- SUPERADMIN SYSTEM - MIGRATION
-- Data: 14 Gennaio 2025
-- Descrizione: Sistema SuperAdmin completo con sicurezza
-- =====================================================

-- 1. Aggiungi colonna role alla tabella profiles se non esiste
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'premium', 'super_admin'));

-- 2. Crea tabella per audit log amministratori
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crea tabella per sessioni admin
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crea tabella per configurazioni admin
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Abilita Row Level Security
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 6. Policy: solo super_admin può vedere audit logs
CREATE POLICY "Super admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

-- 7. Policy: solo super_admin può gestire sessioni admin
CREATE POLICY "Super admins can manage admin sessions" ON admin_sessions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

-- 8. Policy: solo super_admin può gestire impostazioni admin
CREATE POLICY "Super admins can manage admin settings" ON admin_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

-- 9. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 10. Funzione per pulizia sessioni scadute
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. Funzione per log azioni admin
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Trigger per aggiornare timestamp su admin_settings
CREATE OR REPLACE FUNCTION update_admin_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_settings_timestamp
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_timestamp();

-- 13. Inserisci configurazioni di default
INSERT INTO admin_settings (key, value, description) VALUES
('system_name', '"Performance Prime Pulse"', 'Nome del sistema'),
('admin_email', '"admin@performanceprime.com"', 'Email amministratore principale'),
('max_login_attempts', '3', 'Numero massimo tentativi di login'),
('session_timeout_hours', '4', 'Timeout sessione in ore'),
('maintenance_mode', 'false', 'Modalità manutenzione'),
('backup_frequency', '"daily"', 'Frequenza backup database')
ON CONFLICT (key) DO NOTHING;

-- 14. Crea vista per statistiche admin
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'premium') as premium_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as admin_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
  (SELECT COUNT(*) FROM profiles WHERE last_login >= CURRENT_DATE) as active_users_today,
  (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at >= CURRENT_DATE) as admin_actions_today;

-- 15. Commenti per documentazione
COMMENT ON TABLE admin_audit_logs IS 'Log delle azioni degli amministratori per audit e sicurezza';
COMMENT ON TABLE admin_sessions IS 'Sessioni attive degli amministratori con token sicuri';
COMMENT ON TABLE admin_settings IS 'Configurazioni del sistema amministrativo';
COMMENT ON FUNCTION log_admin_action IS 'Funzione per registrare azioni degli amministratori';
COMMENT ON FUNCTION cleanup_expired_admin_sessions IS 'Funzione per pulire sessioni scadute';

-- 16. RLS per la vista admin_stats
CREATE POLICY "Super admins can view admin stats" ON admin_stats
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

-- =====================================================
-- MIGRATION COMPLETATA
-- =====================================================

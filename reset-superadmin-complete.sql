-- =====================================================
-- RESET COMPLETO SISTEMA SUPERADMIN
-- Esegui questo script nel SQL Editor di Supabase
-- =====================================================

-- 1. PULISCI TUTTO (OPZIONALE - RIMUOVI I COMMENTI SE VUOI RESETTARE)
-- DROP TABLE IF EXISTS admin_audit_logs CASCADE;
-- DROP TABLE IF EXISTS admin_sessions CASCADE;
-- DROP TABLE IF EXISTS admin_settings CASCADE;
-- DROP VIEW IF EXISTS admin_stats CASCADE;

-- 2. AGGIUNGI COLONNA ROLE ALLA TABELLA PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'super_admin'));

-- 3. AGGIUNGI COLONNA LAST_LOGIN ALLA TABELLA PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 4. CREA TABELLA ADMIN_AUDIT_LOGS
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

-- 5. CREA TABELLA ADMIN_SESSIONS
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREA TABELLA ADMIN_SETTINGS
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ABILITA ROW LEVEL SECURITY
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 8. CREA POLICY PER ADMIN_AUDIT_LOGS
DROP POLICY IF EXISTS "Super admins can view audit logs" ON admin_audit_logs;
CREATE POLICY "Super admins can view audit logs" ON admin_audit_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

DROP POLICY IF EXISTS "Super admins can insert audit logs" ON admin_audit_logs;
CREATE POLICY "Super admins can insert audit logs" ON admin_audit_logs FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

-- 9. CREA POLICY PER ADMIN_SESSIONS
DROP POLICY IF EXISTS "Super admins can manage admin sessions" ON admin_sessions;
CREATE POLICY "Super admins can manage admin sessions" ON admin_sessions FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

-- 10. CREA POLICY PER ADMIN_SETTINGS
DROP POLICY IF EXISTS "Super admins can manage admin settings" ON admin_settings;
CREATE POLICY "Super admins can manage admin settings" ON admin_settings FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

-- 11. CREA INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 12. CREA FUNZIONE PER PULIZIA SESSIONI SCADUTE
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 13. CREA FUNZIONE PER LOG AZIONI ADMIN
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
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

-- 14. CREA TRIGGER PER AGGIORNARE TIMESTAMP SU ADMIN_SETTINGS
CREATE OR REPLACE FUNCTION update_admin_settings_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_settings_timestamp ON admin_settings;
CREATE TRIGGER trigger_update_admin_settings_timestamp
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_timestamp();

-- 15. INSERISCI CONFIGURAZIONI DI DEFAULT
INSERT INTO admin_settings (key, value, description) VALUES
  ('system_name', '"Performance Prime Pulse"', 'Nome del sistema'),
  ('admin_email', '"admin@performanceprime.com"', 'Email amministratore principale'),
  ('max_login_attempts', '3', 'Numero massimo tentativi di login'),
  ('session_timeout_hours', '4', 'Timeout sessione in ore'),
  ('maintenance_mode', 'false', 'Modalità manutenzione'),
  ('backup_frequency', '"daily"', 'Frequenza backup database')
ON CONFLICT (key) DO NOTHING;

-- 16. CREA VISTA PER STATISTICHE ADMIN
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'premium') as premium_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as admin_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
  (SELECT COUNT(*) FROM profiles WHERE last_login >= CURRENT_DATE) as active_users_today,
  (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at >= CURRENT_DATE) as admin_actions_today;

-- 17. CREA POLICY PER LA VISTA ADMIN_STATS
DROP POLICY IF EXISTS "Super admins can view admin stats" ON admin_stats;
CREATE POLICY "Super admins can view admin stats" ON admin_stats FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

-- 18. AGGIORNA UN ACCOUNT ESISTENTE A SUPER_ADMIN
UPDATE profiles 
SET 
  role = 'super_admin',
  first_name = 'Mattia',
  last_name = 'Silvestrelli',
  email = 'mattiasilvester@gmail.com',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 19. VERIFICA CHE TUTTO SIA STATO CREATO CORRETTAMENTE
SELECT 'TABELLE CREATE:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_audit_logs', 'admin_sessions', 'admin_settings');

SELECT 'ACCOUNT SUPERADMIN:' as status;
SELECT id, email, first_name, last_name, role, created_at
FROM profiles 
WHERE role = 'super_admin';

SELECT 'CONFIGURAZIONI ADMIN:' as status;
SELECT key, value, description FROM admin_settings;

-- =====================================================
-- SETUP COMPLETATO!
-- =====================================================

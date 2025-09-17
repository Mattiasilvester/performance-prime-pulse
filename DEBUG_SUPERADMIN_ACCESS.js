// 🛡️ DEBUG SCRIPT - Esegui nella console del browser su http://localhost:8080/nexus-prime-control/dashboard

console.log('🔍 DEBUG SUPERADMIN ACCESS');

// 1. Pulisci tutto
localStorage.clear();
sessionStorage.clear();

// 2. Crea sessione SuperAdmin robusta
const adminSession = {
  admin_id: 'admin-bypass-001',
  email: 'mattiasilvester@gmail.com',
  role: 'super_admin',
  logged_at: new Date().toISOString(),
  name: 'Super Admin',
  status: 'active',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ore
};

// 3. Salva la sessione
localStorage.setItem('admin_session', JSON.stringify(adminSession));

console.log('✅ Sessione SuperAdmin creata:', adminSession);

// 4. Forza reload della pagina
console.log('🔄 Ricaricando pagina...');
location.reload();

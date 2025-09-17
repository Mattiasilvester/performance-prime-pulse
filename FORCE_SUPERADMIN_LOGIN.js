// 🚀 SCRIPT FORCE LOGIN SUPERADMIN
// Esegui questo script nella console del browser (F12) su http://localhost:8080/nexus-prime-control

console.log('🛡️ FORZA LOGIN SUPERADMIN...');

// Pulisci sessioni esistenti
localStorage.removeItem('admin_session');
sessionStorage.clear();

// Crea sessione SuperAdmin
const adminSession = {
  admin_id: 'admin-bypass-001',
  email: 'mattiasilvester@gmail.com',
  role: 'super_admin',
  logged_at: new Date().toISOString(),
  name: 'Super Admin',
  status: 'active',
  created_at: new Date().toISOString()
};

// Salva la sessione
localStorage.setItem('admin_session', JSON.stringify(adminSession));

console.log('✅ Sessione SuperAdmin creata:', adminSession);

// Vai direttamente alla dashboard
window.location.href = 'http://localhost:8080/nexus-prime-control/dashboard';

console.log('🚀 Reindirizzamento alla dashboard...');

# 🛡️ SUPERADMIN DEBUG GUIDE - Performance Prime Pulse
# Data: $(date)

## 🚀 SERVERS ATTIVI

### 📱 App Principale
- **URL**: http://localhost:8081/
- **Descrizione**: Applicazione completa con modifiche in tempo reale
- **Utenti**: Registrazione, login, dashboard, workout

### 🛡️ SuperAdmin Dashboard  
- **URL**: http://localhost:8080/nexus-prime-control
- **Descrizione**: Dashboard amministrativo con controllo completo

## 🔐 CREDENZIALI SUPERADMIN

### Dati di Accesso:
- **Email**: mattiasilvester@gmail.com
- **Password**: SuperAdmin2025!
- **Secret Key**: PP_SUPERADMIN_2025_SECURE_KEY_CHANGE_ME

### URL Diretto:
```
http://localhost:8080/nexus-prime-control
```

## 🔧 RISOLUZIONE PROBLEMI

### Problema: "Login non funziona"
**Soluzione 1 - Emergency Bypass Attivo:**
Il sistema ha un emergency bypass integrato che dovrebbe funzionare automaticamente con le credenziali sopra.

**Soluzione 2 - Debug Console:**
1. Apri Developer Tools (F12)
2. Vai alla tab Console
3. Inserisci le credenziali
4. Controlla i log per vedere dove fallisce

**Soluzione 3 - Reset Session:**
```javascript
// Esegui in console del browser
localStorage.removeItem('admin_session');
location.reload();
```

**Soluzione 4 - Force Login:**
```javascript
// Esegui in console del browser su /nexus-prime-control
const adminSession = {
  admin_id: 'admin-bypass-001',
  email: 'mattiasilvester@gmail.com', 
  role: 'super_admin',
  logged_at: new Date().toISOString()
};
localStorage.setItem('admin_session', JSON.stringify(adminSession));
location.reload();
```

## 📊 FUNZIONALITÀ DISPONIBILI

Una volta loggato, dovresti vedere:
- ✅ **Dashboard Real-Time** - Statistiche utenti aggiornate ogni 30 secondi
- ✅ **Gestione Utenti** - Tabella completa con azioni
- ✅ **Monitoring Live** - 65/500 utenti verso obiettivo
- ✅ **Notifiche Visive** - Highlight nuovi utenti
- ✅ **Controlli Manuali** - Refresh immediato

## 🚨 SE CONTINUA A NON FUNZIONARE

1. **Verifica Console Errors**: Controlla F12 > Console per errori JavaScript
2. **Verifica Network**: Controlla F12 > Network per chiamate API fallite  
3. **Verifica Database**: Le variabili d'ambiente Supabase sono corrette
4. **Restart Servers**: Riavvia entrambi i server se necessario

## 📝 VARIABILI AMBIENTE ATTIVE

Le seguenti variabili sono configurate in .env:
- VITE_ADMIN_EMAIL="mattiasilvester@gmail.com"
- VITE_ADMIN_SECRET_KEY="PP_SUPERADMIN_2025_SECURE_KEY_CHANGE_ME" 
- VITE_SUPABASE_URL="https://kfxoyucatvvcgmqalxsg.supabase.co"
- VITE_SUPABASE_SERVICE_ROLE_KEY=[configurata]

Tutto dovrebbe funzionare! 🚀

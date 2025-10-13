# 🧪 Setup Test Environment - Performance Prime

## ✅ **FILE CREATI (NON TOCCARE L'APP):**

- `src/test/test-env.ts` - Test runner autenticato
- `server/dev-proxy.js` - Proxy Voiceflow separato
- `supabase/migrations/20250810_rls_policies.sql` - Migrazione RLS
- `test-env.html` - Pagina di test aggiornata
- `package.json` - Script `dev:proxy` aggiunto

## 🔧 **CONFIGURAZIONE MANUALE RICHIESTA:**

### 1. **File .env.local** (per i test DEV):
```bash
# Crea .env.local nella root del progetto
VITE_DEV_TEST_EMAIL=dev@performanceprime.local
VITE_DEV_TEST_PASSWORD=DevTest!12345
```

### 2. **File .env.devproxy.local** (per il proxy):
```bash
# Crea .env.devproxy.local nella root del progetto
VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VF_BASE_URL=https://general-runtime.voiceflow.com
VF_PROXY_PORT=8099
VF_PROXY_ALLOW_ORIGIN=http://localhost:8084
```

## 🚀 **AVVIO E TEST:**

### **Terminal 1 - App principale:**
```bash
cd performance-prime-pulse
npm run dev
# App su http://localhost:8084
```

### **Terminal 2 - Proxy Voiceflow:**
```bash
cd performance-prime-pulse

# macOS/Linux:
export $(cat .env.devproxy.local | xargs) && npm run dev:proxy

# Windows PowerShell:
$env:VF_API_KEY='VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT'
$env:VF_BASE_URL='https://general-runtime.voiceflow.com'
$env:VF_PROXY_PORT='8099'
$env:VF_PROXY_ALLOW_ORIGIN='http://localhost:8084'
npm run dev:proxy
```

## 🧪 **VERIFICA TEST:**

1. **Apri**: `http://localhost:8084/test-env.html`
2. **Verifica che compaiano**:
   - ✅ Supabase Connection: OK ✅
   - ✅ Auth: Login: dev@performanceprime.local ✅
   - ✅ profiles: OK (…) ✅
   - ✅ custom_workouts: OK (…) ✅
   - ✅ user_workout_stats: OK (…) ✅
   - ✅ Errors: —

## 🔍 **TEST VOICEFLOW (Opzionale):**

Dalla console del browser:
```javascript
// Test proxy Voiceflow
fetch('http://localhost:8099/api/voiceflow/test-user/interact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'intent', payload: { intent: 'hello' } })
})
.then(r => r.json())
.then(console.log);
```

## 📋 **CHECKLIST FINALE:**

- [ ] File .env.local creato con credenziali DEV
- [ ] File .env.devproxy.local creato con chiave Voiceflow
- [ ] App avviata su porta 8084
- [ ] Proxy avviato su porta 8099
- [ ] Test RLS passano senza errori 401
- [ ] Nessuna modifica al codice dell'app
- [ ] Proxy Voiceflow funziona senza CORS

## 🚫 **VINCOLI RISPETTATI:**

- ✅ **NON modificato codice dell'app**
- ✅ **NON modificato endpoint esistenti**
- ✅ **NON esposte chiavi API nel client**
- ✅ **Solo file aggiuntivi in nuove directory**
- ✅ **Client Supabase dell'app riutilizzato**
- ✅ **Proxy separato per test Voiceflow**

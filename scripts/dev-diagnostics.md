# 🔧 Scripts di Diagnostica - Performance Prime Pulse

## 🚀 Comandi di Sviluppo

### Ambiente e Dipendenze
```bash
# Verificare versioni
node --version
npm --version
npx supabase --version

# Installare dipendenze
npm install

# Aggiornare dipendenze
npm update
```

### Build e Test
```bash
# Build di produzione
npm run build

# Preview build locale
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Fix automatico linting
npm run lint -- --fix
```

### Sviluppo Locale
```bash
# Avvio server di sviluppo
npm run dev

# Avvio con porta specifica
npm run dev -- --port 8080

# Avvio con host esposto
npm run dev -- --host 0.0.0.0

# Avvio landing page
npm run dev:landing
```

## 🔍 Diagnostica Supabase

### Verifica Connessione
```bash
# Test connessione Supabase
npx supabase status

# Verificare progetti
npx supabase projects list

# Verificare configurazione locale
npx supabase init
```

### Database
```bash
# Generare tipi TypeScript
npx supabase gen types typescript --project-id kfxoyucatvvcgmqalxsg > src/integrations/supabase/types.ts

# Verificare migrazioni
npx supabase migration list

# Applicare migrazioni
npx supabase db push
```

### Auth e RLS
```bash
# Verificare policies RLS
npx supabase db diff --schema public

# Reset database (ATTENZIONE: Cancella tutti i dati)
npx supabase db reset
```

## 🐛 Debug e Troubleshooting

### Log e Monitoraggio
```bash
# Verificare log Supabase
npx supabase logs

# Monitorare errori in tempo reale
npx supabase logs --follow

# Verificare metriche
npx supabase metrics
```

### CORS e Network
```bash
# Test CORS con curl
curl -H "Origin: http://localhost:8080" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://kfxoyucatvvcgmqalxsg.supabase.co/rest/v1/profiles

# Verificare endpoint
curl -H "apikey: YOUR_ANON_KEY" \
     https://kfxoyucatvvcgmqalxsg.supabase.co/rest/v1/profiles
```

### Performance
```bash
# Analisi bundle
npm run build && npx vite-bundle-analyzer dist

# Verificare dimensioni
du -sh dist/*
du -sh dist/assets/*

# Test performance locale
npm run preview && lighthouse http://localhost:4173
```

## 🔧 Comandi di Manutenzione

### Pulizia
```bash
# Pulire node_modules
rm -rf node_modules package-lock.json && npm install

# Pulire cache Vite
rm -rf node_modules/.vite

# Pulire build
rm -rf dist

# Pulire cache Supabase
npx supabase stop && npx supabase start
```

### Backup e Restore
```bash
# Backup database
npx supabase db dump --file backup.sql

# Restore database
npx supabase db reset --file backup.sql

# Backup tipi
cp src/integrations/supabase/types.ts types-backup-$(date +%Y%m%d).ts
```

## 🚨 Comandi di Emergenza

### Reset Completo
```bash
# Stop tutti i servizi
npx supabase stop

# Pulizia completa
rm -rf node_modules dist .vite
npm install

# Restart servizi
npx supabase start
npm run dev
```

### Fix CORS
```bash
# Verificare configurazione CORS
curl -I https://kfxoyucatvvcgmqalxsg.supabase.co/rest/v1/profiles

# Test con header Origin
curl -H "Origin: http://localhost:8080" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://kfxoyucatvvcgmqalxsg.supabase.co/rest/v1/profiles
```

### Fix Sessioni
```bash
# Pulire localStorage (nel browser)
localStorage.clear();
sessionStorage.clear();

# Oppure usa il tool di pulizia
open http://localhost:8080/clear-auth.html
```

## 📊 Analisi e Report

### Bundle Analysis
```bash
# Analisi dettagliata
npm run build
npx vite-bundle-analyzer dist

# Verificare chunk size
ls -la dist/assets/ | grep -E '\.(js|css)$'

# Gzip test
gzip -c dist/assets/index-*.js | wc -c
```

### TypeScript
```bash
# Verificare errori TS
npx tsc --noEmit

# Verificare con strict mode
npx tsc --noEmit --strict

# Generare report
npx tsc --noEmit --listFiles > ts-files.txt
```

### Dependencies
```bash
# Verificare vulnerabilità
npm audit

# Fix automatico
npm audit fix

# Verificare dipendenze obsolete
npm outdated

# Aggiornare dipendenze
npm update
```

## 🔐 Sicurezza

### Verifica Chiavi
```bash
# Verificare che le chiavi non siano esposte
grep -r "VITE_SUPABASE_SERVICE_ROLE_KEY" src/
grep -r "sk-" .env*

# Verificare file sensibili
find . -name "*.env*" -exec grep -l "sk-" {} \;
```

### Audit Sicurezza
```bash
# Audit dipendenze
npm audit

# Verificare CSP
curl -I http://localhost:8080 | grep -i content-security-policy

# Test XSS
# (Usare strumenti esterni come OWASP ZAP)
```

## 📱 Test Mobile

### Responsive Design
```bash
# Test con viewport mobile
npm run dev
# Aprire DevTools → Toggle device toolbar
# Testare su iPhone SE, iPad, etc.
```

### Performance Mobile
```bash
# Lighthouse mobile
npm run preview
lighthouse http://localhost:4173 --view --form-factor=mobile
```

## 🚀 Deploy e Produzione

### Pre-deploy Check
```bash
# Verificare build
npm run build

# Test locale
npm run preview

# Verificare env vars
grep -r "VITE_" .env*

# Test funzionalità critiche
# - Login/Logout
# - Dashboard
# - PrimeBot
# - Admin panel
```

### Post-deploy Verification
```bash
# Verificare deploy
curl -I https://your-domain.vercel.app

# Test CORS in produzione
curl -H "Origin: https://your-domain.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://kfxoyucatvvcgmqalxsg.supabase.co/rest/v1/profiles

# Verificare funzionalità
# - Autenticazione
# - Database queries
# - File upload
# - Real-time updates
```

## 📝 Log e Debug

### Console Debug
```javascript
// Nel browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('User session:', await window.supabase.auth.getSession());
console.log('LocalStorage:', Object.keys(localStorage));
```

### Network Debug
```javascript
// Intercettare richieste Supabase
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args);
};
```

### Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Inviare a servizio di monitoring
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Inviare a servizio di monitoring
});
```

## 🔄 Automazione

### Script di Setup
```bash
#!/bin/bash
# setup-dev.sh
echo "🚀 Setting up development environment..."

# Install dependencies
npm install

# Start Supabase
npx supabase start

# Generate types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Start dev server
npm run dev

echo "✅ Development environment ready!"
```

### Script di Test
```bash
#!/bin/bash
# test-all.sh
echo "🧪 Running all tests..."

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Preview test
npm run preview &
sleep 5
curl -f http://localhost:4173 || exit 1
kill %1

echo "✅ All tests passed!"
```

---

**Note:** Sostituire `YOUR_ANON_KEY`, `YOUR_TOKEN`, `your-domain.vercel.app` con i valori reali del progetto.

**Ultimo aggiornamento:** 17 Gennaio 2025














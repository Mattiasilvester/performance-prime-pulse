# Configurazione Variabili d'Ambiente - Performance Prime

## 📋 **Setup Variabili d'Ambiente**

### 1. **Crea il file `.env`**

Crea un file `.env` nella root del progetto con il seguente contenuto:

```env
# Performance Prime - Environment Variables
# Sviluppo Locale

# Supabase Configuration
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY

# App Configuration
VITE_APP_NAME=Performance Prime
VITE_APP_VERSION=1.1.0
VITE_APP_ENV=development

# URLs Configuration
VITE_APP_URL=http://localhost:8080
VITE_DASHBOARD_URL=http://localhost:8080/app
VITE_LANDING_URL=http://localhost:8080

# Feature Flags
VITE_ENABLE_AI_COACH=true
VITE_ENABLE_WORKOUT_TRACKING=true
VITE_ENABLE_ACHIEVEMENTS=true
```

### 2. **Configurazione Produzione**

Per la produzione, crea un file `.env.production`:

```env
# Performance Prime - Production Environment

# Supabase Configuration
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY

# App Configuration
VITE_APP_NAME=Performance Prime
VITE_APP_VERSION=1.1.0
VITE_APP_ENV=production

# URLs Configuration
VITE_APP_URL=https://performanceprime.it
VITE_DASHBOARD_URL=https://performanceprime.it/app
VITE_LANDING_URL=https://performanceprime.it

# Feature Flags
VITE_ENABLE_AI_COACH=true
VITE_ENABLE_WORKOUT_TRACKING=true
VITE_ENABLE_ACHIEVEMENTS=true
```

## 🔧 **Variabili Disponibili**

### **Supabase**
- `VITE_SUPABASE_URL` - URL del progetto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chiave anonima Supabase

### **App Configuration**
- `VITE_APP_NAME` - Nome dell'applicazione
- `VITE_APP_VERSION` - Versione dell'app
- `VITE_APP_ENV` - Ambiente (development/production)

### **URLs**
- `VITE_APP_URL` - URL base dell'app
- `VITE_DASHBOARD_URL` - URL della dashboard
- `VITE_LANDING_URL` - URL della landing page

### **Feature Flags**
- `VITE_ENABLE_AI_COACH` - Abilita AI Coach
- `VITE_ENABLE_WORKOUT_TRACKING` - Abilita tracking workout
- `VITE_ENABLE_ACHIEVEMENTS` - Abilita achievements

## 🚀 **Utilizzo nel Codice**

```typescript
// Accedi alle variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appName = import.meta.env.VITE_APP_NAME;

// Usa la configurazione centralizzata
import { config } from '@/lib/config';
const dashboardUrl = config.getDashboardUrl();
```

## ⚠️ **Note Importanti**

1. **Sicurezza**: Il file `.env` è già nel `.gitignore`
2. **Prefisso VITE_**: Solo le variabili con prefisso `VITE_` sono accessibili nel browser
3. **Fallback**: Il codice ha fallback per tutte le variabili
4. **Hot Reload**: Le modifiche al `.env` richiedono riavvio del server

## 🔄 **Riavvio Server**

Dopo aver creato/modificato il file `.env`:

```bash
pkill -f "vite"
npm run dev
```

## 📝 **Verifica Configurazione**

Controlla che le variabili siano caricate correttamente:

```javascript
// Nella console del browser
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('App Name:', import.meta.env.VITE_APP_NAME);
``` 
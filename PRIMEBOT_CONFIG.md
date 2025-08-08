# 🚀 PRIMEBOT CONFIGURATION GUIDE

## 📁 File .env da Creare

Crea un file `.env` nella root del progetto con questo contenuto:

```env
# ========================================
# PRIMEBOT CONFIGURATION
# ========================================

# Voiceflow API Configuration
VITE_VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VITE_VF_VERSION_ID=64dbb6696a8fab0013dba194

# Supabase Configuration (già configurato nel progetto)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# ========================================
# DEVELOPMENT SETTINGS
# ========================================

# App Mode (development/production)
VITE_APP_MODE=development

# ========================================
# ANALYTICS (temporaneamente disabilitato)
# ========================================

# Plausible Analytics
# VITE_PLAUSIBLE_DOMAIN=performanceprime.it
# VITE_PLAUSIBLE_SCRIPT=https://plausible.io/js/script.js

# ========================================
# FEATURE FLAGS
# ========================================

# Enable/Disable features
VITE_ENABLE_PRIMEBOT=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_FILE_ANALYSIS=true

# ========================================
# SECURITY
# ========================================

# CORS Settings
VITE_ALLOWED_ORIGINS=http://localhost:8082,https://performanceprime.it

# ========================================
# PERFORMANCE
# ========================================

# Cache settings
VITE_CACHE_DURATION=3600
VITE_MAX_FILE_SIZE=10485760
```

## 🔧 Passi per Attivare PrimeBot

### 1. Crea il file .env
```bash
# Nella root del progetto
touch .env
```

### 2. Copia la configurazione
Copia il contenuto sopra nel file `.env`

### 3. Configura Supabase
Sostituisci con i tuoi valori Supabase:
- `VITE_SUPABASE_URL` → Il tuo URL Supabase
- `VITE_SUPABASE_ANON_KEY` → La tua chiave anonima

### 4. Verifica Voiceflow
I valori Voiceflow sono già configurati:
- `VITE_VF_API_KEY` → API Key Voiceflow
- `VITE_VF_VERSION_ID` → Version ID del progetto

### 5. Riavvia il server
```bash
npm run dev
```

## 🧪 Test PrimeBot

### URL di Test
- **Locale:** `http://localhost:8082/ai-coach`
- **Produzione:** `https://performanceprime.it/ai-coach`

### Funzionalità da Testare
1. **Click sulla chat** → Modal full-screen
2. **Quick replies** → Bottoni suggerimenti
3. **Input manuale** → Scrivi messaggi
4. **Fallback** → Se Voiceflow non funziona

### Messaggi di Test
- "Come posso migliorare la mia resistenza?"
- "Quale workout è meglio per oggi?"
- "Consigli per la nutrizione pre-allenamento"
- "Come posso raggiungere i miei obiettivi?"

## 🔍 Debug

### Se PrimeBot non funziona:
1. **Controlla console browser** → Errori JavaScript
2. **Verifica .env** → Variabili caricate correttamente
3. **Testa Supabase** → Connessione auth
4. **Testa Voiceflow** → API response

### Log di Debug
```javascript
// Nel browser console
console.log('Voiceflow API Key:', import.meta.env.VITE_VF_API_KEY);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

## 🚀 Deploy su Lovable

### Variabili d'Ambiente su Lovable
Aggiungi queste variabili nel pannello Lovable:

```env
VITE_VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VITE_VF_VERSION_ID=64dbb6696a8fab0013dba194
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ENABLE_PRIMEBOT=true
```

### Build e Deploy
```bash
npm run build:public
npm run deploy:lovable
```

## ✅ Checklist Attivazione

- [ ] File `.env` creato
- [ ] Variabili Supabase configurate
- [ ] Server riavviato (`npm run dev`)
- [ ] Test locale funzionante
- [ ] Deploy su Lovable con variabili
- [ ] Test produzione funzionante

## 🎯 Risultato Atteso

Dopo l'attivazione dovresti vedere:
- ✅ Chat PrimeBot funzionante
- ✅ Quick replies interattivi
- ✅ Modal full-screen al click
- ✅ Messaggi utente/bot corretti
- ✅ Fallback se Voiceflow offline

**PrimeBot è pronto per essere attivato! 🚀**

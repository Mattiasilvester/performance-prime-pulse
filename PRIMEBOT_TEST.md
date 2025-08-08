# 🧪 PRIMEBOT TEST GUIDE

## ✅ Attivazione Completata!

### 📁 File Configurati
- ✅ **`.env`** - Variabili d'ambiente configurate
- ✅ **`src/components/PrimeChat.tsx`** - Componente integrato
- ✅ **`src/lib/voiceflow.ts`** - API Voiceflow
- ✅ **`src/lib/supabase.ts`** - Client Supabase

### 🔧 Configurazione Applicata

```env
# Voiceflow API Configuration
VITE_VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VITE_VF_VERSION_ID=64dbb6696a8fab0013dba194

# Supabase Configuration
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogG

# Feature Flags
VITE_ENABLE_PRIMEBOT=true
VITE_APP_MODE=development
```

## 🧪 Test PrimeBot

### 1. Test Locale
```bash
# Vai su
http://localhost:8082/ai-coach
```

### 2. Funzionalità da Verificare

#### ✅ Chat Visibile
- [ ] Componente PrimeChat renderizzato
- [ ] Header "AI Coach Prime" visibile
- [ ] Quick replies bottoni presenti

#### ✅ Interazione Chat
- [ ] Click sulla chat → Modal full-screen
- [ ] Quick replies funzionanti
- [ ] Input manuale accetta messaggi
- [ ] Risposte bot ricevute

#### ✅ Voiceflow Integration
- [ ] Bootstrap utente automatico
- [ ] Messaggi inviati a Voiceflow
- [ ] Risposte parse correttamente
- [ ] Fallback se Voiceflow offline

### 3. Debug Console

Apri la console del browser e verifica:

```javascript
// Verifica configurazione
console.log('PrimeBot Config:', {
  vfApiKey: import.meta.env.VITE_VF_API_KEY ? '✅' : '❌',
  vfVersionId: import.meta.env.VITE_VF_VERSION_ID ? '✅' : '❌',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌',
  enablePrimeBot: import.meta.env.VITE_ENABLE_PRIMEBOT
});

// Verifica Supabase
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Voiceflow API Key:', import.meta.env.VITE_VF_API_KEY);
```

### 4. Messaggi di Test

Prova questi messaggi nella chat:

1. **"Come posso migliorare la mia resistenza?"**
2. **"Quale workout è meglio per oggi?"**
3. **"Consigli per la nutrizione pre-allenamento"**
4. **"Come posso raggiungere i miei obiettivi?"**

## 🚀 Deploy su Lovable

### Variabili per Lovable Dashboard

Aggiungi queste variabili su Lovable:

```env
VITE_VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VITE_VF_VERSION_ID=64dbb6696a8fab0013dba194
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogG
VITE_ENABLE_PRIMEBOT=true
VITE_APP_MODE=production
```

### Deploy Steps
```bash
npm run build:public
npm run deploy:lovable
```

## 🎯 Risultato Atteso

Dopo l'attivazione dovresti vedere:

- ✅ **Chat PrimeBot** funzionante su `localhost:8082/ai-coach`
- ✅ **Modal full-screen** al click sulla chat
- ✅ **Quick replies** interattivi
- ✅ **Voiceflow integration** attiva
- ✅ **Fallback locale** se Voiceflow offline
- ✅ **UI nero/oro** coerente con il design

## 🔍 Troubleshooting

### Se PrimeBot non funziona:

1. **Verifica .env** → File presente e configurato
2. **Riavvia server** → `npm run dev`
3. **Clear cache** → Ctrl+F5 nel browser
4. **Check console** → Errori JavaScript
5. **Test Supabase** → Connessione auth

### Errori Comuni

| Errore | Soluzione |
|--------|-----------|
| `VITE_VF_API_KEY is undefined` | Verifica file .env |
| `Supabase connection failed` | Controlla URL e chiave |
| `Component not rendering` | Verifica VITE_ENABLE_PRIMEBOT=true |
| `Voiceflow API error` | Controlla API key e version ID |

## ✅ Checklist Finale

- [ ] File `.env` configurato correttamente
- [ ] Server riavviato con nuove variabili
- [ ] Test locale su `localhost:8082/ai-coach`
- [ ] Chat PrimeBot visibile e funzionante
- [ ] Modal full-screen attivo
- [ ] Quick replies interattivi
- [ ] Messaggi inviati e risposte ricevute
- [ ] Console browser senza errori
- [ ] Deploy su Lovable (quando pronto)

**PrimeBot è ora completamente attivo! 🚀**

### 🎉 Prossimi Passi

1. **Testa localmente** → `http://localhost:8082/ai-coach`
2. **Verifica funzionalità** → Chat, modal, quick replies
3. **Deploy su Lovable** → Aggiungi variabili e deploy
4. **Test produzione** → `https://performanceprime.it/ai-coach`

**PrimeBot è pronto per l'uso! 🎯**

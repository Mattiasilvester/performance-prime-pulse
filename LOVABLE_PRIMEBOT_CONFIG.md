# 🚀 LOVABLE PRIMEBOT CONFIGURATION

## 📋 Variabili d'Ambiente per Lovable

Aggiungi queste variabili nel pannello di controllo Lovable:

### 🔧 Environment Variables

```env
VITE_VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VITE_VF_VERSION_ID=64dbb6696a8fab0013dba194
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ENABLE_PRIMEBOT=true
VITE_APP_MODE=production
```

### 📍 Dove Aggiungere su Lovable

1. **Vai su Lovable Dashboard**
2. **Seleziona il progetto** `performance-prime-pulse`
3. **Settings** → **Environment Variables**
4. **Aggiungi ogni variabile** una per una

### 🔑 Chiavi Specifiche

| Variabile | Valore | Descrizione |
|-----------|--------|-------------|
| `VITE_VF_API_KEY` | `VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT` | Voiceflow API Key |
| `VITE_VF_VERSION_ID` | `64dbb6696a8fab0013dba194` | Voiceflow Version ID |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | **SOSTITUISCI** con il tuo URL |
| `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | **SOSTITUISCI** con la tua chiave |
| `VITE_ENABLE_PRIMEBOT` | `true` | Abilita PrimeBot |
| `VITE_APP_MODE` | `production` | Modalità produzione |

## 🚀 Deploy Steps

### 1. Configura Variabili
```bash
# Aggiungi le variabili su Lovable Dashboard
# Environment Variables → Add Variable
```

### 2. Build Locale (Test)
```bash
npm run build:public
```

### 3. Deploy su Lovable
```bash
npm run deploy:lovable
```

### 4. Verifica Deploy
- Vai su `https://performanceprime.it/ai-coach`
- Testa la chat PrimeBot
- Verifica quick replies e modal

## 🧪 Test Post-Deploy

### URL di Test
- **Produzione:** `https://performanceprime.it/ai-coach`
- **Locale:** `http://localhost:8082/ai-coach`

### Funzionalità da Verificare
1. ✅ **Chat visibile** → Componente renderizzato
2. ✅ **Click modal** → Full-screen funzionante
3. ✅ **Quick replies** → Bottoni interattivi
4. ✅ **Input manuale** → Messaggi inviati
5. ✅ **Risposte bot** → Voiceflow o fallback
6. ✅ **UI responsive** → Mobile/desktop

### Debug Console
```javascript
// Apri console browser su performanceprime.it
console.log('PrimeBot Config:', {
  vfApiKey: import.meta.env.VITE_VF_API_KEY ? '✅' : '❌',
  vfVersionId: import.meta.env.VITE_VF_VERSION_ID ? '✅' : '❌',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌',
  enablePrimeBot: import.meta.env.VITE_ENABLE_PRIMEBOT
});
```

## 🔧 Troubleshooting

### Se PrimeBot non funziona:

#### 1. Verifica Variabili
```bash
# Su Lovable Dashboard
Settings → Environment Variables
# Controlla che tutte le variabili siano presenti
```

#### 2. Rebuild e Redeploy
```bash
npm run build:public
npm run deploy:lovable
```

#### 3. Clear Cache
- **Browser:** Ctrl+F5 o Cmd+Shift+R
- **Lovable:** Settings → Clear Cache

#### 4. Check Console Errors
```javascript
// Console browser
console.error('PrimeBot Error:', error);
```

### Errori Comuni

| Errore | Soluzione |
|--------|-----------|
| `VITE_VF_API_KEY is undefined` | Aggiungi variabile su Lovable |
| `Supabase connection failed` | Verifica URL e chiave Supabase |
| `Voiceflow API error` | Controlla API key e version ID |
| `Component not rendering` | Verifica `VITE_ENABLE_PRIMEBOT=true` |

## ✅ Checklist Deploy

- [ ] Variabili aggiunte su Lovable
- [ ] Build locale testato
- [ ] Deploy completato
- [ ] Test produzione funzionante
- [ ] Console error-free
- [ ] Responsive design OK

## 🎯 Risultato Finale

Dopo il deploy dovresti vedere:
- ✅ **Chat PrimeBot** su `performanceprime.it/ai-coach`
- ✅ **Modal full-screen** al click
- ✅ **Quick replies** funzionanti
- ✅ **Voiceflow integration** attiva
- ✅ **Fallback locale** se Voiceflow offline

**PrimeBot è ora live su performanceprime.it! 🚀**

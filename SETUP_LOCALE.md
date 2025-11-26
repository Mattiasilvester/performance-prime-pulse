# 🚀 SETUP SVILUPPO LOCALE - Performance Prime Pulse

## ✅ Configurazione Completata

Ho configurato tutto per il testing locale **senza bisogno di deploy su Vercel**! 

---

## 📝 CONFIGURAZIONE VARIABILI D'AMBIENTE

### Aggiungi OPENAI_API_KEY al file `.env`

Apri il file `.env` nella root del progetto e assicurati di avere:

```bash
# Supabase (già configurate)
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (DA CONFIGURARE - OBBLIGATORIO!)
OPENAI_API_KEY=sk-tua-chiave-api-openai-qui
```

**⚠️ IMPORTANTE:** 
- Sostituisci `sk-tua-chiave-api-openai-qui` con la tua chiave API OpenAI reale
- Non committare mai il file `.env` con la chiave reale!
- La chiave `OPENAI_API_KEY` viene letta dal server proxy locale (`server/api-proxy.js`)

---

## 🚀 COMANDO PER AVVIARE L'APP LOCALE

### ⚡ SOLUZIONE CONSIGLIATA: Server Proxy Manuale

**Terminal 1 - Server API Proxy (AVVIA PRIMA):**
```bash
npm run dev:api
```

Dovresti vedere:
```
🚀 [API Proxy] Server locale per OpenAI API in ascolto su http://localhost:3001
📡 Proxy endpoint: http://localhost:3001/api/ai-chat
```

**Terminal 2 - App Vite:**
```bash
npm run dev
```

Dovresti vedere:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:8080/
```

---

## 🌐 URL PER TESTARE

**App principale:** http://localhost:8080

**Come funziona:**
1. Il frontend chiama `/api/ai-chat` (gestito da Vite proxy)
2. Vite proxy inoltra la richiesta a `localhost:3001/api/ai-chat`
3. Il server proxy (`server/api-proxy.js`) legge `OPENAI_API_KEY` dal `.env`
4. Il server proxy chiama l'API OpenAI direttamente
5. La risposta viene ritornata al frontend

**✅ Vantaggi:**
- Funziona completamente in locale
- Non serve deploy su Vercel
- Hot reload funzionante
- Stessa esperienza di produzione
- Modifiche istantanee senza attese

---

## 🔄 SOLUZIONE CONSIGLIATA: Server Proxy Manuale

**⚠️ IMPORTANTE:** Per lavorare in locale senza deploy, usa questa configurazione:

### Terminal 1 - Server API Proxy (DEVE essere avviato per primo):
```bash
npm run dev:api
```

Questo avvia il server proxy su `http://localhost:3001` che gestisce le chiamate a OpenAI usando `OPENAI_API_KEY` dal file `.env`.

### Terminal 2 - App Vite:
```bash
npm run dev
```

Questo avvia Vite su `http://localhost:8080` con proxy configurato per `/api/ai-chat` → `localhost:3001`.

### URL per testare:
**App principale:** http://localhost:8080

**Come funziona:**
1. Il frontend chiama `/api/ai-chat` (gestito da Vite proxy)
2. Vite proxy inoltra la richiesta a `localhost:3001/api/ai-chat`
3. Il server proxy (`server/api-proxy.js`) legge `OPENAI_API_KEY` dal `.env`
4. Il server proxy chiama l'API OpenAI direttamente
5. La risposta viene ritornata al frontend

**✅ Vantaggi:**
- Funziona completamente in locale
- Non serve deploy su Vercel
- Hot reload funzionante
- Stessa esperienza di produzione

---

## ✅ VERIFICA CONFIGURAZIONE

### Checklist:

- [ ] Vercel CLI installato (`vercel --version`)
- [ ] File `.env` presente nella root del progetto
- [ ] `OPENAI_API_KEY` configurata nel `.env`
- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurate

---

## 🐛 RISOLUZIONE PROBLEMI

### Problema: "vercel: command not found"
**Soluzione:** Installa Vercel CLI: `npm i -g vercel`

### Problema: "OPENAI_API_KEY not configured"
**Soluzione:** 
1. Aggiungi `OPENAI_API_KEY` al file `.env`
2. Riavvia `vercel dev`
3. Verifica che il file `.env` sia nella root del progetto

### Problema: "Port already in use"
**Soluzione:** 
- Vercel Dev userà automaticamente una porta disponibile
- Oppure termina il processo che usa la porta: `lsof -ti:3000 | xargs kill`

### Problema: "API route returns 404"
**Soluzione:** 
- Assicurati di usare `vercel dev` e non `npm run dev`
- Verifica che i file in `/api` siano corretti
- Controlla i log di Vercel Dev per errori

### Problema: "CORS error"
**Soluzione:** 
- Con `vercel dev`, CORS è gestito automaticamente
- Se usi il proxy manuale, verifica `ALLOW_ORIGIN` in `server/api-proxy.js`

---

## 📝 NOTE IMPORTANTI

1. **Ordine di avvio:**
   - **PRIMA** avvia `npm run dev:api` (Terminal 1)
   - **POI** avvia `npm run dev` (Terminal 2)
   - Se avvii nell'ordine sbagliato, vedrai errori 404

2. **Hot Reload:**
   - Vite supporta hot reload automatico per modifiche al codice frontend
   - Le modifiche a `server/api-proxy.js` richiedono riavvio del Terminal 1
   - Le modifiche al codice React si aggiornano automaticamente

3. **Variabili d'ambiente:**
   - Le variabili `VITE_*` sono disponibili nel frontend
   - `OPENAI_API_KEY` è disponibile solo nel server proxy (server-side)
   - Il file `.env` viene letto automaticamente da Node.js

4. **Produzione:**
   - In produzione su Vercel, le API routes (`/api/*`) funzionano come serverless functions
   - Il server proxy locale (`server/api-proxy.js`) NON viene deployato
   - Le variabili d'ambiente sono configurate su Vercel Dashboard

---

## 🎯 TEST RAPIDO

1. Aggiungi `OPENAI_API_KEY` al file `.env` (sostituisci il placeholder)
2. **Terminal 1:** Esegui `npm run dev:api` e verifica che sia su `localhost:3001`
3. **Terminal 2:** Esegui `npm run dev` e verifica che sia su `localhost:8080`
4. Apri http://localhost:8080 nel browser
5. Vai su PrimeBot e chiedi "mi crei un piano di allenamento"
6. Verifica che funzioni senza errori 404!

---

## 🔄 ALTERNATIVA: Vercel Dev (opzionale)

Se preferisci usare `vercel dev` invece del proxy manuale:

```bash
npm i -g vercel
npm run dev:vercel
```

**Nota:** Vercel Dev simula l'ambiente di produzione ma può avere problemi con Vite. Il proxy manuale è più affidabile per sviluppo locale.

---

## 📚 DOCUMENTAZIONE VERCEL DEV

Per maggiori informazioni:
- https://vercel.com/docs/cli/dev
- https://vercel.com/docs/functions/runtimes/node-js

---

**Pronto per testare con Vercel Dev! 🚀**

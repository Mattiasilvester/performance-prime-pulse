# 🚀 SETUP SVILUPPO LOCALE - Performance Prime Pulse

## ✅ Configurazione Completata

Ho configurato tutto per il testing locale con **Vercel Dev**! Questo simula esattamente l'ambiente di produzione.

---

## 🔧 INSTALLAZIONE VERCEL CLI

### 1. Installa Vercel CLI (se non già installato):

```bash
npm i -g vercel
```

### 2. Verifica installazione:

```bash
vercel --version
```

---

## 📝 CONFIGURAZIONE VARIABILI D'AMBIENTE

### Aggiungi OPENAI_API_KEY al file `.env`

Apri il file `.env` e assicurati di avere:

```bash
# Supabase (già configurate)
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (DA CONFIGURARE)
OPENAI_API_KEY=sk-tua-chiave-api-openai-qui
```

**⚠️ IMPORTANTE:** 
- Non committare mai il file `.env` con la chiave reale!
- La chiave `OPENAI_API_KEY` viene letta automaticamente da Vercel Dev

---

## 🚀 COMANDO PER AVVIARE L'APP LOCALE

### Usa Vercel Dev (consigliato):

```bash
npm run dev:vercel
```

Oppure direttamente:

```bash
vercel dev
```

**Cosa fa:**
- ✅ Avvia Vite per il frontend React
- ✅ Simula le API routes di Vercel (`/api/*`)
- ✅ Carica automaticamente le variabili d'ambiente da `.env`
- ✅ Simula esattamente l'ambiente di produzione

---

## 🌐 URL PER TESTARE

Quando esegui `vercel dev`, vedrai un output simile a:

```
Vercel CLI 32.x.x
> Ready! Available at http://localhost:3000
```

**App principale:** http://localhost:3000 (o la porta indicata da Vercel)

**Nota:** Vercel Dev potrebbe usare una porta diversa da 8080. Controlla l'output del comando.

---

## 🔄 ALTERNATIVE (se vercel dev non funziona)

### Opzione B: Server Proxy Manuale

Se preferisci non usare Vercel Dev, puoi usare il server proxy manuale:

**Terminal 1 - Server API Proxy:**
```bash
npm run dev:api
```

**Terminal 2 - App Vite:**
```bash
npm run dev
```

Poi apri: http://localhost:8080

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

1. **Vercel Dev vs npm run dev:**
   - `npm run dev` → Solo frontend, API routes NON funzionano
   - `vercel dev` → Frontend + API routes funzionanti ✅

2. **Hot Reload:**
   - Vercel Dev supporta hot reload per modifiche al codice
   - Le modifiche alle API routes richiedono riavvio

3. **Variabili d'ambiente:**
   - Vercel Dev legge automaticamente da `.env`
   - Le variabili `VITE_*` sono disponibili nel frontend
   - Le variabili senza `VITE_` (come `OPENAI_API_KEY`) sono disponibili solo server-side

4. **Produzione:**
   - In produzione su Vercel, tutto funziona automaticamente
   - Le API routes sono deployate come serverless functions

---

## 🎯 TEST RAPIDO

1. Installa Vercel CLI: `npm i -g vercel`
2. Aggiungi `OPENAI_API_KEY` al `.env`
3. Esegui: `npm run dev:vercel`
4. Apri l'URL mostrato da Vercel (es. http://localhost:3000)
5. Vai su PrimeBot e chiedi "mi crei un piano di allenamento"
6. Verifica che funzioni senza errori!

---

## 📚 DOCUMENTAZIONE VERCEL DEV

Per maggiori informazioni:
- https://vercel.com/docs/cli/dev
- https://vercel.com/docs/functions/runtimes/node-js

---

**Pronto per testare con Vercel Dev! 🚀**

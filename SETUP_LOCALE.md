# 🚀 SETUP SVILUPPO LOCALE - Performance Prime Pulse

## ✅ Configurazione Completata

Ho configurato tutto per il testing locale! Ecco cosa è stato fatto:

### 📁 File Creati/Modificati:
- ✅ `server/api-proxy.js` - Server proxy locale per API OpenAI
- ✅ `vite.config.ts` - Aggiunto proxy per `/api/ai-chat`
- ✅ `package.json` - Aggiunti script `dev:api` e `dev:all`
- ✅ `.env` - Aggiunto placeholder per `OPENAI_API_KEY`

---

## 🔧 CONFIGURAZIONE FINALE RICHIESTA

### 1. Aggiungi OPENAI_API_KEY al file `.env`

Apri il file `.env` e sostituisci `your_openai_api_key_here` con la tua chiave API OpenAI:

```bash
OPENAI_API_KEY=sk-tua-chiave-api-openai-qui
```

**⚠️ IMPORTANTE:** Non committare mai il file `.env` con la chiave reale!

---

## 🚀 COMANDI PER AVVIARE L'APP LOCALE

### Opzione 1: Avvio Manuale (2 terminali)

**Terminal 1 - Server API Proxy:**
```bash
npm run dev:api
```
Questo avvia il server proxy su `http://localhost:3001` che gestisce le chiamate a OpenAI.

**Terminal 2 - App Vite:**
```bash
npm run dev
```
Questo avvia Vite su `http://localhost:8080`.

### Opzione 2: Avvio Automatico (1 comando)

```bash
npm run dev:all
```
Questo avvia sia il server API proxy che Vite contemporaneamente.

---

## 🌐 URL PER TESTARE

- **App principale:** http://localhost:8080
- **API Proxy:** http://localhost:3001/api/ai-chat

---

## ✅ VERIFICA CONFIGURAZIONE

### Variabili d'ambiente necessarie nel `.env`:

```bash
# Supabase (già configurate)
VITE_SUPABASE_URL=https://kfxoyucatvvcgmqalxsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (DA AGGIUNGERE)
OPENAI_API_KEY=sk-tua-chiave-api-openai-qui
```

---

## 🐛 RISOLUZIONE PROBLEMI

### Problema: "OPENAI_API_KEY not configured"
**Soluzione:** Aggiungi `OPENAI_API_KEY` al file `.env` e riavvia il server.

### Problema: "Cannot connect to API proxy"
**Soluzione:** Assicurati che `npm run dev:api` sia in esecuzione prima di avviare Vite.

### Problema: "CORS error"
**Soluzione:** Il proxy è configurato per `http://localhost:8080`. Se usi una porta diversa, modifica `ALLOW_ORIGIN` in `server/api-proxy.js`.

### Problema: Porta 8080 già in uso
**Soluzione:** Modifica la porta in `vite.config.ts` (riga 49) o termina il processo che usa la porta 8080.

---

## 📝 NOTE IMPORTANTI

1. **Server API Proxy:** Deve essere sempre in esecuzione quando testi PrimeBot localmente
2. **Hot Reload:** Vite supporta hot reload automatico per le modifiche al codice
3. **Log:** I log del server API proxy appaiono nel terminal dove hai eseguito `npm run dev:api`
4. **Produzione:** In produzione su Vercel, l'endpoint `/api/ai-chat` usa le serverless functions di Vercel

---

## 🎯 TEST RAPIDO

1. Aggiungi `OPENAI_API_KEY` al `.env`
2. Esegui `npm run dev:all`
3. Apri http://localhost:8080
4. Vai su PrimeBot e chiedi "mi crei un piano di allenamento"
5. Verifica che funzioni senza errori!

---

**Pronto per testare! 🚀**


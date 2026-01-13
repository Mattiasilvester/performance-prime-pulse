# 🚀 PrimeBot - Setup Backend Server

## ❌ ERRORE COMUNE

Se vedi questo errore:
```
Proxy error: AggregateError [ECONNREFUSED]
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Significa che il server backend non è in ascolto sulla porta 3001.**

---

## ✅ SOLUZIONE RAPIDA

### Opzione 1: Un Solo Comando (CONSIGLIATO)

Apri un terminale e esegui:
```bash
npm run dev:all
```

Questo avvia automaticamente:
- ✅ Server API Proxy su `localhost:3001`
- ✅ App Vite su `localhost:8080`

### Opzione 2: Due Terminali Separati

**Terminal 1 - Server API Proxy:**
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

---

## 📝 CONFIGURAZIONE RICHIESTA

### File `.env` nella root del progetto

Assicurati di avere:
```bash
OPENAI_API_KEY=sk-tua-chiave-api-openai-qui
```

**⚠️ IMPORTANTE:**
- Sostituisci `sk-tua-chiave-api-openai-qui` con la tua chiave API OpenAI reale
- Non committare mai il file `.env` con la chiave reale!

---

## 🔍 COME FUNZIONA

1. Il frontend chiama `/api/ai-chat` (gestito da Vite proxy)
2. Vite proxy inoltra la richiesta a `localhost:3001/api/ai-chat`
3. Il server proxy (`server/api-proxy.js`) legge `OPENAI_API_KEY` dal `.env`
4. Il server proxy chiama l'API OpenAI direttamente
5. La risposta viene ritornata al frontend

---

## 🐛 RISOLUZIONE PROBLEMI

### Problema: "OPENAI_API_KEY not configured"

**Soluzione:**
1. Aggiungi `OPENAI_API_KEY` al file `.env`
2. Riavvia il server proxy (`npm run dev:api`)

### Problema: "Port 3001 already in use"

**Soluzione:**
- Chiudi altri processi sulla porta 3001
- Oppure modifica `API_PROXY_PORT` nel `.env`

### Problema: "ECONNREFUSED 127.0.0.1:3001"

**Soluzione:**
- Avvia il server proxy con `npm run dev:api`
- Verifica che il server sia in ascolto su `localhost:3001`

---

## 📚 FILE IMPORTANTI

- `server/api-proxy.js` - Server proxy locale per OpenAI API
- `api/ai-chat.ts` - Serverless function per Vercel (produzione)
- `vite.config.ts` - Configurazione proxy Vite
- `src/lib/openai-service.ts` - Servizio frontend per chiamate OpenAI

---

## 🎯 PRODUZIONE

In produzione (Vercel), il proxy non è necessario perché:
- Vercel usa le serverless functions (`api/ai-chat.ts`)
- La chiave API è configurata nelle variabili d'ambiente Vercel
- Non serve avviare server separati

---

**Ultimo aggiornamento:** 8 Gennaio 2025


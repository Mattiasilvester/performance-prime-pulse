# 🔧 CONFIGURAZIONE CORS SUPABASE

## 🚨 PROBLEMA
Il proxy Vite causa errore 431 (Request Header Fields Too Large) con token di 70KB.

## ✅ SOLUZIONE
Usare URL diretto Supabase e configurare CORS nel Dashboard.

---

## 📋 STEP PER CONFIGURARE CORS

### **STEP 1: Vai su Supabase Dashboard**
1. Apri [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il progetto: `kfxoyucatvvcgmqalxsg`
3. Vai su **Settings** → **API**

### **STEP 2: Configura CORS Origins**
1. Trova la sezione **CORS Origins**
2. Aggiungi questi URL:
   ```
   http://localhost:8080
   http://localhost:3000
   http://127.0.0.1:8080
   http://127.0.0.1:3000
   https://your-domain.com (per produzione)
   ```

### **STEP 3: Salva le modifiche**
1. Clicca **Save** o **Update**
2. Aspetta 1-2 minuti per la propagazione

### **STEP 4: Testa la configurazione**
1. Ricarica la pagina `http://localhost:8080`
2. Apri DevTools → Network
3. Verifica che le richieste vadano a `https://kfxoyucatvvcgmqalxsg.supabase.co`
4. NON dovrebbero più esserci errori CORS

---

## 🔍 VERIFICA CONFIGURAZIONE

### **Se CORS è configurato correttamente:**
- ✅ Richieste vanno a `https://kfxoyucatvvcgmqalxsg.supabase.co`
- ✅ Nessun errore CORS in console
- ✅ Login funziona
- ✅ Dashboard mostra nome utente

### **Se CORS non è configurato:**
- ❌ Errore: `Access to fetch at 'https://kfxoyucatvvcgmqalxsg.supabase.co' has been blocked by CORS policy`
- ❌ Login non funziona
- ❌ Redirect a `/auth`

---

## 🚀 ALTERNATIVA: SCRIPT AUTOMATICO

Se non riesci ad accedere al Dashboard, posso creare uno script per configurare CORS via API.

**Dimmi se hai accesso al Supabase Dashboard o se preferisci lo script automatico.**

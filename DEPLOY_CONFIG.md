# Configurazione Deploy MVP Performance Prime

## 🎯 **Problema Identificato**

**Situazione attuale:**
- `performanceprime.it` → Landing page ✅
- `performance-prime-pulse.lovable.app` → Landing page ❌ (dovrebbe essere MVP)
- Bottone "Scansiona e inizia ora" → Non funziona ❌

## 🛠️ **Soluzione**

### **1. Deploy MVP Corretto su Lovable**

**Progetto da deployare:** `performance-prime-pulse` (questo progetto)
**URL di destinazione:** `https://performance-prime-pulse.lovable.app`

**Configurazione richiesta:**
- Route `/` → Reindirizza a `/auth` (login)
- Route `/auth` → Pagina di login/registrazione
- Route `/dashboard` → Dashboard (protetta)
- Route `/landing` → Landing page (se richiesta esplicitamente)

### **2. Verifica Deploy**

**Test da eseguire dopo il deploy:**

#### **Test 1: Root dell'MVP**
```
https://performance-prime-pulse.lovable.app/
```
**Risultato atteso:** Reindirizza a `/auth` (login)

#### **Test 2: Login Diretto**
```
https://performance-prime-pulse.lovable.app/auth
```
**Risultato atteso:** Pagina di login/registrazione

#### **Test 3: Dashboard**
```
https://performance-prime-pulse.lovable.app/dashboard
```
**Risultato atteso:** Dashboard (se autenticato) o redirect al login

#### **Test 4: Landing Esplicita**
```
https://performance-prime-pulse.lovable.app/landing
```
**Risultato atteso:** Landing page

### **3. Configurazione File**

**File da verificare nel deploy:**
- `src/App.tsx` → Router dual
- `src/PublicApp.tsx` → MVP pubblico
- `src/DevApp.tsx` → Modalità sviluppo
- `src/pages/Auth.tsx` → Login/registrazione
- `src/pages/Dashboard.tsx` → Dashboard

### **4. Environment Variables**

**Configurazione produzione:**
```javascript
// src/config/environments.js
production: {
  APP_URL: 'https://performance-prime-pulse.lovable.app',
  MVP_URL: 'https://performance-prime-pulse.lovable.app/auth',
  DASHBOARD_URL: 'https://performance-prime-pulse.lovable.app/dashboard',
  LANDING_URL: 'https://performance-prime-pulse.lovable.app/landing',
}
```

### **5. Test Completo**

#### **Flusso Utente Corretto:**
1. Utente va su `https://performanceprime.it`
2. Clicca "Scansiona e inizia ora"
3. Si apre `https://performance-prime-pulse.lovable.app/auth`
4. Utente fa login/registrazione
5. Accede alla dashboard

#### **Flusso MVP Diretto:**
1. Utente va su `https://performance-prime-pulse.lovable.app`
2. Reindirizza automaticamente a `/auth`
3. Utente fa login/registrazione
4. Accede alla dashboard

## 🚀 **Prossimi Passi**

1. **Deploy progetto su Lovable** con configurazione corretta
2. **Verifica routing** dell'MVP
3. **Test bottone** dalla landing page
4. **Test flusso completo** utente

## ⚠️ **Note Importanti**

- **Non deployare la landing page** su `performance-prime-pulse.lovable.app`
- **Deployare l'MVP completo** con routing corretto
- **Verificare che `/auth`** mostri la pagina di login
- **Testare il bottone** dalla landing page

---

**Status:** ⚠️ In attesa di deploy corretto su Lovable
**Prossimo:** Deploy MVP e test completo 
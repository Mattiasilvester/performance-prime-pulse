# Configurazione Produzione Performance Prime

## 🎯 **Struttura URLs Produzione**

### **1. Landing Page**
```
https://performanceprime.it
```
**Contenuto:** Landing page con bottone "Scansiona e inizia ora"

### **2. MVP App**
```
https://performance-prime-pulse.lovable.app
```
**Contenuto:** App completa con login, dashboard, etc.

### **3. Flusso Utente**
```
performanceprime.it → "Scansiona e inizia ora" → performance-prime-pulse.lovable.app/auth
```

## 🔧 **Configurazione Implementata**

### **Landing Page (performanceprime.it)**
- **Bottone principale:** Punta a `https://performance-prime-pulse.lovable.app/auth`
- **Link diretto:** Punta a `https://performance-prime-pulse.lovable.app/auth`
- **QR Code:** Punta a `https://performance-prime-pulse.lovable.app/auth`

### **MVP App (performance-prime-pulse.lovable.app)**
- **Route `/`:** Reindirizza a `/auth` (HomePage)
- **Route `/auth`:** Pagina di login/registrazione
- **Route `/app`:** Dashboard (protetta)
- **Route `/landing`:** Landing page (se richiesta esplicitamente)

## 🧪 **Test Produzione**

### **Test 1: Landing Page**
1. Vai su `https://performanceprime.it`
2. Clicca "Scansiona e inizia ora"
3. **Risultato atteso:** Si apre `https://performance-prime-pulse.lovable.app/auth`

### **Test 2: MVP Diretto**
1. Vai su `https://performance-prime-pulse.lovable.app`
2. **Risultato atteso:** Reindirizza a `/auth` (login)

### **Test 3: Login MVP**
1. Vai su `https://performance-prime-pulse.lovable.app/auth`
2. **Risultato atteso:** Pagina di login/registrazione

## 📋 **Logs Attesi**

### **Da performanceprime.it:**
```
🌐 Rilevato performanceprime.it - Punto all'MVP Lovable
🚀 Ambiente: Produzione
📱 Aprendo MVP Login: https://performance-prime-pulse.lovable.app/auth
```

### **Da performance-prime-pulse.lovable.app:**
```
🏠 HomePage MVP caricata
🌐 URL corrente: https://performance-prime-pulse.lovable.app/
🔍 Controllo autenticazione...
🔑 Utente non autenticato, redirect a login
```

## ⚠️ **Note Importanti**

### **Deploy Requirements:**
1. **Landing Page:** Deploy su `performanceprime.it`
2. **MVP App:** Deploy su `performance-prime-pulse.lovable.app`
3. **Routing:** MVP deve avere route `/auth` e `/app` funzionanti

### **Environment Variables:**
```javascript
// Development
MVP_URL: 'http://localhost:8081/auth'

// Production  
MVP_URL: 'https://performance-prime-pulse.lovable.app/auth'
```

### **Hostname Detection:**
```javascript
if (window.location.hostname === 'performanceprime.it') {
  // Punta all'MVP su Lovable
  mvpUrl = 'https://performance-prime-pulse.lovable.app/auth';
} else {
  // Usa configurazione normale
  mvpUrl = config.MVP_URL;
}
```

## ✅ **Status**

- ✅ **Locale:** Funziona su `localhost:8081`
- ✅ **Landing Page:** Configurata per puntare all'MVP
- 🔄 **Produzione:** In attesa di deploy su Lovable
- 🔄 **Test:** Da verificare dopo deploy

---

**Prossimo:** Deploy su Lovable e test finale produzione 
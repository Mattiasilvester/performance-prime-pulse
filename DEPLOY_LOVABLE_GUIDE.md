# 🚀 Guida Deploy Lovable - Performance Prime

## 📋 **PREREQUISITI**

- ✅ Progetto configurato con separazione pubblico/sviluppo
- ✅ Build pubblico funzionante
- ✅ File `.deployignore` configurato
- ✅ Script `npm run build:public` testato

## 🎯 **PROCEDURA DEPLOY**

### **1. Build Pubblico**
```bash
npm run build:public
```
Questo comando:
- ✅ Esclude tutti i file di sviluppo (`src/development/`)
- ✅ Usa solo `src/public/` e `src/shared/`
- ✅ Genera build ottimizzato per produzione
- ✅ Crea `dist/` pulito per Lovable

### **2. Verifica Build**
```bash
# Controlla che non ci siano file di sviluppo
grep -r "development\|DevApp\|DevToolbar" dist/

# Controlla la struttura
ls -la dist/
```

### **3. Deploy su Lovable**

#### **Opzione A: Deploy Manuale**
1. Vai su [Lovable Dashboard](https://lovable.app)
2. Seleziona il progetto `performance-prime-pulse`
3. Clicca **"Publish"**
4. Lovable userà automaticamente il contenuto di `dist/`

#### **Opzione B: Deploy Automatico**
```bash
npm run deploy:lovable
```
Questo comando:
- ✅ Esegue `npm run build:public`
- ✅ Prepara il build per Lovable
- ✅ Mostra messaggio di conferma

## 🔧 **CONFIGURAZIONE**

### **File Configurati:**

#### **vite.config.ts**
```typescript
// Esclude file di sviluppo in produzione
external: (id) => {
  if (process.env.NODE_ENV === 'production') {
    return id.includes('/development/') || 
           id.includes('/DevApp') ||
           id.includes('/DevToolbar');
  }
  return false;
}
```

#### **src/App.tsx**
```typescript
// In produzione, usa sempre PublicApp
if (process.env.NODE_ENV === 'production') {
  return <PublicApp />;
}
```

#### **.deployignore**
```
src/development/
src/DevApp.tsx
src/PublicApp.tsx
src/components/DevTools*
src/components/DevToolbar*
```

## 🌐 **URL FINALI**

### **Produzione (Lovable)**
- **Landing:** `https://performance-prime-pulse.lovable.app/`
- **Login:** `https://performance-prime-pulse.lovable.app/auth`
- **Dashboard:** `https://performance-prime-pulse.lovable.app/dashboard`

### **Sviluppo (Locale)**
- **Dev Mode:** `http://localhost:8081/dev/dashboard`
- **Public Mode:** `http://localhost:8081/`

## ✅ **CHECKLIST PRE-DEPLOY**

- [ ] ✅ `npm run build:public` eseguito senza errori
- [ ] ✅ Nessun file di sviluppo in `dist/`
- [ ] ✅ `.deployignore` configurato
- [ ] ✅ `src/App.tsx` usa PublicApp in produzione
- [ ] ✅ `vite.config.ts` esclude file sviluppo
- [ ] ✅ Script `deploy:lovable` funzionante

## 🚨 **TROUBLESHOOTING**

### **Errore: "Cannot find module"**
```bash
# Reinstalla dependencies
npm install

# Pulisci cache
npm run build:public -- --force
```

### **Errore: "File di sviluppo nel build"**
```bash
# Verifica .deployignore
cat .deployignore

# Ricostruisci
rm -rf dist/
npm run build:public
```

### **Errore: "Routing non funziona"**
```bash
# Verifica src/App.tsx
# Assicurati che usi PublicApp in produzione
```

## 📊 **MONITORING POST-DEPLOY**

### **Test URL**
1. **Landing:** `https://performance-prime-pulse.lovable.app/`
2. **Login:** `https://performance-prime-pulse.lovable.app/auth`
3. **Dashboard:** `https://performance-prime-pulse.lovable.app/dashboard`

### **Verifica Funzionalità**
- ✅ Landing page carica correttamente
- ✅ Bottone "Scansiona e inizia ora" funziona
- ✅ Login/registrazione funziona
- ✅ Dashboard accessibile dopo login
- ✅ QR code funziona

## 🎉 **DEPLOY COMPLETATO**

Una volta completato il deploy:
- ✅ Solo contenuto pubblico online
- ✅ Nessun file di sviluppo visibile
- ✅ Performance ottimizzata
- ✅ Routing pulito e funzionante

---

**Ultimo aggiornamento:** 30 Luglio 2025
**Versione:** 1.0.0
**Status:** ✅ Pronto per Deploy 
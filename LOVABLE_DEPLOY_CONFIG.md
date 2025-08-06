# 🚀 LOVABLE DEPLOY CONFIGURATION

## 📋 CONFIGURAZIONE LOVABLE - APP UNIFICATA

### **ENTRY POINT CORRETTO**
- **File HTML:** `index.html` (entry point principale)
- **Entry Script:** `src/main.tsx` (app unificata)
- **App Component:** `src/App.tsx` (include landing + MVP)

### **BUILD CONFIGURAZIONE**
- **Config File:** `vite.config.ts`
- **Build Command:** `npm run build:public`
- **Output:** `dist/index.html`

### **LOVABLE SETTINGS**

#### **Source Folder:**
```
/ (root del progetto)
```

#### **Entry File:**
```
index.html
```

#### **Build Command:**
```bash
npm run build:public
```

#### **Output Directory:**
```
dist/
```

### **VERIFICA DEPLOY**

1. **Entry Point Corretto:**
   - ✅ `index.html` → `src/main.tsx`
   - ✅ App unificata con landing + MVP

2. **Build App Unificata:**
   - ✅ `npm run build:public`
   - ✅ Include landing page + MVP dashboard

3. **Output Files:**
   - ✅ `dist/index.html`
   - ✅ `dist/assets/App-*.js`
   - ✅ `dist/assets/index-*.js`
   - ✅ `dist/assets/landing-*.js`

### **DIFFERENZE MVP vs LANDING**

| Feature | MVP Dashboard | Landing Page |
|---------|---------------|--------------|
| **Entry** | `index.html` | `landing.html` |
| **Script** | `src/main.tsx` | `src/landing-main.tsx` |
| **App** | `src/App.tsx` | `src/landing/App.tsx` |
| **Config** | `vite.config.ts` | `vite.config.landing.ts` |
| **Port** | 8080 | 8081 |
| **Build** | `npm run build` | `npm run build:landing` |

### **COMANDI DEPLOY**

```bash
# Build App Unificata per Lovable
npm run build:public

# Deploy su Lovable
npm run deploy:lovable

# Verifica build
ls -la dist/
```

### **STRUTTURA FINALE**

```
dist/
├── index.html           # ← ENTRY POINT LOVABLE
├── assets/
│   ├── App-*.js        # MVP dashboard bundle
│   ├── index-*.js      # App principale bundle
│   ├── landing-*.js    # Landing page bundle
│   └── *.css           # Styles unificati
└── (altri file statici)
```

---

**✅ APP UNIFICATA:** `performanceprime.it` ora include landing + auth + MVP tutto insieme! 
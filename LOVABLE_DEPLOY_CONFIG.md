# 🚀 LOVABLE DEPLOY CONFIGURATION

## 📋 CONFIGURAZIONE LOVABLE - LANDING PAGE

### **ENTRY POINT CORRETTO**
- **File HTML:** `landing.html` (NON `index.html`)
- **Entry Script:** `src/landing-main.tsx` (NON `src/main.tsx`)
- **App Component:** `src/landing/App.tsx`

### **BUILD CONFIGURAZIONE**
- **Config File:** `vite.config.landing.ts`
- **Build Command:** `npm run build:landing`
- **Output:** `dist/landing.html`

### **LOVABLE SETTINGS**

#### **Source Folder:**
```
/ (root del progetto)
```

#### **Entry File:**
```
landing.html
```

#### **Build Command:**
```bash
npm run build:landing
```

#### **Output Directory:**
```
dist/
```

### **VERIFICA DEPLOY**

1. **Entry Point Corretto:**
   - ✅ `landing.html` → `src/landing-main.tsx`
   - ❌ NON `index.html` → `src/main.tsx`

2. **Build Landing Page:**
   - ✅ `npm run build:landing`
   - ❌ NON `npm run build`

3. **Output Files:**
   - ✅ `dist/landing.html`
   - ✅ `dist/assets/main-*.js`
   - ✅ `dist/assets/main-*.css`

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
# Build Landing Page per Lovable
npm run build:landing

# Deploy su Lovable
npm run deploy:lovable

# Verifica build
ls -la dist/
```

### **STRUTTURA FINALE**

```
dist/
├── landing.html          # ← ENTRY POINT LOVABLE
├── assets/
│   ├── main-*.js        # Landing page bundle
│   └── main-*.css       # Landing page styles
└── (altri file statici)
```

---

**⚠️ IMPORTANTE:** Lovable deve usare `landing.html` come entry point, NON `index.html`! 
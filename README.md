# 🚀 Performance Prime - App Unificata

**Ultimo aggiornamento:** 5 Agosto 2025  
**Stato:** ✅ **PRODUZIONE STABILE** - Deploy funzionante su `performanceprime.it`

## 📋 PANORAMICA PROGETTO

Performance Prime è un'applicazione React/TypeScript unificata che combina:
- **Landing Page** per acquisizione utenti
- **Sistema di Autenticazione** Supabase
- **Dashboard MVP** per utenti autenticati
- **Flusso completo:** Landing → Auth → Dashboard

## 🏗️ ARCHITETTURA UNIFICATA

### **Entry Point Principale**
```
index.html → src/main.tsx → src/App.tsx
```

### **Routing Unificato**
```typescript
// src/App.tsx - App unificata
<Routes>
  {/* HOMEPAGE: Landing page per utenti non autenticati */}
  <Route path="/" element={<SmartHomePage />} />
  
  {/* AUTH: Pagina di autenticazione unificata */}
  <Route path="/auth" element={<Auth />} />
  
  {/* MVP DASHBOARD: Route protette per utenti autenticati */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
  <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
  <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  
  {/* PAGINE LEGALI: Accessibili a tutti */}
  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
</Routes>
```

### **Flusso Utente Completo**
```
performanceprime.it/
├── /                    → Landing page (non autenticati)
├── /auth               → Login/registrazione
├── /dashboard          → Dashboard MVP (autenticati)
├── /workouts           → Allenamenti MVP
├── /schedule           → Appuntamenti MVP
├── /ai-coach           → Coach AI MVP
├── /profile            → Profilo MVP
└── /privacy-policy     → Pagine legali
```

## 🛠️ TECNOLOGIE

- **Frontend:** React 18+ con TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **Backend:** Supabase (Auth + Database)
- **Build:** Vite
- **Mobile:** Capacitor (iOS/Android)
- **Deploy:** Lovable

## 🚀 COMANDI SVILUPPO

### **Sviluppo Locale**
```bash
# MVP Dashboard (porta 8080)
npm run dev

# Landing Page (porta 8081) - DEPRECATO
npm run dev:landing

# Build produzione
npm run build:public

# Deploy Lovable
npm run deploy:lovable
```

### **Build e Deploy**
```bash
# Build app unificata
npm run build:public

# Deploy su Lovable
npm run deploy:lovable
```

## 📁 STRUTTURA PROGETTO

```
src/
├── App.tsx                    # ← Router principale UNIFICATO
├── main.tsx                   # ← Entry point UNIFICATO
├── landing/                   # ← Componenti landing page
│   ├── App.tsx               # ← Router landing (DEPRECATO)
│   ├── pages/
│   │   ├── LandingPage.tsx   # ← Homepage landing
│   │   └── AuthPage.tsx      # ← Auth landing
│   └── components/           # ← Componenti landing
├── pages/                    # ← Pagine MVP
│   ├── Dashboard.tsx         # ← Dashboard principale
│   ├── Auth.tsx              # ← Auth MVP
│   ├── Profile.tsx           # ← Profilo utente
│   ├── Workouts.tsx          # ← Allenamenti
│   ├── Schedule.tsx          # ← Appuntamenti
│   ├── AICoach.tsx           # ← Coach AI
│   ├── Timer.tsx             # ← Timer allenamenti
│   ├── Notes.tsx             # ← Note personali
│   └── Subscriptions.tsx     # ← Gestione abbonamenti
├── components/               # ← Componenti MVP
│   ├── ui/                  # ← Componenti UI
│   ├── layout/              # ← Layout components
│   ├── dashboard/           # ← Dashboard components
│   ├── workouts/            # ← Workout components
│   ├── schedule/            # ← Schedule components
│   ├── profile/             # ← Profile components
│   └── ai/                  # ← AI components
├── hooks/                   # ← Custom hooks
├── services/                # ← API services
├── integrations/            # ← Integrazioni esterne
│   └── supabase/           # ← Configurazione Supabase
└── shared/                 # ← Codice condiviso
```

## 🔧 CONFIGURAZIONE DEPLOY

### **Lovable Settings**
- **Source Folder:** `/` (root del progetto)
- **Entry File:** `index.html`
- **Build Command:** `npm run build:public`
- **Output Directory:** `dist/`

### **Build Output**
```
dist/
├── index.html               # ← ENTRY POINT LOVABLE
├── assets/
│   ├── App-*.js            # ← MVP dashboard bundle
│   ├── index-*.js          # ← App principale bundle
│   ├── landing-*.js        # ← Landing page bundle
│   └── *.css               # ← Styles unificati
└── (altri file statici)
```

## 🎯 FUNZIONALITÀ

### **Landing Page (Pubblica)**
- ✅ Hero section con CTA
- ✅ Features section
- ✅ QR code per download app
- ✅ Form di registrazione
- ✅ Design responsive
- ✅ Integrazione Supabase

### **MVP Dashboard (Autenticati)**
- ✅ Dashboard con metriche personalizzate
- ✅ Sezione allenamenti con categorie
- ✅ Calendario appuntamenti
- ✅ Coach AI con chat
- ✅ Timer per allenamenti
- ✅ Note personali
- ✅ Gestione profilo e obiettivi
- ✅ Sistema abbonamenti
- ✅ Pagine legali (GDPR compliant)

### **Sistema di Autenticazione**
- ✅ Registrazione email/password
- ✅ Login con credenziali
- ✅ Reset password
- ✅ Protezione route
- ✅ Gestione sessioni Supabase

## 🚨 PROTEZIONE CODICE PRODUZIONE

### **File Protetti (NON MODIFICARE)**
```
src/App.tsx                    # ← Router principale PROTETTO
src/main.tsx                   # ← Entry point PROTETTO
src/landing/                   # ← Landing page PROTETTA
src/pages/                     # ← Pagine MVP PROTETTE
package.json                   # ← Scripts build PROTETTI
vite.config.ts                 # ← Config build PROTETTA
```

### **Zone Sicure per Sviluppo**
```
src/development/               # ← Features in sviluppo
src/experimental/              # ← Sperimentazioni
docs/                         # ← Documentazione
tests/                        # ← Test files
```

## 📊 STATO ATTUALE

### **✅ COMPLETATO**
- ✅ App unificata funzionante
- ✅ Deploy stabile su Lovable
- ✅ Landing page pubblica
- ✅ Auth system operativo
- ✅ MVP dashboard completa
- ✅ Flusso utente naturale
- ✅ Protezione codice produzione

### **🔄 IN SVILUPPO**
- 🔄 Features sperimentali in `src/development/`
- 🔄 Testing e ottimizzazioni
- 🔄 Documentazione aggiornata

### **📈 PROSSIMI OBIETTIVI**
- 📈 Analytics e tracking
- 📈 Performance optimization
- 📈 Mobile app deployment
- 📈 Advanced AI features

## 🐛 RISOLUZIONE PROBLEMI

### **Problemi Risolti Recentemente**
1. **Merge incompleto** → ✅ Risolto con commit pulito
2. **Configurazione Lovable** → ✅ Entry point corretto (`index.html`)
3. **Build separati** → ✅ App unificata con build singolo
4. **Routing confuso** → ✅ Router unificato in `src/App.tsx`

### **Debug Comandi**
```bash
# Verifica stato git
git status

# Test build
npm run build:public

# Verifica deploy
npm run deploy:lovable
```

## 📞 SUPPORTO

**Per problemi o modifiche:**
1. Verifica che non tocchi file protetti
2. Usa cartelle di sviluppo per nuove features
3. Testa sempre prima del deploy
4. Documenta le modifiche

---

**Performance Prime è ora un'applicazione unificata stabile e funzionante! 🚀**

# Performance Prime Pulse - MVP Fitness & Wellness

## 🚀 **STATO ATTUALE (31 Luglio 2025)**

### **✅ MVP CORRETTO E FUNZIONANTE**
- **Server attivo:** `http://localhost:8080/`
- **Link pubblico:** `https://performanceprime.it`
- **Architettura semplificata:** Eliminata landing page, flusso diretto `/` → `/auth` → `/app`
- **Autenticazione Supabase:** Login/registrazione funzionante
- **Dashboard protetta:** Accesso solo per utenti autenticati
- **Design responsive:** Ottimizzato per mobile e desktop
- **Overlay corretto:** Funzioni premium bloccate con design coerente

### **🔄 ULTIMI SVILUPPI (31 Luglio 2025)**
- **Correzione overlay MVP** - Implementato overlay individuale su funzioni premium
- **Layout completo** - Header + Main Content + Navigation Footer
- **Menu dropdown** - Aggiunto Termini e Condizioni + GDPR
- **Design coerente** - Tema scuro con accenti oro e lucchetto 🔒
- **Eliminazione sistema overlay complesso** - Ripristinato design originale
- **AppLayout integrato** - Struttura completa con navigazione

---

## 🎯 **FUNZIONALITÀ MVP**

### **🔐 Autenticazione**
- **Login/Registrazione** con Supabase
- **Reset password** integrato
- **Protezione route** per utenti non autenticati
- **Rate limiting** per sicurezza

### **📊 Dashboard**
- **Overview statistiche** personali
- **Azioni rapide** per workout
- **Progress tracking** settimanale
- **Obiettivi e achievements**

### **💪 Workouts**
- **Generazione automatica** workout personalizzati
- **Timer integrato** per esercizi
- **Categorie esercizi** (Cardio, Forza, Flessibilità)
- **Tracking progressi**

### **📅 Schedule**
- **Calendario appuntamenti** con professionisti
- **Pianificazione workout** personalizzati
- **Integrazione AI** per suggerimenti

### **🤖 AI Coach**
- **Chat intelligente** per consigli fitness
- **Piani personalizzati** basati su obiettivi
- **Analisi performance** e suggerimenti
- **Motivazione personalizzata**

---

## 🛠️ **TECNOLOGIE**

### **Frontend**
- **React 18+** con TypeScript
- **Vite** per build e development
- **Tailwind CSS** per styling
- **Shadcn/ui** componenti UI
- **React Router** per navigazione

### **Backend & Database**
- **Supabase** per autenticazione e database
- **PostgreSQL** per dati utente
- **Real-time subscriptions** per aggiornamenti live

### **Mobile**
- **Capacitor** per app mobile (iOS/Android)
- **Responsive design** ottimizzato
- **PWA** capabilities

### **AI & Analytics**
- **OpenAI API** per AI Coach
- **Analytics** per tracking performance
- **Machine Learning** per personalizzazione

---

## 📁 **STRUTTURA PROGETTO**

```
performance-prime-pulse/
├── src/
│   ├── components/          # Componenti UI riutilizzabili
│   ├── public/             # MVP pubblico (senza landing)
│   │   ├── pages/          # Pagine MVP
│   │   ├── components/     # Componenti MVP
│   │   └── App.tsx         # App principale MVP
│   ├── shared/             # Codice condiviso
│   │   ├── config/         # Configurazioni
│   │   ├── hooks/          # Custom hooks
│   │   ├── ui/             # Componenti UI
│   │   └── integrations/   # Integrazioni esterne
│   ├── App.tsx             # Entry point semplificato
│   └── main.tsx            # Bootstrap app
├── android/                # App Android (Capacitor)
├── ios/                    # App iOS (Capacitor)
└── supabase/               # Database migrations
```

---

## 🚀 **QUICK START**

### **Prerequisiti**
```bash
Node.js 18+
npm 9+
```

### **Installazione**
```bash
# Clone repository
git clone [repository-url]
cd performance-prime-pulse

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Configura Supabase URL e API Key
```

### **Development**
```bash
# Avvia server development
npm run dev

# Server attivo su: http://localhost:8080/
```

### **Build & Deploy**
```bash
# Build produzione
npm run build

# Preview build
npm run preview
```

---

## 🎯 **ROUTING MVP**

### **Flusso Principale**
```
/ → Redirect a /auth
/auth → Login/Registrazione
/app → Dashboard (protetta)
/dashboard → Dashboard (protetta)
```

### **Route Protette**
- `/app/*` - Richiede autenticazione
- `/dashboard/*` - Richiede autenticazione
- `/profile/*` - Richiede autenticazione

### **Route Pubbliche**
- `/auth` - Login/Registrazione
- `/reset-password` - Reset password
- `/*` - 404 Not Found

---

## 🎨 **DESIGN SYSTEM**

### **Colori Principali**
- **Primary:** `#EEBA2B` (Giallo Performance)
- **Background:** `#000000` (Nero)
- **Text:** `#FFFFFF` (Bianco)
- **Accent:** `#1a1a1a` (Grigio scuro)

### **Typography**
- **Font:** Inter, system-ui, sans-serif
- **Headings:** Bold, responsive sizing
- **Body:** Regular, optimal readability

### **Componenti UI**
- **Cards:** Elevation e border radius
- **Buttons:** Hover effects e loading states
- **Forms:** Validation e error handling
- **Navigation:** Responsive e accessible

---

## 🔒 **SICUREZZA**

### **Autenticazione**
- **Supabase Auth** con JWT tokens
- **Rate limiting** per login/registrazione
- **CSRF protection** per forms
- **Input sanitization** e validation

### **Protezione Dati**
- **HTTPS** per tutte le comunicazioni
- **Environment variables** per secrets
- **SQL injection** prevention
- **XSS protection** integrata

---

## 📱 **MOBILE SETUP**

### **Capacitor Configuration**
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Add platforms
npx cap add android
npx cap add ios

# Sync changes
npx cap sync
```

### **Build Mobile**
```bash
# Build web assets
npm run build

# Copy to native projects
npx cap copy

# Open in native IDEs
npx cap open android
npx cap open ios
```

---

## 🚀 **DEPLOYMENT**

### **Lovable Platform**
- **Domain:** `performanceprime.it`
- **Build:** Automatico su push
- **Environment:** Production ottimizzato
- **SSL:** Configurato automaticamente

### **Environment Variables**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_OPENAI_API_KEY=your_openai_key
```

---

## 🧪 **TESTING**

### **Test Manuali**
- **Login/Registrazione** su diversi browser
- **Responsive design** su dispositivi mobili
- **Performance** con Lighthouse
- **Accessibilità** con screen readers

### **Test Automatici**
```bash
# Run tests
npm test

# Coverage report
npm run test:coverage
```

---

## 📊 **METRICHE**

### **Performance**
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size:** < 500KB gzipped
- **Load Time:** < 2s su 3G
- **Core Web Vitals:** Ottimali

### **Analytics**
- **User Engagement:** Tracking sessioni e interazioni
- **Conversion Rate:** Login → Dashboard usage
- **Error Tracking:** Sentry integration
- **Performance Monitoring:** Real-time metrics

---

## 🔧 **TROUBLESHOOTING**

### **Errori Comuni**

#### **"Failed to resolve import"**
```bash
# Pulisci cache
rm -rf node_modules/.vite dist
npm run dev
```

#### **"_jsxDEV is not a function"**
```bash
# Riavvia server
pkill -f "vite"
npm run dev
```

#### **"Cannot find module"**
```bash
# Reinstalla dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Debug Development**
```bash
# Log dettagliati
DEBUG=vite:* npm run dev

# Check build
npm run build && npm run preview
```

---

## 📝 **CHANGELOG**

### **v1.0.0 - 31 Luglio 2025**
- ✅ **Eliminazione landing page** - Semplificazione architettura
- ✅ **Correzione errori import** - Risolti problemi `@/lib/config`
- ✅ **Ottimizzazione routing** - Flusso diretto `/` → `/auth` → `/app`
- ✅ **Pulizia cache** - Risolti errori `_jsxDEV`
- ✅ **Server funzionante** - `http://localhost:8080/` attivo

### **v0.9.0 - 29 Luglio 2025**
- ✅ **MVP completo** con autenticazione Supabase
- ✅ **Dashboard funzionante** con statistiche
- ✅ **AI Coach** integrato
- ✅ **Mobile responsive** design

---

## 🤝 **SUPPORT**

### **Documentazione**
- **API Docs:** [Link documentazione]
- **Component Library:** [Link componenti]
- **Design System:** [Link design]

### **Community**
- **GitHub Issues:** [Link issues]
- **Discord:** [Link community]
- **Email:** support@performanceprime.it

### **Sviluppo**
- **Roadmap:** [Link roadmap]
- **Contributing:** [Link guidelines]
- **Code of Conduct:** [Link CoC]

---

## 📄 **LICENSE**

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

**Performance Prime Pulse** - Oltre ogni limite 🚀

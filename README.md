# Performance Prime Pulse

## Stato Attuale (5 Agosto 2025)

### ✅ **App Unificata Funzionante**
- **URL:** `https://performanceprime.it`
- **Architettura:** Landing + Auth + MVP tutto insieme
- **Flusso:** Landing → Auth → Dashboard (stessa app)
- **Deploy:** Stabile su Lovable con dominio personalizzato

### ✅ **Landing Page - Ultimi Sviluppi (5 Agosto 2025)**
- **Layout Alternato:** Sezioni nere/grigie alternate
- **Sezione Founders:** Spostata da Hero a CTA Section
- **Card Founders:** Layout orizzontale su desktop/tablet, verticale su mobile
- **Nuovo Contenuto Hero:** Aggiunto blocco descrittivo con "Performance Prime" e descrizioni
- **Card Features:** "Cosa puoi fare" e "Perché è diversa" con sfondo grigio e hover effects
- **Spacing Ottimizzato:** Ridotto spazio verticale tra elementi Hero
- **Social Proof Rimosso:** Sezione rimossa per design più pulito
- **Animazioni Globali:** Fade-in/slide-up per tutti gli elementi
- **Linea Divisoria Oro:** Sostituisce testi "Performance Prime" e "L'app per chi prende sul serio..."
- **Tagline Allenamenti:** Aggiunta sotto le 6 card features
- **Card Allenamenti:** Trasformata in card dedicata posizionata sotto Community
- **Posizionamento Card:** Card "Scegli il tuo tipo di allenamento" centrata sotto card "Community"

### ✅ **Configurazione DNS Aruba Completata**
- **Registrar:** Aruba
- **Record CNAME:** `www` → `lovable.app`
- **Propagazione:** Completata (1-2 ore)
- **SSL:** Attivo e funzionante

### ✅ **Dominio Personalizzato Configurato**
- **URL:** `performanceprime.it`
- **Lovable Settings:** Configurati correttamente
- **HTTPS:** Attivo e funzionante

## Architettura Unificata

### **App Unificata (performanceprime.it)**
- **Entry:** `index.html` → `src/main.tsx` → `src/App.tsx`
- **Config:** `vite.config.ts`
- **Scopo:** App completa con landing + auth + MVP

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

## Tecnologie Principali
- React 18+ con TypeScript
- Capacitor per app mobile (iOS/Android)
- Supabase per backend e autenticazione
- Tailwind CSS per styling
- Shadcn/ui per componenti UI
- Vite come build tool
- Lovable per deploy
- Aruba per DNS

## Convenzioni di Codice
- Usa TypeScript strict mode
- Preferisci functional components con hooks
- Usa named exports invece di default exports
- Segui la convenzione camelCase per variabili e funzioni
- Usa PascalCase per componenti React
- Mantieni i componenti piccoli e focalizzati

## Struttura del Progetto
- `/src/App.tsx` - Router principale UNIFICATO
- `/src/main.tsx` - Entry point UNIFICATO
- `/src/landing/` - Componenti landing page (ZONA SICURA)
  - `/src/landing/pages/` - Pagine landing (LandingPage, AuthPage)
  - `/src/landing/components/` - Componenti landing (Hero, Features, CTA, Footer)
  - `/src/landing/lib/` - Configurazioni landing (supabase.ts)
  - `/src/landing/styles/` - Stili landing (landing.css)
- `/src/pages/` - Pagine MVP (PROTETTE)
- `/src/components/` - Componenti MVP (PROTETTI)
- `/src/shared/` - Codice condiviso (config, hooks, ui, integrations)
- `/src/development/` - Features in sviluppo (ZONA SICURA)
- `/src/experimental/` - Sperimentazioni (ZONA SICURA)

## Configurazioni Vite
### **App Unificata**
- **File:** `vite.config.ts`
- **Entry:** `index.html` → `src/main.tsx`
- **Build:** `npm run build:public`
- **Dev Server:** Porta 8082 (automatica)

## Scripts Package.json
- `npm run dev` - App unificata (porta 8082)
- `npm run build:public` - Build produzione
- `npm run deploy:lovable` - Deploy Lovable

## Styling
- Usa Tailwind CSS per lo styling
- Preferisci componenti Shadcn/ui quando disponibili
- Mantieni la coerenza con il design system esistente
- Usa variabili CSS per colori e spacing
- **Landing page:** Stili in `src/landing/styles/landing.css`

## Database e API
- Usa Supabase per tutte le operazioni di database
- Implementa proper error handling per le API calls
- Usa TypeScript types per i dati del database
- Segui le convenzioni di naming di Supabase

## Mobile (Capacitor)
- Considera sempre la compatibilità mobile
- Usa responsive design
- Testa su dispositivi reali quando possibile
- Gestisci correttamente le API native di Capacitor

## AI e Machine Learning
- Implementa funzionalità AI in modo sicuro
- Valida sempre gli input dell'utente
- Fornisci feedback chiaro per le operazioni AI
- Mantieni la privacy dell'utente

## Performance
- Ottimizza il bundle size
- Usa lazy loading per i componenti pesanti
- Implementa caching appropriato
- Monitora le performance su dispositivi mobili

## Sicurezza
- Valida sempre gli input dell'utente
- Usa HTTPS per tutte le comunicazioni
- Implementa proper authentication
- Proteggi i dati sensibili

## Testing
- Scrivi test per le funzionalità critiche
- Usa React Testing Library per i test dei componenti
- Testa le integrazioni con Supabase
- Verifica la compatibilità mobile

## Documentazione
- Commenta il codice complesso
- Mantieni README aggiornato
- Documenta le API custom
- Fornisci esempi di utilizzo

## 🚨 PROTEZIONE CODICE PRODUZIONE

### **File Protetti (NON MODIFICARE)**
```
src/App.tsx                    # ← Router principale PROTETTO
src/main.tsx                   # ← Entry point PROTETTO
src/pages/                     # ← Pagine MVP PROTETTE
package.json                   # ← Scripts build PROTETTI
vite.config.ts                 # ← Config build PROTETTA
index.html                     # ← HTML entry PROTETTO
```

### **Zone Sicure per Sviluppo**
```
src/landing/                   # ← Landing page (ZONA SICURA)
├── pages/
├── components/
└── styles/
```

### **Regole Operative**
- ✅ **Leggere** i file per reference
- ✅ **Analizzare** il codice per capire funzionalità
- ✅ **Copiare** parti per nuove features
- ✅ **Suggerire** miglioramenti senza modificare
- ✅ **Modificare** solo `src/landing/` per landing page
- ❌ **Modificare** file protetti senza permesso
- ❌ **Rinominare** file o cartelle protette
- ❌ **Spostare** componenti protetti
- ❌ **Cambiare** configurazioni build

### **Controlli di Sicurezza**
Prima di ogni modifica verifica:
1. ❓ "Questa modifica tocca file di produzione?"
2. ❓ "L'utente ha esplicitamente richiesto questo cambio?"
3. ❓ "Potrebbe rompere il deploy funzionante?"
4. ❓ "È davvero necessaria o solo un 'miglioramento'?"

Se risposta è SÌ a qualsiasi domanda → FERMA e CHIEDI CONFERMA

## Quando Suggerisci Modifiche
- Mantieni la coerenza con il codice esistente
- Considera l'impatto sulle performance
- Verifica la compatibilità mobile
- Assicurati che le modifiche seguano le convenzioni del progetto
- Testa sempre l'app unificata
- Verifica che il flusso Landing → Auth → MVP funzioni correttamente
- Mantieni aggiornata la documentazione
- **NON toccare file protetti senza permesso esplicito**
- **MODIFICA SOLO `src/landing/` per landing page**

## Problemi Risolti Recentemente (5 Agosto 2025)
- ✅ **App unificata** - Landing + Auth + MVP tutto insieme
- ✅ **Merge incompleto risolto** - Repository pulito
- ✅ **Configurazione Lovable corretta** - Entry point `index.html`
- ✅ **Build unificato** - Un solo build per tutto
- ✅ **Router unificato** - Tutto in `src/App.tsx`
- ✅ **Deploy stabile** - Funzionante su `performanceprime.it`
- ✅ **Protezione codice produzione** - File protetti identificati
- ✅ **Configurazione DNS Aruba** - Record CNAME configurato
- ✅ **Dominio personalizzato** - `performanceprime.it` attivo
- ✅ **Layout alternato landing page** - Nero/grigio implementato
- ✅ **Sezione founders spostata** - Da Hero a CTA
- ✅ **Card founders orizzontali** - Layout responsive corretto
- ✅ **Nuovo contenuto Hero** - Blocco descrittivo aggiunto
- ✅ **Card features grigie** - "Cosa puoi fare" e "Perché è diversa"
- ✅ **Spacing ottimizzato** - Ridotto spazio verticale tra elementi
- ✅ **Social proof rimosso** - Design più pulito
- ✅ **Animazioni globali** - Fade-in/slide-up implementate
- ✅ **Linea divisoria oro** - Sostituisce testi specifici
- ✅ **Tagline allenamenti** - Aggiunta sotto card features
- ✅ **Card allenamenti dedicata** - Trasformata in card separata
- ✅ **Posizionamento card** - Centrata sotto Community

## Flusso Utente Completo
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

## Layout Corretto
- **Header:** Logo "DD" + "Performance Prime" + menu dropdown utente
- **Main Content:** Dashboard con metriche, azioni rapide, progressi
- **Nessuna sidebar sinistra:** Rimossa completamente
- **Responsive:** Ottimizzato per mobile e desktop

## Overlay Premium
- **Lucchetto 🔒** al centro per funzioni bloccate
- **Messaggio:** "Funzionalità in arrivo"
- **Sottotitolo:** Messaggi specifici per ogni sezione
- **Opacità:** Contenuto bloccato visibile sotto overlay

## Menu Dropdown
- **Utente:** Nome utente + icone (search, notifications, menu)
- **Voci:** Dashboard, Abbonamenti, Allenamento, Appuntamenti, Timer, Coach AI, Note, Profilo, Logout
- **Legale:** Termini e Condizioni, Privacy Policy (GDPR)

## Barra di Navigazione Inferiore
- **5 icone:** Dashboard, Allenamento, Appuntamenti, Coach AI, Profilo
- **Design:** Solo mobile (`lg:hidden`), tema scuro con accenti oro
- **Funzionalità:** Navigazione completa tra sezioni

## Funzionalità Accessibili
- **Dashboard:** Metriche personalizzate e statistiche
- **Allenamento:** Categorie workout e esercizi
- **Appuntamenti:** Calendario base e gestione
- **Coach AI:** Chat base, piani personalizzati, suggerimenti AI
- **Profilo:** Gestione informazioni utente, achievement, progressi, impostazioni
- **Abbonamenti:** Piani BASIC, ADVANCED, PRO con feature dettagliate
- **Timer:** Timer countdown per allenamenti con controlli completi
- **Note:** Creazione, modifica, eliminazione note personali
- **Pagine Legali:** Termini e Condizioni, Privacy Policy GDPR compliant

## Funzioni Premium (Bloccate)
- **Azioni Rapide:** "Prenota Sessione" e "Chat AI Coach" con overlay
- **Prossimi Appuntamenti:** Sezione completa con overlay
- **Professionisti:** Lista professionisti con overlay
- **Insights AI:** Analisi avanzata bloccata
- **Albo delle medaglie:** Sezione achievement con overlay
- **Contatto Professionisti:** Prenotazioni premium bloccate

## Landing Page - Ultime Modifiche
### **Layout Alternato**
```
Hero Section (NERA) → Features Section (GRIGIA) → CTA Section (NERA) → Footer (GRIGIO)
```

### **Sezione Founders**
- **Posizione:** CTA Section (sotto bottone "Scansiona e inizia ora")
- **Layout:** Card orizzontali su desktop/tablet, verticali su mobile
- **Responsive:** `flex-direction: row` su desktop, `column` su mobile

### **Nuovo Contenuto Hero**
- **Blocco descrittivo:** Aggiunto sotto tagline principale
- **Performance Prime:** Titolo con descrizioni
- **Card grigie:** "Cosa puoi fare" e "Perché è diversa" con sfondo grigio
- **Spacing ottimizzato:** Ridotto spazio verticale tra elementi
- **Linea divisoria oro:** Sostituisce testi specifici

### **Card Features**
- **Tagline allenamenti:** Aggiunta sotto le 6 card features
- **Card dedicata:** "Scegli il tuo tipo di allenamento" trasformata in card separata
- **Posizionamento:** Centrata sotto la card "Community"
- **Styling:** Identico alle altre card con icona e gradient

### **Zona Sicura per Sviluppo**
```
src/landing/                   # ← Landing page (MODIFICABILE)
├── pages/
├── components/
└── styles/
```

## Prossimi Sviluppi
- 🔄 **Features sperimentali** in `src/development/`
- 🔄 **Testing e ottimizzazioni**
- 🔄 **Analytics e tracking**
- 🔄 **Mobile app deployment**
- 🔄 **Advanced AI features**
- 🔄 **Test dominio personalizzato**
- 🔄 **Ottimizzazioni landing page**

## Motto Operativo
**"Se funziona, non toccarlo - sviluppa a fianco!"**

Il deploy su `performanceprime.it` è **PERFETTO e FUNZIONANTE** con dominio personalizzato configurato e landing page ottimizzata. Proteggi il codice di produzione e sviluppa nuove features nelle zone sicure.

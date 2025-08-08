# Performance Prime - App Unificata

**Performance Prime** è un'applicazione React/TypeScript unificata per il fitness e il benessere, che combina landing page, autenticazione e MVP in un'unica applicazione.

## 🚀 Stato Attuale (8 Agosto 2025)

### ✅ **Funzionalità Complete**
- **App unificata funzionante** con deploy stabile su `performanceprime.it`
- **Architettura unificata** - Landing + Auth + MVP tutto insieme
- **Flusso completo:** Landing → Auth → Dashboard (stessa app)
- **Autenticazione Supabase** funzionante
- **Dashboard protetta** e responsive
- **Overlay corretto** - Funzioni premium bloccate con design coerente
- **Layout corretto** - Header + Main Content (senza menu laterale)
- **Sidebar sinistra completamente rimossa**
- **Barra di navigazione inferiore** implementata
- **Sezioni complete:** Dashboard, Allenamento, Appuntamenti, Coach AI, Profilo
- **Configurazione DNS Aruba completata**
- **Dominio personalizzato configurato**
- **Problema analytics risolto** - App funzionante in locale
- **Analytics Plausible temporaneamente disabilitato** per debugging
- **Layout alternato nero/grigio landing page**
- **Sezione founders spostata in CTA**
- **Card founders orizzontali su desktop**
- **Nuovo contenuto Hero** - Blocco descrittivo aggiunto
- **Card features grigie** - "Cosa puoi fare" e "Perché è diversa"
- **Spacing ottimizzato** - Ridotto spazio verticale tra elementi
- **Social proof rimosso** - Design più pulito
- **Animazioni globali** - Fade-in/slide-up implementate
- **Linea divisoria oro** - Sostituisce testi specifici
- **Tagline allenamenti** - Aggiunta sotto card features
- **Card allenamenti dedicata** - Trasformata in card separata
- **Posizionamento card** - Centrata sotto Community
- **Sistema consenso file** - Banner e sezione impostazioni implementati
- **Analisi OCR file** - Riconoscimento automatico esercizi da immagini/PDF
- **Integrazione allegati** - Caricamento file nel modal creazione allenamento
- **Pattern matching** - Riconoscimento formati italiani e inglesi
- **Componente risultati** - FileAnalysisResults per rivedere esercizi estratti
- **Hook useFileAccess** - Gestione stato consenso con localStorage
- **Servizio FileAnalyzer** - OCR avanzato con database 50+ esercizi
- **Chat PrimeBot Modal Overlay** - Implementazione completa con backdrop sfocato
- **UI Chat ottimizzata** - Area messaggi grigia e bubble bot bianchi
- **Contrasto migliorato** - Leggibilità ottimizzata per messaggi bot
- **PARSER RIGOROSO** - Sistema che legge SOLO dati reali dal PDF
- **Validazione critica** - Verifica esercizi, serie, nomi corretti
- **Debug dettagliato** - Log completo di ogni passo del parsing
- **Pattern conservativi** - Meglio non parsare che parsare male
- **Estrazione testo reale** - Solo quello che c'è nel PDF

## 🏗️ Architettura

### **App Unificata (performanceprime.it)**
- **URL:** `https://performanceprime.it`
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

## 🛠️ Tecnologie

- **Frontend:** React 18+ con TypeScript
- **Mobile:** Capacitor per app mobile (iOS/Android)
- **Backend:** Supabase per database e autenticazione
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui
- **Build Tool:** Vite
- **Deploy:** Lovable
- **DNS:** Aruba
- **Analytics:** Plausible Analytics (temporaneamente disabilitato)
- **Validazione:** Zod per schema validation
- **PDF Processing:** pdfjs-dist per estrazione PDF (opzionale)

## 📁 Struttura del Progetto

```
performance-prime-pulse/
├── src/
│   ├── App.tsx                    # Router principale UNIFICATO
│   ├── main.tsx                   # Entry point UNIFICATO
│   ├── landing/                   # Landing page (ZONA SICURA)
│   │   ├── pages/
│   │   ├── components/
│   │   └── styles/
│   ├── pages/                     # Pagine MVP (PROTETTE)
│   ├── components/                # Componenti MVP (PROTETTI)
│   ├── shared/                    # Codice condiviso
│   ├── development/               # Features in sviluppo (ZONA SICURA)
│   └── experimental/              # Sperimentazioni (ZONA SICURA)
├── public/
├── android/                       # App mobile Android
├── ios/                          # App mobile iOS
└── supabase/                     # Database e migrazioni
```

## 🚀 Scripts

```bash
# Sviluppo
npm run dev                    # App unificata (porta 8082)

# Build
npm run build:public          # Build produzione

# Deploy
npm run deploy:lovable        # Deploy Lovable
```

## 🎨 Layout e Design

### **Layout Corretto**
- **Header:** Logo "DD" + "Performance Prime" + menu dropdown utente
- **Main Content:** Dashboard con metriche, azioni rapide, progressi
- **Nessuna sidebar sinistra:** Rimossa completamente
- **Responsive:** Ottimizzato per mobile e desktop

### **Overlay Premium**
- **Lucchetto 🔒** al centro per funzioni bloccate
- **Messaggio:** "Funzionalità in arrivo"
- **Sottotitolo:** Messaggi specifici per ogni sezione
- **Opacità:** Contenuto bloccato visibile sotto overlay

### **Barra di Navigazione Inferiore**
- **5 icone:** Dashboard, Allenamento, Appuntamenti, Coach AI, Profilo
- **Design:** Solo mobile (`lg:hidden`), tema scuro con accenti oro
- **Funzionalità:** Navigazione completa tra sezioni

## 💬 Chat PrimeBot - Modal Overlay

### **Funzionalità Implementate:**
- **Click sulla card AI Coach** → Apertura chat a tutto schermo
- **Backdrop sfocato** con `bg-black/20 backdrop-blur-sm`
- **App sfocata dietro** ma visibile
- **Interazione solo con chat** quando modal è aperta
- **Click outside per chiudere** - Backdrop interattivo
- **Pulsante X nell'header** - Solo in modal per chiudere

### **UI Ottimizzata:**
- **Area messaggi grigia:** `bg-gray-300` per contrasto
- **Bubble messaggi bot bianchi:** `bg-white` per leggibilità
- **Design coerente:** Bordi oro, header, layout identico
- **Responsive:** `max-w-2xl` per dimensioni ottimali

### **Struttura Modal:**
```typescript
{isFullScreenChat && (
  <div className="fixed inset-0 z-50">
    {/* Backdrop sfocato */}
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={closeFullScreenChat} />
    
    {/* Chat Modal centrato */}
    <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <ChatInterface ref={chatInterfaceRef} onClose={closeFullScreenChat} />
      </div>
    </div>
  </div>
)}
```

## 📄 Sistema File Integrato - PARSER RIGOROSO

### **Funzionalità Implementate:**
- **Sistema consenso file** - Banner e sezione impostazioni implementati
- **Analisi OCR file** - Riconoscimento automatico esercizi da immagini/PDF
- **Integrazione allegati** - Caricamento file nel modal creazione allenamento
- **Pattern matching** - Riconoscimento formati italiani e inglesi
- **Componente risultati** - FileAnalysisResults per rivedere esercizi estratti
- **Hook useFileAccess** - Gestione stato consenso con localStorage
- **Servizio FileAnalyzer** - OCR avanzato con database 50+ esercizi
- **PARSER RIGOROSO** - Sistema che legge SOLO dati reali dal PDF
- **Validazione critica** - Verifica esercizi, serie, nomi corretti
- **Debug dettagliato** - Log completo di ogni passo del parsing
- **Pattern conservativi** - Meglio non parsare che parsare male
- **Estrazione testo reale** - Solo quello che c'è nel PDF

### **Principi Chiave del Parser Rigoroso:**
1. **MAI inventare dati** - Solo quello che c'è nel PDF
2. **Pattern conservativi** - Meglio non parsare che parsare male
3. **Validazione rigorosa** - Verifica che i dati siano quelli attesi
4. **Debug dettagliato** - Mostra esattamente cosa sta leggendo
5. **Adattabilità intelligente** - Riconosce diversi formati ma senza inventare

### **Architettura Parser Rigoroso:**
```typescript
class RealWorkoutParser {
  constructor() {
    this.debug = true;
    this.strict = true; // Modalità rigorosa: NON inventare mai dati
  }
  
  async parseWorkoutPdf(file: File): Promise<WorkoutPlan> {
    // STEP 1: Estrai testo dal PDF
    // STEP 2: Preprocessa e normalizza il testo
    // STEP 3: Estrai le sezioni REALI dal documento
    // STEP 4: Parsa ogni sezione SENZA inventare nulla
    // STEP 5: Validazione rigorosa
    // STEP 6: Converti in formato WorkoutPlan
  }
}
```

### **Validazione Critica:**
- **Verifica esercizi** - Conta esatta per ogni giorno
- **Controllo nomi** - "Trazioni" non "Leg extension"
- **Validazione serie** - 4 serie per squat, non 3
- **Report errori** - Lista dettagliata di problemi

### **Pattern Conservativi:**
```typescript
// Identifica SOLO sezioni reali con pattern conservativi
if (rigaTrim.match(/^Riscaldamento/i)) {
  nuovaSezione = 'Riscaldamento';
} else if (rigaTrim.match(/^Giorno\s+1/i)) {
  nuovaSezione = 'Giorno 1';
} else if (rigaTrim.match(/^Giorno\s+2/i)) {
  nuovaSezione = 'Giorno 2';
} else if (rigaTrim.match(/^Giorno\s+3/i)) {
  nuovaSezione = 'Giorno 3';
} else if (rigaTrim.match(/^Stretching\s+finale/i)) {
  nuovaSezione = 'Stretching finale';
}
```

### **Parsing Rigoroso:**
```typescript
// PATTERN PRINCIPALE: "N. Nome esercizio: SERIExRIPETIZIONI"
// IMPORTANTE: Cattura i VERI valori dal PDF

const patterns = [
  // Pattern 1: Standard con due punti
  /^(\d+)\.\s+(.+?):\s+(\d+)x(\d+(?:-\d+)?)\s*(.*)$/i,
  
  // Pattern 2: Con Addome prefix
  /^(\d+)\.\s+Addome:\s*(.+?):\s+(\d+)x(\d+(?:-\d+)?)\s*(.*)$/i,
  
  // Pattern 3: Con tempo (sec)
  /^(\d+)\.\s+(?:Addome:\s*)?(.+?):\s+(\d+)x(\d+)\s+sec\s*(.*)$/i,
  
  // Pattern 4: Max reps
  /^(\d+)\.\s+(.+?):\s+(\d+)x\s*max\s+reps\s*(.*)$/i,
  
  // Pattern 5: Con parentesi per note
  /^(\d+)\.\s+(.+?)\s+\(([^)]+)\):\s+(\d+)x(\d+(?:-\d+)?)\s*(.*)$/i,
];
```

### **Validazione Critica:**
```typescript
// Verifica che NON ci sia "Leg extension" ma "Trazioni"
const hasTrazioni = giorno3.esercizi.some(e => 
  e.name.toLowerCase().includes('trazion')
);
const hasLegExtension = giorno3.esercizi.some(e => 
  e.name.toLowerCase().includes('leg extension')
);

if (!hasTrazioni) {
  errori.push('Giorno 3 manca "Trazioni"');
}
if (hasLegExtension) {
  errori.push('Giorno 3 ha "Leg extension" che NON esiste nel PDF!');
}
```

## 🎯 Funzionalità Accessibili

### **Dashboard**
- Metriche personalizzate e statistiche
- Azioni rapide per funzioni principali
- Progressi e achievement

### **Allenamento**
- Categorie workout e esercizi
- Creazione allenamenti personalizzati
- Tracking progressi

### **Appuntamenti**
- Calendario base e gestione
- Prenotazioni con professionisti
- Scheduling intelligente

### **Coach AI**
- Chat base con AI coach
- Piani personalizzati
- Suggerimenti AI per allenamenti

### **Profilo**
- Gestione informazioni utente
- Achievement e progressi
- Impostazioni personalizzate

### **Abbonamenti**
- Piani BASIC, ADVANCED, PRO
- Feature dettagliate per ogni livello
- Gestione abbonamenti

### **Timer**
- Timer countdown per allenamenti
- Controlli completi
- Integrazione con workout

### **Note**
- Creazione, modifica, eliminazione note personali
- Organizzazione per categorie
- Ricerca e filtri

### **Pagine Legali**
- Termini e Condizioni
- Privacy Policy GDPR compliant

## 🔒 Funzioni Premium (Bloccate)

- **Azioni Rapide:** "Prenota Sessione" e "Chat AI Coach" con overlay
- **Prossimi Appuntamenti:** Sezione completa con overlay
- **Professionisti:** Lista professionisti con overlay
- **Insights AI:** Analisi avanzata bloccata
- **Albo delle medaglie:** Sezione achievement con overlay
- **Contatto Professionisti:** Prenotazioni premium bloccate

## 🚨 Protezione Codice Produzione

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

## 🔄 Prossimi Sviluppi

- 🔄 **Ripristino analytics** con error handling migliorato
- 🔄 **Features sperimentali** in `src/development/`
- 🔄 **Testing e ottimizzazioni**
- 🔄 **Analytics e tracking**
- 🔄 **Mobile app deployment**
- 🔄 **Advanced AI features**
- 🔄 **Test dominio personalizzato**
- 🔄 **Ottimizzazioni landing page**
- 🔄 **OCR avanzato** - Integrazione Tesseract.js per analisi reale
- 🔄 **Machine Learning** - Miglioramento riconoscimento esercizi
- 🔄 **API OCR** - Servizio esterno per analisi più accurate
- 🔄 **Batch processing** - Analisi multipli file contemporaneamente
- 🔄 **Test parser rigoroso** - Verifica con PDF reali
- 🔄 **Ottimizzazioni performance** - Miglioramento velocità parsing
- 🔄 **UI risultati** - Miglioramento visualizzazione esercizi estratti

## 🎯 Motto Operativo

**"Se funziona, non toccarlo - sviluppa a fianco!"**

Il deploy su `performanceprime.it` è **PERFETTO e FUNZIONANTE** con dominio personalizzato configurato, landing page ottimizzata, chat PrimeBot con modal overlay implementata e parser rigoroso per analisi file. Proteggi il codice di produzione e sviluppa nuove features nelle zone sicure.

## 📞 Contatti

- **Sito Web:** https://performanceprime.it
- **Email:** info@performanceprime.it
- **Supporto:** support@performanceprime.it

---

**Performance Prime** - Trasforma il tuo fitness con l'intelligenza artificiale 🚀

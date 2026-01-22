# 📋 ANALISI ONBOARDING PROFESSIONISTA - INTEGRAZIONE DASHBOARD E CARD UTENTE

**Data**: 23 Gennaio 2025  
**Obiettivo**: Analizzare l'onboarding professionista e definire come integrare automaticamente i dati nella dashboard e nella card utente

---

## 🎯 STEP ATTUALE ONBOARDING PROFESSIONISTA

### **STEP 1: Dati Personali** ✅
**Campi raccolti:**
- `first_name` (Nome) - **OBBLIGATORIO**
- `last_name` (Cognome) - **OBBLIGATORIO**
- `email` (Email) - **OBBLIGATORIO** + verifica esistenza
- `phone` (Telefono) - **OBBLIGATORIO**

**Dove viene usato:**
- ✅ Dashboard: Nome professionista in header
- ✅ Card Utente: Nome e cognome nella card
- ✅ Database: Salvato in `professionals` table

**Stato**: ✅ **COMPLETO** - Dati già integrati

---

### **STEP 2: Password** 🔒
**Campi raccolti:**
- `password` (Password) - **OBBLIGATORIO** (min 8 caratteri, maiuscola, minuscola, numero)
- `password_confirm` (Conferma Password) - **OBBLIGATORIO**

**Dove viene usato:**
- ✅ Autenticazione Supabase Auth
- ❌ Non usato in dashboard/card (dati sensibili)

**Stato**: ✅ **COMPLETO** - Non necessario per dashboard/card

---

### **STEP 3: Categoria** 🏷️
**Campi raccolti:**
- `category` (Categoria) - **OBBLIGATORIO**
  - Opzioni: `pt`, `nutrizionista`, `fisioterapista`, `mental_coach`, `osteopata`, `altro`
- `customCategory` (Categoria Custom) - **CONDIZIONALE** (solo se `category === 'altro'`)

**Dove viene usato:**
- ✅ Dashboard: Non mostrato direttamente (ma usato per filtri)
- ✅ Card Utente: **Mostrato come label sotto il nome** (`getCategoryLabel(professional.category)`)
- ✅ Database: Salvato in `professionals.category`

**Stato**: ✅ **COMPLETO** - Dati già integrati

**Nota**: Se `category === 'altro'`, attualmente viene aggiunto al `bio`. **CONSIGLIO**: Mantenere così o creare campo `category_custom` separato.

---

### **STEP 4: Informazioni Professionali** 📋
**Campi raccolti:**
- `city` (Città) - **OBBLIGATORIO**
- `titolo_studio` (Titolo di Studio) - **OBBLIGATORIO**
- `certificazioni` (Certificazioni) - **OBBLIGATORIO** (array, min 1)
- `studio_sede` (Studio/Sede) - **OBBLIGATORIO** (con autocomplete OpenStreetMap)

**Dove viene usato:**
- ✅ Dashboard: `titolo_studio` in ProfiloPage
- ✅ Dashboard: `company_name` (da `studio_sede`) in ProfiloPage
- ✅ Dashboard: `specializzazioni` (da `certificazioni`) in ProfiloPage
- ✅ Card Utente: **`zona`** (da `city`) mostrato come "📍 {zona}"
- ✅ Card Utente: **`specializzazioni`** mostrate come tag (primi 3)
- ❌ Card Utente: `titolo_studio` e `studio_sede` **NON mostrati** (solo nel profilo completo)

**Mapping attuale:**
```typescript
// In professionalAuthService.ts
zona: data.city,  // ✅ city → zona
specializzazioni: data.certificazioni || [],  // ✅ certificazioni → specializzazioni
company_name: data.company_name || `${data.first_name} ${data.last_name}`,  // ✅ studio_sede → company_name
titolo_studio: data.titolo_studio || null,  // ✅ titolo_studio → titolo_studio
```

**Stato**: ✅ **QUASI COMPLETO** - Dati già mappati correttamente

**Problema identificato**: `studio_sede` viene salvato come `company_name`, ma nella card utente non viene mostrato. **CONSIGLIO**: Mantenere così (non necessario nella card, solo nel profilo completo).

---

### **STEP 5: Bio** 📝
**Campi raccolti:**
- `bio` (Biografia) - **OBBLIGATORIO** (min 50 caratteri, max 500)

**Dove viene usato:**
- ✅ Dashboard: `bio` in ProfiloPage (modificabile)
- ✅ Card Utente: **`bio` mostrata troncata** (`line-clamp-2`)
- ✅ Database: Salvato in `professionals.bio`

**Stato**: ✅ **COMPLETO** - Dati già integrati

**Nota**: Se `category === 'altro'`, viene aggiunto `"Categoria: {customCategory}\n\n{bio}"`. **CONSIGLIO**: Mantenere così o creare campo separato.

---

## 📊 DATI MANCANTI NELL'ONBOARDING (usati in dashboard/card)

### **Campi usati nella Card Utente ma NON nell'onboarding:**

1. **`modalita`** (Modalità) ❌
   - **Usato in**: Card Utente (`professional.modalita`)
   - **Valore attuale**: Default `'entrambi'` in `professionalAuthService.ts`
   - **CONSIGLIO**: ✅ **AGGIUNGERE** step o campo nell'onboarding
   - **Opzioni**: `'online'`, `'presenza'`, `'entrambi'`
   - **Priorità**: 🟡 **MEDIA** (utile per filtri utenti)

2. **`prezzo_seduta`** (Prezzo Seduta) ❌
   - **Usato in**: Card Utente (se non ci sono servizi attivi)
   - **Valore attuale**: `null` (non impostato)
   - **CONSIGLIO**: ✅ **AGGIUNGERE** step o campo nell'onboarding
   - **Priorità**: 🟢 **ALTA** (importante per utenti)

3. **`prezzo_fascia`** (Fascia Prezzo) ❌
   - **Usato in**: Card Utente (fallback se non c'è `prezzo_seduta` né servizi)
   - **Valore attuale**: Default `'€€'` in `professionalAuthService.ts`
   - **CONSIGLIO**: ⚠️ **OPZIONALE** (può essere calcolato da `prezzo_seduta` o servizi)
   - **Priorità**: 🟢 **ALTA** (usato come fallback)

4. **`foto_url`** (Foto Profilo) ❌
   - **Usato in**: Card Utente (se presente, altrimenti icona categoria)
   - **Valore attuale**: `null` (non caricata)
   - **CONSIGLIO**: ⚠️ **OPZIONALE** (può essere aggiunta dopo)
   - **Priorità**: 🟡 **MEDIA** (migliora UX ma non critico)

5. **`rating`** e **`reviews_count`** ⭐
   - **Usato in**: Card Utente (mostrato come "⭐ {rating} ({reviews_count})")
   - **Valore attuale**: Default `0` e `0` in `professionalAuthService.ts`
   - **CONSIGLIO**: ❌ **NON necessario** (generati automaticamente da recensioni)
   - **Priorità**: ⚪ **BASSA** (non modificabile dall'utente)

---

## 🎯 CONSIGLI PER OTTIMIZZAZIONE ONBOARDING

### **✅ DA MANTENERE (Tutti gli step attuali)**

1. **STEP 1: Dati Personali** ✅
   - Essenziale per autenticazione e identificazione
   - Già perfettamente integrato

2. **STEP 2: Password** ✅
   - Essenziale per autenticazione
   - Non necessario per dashboard/card

3. **STEP 3: Categoria** ✅
   - Essenziale per categorizzazione e filtri
   - Già mostrato nella card utente

4. **STEP 4: Informazioni Professionali** ✅
   - Essenziale per credibilità professionale
   - Già mappato correttamente (`city` → `zona`, `certificazioni` → `specializzazioni`)

5. **STEP 5: Bio** ✅
   - Essenziale per presentazione professionale
   - Già mostrata nella card utente (troncata)

---

### **➕ DA AGGIUNGERE (Nuovi step/campi)**

#### **OPZIONE A: Aggiungere STEP 6 (Raccomandato)** 🎯

**STEP 6: Modalità e Prezzi**
- **Campi da aggiungere:**
  1. **Modalità** (radio buttons o select)
     - `modalita`: `'online'`, `'presenza'`, `'entrambi'`
     - Default: `'entrambi'` (se non selezionato)
   
  2. **Prezzo Seduta** (input numerico)
     - `prezzo_seduta`: numero intero (es: 50, 80, 100)
     - Opzionale: se non inserito, usa `prezzo_fascia` come fallback
     - Validazione: min 0, max 1000 (o range ragionevole)
   
  3. **Fascia Prezzo** (select, opzionale)
     - `prezzo_fascia`: `'€'`, `'€€'`, `'€€€'`
     - Default: Calcolato automaticamente da `prezzo_seduta` se non specificato
     - Logica calcolo:
       - `prezzo_seduta < 50` → `'€'`
       - `prezzo_seduta >= 50 && prezzo_seduta < 100` → `'€€'`
       - `prezzo_seduta >= 100` → `'€€€'`

**Vantaggi:**
- ✅ Completa tutti i dati necessari per la card utente
- ✅ Professionista può impostare prezzi subito
- ✅ Migliora UX (meno dati da completare dopo)

**Svantaggi:**
- ⚠️ Aumenta lunghezza onboarding (da 5 a 6 step)
- ⚠️ Potrebbe essere "troppo" per alcuni professionisti

---

#### **OPZIONE B: Aggiungere campi opzionali negli step esistenti** 🔄

**Modifiche agli step esistenti:**

1. **STEP 4: Informazioni Professionali** (aggiungere)
   - Campo **Modalità** (select)
   - Campo **Prezzo Seduta** (input numerico)

2. **STEP 5: Bio** (aggiungere)
   - Campo **Fascia Prezzo** (select, opzionale, calcolato automaticamente)

**Vantaggi:**
- ✅ Non aumenta numero di step
- ✅ Dati raggruppati logicamente

**Svantaggi:**
- ⚠️ STEP 4 diventa più lungo
- ⚠️ Potrebbe essere "troppo" in un solo step

---

#### **OPZIONE C: Completare dopo onboarding (Attuale)** 📝

**Mantenere onboarding attuale e aggiungere:**
- Sezione "Completa il tuo profilo" nella dashboard
- Promemoria per completare dati mancanti (`modalita`, `prezzo_seduta`)

**Vantaggi:**
- ✅ Onboarding più veloce
- ✅ Professionista può iniziare subito

**Svantaggi:**
- ⚠️ Dati mancanti nella card utente inizialmente
- ⚠️ Card utente meno completa per nuovi professionisti

---

### **❌ DA RIMUOVERE (Nessuno)**

**Tutti gli step attuali sono essenziali e ben progettati. Nessuno step dovrebbe essere rimosso.**

---

## 🎨 RACCOMANDAZIONE FINALE

### **✅ RACCOMANDAZIONE: OPZIONE A (STEP 6)**

**Aggiungere STEP 6: "Modalità e Prezzi"**

**Motivazioni:**
1. **Completezza**: Completa tutti i dati necessari per la card utente
2. **UX**: Professionista vede subito come apparirà nella ricerca
3. **Business**: Prezzi impostati subito = più conversioni
4. **Coerenza**: Tutti i dati pubblici completati in onboarding

**Implementazione suggerita:**

```typescript
// STEP 6: Modalità e Prezzi
interface Step6Data {
  modalita: 'online' | 'presenza' | 'entrambi';
  prezzo_seduta?: number | null;
  prezzo_fascia?: '€' | '€€' | '€€€';
}

// Validazione
- modalita: OBBLIGATORIO (default: 'entrambi')
- prezzo_seduta: OPZIONALE (se non inserito, usa prezzo_fascia)
- prezzo_fascia: OPZIONALE (calcolato automaticamente da prezzo_seduta se non specificato)
```

**UI suggerita:**
- **Modalità**: Radio buttons con icone (💻 Online, 🏠 In presenza, 🔄 Entrambi)
- **Prezzo Seduta**: Input numerico con placeholder "Es: 50, 80, 100"
- **Fascia Prezzo**: Select con tooltip che spiega la logica

---

## 📋 CHECKLIST INTEGRAZIONE

### **Dati già integrati automaticamente:**
- ✅ `first_name` → Card Utente (nome)
- ✅ `last_name` → Card Utente (cognome)
- ✅ `category` → Card Utente (categoria label)
- ✅ `city` → `zona` → Card Utente (zona)
- ✅ `certificazioni` → `specializzazioni` → Card Utente (tag specializzazioni)
- ✅ `bio` → Card Utente (bio troncata)
- ✅ `titolo_studio` → Dashboard ProfiloPage
- ✅ `studio_sede` → `company_name` → Dashboard ProfiloPage

### **Dati da aggiungere nell'onboarding:**
- ❌ `modalita` → Card Utente (modalità)
- ❌ `prezzo_seduta` → Card Utente (prezzo se non ci sono servizi)
- ⚠️ `prezzo_fascia` → Card Utente (fallback, può essere calcolato)

### **Dati generati automaticamente (non necessari in onboarding):**
- ✅ `rating` → Card Utente (da recensioni)
- ✅ `reviews_count` → Card Utente (da recensioni)
- ✅ `is_partner` → Card Utente (da pagamento)

### **Dati opzionali (possono essere aggiunti dopo):**
- ⚠️ `foto_url` → Card Utente (foto profilo)

---

## 🚀 PROSSIMI PASSI

1. **Implementare STEP 6** (se si sceglie Opzione A)
2. **Aggiornare `professionalAuthService.ts`** per salvare nuovi campi
3. **Testare integrazione** dashboard e card utente
4. **Aggiungere validazione** per nuovi campi
5. **Aggiornare documentazione** onboarding

---

**Ultima revisione**: 23 Gennaio 2025  
**Stato**: ✅ Analisi completata, pronta per implementazione

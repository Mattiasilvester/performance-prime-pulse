# 📍 DOVE TESTARE LE RECENSIONI - GUIDA COMPLETA

**Data**: 23 Gennaio 2025  
**Feature**: Sistema Recensioni Professionisti

---

## 🎯 DOVE TESTARE LE RECENSIONI

### **1. LATO UTENTE (End User)** 👤

#### **A) Lista Professionisti** 📋
**Route**: `/professionals`  
**File**: `src/pages/Professionals.tsx`

**Cosa vedere:**
- ✅ Rating medio professionista (es: ⭐ 4.5)
- ✅ Numero recensioni (es: (12))
- ✅ Visualizzato nella card di ogni professionista

**Come testare:**
1. Accedi come utente normale
2. Vai su `/professionals`
3. Vedi le card professionisti con rating e count recensioni
4. **Dopo integrazione**: Il rating e count vengono dal database (già funzionante)

**Screenshot Location:**
- Card professionista mostra: `⭐ {rating.toFixed(1)} ({reviews_count})`
- Linee: 440, 531 in `Professionals.tsx`

---

#### **B) Dettaglio Professionista** 🔍
**Route**: `/professionals/:id`  
**File**: `src/pages/ProfessionalDetail.tsx`

**Cosa vedere:**
- ✅ Sezione "Recensioni" completa
- ✅ Lista recensioni con:
  - Nome utente
  - Rating (stelle)
  - Data recensione
  - Commento
  - Risposta professionista (se presente)
- ✅ Count recensioni nel titolo: "⭐ Recensioni (X)"

**Come testare:**
1. Accedi come utente normale
2. Vai su `/professionals`
3. Clicca su un professionista
4. Scorri fino alla sezione "Recensioni"
5. **PRIMA integrazione**: Vedi 3 recensioni demo hardcoded
6. **DOPO integrazione**: Vedi recensioni reali dal database

**Screenshot Location:**
- Sezione recensioni: linea 405-430 in `ProfessionalDetail.tsx`
- Attualmente usa `DEMO_REVIEWS` (linea 9-31)

**Cosa cambierà:**
- ❌ Rimuovere `DEMO_REVIEWS` hardcoded
- ✅ Aggiungere fetch recensioni dal database
- ✅ Mostrare recensioni reali con dati utente
- ✅ Gestire stato "Nessuna recensione"

---

### **2. LATO PROFESSIONISTA (Dashboard)** 💼

#### **A) Dashboard Overview** 📊
**Route**: `/partner/dashboard`  
**File**: `src/pages/partner/dashboard/OverviewPage.tsx`

**Cosa vedere (DA IMPLEMENTARE):**
- ⚠️ **ATTUALMENTE NON PRESENTE** - Da aggiungere
- Card "Recensioni Recenti" con:
  - Ultime 3-5 recensioni ricevute
  - Rating medio aggiornato
  - Link a pagina recensioni completa

**Come testare (DOPO IMPLEMENTAZIONE):**
1. Accedi come professionista
2. Vai su `/partner/dashboard`
3. Vedi card "Recensioni Recenti" nella overview
4. Clicca per vedere tutte le recensioni

**Da implementare:**
- Card recensioni nella dashboard overview
- Link a pagina recensioni completa

---

#### **B) Pagina Recensioni (DA CREARE)** 📝
**Route**: `/partner/reviews` (DA CREARE)  
**File**: `src/pages/partner/reviews/ReviewsPage.tsx` (DA CREARE)

**Cosa vedere:**
- ✅ Lista completa recensioni ricevute
- ✅ Filtri per rating (1-5 stelle)
- ✅ Card recensione con:
  - Nome utente
  - Rating
  - Commento
  - Data
  - Badge "Verificata" se `is_verified = true`
  - Risposta professionista (se presente)
  - Bottone "Rispondi" se non risposta
- ✅ Statistiche:
  - Rating medio
  - Totale recensioni
  - Distribuzione rating (1-5 stelle)

**Come testare (DOPO IMPLEMENTAZIONE):**
1. Accedi come professionista
2. Vai su `/partner/reviews`
3. Vedi tutte le recensioni ricevute
4. Filtra per rating
5. Rispondi a recensioni
6. Vedi statistiche

**Da implementare:**
- Pagina completa recensioni
- Componenti: `ReviewList.tsx`, `ReviewCard.tsx`
- Modal risposta: `ReviewResponseModal.tsx`

---

#### **C) Profilo Professionista** 👤
**Route**: `/partner/profilo`  
**File**: `src/pages/partner/dashboard/ProfiloPage.tsx`

**Cosa vedere (DA VERIFICARE):**
- ⚠️ **DA VERIFICARE** se c'è sezione recensioni
- Potrebbe mostrare:
  - Rating medio professionista
  - Link a pagina recensioni completa

**Come testare:**
1. Accedi come professionista
2. Vai su `/partner/profilo`
3. Verifica se c'è sezione recensioni
4. Se non c'è, considerare aggiungerla

---

## 🧪 SCENARI DI TEST COMPLETI

### **Test 1: Visualizzazione Recensioni (Utente)**
1. ✅ Utente vede lista professionisti con rating
2. ✅ Utente clicca su professionista
3. ✅ Utente vede sezione recensioni con recensioni reali
4. ✅ Utente vede risposte professionisti (se presenti)
5. ✅ Utente vede badge "Verificata" (se `is_verified = true`)

### **Test 2: Visualizzazione Recensioni (Professionista)**
1. ✅ Professionista vede recensioni nella dashboard
2. ✅ Professionista vede tutte le recensioni ricevute
3. ✅ Professionista può filtrare per rating
4. ✅ Professionista vede statistiche (rating medio, totale)

### **Test 3: Risposta a Recensioni**
1. ✅ Professionista clicca "Rispondi" su recensione
2. ✅ Si apre modal con textarea
3. ✅ Professionista scrive risposta e salva
4. ✅ Risposta appare nella recensione
5. ✅ Utente vede risposta nella pagina professionista

### **Test 4: Creazione Recensione (Utente)**
1. ✅ Utente completa booking
2. ✅ Utente può lasciare recensione
3. ✅ Utente inserisce rating e commento
4. ✅ Recensione viene salvata nel database
5. ✅ Rating professionista si aggiorna automaticamente

---

## 📂 FILE DA MODIFICARE/CREARE

### **File da Modificare:**
1. ✅ `src/pages/ProfessionalDetail.tsx` - Sostituire DEMO_REVIEWS con fetch database
2. ⚠️ `src/pages/partner/dashboard/OverviewPage.tsx` - Aggiungere card recensioni (opzionale)

### **File da Creare:**
1. ✅ `src/services/reviewsService.ts` - Service layer per recensioni
2. ✅ `src/pages/partner/reviews/ReviewsPage.tsx` - Pagina recensioni professionista
3. ✅ `src/components/partner/reviews/ReviewList.tsx` - Lista recensioni
4. ✅ `src/components/partner/reviews/ReviewCard.tsx` - Card singola recensione
5. ✅ `src/components/partner/reviews/ReviewResponseModal.tsx` - Modal risposta
6. ✅ `src/components/user/ReviewForm.tsx` - Form per lasciare recensione (opzionale, futuro)

---

## 🗺️ ROUTE DA AGGIUNGERE

### **Route Nuova:**
```typescript
// In App.tsx
<Route path="/partner/reviews" element={
  <ProtectedRoute session={session}>
    <PartnerLayout>
      <ReviewsPage />
    </PartnerLayout>
  </ProtectedRoute>
} />
```

### **Link da Aggiungere:**
- In `PartnerSidebar.tsx`: Aggiungere voce "Recensioni" nel menu
- In `OverviewPage.tsx`: Link a pagina recensioni dalla card

---

## ✅ CHECKLIST TEST

### **Lato Utente:**
- [ ] Lista professionisti mostra rating e count
- [ ] Dettaglio professionista mostra recensioni reali
- [ ] Recensioni mostrano nome utente, rating, commento, data
- [ ] Recensioni mostrano risposte professionisti (se presenti)
- [ ] Badge "Verificata" appare se `is_verified = true`
- [ ] Stato "Nessuna recensione" appare se non ci sono recensioni

### **Lato Professionista:**
- [ ] Dashboard mostra card recensioni recenti (opzionale)
- [ ] Pagina recensioni mostra tutte le recensioni
- [ ] Filtri per rating funzionano
- [ ] Statistiche mostrano rating medio e totale
- [ ] Modal risposta funziona
- [ ] Risposta viene salvata e visualizzata

---

## 🎯 PRIORITÀ IMPLEMENTAZIONE

### **Fase 1: Visualizzazione (Priorità Alta)** 🔴
1. ✅ Service layer (`reviewsService.ts`)
2. ✅ Modificare `ProfessionalDetail.tsx` per usare recensioni reali
3. ✅ Test visualizzazione lato utente

**Tempo**: 1-2 ore

### **Fase 2: Dashboard Professionista (Priorità Media)** 🟡
1. ✅ Pagina recensioni professionista (`ReviewsPage.tsx`)
2. ✅ Componenti lista e card recensioni
3. ✅ Test visualizzazione lato professionista

**Tempo**: 2-3 ore

### **Fase 3: Risposta Recensioni (Priorità Media)** 🟡
1. ✅ Modal risposta professionista
2. ✅ Salvataggio risposta
3. ✅ Test risposta

**Tempo**: 1-2 ore

### **Fase 4: Creazione Recensioni (Priorità Bassa)** 🟢
1. ⚠️ Form per lasciare recensione (futuro)
2. ⚠️ Integrazione dopo completamento booking (futuro)

**Tempo**: 2-3 ore (futuro)

---

## 📊 RIEPILOGO DOVE TESTARE

| Luogo | Route | File | Stato | Priorità |
|-------|-------|------|-------|----------|
| **Lista Professionisti** | `/professionals` | `Professionals.tsx` | ✅ Già funziona (rating/count) | - |
| **Dettaglio Professionista** | `/professionals/:id` | `ProfessionalDetail.tsx` | ⚠️ Da integrare | 🔴 ALTA |
| **Dashboard Overview** | `/partner/dashboard` | `OverviewPage.tsx` | ⚠️ Da aggiungere (opzionale) | 🟡 MEDIA |
| **Pagina Recensioni** | `/partner/reviews` | `ReviewsPage.tsx` | ❌ Da creare | 🟡 MEDIA |
| **Profilo Professionista** | `/partner/profilo` | `ProfiloPage.tsx` | ⚠️ Da verificare | 🟢 BASSA |

---

**Prossimo passo**: Iniziare con Fase 1 (Visualizzazione lato utente) - Modificare `ProfessionalDetail.tsx`

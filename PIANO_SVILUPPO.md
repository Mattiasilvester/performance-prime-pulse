# 🎯 PIANO DI SVILUPPO PERFORMANCE PRIME PULSE

**Data creazione**: 21 Gennaio 2025  
**Versione**: 1.0  
**Status**: ✅ Database completato - Pronto per sviluppo features

---

## 📊 STATO ATTUALE

### ✅ **COMPLETATO AL 100%**

#### **Database Schema**
- ✅ FASE 1: Cleanup database (rimozione duplicati, colonne deprecate)
- ✅ FASE 2.1: Tabella `professional_services` creata e popolata
- ✅ FASE 2.2: Tabella `reviews` creata con trigger automatici
- ✅ FASE 2.3: Colonna `prezzo_seduta` aggiunta e integrata
- ✅ FASE 2.4: Tabelle settings (`professional_settings`, `professional_languages`)

#### **Codice Base**
- ✅ `ProfiloPage.tsx` aggiornato per usare `prezzo_seduta` (number)
- ✅ Modal Impostazioni: Specializzazioni, Lingua, Link Social implementati

---

## 🚨 PRIORITÀ CRITICHE (DA FARE PRIMA DI TUTTO)

### **PRIORITÀ 1: Aggiornare Codice per `professional_services`** 🔴 **CRITICA**

**Problema attuale**: Il codice usa ancora `service_type` (VARCHAR) invece di `service_id` (FK a `professional_services`)

**Impatto**: 🔴 **ALTO**
- Duplicazione dati (`professional_services` + `bookings.service_type`)
- Inconsistenza database
- Difficoltà future a migrare
- Servizi default creati ma non utilizzati

**Azioni richieste**:

#### **1.1 Creare Servizio API**
**File**: `src/services/professionalServicesService.ts` (NUOVO)
```typescript
// Funzioni da implementare:
- fetchServices(professionalId: string): Promise<Service[]>
- createService(professionalId: string, data: CreateServiceData): Promise<Service>
- updateService(serviceId: string, data: UpdateServiceData): Promise<Service>
- deleteService(serviceId: string): Promise<void>
```

**Interfaccia Service**:
```typescript
interface Service {
  id: string;
  professional_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_online: boolean;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}
```

**Tempo stimato**: 30 minuti

---

#### **1.2 Aggiornare `AddBookingModal.tsx`**
**File**: `src/components/partner/bookings/AddBookingModal.tsx`

**Modifiche**:
- [ ] Rimuovere input testo `service_type`
- [ ] Aggiungere dropdown per selezionare servizio da `professional_services`
- [ ] Fetch servizi del professionista all'apertura modal
- [ ] Salvare `service_id` invece di `service_type`
- [ ] Pre-compilare durata e prezzo dal servizio selezionato

**Tempo stimato**: 45 minuti

---

#### **1.3 Aggiornare `AgendaView.tsx`**
**File**: `src/components/partner/calendario/AgendaView.tsx`

**Modifiche**:
- [ ] Modificare `fetchBookings` per includere JOIN con `professional_services`
- [ ] Mostrare `service.name` invece di `booking.service_type`
- [ ] Aggiornare `handleCreateBooking` per salvare `service_id`
- [ ] Aggiornare `handleUpdateBooking` per gestire `service_id`

**Tempo stimato**: 45 minuti

---

#### **1.4 Aggiornare `PrenotazioniPage.tsx`**
**File**: `src/pages/partner/dashboard/PrenotazioniPage.tsx`

**Modifiche**:
- [ ] Modificare `fetchBookings` per includere JOIN con `professional_services`
- [ ] Mostrare `service.name` invece di `booking.service_type` nella lista
- [ ] Aggiornare modal modifica per usare dropdown servizi
- [ ] Aggiornare filtri se necessario

**Tempo stimato**: 30 minuti

---

#### **1.5 Creare Modal Gestione Servizi**
**File**: `src/components/partner/settings/ServicesModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Lista servizi del professionista
- [ ] Creazione nuovo servizio (form con: nome, descrizione, durata, prezzo, online/presenza, colore)
- [ ] Modifica servizio esistente
- [ ] Eliminazione servizio (con conferma)
- [ ] Toggle attivo/inattivo
- [ ] Integrazione in `ImpostazioniPage.tsx`

**Tempo stimato**: 2 ore

---

**TOTALE PRIORITÀ 1**: ~4 ore

**Perché è critico**: Senza questa integrazione, la tabella `professional_services` non viene utilizzata e avremo dati duplicati e inconsistenti.

---

### **PRIORITÀ 2: Test e Verifica Post-Integrazione** 🟡 **ALTA**

Dopo aver completato PRIORITÀ 1:

1. **Test Funzionali**:
   - [ ] Creazione prenotazione con servizio selezionato
   - [ ] Modifica prenotazione cambiando servizio
   - [ ] Visualizzazione nome servizio in AgendaView
   - [ ] Visualizzazione nome servizio in PrenotazioniPage
   - [ ] Creazione/modifica/eliminazione servizi in Impostazioni

2. **Test Database**:
   - [ ] Verifica che `service_id` venga salvato correttamente
   - [ ] Verifica che `service_type` non venga più usato
   - [ ] Verifica JOIN funzionanti

**Tempo stimato**: 1 ora

---

## 🎯 FEATURES DA IMPLEMENTARE (Dopo PRIORITÀ 1)

### **FASE 3: Completare Sezione Impostazioni**

#### **3.1 Notifiche** 🟡 **MEDIA**
**File**: `src/components/partner/settings/NotificationsModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Toggle notifiche email per:
  - Nuove prenotazioni
  - Cancellazioni
  - Messaggi da clienti
  - Recensioni ricevute
- [ ] Toggle notifiche push (se implementato)
- [ ] Salvataggio in `professional_settings`

**Tempo stimato**: 1.5 ore

---

#### **3.2 Pagamenti** 🟡 **MEDIA**
**File**: `src/components/partner/settings/PaymentsModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Integrazione Stripe Connect
- [ ] Collegamento account Stripe
- [ ] Visualizzazione stato account
- [ ] Gestione `stripe_account_id` in `professional_settings`
- [ ] Messaggi informativi per setup

**Tempo stimato**: 3 ore (dipende da integrazione Stripe)

---

#### **3.3 Privacy** 🟡 **MEDIA**
**File**: `src/components/partner/settings/PrivacyModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Toggle "Profilo pubblico" / "Profilo privato"
- [ ] Toggle "Mostra prezzo" / "Nascondi prezzo"
- [ ] Toggle visibilità altre informazioni
- [ ] Salvataggio in `professional_settings`

**Tempo stimato**: 1 ora

---

#### **3.4 Account** 🟡 **MEDIA**
**File**: `src/components/partner/settings/AccountModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Cambio password (Supabase Auth)
- [ ] Cambio email (Supabase Auth con verifica)
- [ ] Eliminazione account (con conferma multipla)
- [ ] Messaggi informativi e gestione errori

**Tempo stimato**: 2 ore

---

#### **3.5 Area di Copertura** 🟡 **MEDIA**
**File**: `src/components/partner/settings/CoverageAreaModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Mappa interattiva (usare libreria come Leaflet o Google Maps)
- [ ] Selezione punto centrale con marker
- [ ] Slider per raggio di copertura (km)
- [ ] Salvataggio coordinate in `professional_settings`
- [ ] Visualizzazione area attuale

**Tempo stimato**: 4 ore (dipende da libreria mappe)

---

#### **3.6 Politiche Cancellazione** 🟡 **MEDIA**
**File**: `src/components/partner/settings/CancellationPoliciesModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Input "Ore di preavviso minimo" (number)
- [ ] Input "Percentuale penale" (number, 0-100)
- [ ] Spiegazione delle politiche
- [ ] Salvataggio in `professional_settings`
- [ ] Preview politica applicata

**Tempo stimato**: 1.5 ore

---

**TOTALE FASE 3**: ~13 ore

---

### **FASE 4: Sistema Recensioni UI**

#### **4.1 Visualizzazione Recensioni (Professionisti)** 🟡 **MEDIA**
**File**: `src/components/partner/reviews/ReviewList.tsx` (NUOVO)  
**File**: `src/components/partner/reviews/ReviewCard.tsx` (NUOVO)

**Funzionalità**:
- [ ] Lista recensioni ricevute
- [ ] Filtri per rating (1-5 stelle)
- [ ] Card recensione con: nome utente, rating, commento, data
- [ ] Badge "Verificata" se `is_verified = true`
- [ ] Indicatore "Non risposta" se `response IS NULL`

**Tempo stimato**: 2 ore

---

#### **4.2 Risposta a Recensioni** 🟡 **MEDIA**
**File**: `src/components/partner/reviews/ReviewResponseModal.tsx` (NUOVO)

**Funzionalità**:
- [ ] Modal per rispondere a recensione
- [ ] Textarea per risposta
- [ ] Salvataggio `response` e `response_at` in `reviews`
- [ ] Visualizzazione risposta esistente
- [ ] Possibilità di modificare risposta

**Tempo stimato**: 1.5 ore

---

#### **4.3 Form Recensione (Utenti)** 🟡 **MEDIA**
**File**: `src/components/user/ReviewForm.tsx` (NUOVO)

**Funzionalità**:
- [ ] Form per lasciare recensione dopo completamento booking
- [ ] Rating a stelle (1-5)
- [ ] Campo titolo (opzionale)
- [ ] Campo commento
- [ ] Validazione e salvataggio
- [ ] Toast di conferma
- [ ] Integrazione in pagina profilo professionista

**Tempo stimato**: 2 ore

---

**TOTALE FASE 4**: ~5.5 ore

---

## 📋 ORDINE DI IMPLEMENTAZIONE RACCOMANDATO

### **SETTIMANA 1: PRIORITÀ CRITICHE**

**Giorno 1-2**: PRIORITÀ 1 (Aggiornamento codice per `professional_services`)
- [x] ✅ Servizio API
- [x] ✅ AddBookingModal
- [x] ✅ AgendaView
- [x] ✅ PrenotazioniPage
- [x] ✅ ServicesModal

**Giorno 3**: PRIORITÀ 2 (Test e verifica)
- [x] ✅ Test funzionali completi
- [x] ✅ Fix eventuali bug

---

### **SETTIMANA 2: IMPOSTAZIONI E RECENSIONI**

**Giorno 1-2**: FASE 3 - Impostazioni (Parte 1)
- [ ] Notifiche
- [ ] Privacy
- [ ] Politiche Cancellazione

**Giorno 3-4**: FASE 3 - Impostazioni (Parte 2)
- [ ] Account
- [ ] Pagamenti (se Stripe pronto)
- [ ] Area Copertura (se mappe pronte)

**Giorno 5**: FASE 4 - Recensioni
- [ ] Visualizzazione recensioni
- [ ] Risposta recensioni
- [ ] Form recensione utenti

---

## 🎯 CHECKLIST FINALE PRE-SVILUPPO

### **Prima di iniziare PRIORITÀ 1, verifica**:

- [x] ✅ Tutte le migrazioni database eseguite con successo
- [x] ✅ Test database completato (tutte le tabelle presenti)
- [ ] ⚠️ Test UI ProfiloPage (prezzo_seduta funziona)
- [ ] ⚠️ Test UI Impostazioni (Specializzazioni, Lingua, Link Social funzionano)

**Se mancano test UI, eseguire prima di iniziare PRIORITÀ 1**

---

## 📝 NOTE TECNICHE

### **Dipendenze Esterne**

1. **Stripe Connect** (per Pagamenti):
   - Configurare account Stripe
   - Ottere API keys
   - Implementare webhook (futuro)

2. **Mappe** (per Area Copertura):
   - Scegliere libreria: Leaflet (gratuita) o Google Maps (a pagamento)
   - Configurare API keys se necessario

### **Tabelle Database Utilizzate**

- `professional_services`: Servizi offerti dai professionisti
- `bookings`: Prenotazioni (con `service_id` FK)
- `reviews`: Recensioni (con trigger per rating automatico)
- `professional_settings`: Impostazioni professionali (notifiche, privacy, pagamenti, area, politiche)
- `professional_languages`: Lingue parlate
- `professionals`: Profilo professionista (con `prezzo_seduta`)

### **Pattern di Codice**

- **Modal**: Usare `createPortal` per renderizzare nel `document.body` (evita problemi scroll)
- **Servizi API**: Creare file separati in `src/services/` per ogni entità
- **Toast**: Usare `sonner` per feedback utente
- **Validazione**: Client-side + Server-side (RLS policies)

---

## 🚀 RACCOMANDAZIONE FINALE

**PROSSIMO STEP IMMEDIATO**:

1. ✅ **Test UI rapido** (15 minuti):
   - ProfiloPage: modifica prezzo seduta
   - Impostazioni: testa 3 modal esistenti

2. 🔴 **INIZIARE PRIORITÀ 1** (4 ore):
   - Creare servizio API per `professional_services`
   - Aggiornare componenti esistenti
   - Creare modal gestione servizi

3. ✅ **Test completo** (1 ora):
   - Verifica funzionamento end-to-end
   - Fix bug eventuali

**DOPO PRIORITÀ 1**, procedere con:
- FASE 3: Impostazioni (6 modal rimanenti)
- FASE 4: Recensioni UI

---

## 📊 STIMA TEMPI TOTALI

| Fase | Tempo Stimato | Priorità |
|------|---------------|----------|
| PRIORITÀ 1: Integrazione professional_services | 4 ore | 🔴 CRITICA |
| PRIORITÀ 2: Test post-integrazione | 1 ora | 🟡 ALTA |
| FASE 3: Impostazioni complete | 13 ore | 🟡 MEDIA |
| FASE 4: Recensioni UI | 5.5 ore | 🟡 MEDIA |
| **TOTALE** | **~23.5 ore** | |

**Nota**: Le stime includono sviluppo, test e fix bug. Tempi reali possono variare in base a complessità impreviste o richieste aggiuntive.

---

**Ultima revisione**: 21 Gennaio 2025  
**Prossima revisione**: Dopo completamento PRIORITÀ 1


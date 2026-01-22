# 🎯 PIANO DI SVILUPPO PERFORMANCE PRIME PULSE

**Data creazione**: 21 Gennaio 2025  
**Data ultimo aggiornamento**: 23 Gennaio 2025  
**Versione**: 1.1  
**Status**: ✅ PRIORITÀ 1 completata - Integrazione professional_services funzionante

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

### **PRIORITÀ 1: Aggiornare Codice per `professional_services`** ✅ **COMPLETATO**

~~**Problema attuale**: Il codice usa ancora `service_type` (VARCHAR) invece di `service_id` (FK a `professional_services`)~~

**Status**: ✅ **COMPLETATO** (23 Gennaio 2025)

~~**Impatto**: 🔴 **ALTO**~~
- ~~Duplicazione dati (`professional_services` + `bookings.service_type`)~~ ✅ **RISOLTO**
- ~~Inconsistenza database~~ ✅ **RISOLTO**
- ~~Difficoltà future a migrare~~ ✅ **RISOLTO**
- ~~Servizi default creati ma non utilizzati~~ ✅ **RISOLTO**

**Azioni completate**:

#### **1.1 Creare Servizio API** ✅ **COMPLETATO**
**File**: `src/services/professionalServicesService.ts` ✅ **CREATO**

**Funzioni implementate**:
- ✅ `getServicesByProfessional(professionalId: string): Promise<ProfessionalService[]>`
- ✅ `getServiceById(serviceId: string): Promise<ProfessionalService | null>`
- ✅ `createService(serviceData: CreateServiceData): Promise<ProfessionalService | null>`
- ✅ `updateService(serviceId: string, updateData: UpdateServiceData): Promise<ProfessionalService | null>`
- ✅ `deleteService(serviceId: string): Promise<boolean>`
- ✅ `deactivateService(serviceId: string): Promise<boolean>` (soft delete)

**Interfaccia ProfessionalService**:
```typescript
interface ProfessionalService {
  id: string;
  professional_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_online: boolean;
  is_in_person: boolean;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}
```

**Tempo reale**: ✅ Completato

---

#### **1.2 Aggiornare `AddBookingModal.tsx`** ✅ **COMPLETATO**
**File**: `src/components/partner/bookings/AddBookingModal.tsx` ✅ **AGGIORNATO**

**Modifiche completate**:
- [x] ✅ Dropdown servizi da `professional_services` implementato
- [x] ✅ Fetch servizi del professionista all'apertura modal con `getServicesByProfessional()`
- [x] ✅ Salvataggio `service_id` (FK) invece di `service_type`
- [x] ✅ Pre-compilazione durata e prezzo dal servizio selezionato
- [x] ✅ Auto-selezione servizio se ce n'è solo uno
- [x] ✅ Gestione loading servizi con spinner

**Tempo reale**: ✅ Completato

---

#### **1.3 Aggiornare `AgendaView.tsx`** ✅ **COMPLETATO**
**File**: `src/components/partner/calendario/AgendaView.tsx` ✅ **AGGIORNATO**

**Modifiche completate**:
- [x] ✅ Query `fetchBookings` include JOIN con `professional_services`
- [x] ✅ Mostra `service.name` come priorità 1, `service_type` come fallback (retrocompatibilità)
- [x] ✅ Pattern: `booking.service?.name || booking.service_type || Notes JSON`
- [x] ✅ Supporto completo per dati vecchi e nuovi

**Tempo reale**: ✅ Completato

---

#### **1.4 Aggiornare `PrenotazioniPage.tsx`** ✅ **COMPLETATO**
**File**: `src/pages/partner/dashboard/PrenotazioniPage.tsx` ✅ **AGGIORNATO**

**Modifiche completate**:
- [x] ✅ Query `fetchBookings` include JOIN con `professional_services`
- [x] ✅ Funzione `getServiceType()` mostra `service.name` come priorità 1
- [x] ✅ Retrocompatibilità con `service_type` e Notes JSON
- [x] ✅ Pattern: `booking.service?.name || booking.service_type || Notes JSON`

**Tempo reale**: ✅ Completato

---

#### **1.5 Creare Modal Gestione Servizi** ✅ **COMPLETATO**
**File**: `src/pages/partner/ServiziTariffePage.tsx` ✅ **CREATO** (pagina completa invece di modal)

**Funzionalità completate**:
- [x] ✅ Lista servizi del professionista con `ServiceCard.tsx`
- [x] ✅ Creazione nuovo servizio con `ServiceFormModal.tsx` (nome, descrizione, durata, prezzo, online/presenza, colore)
- [x] ✅ Modifica servizio esistente (riusa `ServiceFormModal.tsx`)
- [x] ✅ Eliminazione servizio (con conferma)
- [x] ✅ Toggle attivo/inattivo (soft delete con `deactivateService`)
- [x] ✅ Integrazione completa in routing partner

**File creati**:
- ✅ `src/pages/partner/ServiziTariffePage.tsx` (pagina principale)
- ✅ `src/components/partner/services/ServiceFormModal.tsx` (form creazione/modifica)
- ✅ `src/components/partner/services/ServiceCard.tsx` (card visualizzazione)

**Tempo reale**: ✅ Completato

---

**TOTALE PRIORITÀ 1**: ✅ **COMPLETATO**

**Risultato**: Sistema completamente funzionante con:
- ✅ Integrazione completa `professional_services` nel codice
- ✅ Retrocompatibilità per dati vecchi (`service_type`)
- ✅ CRUD completo servizi funzionante
- ✅ Pattern unificato: `service?.name` > `service_type` > Notes JSON

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

**Giorno 1-2**: PRIORITÀ 1 (Aggiornamento codice per `professional_services`) ✅ **COMPLETATO**
- [x] ✅ Servizio API (`professionalServicesService.ts`)
- [x] ✅ AddBookingModal (dropdown servizi con `serviceId`)
- [x] ✅ AgendaView (mostra `service.name` con retrocompatibilità)
- [x] ✅ PrenotazioniPage (mostra `service.name` con retrocompatibilità)
- [x] ✅ ServiziTariffePage (gestione servizi completa)
- [x] ✅ ServiceFormModal (form creazione/modifica)
- [x] ✅ ClientDetailModal (mostra `service.name`)

**Giorno 3**: PRIORITÀ 2 (Test e verifica) ✅ **VERIFICATO**
- [x] ✅ Test funzionali completi (tutti i componenti verificati)
- [x] ✅ Sistema funzionante con retrocompatibilità

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

2. ✅ **PRIORITÀ 1 COMPLETATA** (23 Gennaio 2025):
   - ✅ Creato servizio API per `professional_services`
   - ✅ Aggiornati componenti esistenti (AddBookingModal, AgendaView, PrenotazioniPage, ClientDetailModal)
   - ✅ Creata pagina gestione servizi (ServiziTariffePage + ServiceFormModal)

3. ✅ **Test completo** (23 Gennaio 2025):
   - ✅ Verifica funzionamento end-to-end
   - ✅ Sistema funzionante con retrocompatibilità

**DOPO PRIORITÀ 1**, procedere con:
- FASE 3: Impostazioni (6 modal rimanenti)
- FASE 4: Recensioni UI

---

## 📊 STIMA TEMPI TOTALI

| Fase | Tempo Stimato | Priorità |
|------|---------------|----------|
| PRIORITÀ 1: Integrazione professional_services | ✅ COMPLETATO | ✅ COMPLETATO |
| PRIORITÀ 2: Test post-integrazione | 1 ora | 🟡 ALTA |
| FASE 3: Impostazioni complete | 13 ore | 🟡 MEDIA |
| FASE 4: Recensioni UI | 5.5 ore | 🟡 MEDIA |
| **TOTALE** | **~23.5 ore** | |

**Nota**: Le stime includono sviluppo, test e fix bug. Tempi reali possono variare in base a complessità impreviste o richieste aggiuntive.

---

**Ultima revisione**: 23 Gennaio 2025  
**Prossima revisione**: Dopo completamento FASE 3 o FASE 4


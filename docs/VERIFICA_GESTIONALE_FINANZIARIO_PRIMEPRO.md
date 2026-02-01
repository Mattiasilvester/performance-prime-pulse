# Verifica pre-implementazione – Gestionale finanziario PrimePro

**Data:** 31 Gennaio 2026  
**Scope:** Step 8 (Costi & Spese), Step 9 (Andamento & Analytics), Step 10 (Export Report)

---

## 1. Logo Prime Pro – colori per template PDF (Step 10)

**Riferimenti in codice:**
- `src/components/partner/PartnerHeader.tsx`: "Prime" = `var(--partner-primary-foreground)`, "Pro" = `#EEBA2B`
- `src/components/partner/dashboard/PartnerSidebar.tsx`: "Prime" = `text-black`, "Pro" = `text-[#EEBA2B]`
- `src/services/invoiceExportService.ts`: già usa `#EEBA2B` (238, 186, 43) per titolo "PrimePro" e header tabella

**Colori da usare nel template PDF (stesso colore del logo Prime Pro):**
- **Nero:** testo "Prime", bordi, testo corpo (es. RGB 0, 0, 0)
- **Oro Prime Pro:** `#EEBA2B` → RGB (238, 186, 43) per "Pro", accenti, header tabelle, linee di separazione

**Logo immagine:** `/images/logo-pp-transparent.png` (usato in PartnerHeader e PartnerSidebar). In PDF si può inserire questa immagine nell’header; il template (testi, tabelle, bordi) deve usare nero + #EEBA2B come sopra.

**Conclusione Step 10:** Template PDF con logo stesso colore del logo Prime Pro = nero + #EEBA2B. PDF sia mensile sia per periodo (range date) come da richiesta.

---

## 2. Fonte ricavi (per Andamento & Riepilogo profitto)

**Dove sono i ricavi:**
- Tabella **`bookings`**: `professional_id`, `service_id`, `status`, `price` (numero, nullable)
- Tabella **`professional_services`**: `id`, `professional_id`, `name`, `price` (numero)

**Logica attuale (da riutilizzare):**
- `src/components/partner/dashboard/kpi/KPICardsSection.tsx`: funzione `sumBookingRevenue(rows)` somma per ogni booking `bookings.price` (se valorizzato) oppure `professional_services.price` (da JOIN). Solo appuntamenti con `status === 'completed'`.
- Query ricavi: `bookings` con filtro `professional_id`, `status = 'completed'`, JOIN `professional_services(price)`.

**Conclusione:** I ricavi per “Andamento” e “Riepilogo profitto” si basano su **bookings completati** con prezzo da `bookings.price` o `professional_services.price`. Nessuna nuova tabella per i ricavi; eventuale helper condiviso per il calcolo (es. `sumBookingRevenue`) da riutilizzare per Andamento e per il report PDF.

---

## 3. Costi – stato attuale DB

**Verifica types e codice:** Non esiste alcuna tabella per costi/spese del professionista (né `professional_costs`, né `professional_expenses`, né simili).

**Conclusione Step 8:** Serve una **nuova tabella** (es. `professional_costs` o `professional_expenses`) con almeno:
- `professional_id`, `amount`, `category`, `description`, `date` (o `period`), `is_recurring`, `recurrence` (mensile/annuale), `created_at`, `updated_at`.  
Schema preciso e RLS da definire nello Step 8.

---

## 4. Sidebar Partner – dove inserire “Costi & Spese”

**File:** `src/components/partner/dashboard/PartnerSidebar.tsx`  
**Array:** `menuItems` (righe ~40–48).

**Voci attuali:** Overview, Calendario, Prenotazioni, Profilo, Servizi e Tariffe, Recensioni, Abbonamento.

**Azione:** Aggiungere una voce **“Costi & Spese”** (es. icona `Receipt` o `Wallet` da lucide-react) con path dedicato (es. `/partner/dashboard/costi-spese`).  
“Andamento & Analytics” può essere una sezione della stessa area finanziaria o una pagina separata (es. `/partner/dashboard/andamento`); da decidere in Step 9 (es. tab “Andamento” nella stessa area dove ci sono “Costi & Spese”).

---

## 5. Export PDF esistente – allineamento Step 10

**File:** `src/services/invoiceExportService.ts`  
**Contenuto attuale:** Export fatture abbonamento PrimePro: titolo "PrimePro" in #EEBA2B, “Riepilogo Fatture”, tabella fatture, totale pagato, footer “Performance Prime Pulse - www.performanceprime.it”.

**Step 10 – Report “Pronto per il Commercialista”:**
- Nuova funzione (o nuovo file servizio) per il report **economico** (ricavi + costi + margine).
- Stesso stile Prime Pro: **nero + #EEBA2B** (stesso colore del logo Prime Pro).
- Contenuto: ricavi per servizio, costi per categoria, totale lordo, totale costi, margine stimato; periodo selezionabile (mensile o range date).
- Formati: PDF (brandizzato), Excel, CSV come da piano.

---

## 6. Riepilogo verifiche

| Tema | Esito | Note |
|------|--------|------|
| Colori logo Prime Pro per PDF | Ok | Nero + #EEBA2B; invoiceExportService già allineato su #EEBA2B |
| PDF mensile / periodi | Ok | Da implementare: scelta periodo (mese singolo o range) nel report |
| Fonte ricavi | Ok | `bookings` (completed) + `professional_services.price`; logica in KPICardsSection |
| Tabella costi | Da creare | Nessuna tabella esistente; nuova tabella in Step 8 |
| Sidebar “Costi & Spese” | Ok | Aggiungere voce in `PartnerSidebar.tsx` con path dedicato |
| Riepilogo profitto (ricavi − costi) | Ok | Da fare in Step 9 usando stessa fonte ricavi + nuova tabella costi |

---

**Prossimo passo:** Implementazione Step 8 (Costi & Spese): migrazione tabella costi, CRUD, categorie, ricorrenza, voce sidebar, riepilogo mensile.

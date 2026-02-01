# Report — “Report per Commercialista” + CSV (solo export, no modifiche KPI)

**Vincolo**: modificare/aggiungere **solo** la parte di export. Non toccare `analyticsService`, KPI, grafici, calcolo ricavi (count × prezzo_seduta). Lasciare intatto `exportAnalyticsReportToPDF`.

---

## 1. Obiettivo

- Nuovo export **Report per Commercialista**: PDF dedicato + 3 CSV (prestazioni, costi, riepilogo).
- Dati usati: `bookings` (completed), `professional_costs`, `professionals` (già presenti).
- Periodo: stesso range selezionato in Andamento (3/6/12 mesi), senza cambiare la logica UI.

---

## 2. Decisioni “del caso” (risposte alle domande)

### 1) Se `bookings.price` è NULL — cosa facciamo?

**Raccomandazione: A**

- **A) Escludere la riga dal totale e segnalare “price missing”** (o simile in tabella).
- B) Fallback su `professionals.prezzo_seduta`: mischierebbe due fonti e il report è “valore dichiarato” dal professionista.
- C) Bloccare export: troppo restrittivo, un solo booking senza prezzo bloccherebbe tutto.

**Implementazione suggerita**: nella tabella prestazioni mostrare tutte le righe; se `price == null` mettere nella colonna prezzo “— (mancante)” e **non** includere quella riga nel “Valore lordo dichiarato”. In fondo alla sezione o in nota: “Righe con prezzo mancante escluse dal totale.”

---

### 2) Nel PDF includiamo `client_name`? (privacy)

**Raccomandazione: Sì, ma opzionale e configurabile.**

- Inclusione di default: **sì** (utile al commercialista per riconciliare).
- Se in futuro si vuole tutelare la privacy: aggiungere un parametro `includeClientName?: boolean` (default `true`). Per l’MVP si può includere sempre; eventuale opzione “anonimizza” in un secondo step.

---

### 3) Includiamo `notes`? (rischio info sensibili)

**Raccomandazione: Sì, ma opzionale.**

- Inclusione di default: **sì** (il commercialista può aver bisogno di note).
- Stesso approccio: parametro `includeNotes?: boolean` (default `true`). Per l’MVP includere; eventuale esclusione in un secondo step.

---

### 4) Costi ricorrenti: nel report includiamo solo record presenti (no calcoli virtuali)?

**Conferma: Sì.**

- Solo record effettivamente presenti in `professional_costs` con `cost_date` nel periodo.
- Nessuna “replica” virtuale di ricorrenze nel report. Coerente con “dati già presenti” e con la richiesta di non cambiare logica analytics.

---

## 3. Struttura PDF (MVP)

- **Titolo**: “Report per Commercialista”
- **Data generazione** (gg/mm/aaaa)
- **Periodo**: date from / to (es. “Dal 01/08/2025 al 31/01/2026” per 6 mesi)
- **Dati professionista**:
  - Ragione sociale / Nome: `company_name` oppure `first_name` + `last_name`
  - Email, telefono
  - P.IVA: `vat_number`
  - Indirizzo: `vat_address`, `vat_city`, `vat_postal_code`
  - (Opzionale) PEC, Codice SDI
- **Disclaimer** (box evidente):
  - “La piattaforma non gestisce pagamenti/incassi. I valori economici sono inseriti dal professionista a fini organizzativi e di analisi.”
- **Riepilogo periodo**:
  - Sedute completate (count)
  - Valore lordo dichiarato = SUM(bookings.price) per righe con price non null
  - Totale costi = SUM(professional_costs.amount) nel periodo
  - Margine operativo (ante imposte) = lordo − costi
- **Tabella prestazioni** (bookings completed nel periodo):
  - booking_date, booking_time, service_type, price, (client_name), (notes)
  - Se price null: colonna prezzo “— (mancante)”; nota che queste righe sono escluse dal totale
- **Tabella costi** (nel periodo):
  - cost_date, category, description, amount, is_recurring, recurrence

---

## 4. Periodo (date from/to)

- Stesso `timeRange` (3 | 6 | 12) della pagina Andamento.
- Calcolo coerente con i trend esistenti:
  - `dateTo` = fine mese corrente (o oggi, a scelta)
  - `dateFrom` = inizio del mese che dista `timeRange` mesi indietro
- Esempio: timeRange 6, oggi 31/01/2026 → dal 01/08/2025 al 31/01/2026.

---

## 5. Nuove funzioni (solo export)

| Funzione | Dove | Descrizione |
|----------|------|-------------|
| `exportAccountantReportToPDF(...)` | Nuovo servizio (es. `analyticsAccountantReportExportService.ts`) | Genera il PDF “Report per Commercialista” (client-side, jsPDF + autotable). Riceve: professionalId, timeRange, dateFrom, dateTo, dati professionista, bookings, costs, totali. |
| `exportBookingsToCSV(bookings[], options?)` | Stesso servizio | CSV prestazioni: date, time, service_type, price, client_name (opz.), notes (opz.). Download Blob. |
| `exportCostsToCSV(costs[], options?)` | Stesso servizio | CSV costi: cost_date, category, description, amount, is_recurring, recurrence. Download Blob. |
| `exportSummaryToCSV(summary, periodLabel)` | Stesso servizio | CSV riepilogo: sedute completate, valore lordo, totale costi, margine operativo, periodo. Download Blob. |

Per il report commercialista servirà anche un modo per **caricare** i dati nel periodo (bookings completed, costs, professional). Due opzioni:

- **Opzione A**: Nuovo servizio di fetch dedicato (es. `getAccountantReportData(professionalId, dateFrom, dateTo)`) che restituisce { professional, bookings, costs, summary } senza usare analyticsService per i totali (summary calcolato lato client da SUM(price) e SUM(amount)).
- **Opzione B**: Pagina Andamento chiama questo fetch solo al click “Esporta Report (Commercialista)” e passa i dati alle funzioni di export.

Raccomandazione: **Opzione A** — un unico servizio “report commercialista” che: (1) fa fetch bookings + costs + professional nel periodo, (2) calcola i totali per il report, (3) espone `exportAccountantReportToPDF` e le 3 export CSV. La pagina passa solo `professionalId` e `timeRange` (e deriva dateFrom/dateTo).

---

## 6. File da creare / modificare

| File | Azione |
|------|--------|
| `src/services/analyticsAccountantReportExportService.ts` | **CREARE**. Contiene: fetch dati periodo (bookings completed, costs, professional), calcolo totali report, `exportAccountantReportToPDF`, `exportBookingsToCSV`, `exportCostsToCSV`, `exportSummaryToCSV`. |
| `src/pages/partner/dashboard/AndamentoPage.tsx` | **MODIFICARE**. Aggiungere secondo bottone “Esporta Report (Commercialista)” che chiama il nuovo servizio (fetch + PDF + eventuale download CSV). Mantenere “Esporta Report” esistente per `exportAnalyticsReportToPDF`. |
| `src/components/partner/analytics/ProfitSummaryCard.tsx` | **MODIFICARE**. Aggiungere prop opzionale `onExportAccountant?: () => void` e secondo bottone “Esporta Report (Commercialista)” (o menu/dropdown con due voci). In alternativa il secondo bottone può stare solo in AndamentoPage. |

**Alternativa UI**: un solo bottone “Esporta Report” con dropdown “Report Analytics” / “Report Commercialista (PDF + CSV)”. Stesso risultato funzionale.

- **Nessuna modifica** a: `analyticsService.ts`, `useProfessionalAnalytics.ts`, grafici, KPI, `exportAnalyticsReportToPDF`, `professional_costs` / `bookings` schema.

---

## 7. Test manuale suggerito

1. Utente professionista con almeno **5 bookings completed** nel periodo (alcuni con `price` valorizzato, eventualmente uno con `price` null per testare A).
2. Almeno **5 costi** in `professional_costs` nel periodo (mix categorie, almeno uno ricorrente).
3. Andamento & Analytics: selezionare 3, 6 o 12 mesi.
4. Clic “Esporta Report (Commercialista)”:
   - Si scarica PDF con frontespizio, disclaimer, dati professionista, riepilogo (valore lordo = SUM(price), totale costi, margine), tabella prestazioni, tabella costi.
   - Opzionale: scaricare anche i 3 CSV (prestazioni, costi, riepilogo).
5. Verificare che le righe con `price` null compaiano in tabella con “— (mancante)” e siano escluse dal “Valore lordo dichiarato”.
6. Verificare che `exportAnalyticsReportToPDF` e il bottone “Esporta Report” esistente funzionino ancora senza modifiche.

---

## 8. Riepilogo risposte alle domande

| Domanda | Risposta |
|---------|----------|
| Se `bookings.price` è null? | **A)** Escludere dal totale e segnalare “price missing” (riga in tabella con “— (mancante)”, nota che sono escluse dal totale). |
| Includere `client_name` nel PDF? | **Sì** (default). Opzione per anonimizzare in seguito se serve. |
| Includere `notes`? | **Sì** (default). Opzione per escludere in seguito se serve. |
| Costi: solo record presenti, no virtuali? | **Sì.** Solo record in `professional_costs` con `cost_date` nel periodo. |

---

## 9. Route "Completa dati" e campi vat_* (F)

- **Route "Completa dati"**: `/partner/dashboard/profilo` (componente `ProfiloPage`).
- **Chi gestisce l'edit**: `ProfiloPage` gestisce `company_name` (Studio/Sede), `first_name`, `last_name`, `phone`, `prezzo_seduta`, `titolo_studio`, `category`, `specializzazioni`, `bio`. **Non** gestisce attualmente l'edit di `vat_number`, `vat_address`, `vat_city`, `vat_postal_code`.
- **Conseguenza**: "Completa dati" porta l'utente al profilo; se serve completare P.IVA/indirizzo fiscale, l'aggiunta di campi vat_* in ProfiloPage è da considerare **task separato**.

---

*Report generato per task “Report per Commercialista” + CSV — solo export, nessuna modifica a analytics/KPI.*

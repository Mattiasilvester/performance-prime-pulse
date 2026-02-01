# Prompt per ChatGPT — Step 10 Export Report (Andamento & Analytics)

Copia il blocco sotto e incollalo in ChatGPT. Contiene tutto il contesto del progetto, cosa è stato fatto e cosa manca.

---

## ISTRUZIONI PER L'USO

1. Copia **tutto** il testo dalla riga "CONTESTO PROGETTO" fino alla fine della sezione "COSA DEVI FARE (STEP 10)".
2. Incollalo in una nuova chat ChatGPT.
3. Se ChatGPT chiede chiarimenti, puoi aggiungere: "Usa jspdf e jspdf-autotable come in invoiceExportService.ts. Colori brand: nero e #EEBA2B."

---

# INIZIO PROMPT (copia da qui)

CONTESTO PROGETTO

Sto lavorando su **PrimePro** (portale per professionisti fitness) di **Performance Prime**. Stack: React 18, TypeScript, Vite, Supabase, Tailwind CSS, shadcn/ui, Recharts. Brand: nero (#000000) e oro (#EEBA2B). Il professionista si identifica con `user_id` sulla tabella `professionals` (NON auth_user_id). L’hook per ottenere l’id è `useProfessionalId()`.

Sto implementando il **gestionale finanziario** in 3 step:
- **Step 8 — Costi & Spese**: completato (tabella `professional_costs`, pagina Costi & Spese, CRUD costi, cost_type fisso/variabile/una_tantum, cost_date per filtrare per mese).
- **Step 9 — Andamento & Analytics**: completato (pagina Andamento con riepilogo profitto, grafici Recharts, alert intelligenti, time range 3/6/12 mesi).
- **Step 10 — Export Report**: da fare (bottone "Esporta Report" che genera un report PDF o CSV dei dati analytics).

COSA È STATO CREATO

**Step 8**
- Migration: `supabase/migrations/20260131120000_professional_costs.sql` (tabella `professional_costs` con id, professional_id, amount, category, description, cost_date, cost_type, is_recurring, recurrence, created_at, updated_at). RLS con `professionals.user_id = auth.uid()`.
- Migration: `20260131120001_professional_costs_add_cost_type.sql` (colonna cost_type).
- Service: `src/services/professionalCostsService.ts` (CRUD, getMonthlyCostsTotal, replicateRecurringCosts, getRecurringCostsSummary).
- Pagina: `src/pages/partner/dashboard/CostiSpesePage.tsx` (lista costi, totale mese, aggiungi/modifica/elimina, banner costi ricorrenti).
- Componenti: `src/components/partner/costs/CostFormModal.tsx`, `RecurringCostsBanner.tsx`.
- Sidebar: voce "Costi & Spese" con path `/partner/dashboard/costi-spese`. Route in App.tsx: `<Route path="costi-spese" element={<CostiSpesePage />} />`.

**Step 9**
- Service: `src/services/analyticsService.ts` — funzioni: getMonthlyRevenue, getMonthlyCosts, getRevenueTrend, getCostsTrend, getMarginTrend, getMonthComparison, getCostsDistribution, getProfitSummary, getFixedCostsRatio, getSmartAlertsForProfessional, generateSmartAlerts. Ricavi = count(bookings completed) × prezzo_seduta. Costi filtrati per cost_date nel mese (non month_year).
- Hook: `src/hooks/useProfessionalAnalytics.ts` — prende (professionalId, prezzoSeduta), restituisce { data, loading, timeRange, setTimeRange, refetch }. `data` è di tipo AnalyticsData con: profitSummary, revenueTrend, costsTrend, marginTrend, monthComparison, costsDistribution, alerts.
- Pagina Andamento: `src/pages/partner/dashboard/AndamentoPage.tsx` — usa useProfessionalId(), carica prezzo_seduta da `professionals` (select prezzo_seduta where id = professionalId), usa useProfessionalAnalytics(professionalId, prezzoSeduta ?? 0). Mostra: SmartAlerts, ProfitSummaryCard, TimeRangeSelector, RevenueTrendChart, CostsTrendChart, MarginTrendChart, MonthComparisonChart, CostsDistributionChart. Empty state e banner se prezzo_seduta manca.
- Componenti analytics: `src/components/partner/analytics/` — ProfitSummaryCard, RevenueTrendChart, CostsTrendChart, MarginTrendChart, MonthComparisonChart, CostsDistributionChart, SmartAlerts, TimeRangeSelector (index.ts esporta tutto tranne una pagina).
- Nella pagina, ProfitSummaryCard viene chiamata così: `<ProfitSummaryCard data={data.profitSummary} onExport={() => {}} />`. Il bottone "Esporta Report" è già nel componente (onClick={onExport}); al momento onExport è una funzione vuota.
- Sidebar: voce "Andamento e analytics", path `/partner/dashboard/andamento`. Route: `<Route path="andamento" element={<AndamentoPage />} />`.

STRUTTURE DATI DISPONIBILI PER L'EXPORT

- **profitSummary**: { revenue, costs, margin, revenueChangePercent, costsChangePercent, marginChangePercent, bookingsCount }.
- **revenueTrend**: array di { month: string, revenue: number } (es. "gen 2026", 1250).
- **costsTrend**: array di { month: string, costs: number }.
- **marginTrend**: array di { month: string, margin: number }.
- **monthComparison**: { current: { revenue, costs, margin }, previous: { revenue, costs, margin } }.
- **costsDistribution**: array di { name: string, value: number } (categoria e importo, es. "Affitto", 300).
- **alerts**: array di { type: 'success'|'warning'|'info'|'danger', icon: string, message: string }.

Tutte queste sono già in `data` restituito da useProfessionalAnalytics. La pagina ha anche `refetch` se serve aggiornare prima dell’export.

DIPENDENZE GIÀ PRESENTI

- jspdf: sì (package.json).
- jspdf-autotable: sì.
- date-fns: sì (usato per date in italiano).
- recharts: sì (solo per la UI, non per il PDF).
- html2canvas: no.
- @react-pdf/renderer: no.

Nel progetto esiste già un export PDF per le fatture: `src/services/invoiceExportService.ts`. Usa jsPDF e jspdf-autotable, colori nero e #EEBA2B (RGB 238, 186, 43). Puoi seguire lo stesso stile per il report analytics (titolo, tabelle con autoTable, formattazione € e date it-IT).

COSA DEVI FARE (STEP 10)

1. **Implementare l’export del report Andamento & Analytics** (PDF e/o CSV) usando i dati già disponibili nella pagina (data da useProfessionalAnalytics). Contenuto suggerito: periodo (mese corrente o ultimi N mesi in base al timeRange), riepilogo profitto (incasso lordo, totale spese, margine netto), confronto mese corrente vs precedente, trend ricavi/costi/margine (tabella), distribuzione costi per categoria. Opzionale: elenco alert.
2. **Collegare il bottone "Esporta Report"** alla funzione di export: in AndamentoPage.tsx sostituire `onExport={() => {}}` con una funzione che chiama il nuovo servizio di export passando `data` (e eventualmente timeRange). Il bottone è già in ProfitSummaryCard; non spostarlo.
3. **Dove mettere il codice**: creare un servizio dedicato, ad es. `src/services/analyticsReportExportService.ts`, con funzioni tipo `exportAnalyticsReportToPDF(data: AnalyticsData, timeRange: TimeRange, professionalName?: string): void` e eventualmente `exportAnalyticsReportToCSV(...)`. Usare i tipi già definiti in `src/services/analyticsService.ts` (ProfitSummary, MonthComparison, SmartAlert) e in `src/hooks/useProfessionalAnalytics.ts` (AnalyticsData, TimeRange). Non modificare le strutture dati esistenti.
4. **Requisiti tecnici**: TypeScript senza errori; formattazione € in locale it-IT; date in italiano; colori brand nero e #EEBA2B nel PDF; nome file con data (es. report_andamento_2026-01-31.pdf). Gestire il caso in cui data sia null (es. non fare export o mostrare un toast "Nessun dato da esportare").

Se preferisci solo PDF va bene; se aggiungi anche CSV usa lo stesso stile del CSV fatture (delimiter ;, BOM UTF-8, nomi colonne in italiano).

# FINE PROMPT

---

## Note aggiuntive (opzionali da incollare se ChatGPT chiede dettagli)

- **Percorso pagina Andamento**: `src/pages/partner/dashboard/AndamentoPage.tsx`.
- **Percorso ProfitSummaryCard**: `src/components/partner/analytics/ProfitSummaryCard.tsx` — il bottone è già presente, riceve `onExport` dalle props.
- **Hook**: `useProfessionalAnalytics(professionalId, prezzoSeduta)` restituisce `{ data, loading, timeRange, setTimeRange, refetch }`. Tipo `AnalyticsData` e `TimeRange` sono in `src/hooks/useProfessionalAnalytics.ts`.
- **Tipi analytics**: `ProfitSummary`, `MonthComparison`, `SmartAlert` in `src/services/analyticsService.ts`.
- **Esempio export PDF esistente**: `src/services/invoiceExportService.ts` (exportInvoicesToPDF con jsPDF + autoTable, colori #EEBA2B e nero).

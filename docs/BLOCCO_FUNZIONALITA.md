# 🔒 BLOCCO FUNZIONALITÀ — NON TOCCARE

**Ultimo aggiornamento:** 11 Febbraio 2026

Prima di implementare qualsiasi nuova feature: queste funzionalità sono **testate e funzionanti**. Se una modifica rischia di impattare anche solo una di esse, **fermarsi e chiedere conferma**.

---

## Riferimento per le regole

- **In .cursorrules** è presente un riepilogo breve di questo blocco (visibile a inizio/fine sessione).
- **Questo file** è il riferimento completo: va aggiornato **a fine sessione** se si aggiungono nuove funzionalità testate o si cambiano le regole.

---

## Funzionalità bloccate (non modificare)

- **Autenticazione** – Login, logout, reset password
- **Dashboard** – OverviewPage con KPI reali, prossimi appuntamenti, stato vuoto (nessun dato demo/placeholder)
- **Agenda / Calendario** – Vista giorno/settimana, drag&drop, blocco slot
- **Prenotazioni** – Lista filtrabile, conferma/cancella/completa, conteggio card
- **Clienti** – Lista, aggiungi, dettaglio
- **Servizi e Tariffe** – CRUD
- **Profilo** – Visualizzazione e modifica
- **Costi e Spese** – Gestionale
- **Report e Analytics** – Andamento, export PDF Analytics e Commercialista (con e senza dati), Report Settimanale  
  - **Regola jspdf-autotable:** usare `import 'jspdf-autotable'` (solo side-effect) e `(doc as any).autoTable({ ... })`. **Non** usare `import { autoTable }` né `autoTable(doc, ...)`.
- **Recensioni**
- **Abbonamento** – Trial, badge
- **Notifiche e Promemoria** – Push, promemoria programmati
- **Onboarding** – Tour 13 step, "Rivedi guida"
- **SuperAdmin** – Dashboard, CORS
- **Landing**
- **Email** – Benvenuto, reminder trial
- **Safari iOS** – Input, select, modal
- **Vercel Analytics** – Inject in main

---

## Regole obbligatorie

1. **Nuove feature additive** – Non rimuovere o riscrivere logica esistente per le aree sopra.
2. **Modifiche minime** – Toccare solo le righe strettamente necessarie.
3. **Build pulita** – Dopo ogni modifica: `pnpm build:pro` deve terminare con **0 errori**.
4. **jspdf-autotable** – Non cambiare l’import né la forma di chiamata (vedi sopra).
5. **Test manuali** – I test manuali che passavano devono continuare a passare.

---

## Aggiornamento a fine sessione

Se in sessione sono state:
- aggiunte nuove funzionalità testate → aggiungerle all’elenco “Funzionalità bloccate”.
- modificate regole (es. nuovi vincoli tecnici) → aggiornare la sezione “Regole obbligatorie” e, se necessario, il riepilogo in `.cursorrules`.

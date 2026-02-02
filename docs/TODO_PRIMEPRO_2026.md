# PRIMEPRO → 100% — TODO LIST PRIORITIZZATA
## 2 Febbraio 2026 — Regole di esecuzione e task

---

## REGOLE DI ESECUZIONE

1. **Prima di ogni step:** l'assistente dichiara in chat **"Cosa ho capito"** e **"Cosa farò"** (breve, 1–3 righe).
2. **Dopo ogni step completato:** l'assistente **si ferma**; l'utente controlla e dice se continuare con il task successivo.

**Utilizzo in sessione:**
- Apri questo file e scegli il task da eseguire (es. Task 1).
- L'assistente scrive: "**Task N – Cosa ho capito:** … **Cosa farò:** …"
- Esecuzione del task.
- L'assistente scrive: "Task N completato. Controlla e dimmi se procedere con il Task N+1."
- L'utente conferma; si ripete per il task successivo.

---

## LEGENDA PRIORITÀ

- **CRITICO** — Bug visibili in produzione, utenti impattati ora
- **ALTO** — Feature mancanti che bloccano il lancio
- **MEDIO** — Miglioramenti importanti ma non bloccanti
- **BASSO** — Polish, ottimizzazioni, nice-to-have

---

## RIEPILOGO ORDINE DI ESECUZIONE

| # | Task | Priorità | Tempo | Impatto |
|---|------|----------|-------|---------|
| 1 | Fix "In attesa" → "Non completato" | CRITICO | 30 min | Bug visibile, dato sbagliato |
| 2 | Code splitting bundle | CRITICO | 2–3 h | Performance mobile critica |
| 3 | Bloccare X ore in un giorno | ALTO | 3–4 h | Gestione agenda completa |
| 4 | Gestione promemoria completa | ALTO | 2–3 h | Notifiche + modifica/elimina |
| 5 | Titolo di studio multi-valore | ALTO | 1–2 h | Profilo professionale completo |
| 6 | Click logo → Overview | ALTO | 15 min | UX standard |
| 7 | Report settimanale automatico | MEDIO | 3–4 h | Feature di valore |
| 8 | CTA "Sei un professionista?" landing | MEDIO | 30–45 min | Conversione B2B |
| 9 | SuperAdmin da zero | MEDIO | 4–5 h | Gestione piattaforma |
| 10 | Fix 4 warning ESLint | BASSO | 15 min | Code quality |
| 11 | Migration workout_attachments | BASSO | 30 min | Futuro |
| 12 | Studio/Ragione sociale in card Dati fiscali | MEDIO | 20 min | Coerenza profilo |
| 13 | Sidebar: Clienti al posto Profilo, Profilo sopra Impostazioni | MEDIO | 15 min | UX navigazione |

**Tempo totale stimato:** ~18–24 ore di sviluppo.

---

## TASK 1 — Fix Card Appuntamenti: "In attesa" → "Non completato"

**Priorità:** CRITICO  
**Tempo stimato:** 30 min  
**File coinvolti:** `src/utils/bookingHelpers.ts` (nuovo), `src/components/partner/dashboard/kpi/AppointmentsView.tsx`, `src/pages/partner/dashboard/OverviewPage.tsx`, `src/pages/partner/dashboard/PrenotazioniPage.tsx`, `src/components/partner/dashboard/kpi/KPICardsSection.tsx`

**Problema:** La card KPI Appuntamenti mostra "In attesa" per booking passati che non sono mai stati né completati né cancellati. Un appuntamento del 15 gennaio ancora `pending` o `confirmed` NON è "in attesa" — è "non completato".

**Soluzione:** Introdurre lo status di visualizzazione `incomplete`. I booking con status `pending` o `confirmed` e `booking_date` nel passato devono essere mostrati come "Non completato" (arancione), non "In attesa" (giallo).

**Cosa fare:**
- Creare `src/utils/bookingHelpers.ts` con `getDisplayStatus(booking)` che restituisce `'completed' | 'cancelled' | 'pending' | 'incomplete' | 'no_show'` (logica: se `booking_date < today` e status `pending`/`confirmed` → `incomplete`).
- In AppointmentsView.tsx e OverviewPage.tsx: card "In attesa" → "Non completati"; colore arancione (`bg-orange-100`, `text-orange-600`); icona AlertCircle; count basato su `getDisplayStatus()`.
- Badge nelle liste: mappatura `incomplete` → "Non completato", `bg-orange-100 text-orange-700`.
- Aggiornare KPICardsSection e PrenotazioniPage per usare lo stesso helper e label/colori.

---

## TASK 2 — Code Splitting Bundle (2.33 MB → <1 MB)

**Priorità:** CRITICO  
**Tempo stimato:** 2–3 ore  
**File coinvolti:** `src/App.tsx`, `vite.config.ts`, `src/components/ui/PageSkeleton.tsx`

**Problema:** Bundle passato da ~963 KB a 2.33 MB. Su mobile con 4G il caricamento supera i 5 secondi; ogni secondo in più impatta le conversioni.

**Soluzione:** Lazy loading delle route non iniziali + manual chunks in Vite + **scheletro pagina** come fallback (no rotella).

**Implementato:**
- `PageSkeleton.tsx`: scheletro pagina (header + contenuto) con varianti `default` e `dashboard`; sfondo nero, blocchi animate-pulse.
- Tutti i fallback Suspense usano `<PageSkeleton />` o `<PageSkeleton variant="dashboard" />` (dashboard, diary, piani, workouts).
- `vite.config.ts`: manualChunks per `vendor-react`, `vendor-supabase`, `vendor-ui`, `vendor-charts`, `vendor-stripe`, `vendor-pdf`.
- Target: chunk iniziale ridotto, totale con lazy distribuito su chunk separati.

---

## TASK 3 — Bloccare X Ore in un Giorno (Slot Non Disponibili)

**Priorità:** ALTO  
**Tempo stimato:** 3–4 ore  
**File coinvolti:** Migration SQL (nuova), `src/components/partner/calendario/AgendaView.tsx`, DisponibilitaManager, `src/components/partner/BlockSlotsModal.tsx` (nuovo), `src/services/availabilityOverrideService.ts` (nuovo)

**Problema:** Il professionista non può bloccare ore specifiche in un giorno (es. "martedì 4 febbraio 10–13 non disponibile"). La disponibilità è solo settimanale ricorrente, senza override per date specifiche.

**Soluzione:** Tabella `availability_overrides` per blocchi puntuali su date specifiche.

**Cosa fare:**
- Migration: `availability_overrides` (id, professional_id, override_date, start_time, end_time, is_blocked, reason, created_at); constraint `end_time > start_time`; UNIQUE (professional_id, override_date, start_time); indici e RLS (professional gestisce i propri override; SELECT pubblica per is_blocked = true).
- Service `availabilityOverrideService.ts`: `blockSlots()`, `getBlockedSlots()`, `removeBlock()`, `blockFullDay()`.
- UI: bottone "Blocca ore" in AgendaView; modal BlockSlotsModal (date, range orario, motivo); slot bloccati in grigio con icona lucchetto; in DisponibilitaManager sezione "Blocchi prossimi" con lista e elimina.

---

## TASK 4 — Gestione Completa Promemoria (Notifica Creazione + Modifica/Elimina)

**Priorità:** ALTO  
**Tempo stimato:** 2–3 ore  
**File coinvolti:** `ScheduleNotificationModal.tsx`, `scheduledNotificationService.ts`, `OverviewPage.tsx`, `src/components/partner/notifications/PromemoriList.tsx` (nuovo)

**Problema:** Sistema promemoria esiste (`scheduled_notifications`) ma: (1) alla creazione non arriva notifica di conferma; (2) non c'è lista promemoria attivi; (3) non si può modificare o eliminare un promemoria.

**Soluzione:** Notifica alla creazione; lista promemoria attivi in Overview; modal in modalità modifica; service con getUpcoming, update, remove.

**Cosa fare:**
- Dopo salvataggio in ScheduleNotificationModal: insert in `professional_notifications` (type 'custom', titolo "Promemoria creato", messaggio con data); toast.success.
- Nuovo PromemoriList.tsx: sotto "Prossimi appuntamenti" in OverviewPage; fetch scheduled_notifications WHERE sent = false AND scheduled_at > now(); card con titolo, data/ora, Modifica/Elimina; Modifica riapre modal con existingNotification; Elimina con conferma + delete + toast.
- scheduledNotificationService: getUpcoming(professionalId), update(id, data), remove(id).
- ScheduleNotificationModal: prop opzionale existingNotification; se presente precompilare e bottone "Aggiorna"; on submit UPDATE + notifica "Promemoria aggiornato".

---

## TASK 5 — Titolo di Studio Multi-Valore

**Priorità:** ALTO  
**Tempo stimato:** 1–2 ore  
**File coinvolti:** Migration SQL, `src/pages/partner/dashboard/ProfiloPage.tsx`, `src/pages/ProfessionalDetail.tsx`

**Problema:** Il campo `titolo_studio` in `professionals` è TEXT singolo. Un professionista può avere più titoli (Laurea, Master, Certificazione).

**Soluzione:** Convertire `titolo_studio` in TEXT[]; UI a pill/tag come le specializzazioni.

**Cosa fare:**
- Migration: ALTER COLUMN titolo_studio TYPE TEXT[] USING CASE WHEN titolo_studio IS NOT NULL AND titolo_studio != '' THEN ARRAY[titolo_studio] ELSE NULL END.
- ProfiloPage: input "Aggiungi titolo" + Enter; pill con X per rimuovere; dropdown suggerimenti (Laurea Scienze Motorie, Fisioterapia, NSCA, ACE, Master, ecc.).
- ProfessionalDetail: sezione "Formazione" con lista titoli e icona GraduationCap.

---

## TASK 6 — Click Logo → Overview

**Priorità:** ALTO  
**Tempo stimato:** 15 min  
**File coinvolti:** `src/components/partner/PartnerSidebar.tsx` (o componente che contiene il logo partner)

**Problema:** UX standard mancante: il logo nella sidebar partner non porta alla overview, confondendo l'utente.

**Soluzione:** Logo cliccabile che naviga a `/partner/dashboard/overview`.

**Cosa fare:**
- Nel componente sidebar partner (PartnerSidebar o equivalente): wrappare il logo con onClick che chiama `navigate('/partner/dashboard/overview')`; aggiungere `cursor-pointer` e useNavigate.

---

## TASK 7 — Report Settimanale Automatico

**Priorità:** MEDIO  
**Tempo stimato:** 3–4 ore  
**File coinvolti:** `src/pages/partner/dashboard/ReportSettimanale.tsx` (nuovo), reportService (estensione), Edge Function (opzionale Fase 2)

**Problema:** Il campo `notify_weekly_summary` esiste in `professional_settings` ma non c'è report settimanale implementato.

**Soluzione:** Pagina Report Settimanale con KPI e grafici; opzionale notifica automatica (Edge Function + cron).

**Cosa fare:**
- Nuova pagina ReportSettimanale: accesso da Overview con bottone "Report Settimana"; periodo Lun–Dom; card KPI (appuntamenti completati, incasso lordo, nuovi clienti, tasso completamento); grafico a barre per giorno; top 3 servizi; confronto con settimana precedente (%, frecce); bottone "Scarica PDF" (riuso pattern Report Commercialista).
- Query dati: bookings della settimana (booking_date tra lunedì e domenica) con COUNT/SUM/COUNT DISTINCT clienti.
- Fase 2 (opzionale): Edge Function weekly-report + cron lunedì 8:00; notifica in professional_notifications per chi ha notify_weekly_summary = true.

---

## TASK 8 — CTA "Sei un professionista?" in Alto a Dx nella Landing B2C

**Priorità:** MEDIO  
**Tempo stimato:** 30–45 min  
**File coinvolti:** Header/Hero della landing B2C (es. `NewLandingPage.tsx` e relativi componenti header)

**Problema:** Il CTA per i professionisti è in basso e poco diretto; serve visibilità in alto.

**Soluzione:** CTA in header, angolo alto a destra: "Sei un professionista? Clicca qui!" con link a `/partner/login`.

**Cosa fare:**
- Nell'header della landing: Link to="/partner/login" con classi bordo oro, testo oro, sfondo trasparente; hover sfondo oro testo nero; rounded-full; flex justify-end; su mobile icona briefcase + "Per Professionisti".
- Ridurre o rimuovere il CTA vecchio in basso se presente.

---

## TASK 9 — SuperAdmin da Zero ✅ (Fase 1 completata)

**Priorità:** MEDIO  
**Tempo stimato:** 4–5 ore  
**File coinvolti:** Edge Functions (`admin-stats`, `admin-application-action`), `src/pages/admin/SuperAdminDashboard.tsx`, `src/components/admin/PulseCheckCards.tsx`, `src/services/adminApplicationService.ts`

**Problema:** Sistema SuperAdmin attuale con TODO e Edge Functions mancanti; serve una base pulita.

**Soluzione (Fase 1):** Edge Function admin-stats per KPI Pulse Check + applicazioni + professionisti; admin-application-action per Approva/Rifiuta; dashboard con 6 card Pulse Check, tabella applicazioni in attesa, tabella professionisti con filtri.

**Completato:**
- Edge Function **admin-stats**: MRR, utenti totali, professionisti attivi, booking mese, conversione trial (placeholder), rating medio; lista applicazioni pending; lista professionisti.
- Edge Function **admin-application-action**: Approva (crea professional + professional_settings, aggiorna application) / Rifiuta (aggiorna application con motivo).
- **Pulse Check**: 6 card in header (MRR, Utenti, Professionisti attivi, Booking mese, Conversione trial %, Rating medio).
- **Applicazioni in attesa**: tabella con Nome, Email, Categoria, Città, Data invio, Ore in attesa; azioni Approva / Rifiuta (con motivo).
- **Professionisti**: tabella con filtri Tutti / Attivi / Non attivi; Nome, Email, Categoria, Zona, Status, Rating, Registrato.
- Sidebar: Overview (Pulse Check), Utenti (B2C), Analytics, Sistema, Audit Logs, Cancellazioni.
- Documento **SUPERADMIN_BLUEPRINT_CONSIGLIO.md** con priorità Fase 2/3 e note su admin_users, platform_events, variazione %.

**Da fare (Fase 2/3):** tabella admin_users + admin-auth-validate; grafici trend; cohort retention; export PDF investitori; activity log; alert automatici.

---

## TASK 10 — Fix 4 Warning ESLint

**Priorità:** BASSO  
**Tempo stimato:** 15 min  
**File coinvolti:** File con warning `react-hooks/exhaustive-deps` (individuare con `npx eslint src/ --ext .ts,.tsx`)

**Problema:** 4 warning ESLint `react-hooks/exhaustive-deps` dall'audit del 29 gennaio; non bloccanti ma da sanare.

**Soluzione:** Per ogni warning: aggiungere la dipendenza mancante in useEffect/useCallback oppure `// eslint-disable-next-line react-hooks/exhaustive-deps` con commento motivato se mount-only intenzionale.

**Cosa fare:**
- Eseguire `npx eslint src/ --ext .ts,.tsx` e filtrare per react-hooks/exhaustive-deps.
- Correggere i 4 file: aggiungere deps o eslint-disable con commento.

---

## TASK 11 — Migration workout_attachments

**Priorità:** BASSO  
**Tempo stimato:** 30 min  
**File coinvolti:** Migration SQL; types già presenti in `src/integrations/supabase/types.ts`

**Problema:** Tabella `workout_attachments` referenziata nei types ma non creata fisicamente nel DB; feature non critica per il lancio.

**Soluzione:** Eseguire migration che crea la tabella in linea con la definizione in types.ts.

**Cosa fare:**
- Creare migration SQL che crea `workout_attachments` (struttura coerente con types.ts); RLS e indici se previsti. Implementare feature allegati solo quando si decide di attivarla.

---

## TASK 12 — Studio / Ragione sociale nella card Dati fiscali

**Priorità:** MEDIO  
**Tempo stimato:** 20 min  
**File coinvolti:** `src/pages/partner/dashboard/ProfiloPage.tsx`

**Problema:** Il campo "Studio / Ragione sociale" (company_name) è attualmente in una card separata; ha più senso averlo nella card "Dati fiscali" insieme a P.IVA, indirizzo, città, CAP, PEC, Codice SDI.

**Soluzione:** Spostare il blocco "Studio / Ragione sociale" (label, valore, pulsante modifica) **dentro** la card "Dati fiscali", come primo campo (sopra P.IVA o come campo logico della sede/ragione sociale). Rimuovere la card/riga standalone di Studio / Ragione sociale.

**Cosa fare:**
- In ProfiloPage: rimuovere la riga/card dedicata "Studio / Ragione sociale" dalla sua posizione attuale.
- All’interno della card "Dati fiscali": aggiungere come primo campo "Studio / Ragione sociale" (stesso comportamento: modifica inline, saveEdit('company_name'), hint "Es. Studio Rossi, PT Marco Bianchi (non l'indirizzo)").

---

## TASK 13 — Sidebar: Clienti al posto di Profilo, Profilo sopra Impostazioni

**Priorità:** MEDIO  
**Tempo stimato:** 15 min  
**File coinvolti:** `src/components/partner/PartnerSidebar.tsx` (o file che definisce le voci della sidebar partner)

**Problema:** Ordine attuale: … Profilo (4ª), … Clienti (9ª), Impostazioni (10ª). Si vuole: Clienti (con annessi progetti) nella posizione attuale di Profilo; Profilo spostato subito sopra Impostazioni.

**Soluzione:** Riordinare le voci della sidebar partner: "Clienti" (con eventuale sottomenu progetti) va al posto dove ora c’è "Profilo"; "Profilo" va subito sopra "Impostazioni" (quindi seconda dal basso, prima di Esci).

**Cosa fare:**
- Nel componente sidebar partner: spostare la voce "Clienti" (e relativi link/sottomenu progetti) nella posizione in cui oggi c’è "Profilo" (es. 4ª voce).
- Spostare la voce "Profilo" subito sopra "Impostazioni" (es. 10ª voce, sopra Impostazioni e sopra Esci).
- Verificare che route e highlight della voce attiva restino corretti dopo il riordino.

---

## SESSIONI CONSIGLIATE

- **Sessione 1 (3–4 h):** Task 1 + 2 + 6 → Fix critici + performance + quick win
- **Sessione 2 (4–5 h):** Task 3 + 4 → Blocco ore + promemoria completi
- **Sessione 3 (2–3 h):** Task 5 + 8 + 10 → Profilo + landing + ESLint
- **Sessione 4 (3–4 h):** Task 7 → Report settimanale
- **Sessione 5 (4–5 h):** Task 9 → SuperAdmin da zero
- **Merge finale:** dev → main, tag release, deploy produzione

Dopo queste sessioni → **PrimePro è al 100%** → si può valutare la separazione monorepo.

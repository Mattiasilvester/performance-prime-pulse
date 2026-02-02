# Raccomandazioni KPI — Admin Nexus Control

**Data:** 2 Febbraio 2026  
**Contesto:** Analisi area admin (Overview, Utenti, Analytics, Sistema, Audit Logs, Cancellazioni) e dati disponibili in DB/Edge Functions.

---

## 0. KPI aggiuntivi implementati (2 Feb 2026)

Nella sezione **Overview** è stata aggiunta la riga **KPI Aggiuntivi** con 5 card:

| KPI | Fonte | Dove |
|-----|--------|------|
| **Churn B2B** | `professional_subscriptions` (status = canceled) | Card "Churn B2B" — abbonamenti cancellati (totale) |
| **Tasso completamento booking** | `bookingsCompleted / bookingsThisMonth` (questo mese) | Card "Booking completati %" |
| **Cancellazioni in scadenza** | `professional_subscriptions` (cancel_at_period_end = true) | Card "In scadenza" (click → pagina Cancellazioni) |
| **Utenti B2C attivi** | `profiles` esclusi professionisti + `user_workout_stats` (≥1 workout) | Card "Utenti B2C attivi" (N / totale, % con almeno 1 workout) |

- **Rating medio** è mostrato solo nella sezione Pulse Check (non duplicato in KPI Aggiuntivi).
- **Backend:** Edge Function `admin-stats` estesa con le query e i campi in `pulseCheck`.
- **Frontend:** componente `AdminKpiAggiuntivi.tsx` (4 card) + sezione sotto Pulse Check in `SuperAdminDashboard.tsx`.

---

## 1. KPI già presenti (riepilogo)

| Dove | KPI | Fonte |
|------|-----|--------|
| **Overview (Pulse Check)** | MRR totale, Utenti totali, Professionisti attivi, Booking questo mese, Conversione Trial→Paid %, Rating medio | `admin-stats` → PulseCheck |
| **Overview (fallback Stats)** | Obiettivo 500 utenti, Utenti online (5 min), Activation D0, Retention D7, Weekly growth, PT count | `admin-stats` (alcuni placeholder) |
| **Analytics** | Crescita Utenti B2C, Crescita Professionisti B2B, Revenue mensile (B2B+B2C), MRR totale | `admin-analytics` |
| **Cancellazioni** | Lista subscription cancellate / in scadenza con motivo | `professional_subscriptions` |

---

## 2. KPI consigliati (nuovi o da valorizzare)

Priorità: **Alto** = massimo impatto con dati già disponibili; **Medio** = richiede piccole estensioni; **Basso** = utile ma secondario.

---

### 2.1 Churn professionisti (B2B) — **Alto**

- **Cosa:** % professionisti che hanno cancellato (o in scadenza) sul totale che hanno avuto abbonamento.
- **Perché:** Capire se il prodotto B2B trattiene o perde; intervenire su onboarding o supporto.
- **Dati:** `professional_subscriptions` (status = canceled, cancel_at_period_end), storico approvati/paganti.
- **Dove mostrarlo:** Overview (nuova card Pulse Check) e/o Analytics (trend mensile churn %).
- **Nota:** Già hai la pagina Cancellazioni; serve solo un numero sintetico (es. “X in scadenza, Y cancellati questo mese”) in Overview.

---

### 2.2 Tempo medio approvazione applicazioni — **Alto**

- **Cosa:** Ore (o giorni) tra `submitted_at` e `approved_at` per le applicazioni approvate.
- **Perché:** KPI operativo: tempi lunghi = frustrazione e abbandono candidati.
- **Dati:** `professional_applications` (submitted_at, status) + `professionals` (approved_at). Media sulle ultime N approvazioni.
- **Dove:** Overview, card tipo “Tempo medio approvazione: X ore” (o “N applicazioni > 48h in attesa”).

---

### 2.3 Tasso completamento booking — **Alto**

- **Cosa:** % booking completati sul totale booking del mese (o “Completati / Totali”).
- **Perché:** Indica qualità dell’esperienza prenotazione (no-show, cancellazioni, completamenti).
- **Dati:** Già in `admin-stats`: `bookingsCompleted`, `bookingsThisMonth` → rapporto in %.
- **Dove:** Overview (Pulse Check): una card “Booking completati %” o “Completati / Totali”.

---

### 2.4 Revenue per professionista pagante (ARPU B2B) — **Medio**

- **Cosa:** Revenue B2B del mese / numero professionisti con abbonamento attivo (o fatturato nel mese).
- **Perché:** Capire valore medio per professionista; confrontare con obiettivo prezzo.
- **Dati:** `admin-analytics` (revenue B2B) + `admin-stats` (activeProfessionals / payingProIds) o `subscription_invoices` + professionisti paganti.
- **Dove:** Overview o Analytics, una riga/box “ARPU B2B: €X”.

---

### 2.5 Nuove applicazioni (ultimi 7 giorni) — **Medio**

- **Cosa:** Conteggio applicazioni con `submitted_at` negli ultimi 7 giorni.
- **Perché:** Trend reclutamento B2B senza aspettare la tabella “Applicazioni in attesa”.
- **Dati:** `professional_applications` filtrate per `submitted_at >= now() - 7d`.
- **Dove:** Overview (card “Nuove applicazioni (7 gg)”) e opzionale in Analytics come trend.

---

### 2.6 Cancellazioni in scadenza (count) — **Medio**

- **Cosa:** Numero di subscription con `cancel_at_period_end = true` (ancora attive ma in uscita).
- **Perché:** Allarme proattivo: quante uscite certe hai nel prossimo periodo.
- **Dati:** `professional_subscriptions` (già usata in AdminCancellations).
- **Dove:** Overview, card “In scadenza: N” con link alla pagina Cancellazioni.

---

### 2.7 Utenti B2C “attivi” (almeno 1 workout) — **Medio**

- **Cosa:** % utenti B2C (profiles non professionisti) con almeno 1 workout registrato (o totale minuti > 0).
- **Perché:** Engagement reale oltre la sola registrazione.
- **Dati:** `profiles` (esclusi professionisti) + `user_workout_stats` (total_workouts / total_minutes). Se non esiste vista aggregata, una query per count distinti.
- **Dove:** Overview (“Utenti attivi %” o “Utenti con ≥1 workout”) e/o Analytics (trend).

---

### 2.8 Rating medio (trend) — **Basso**

- **Cosa:** Rating medio recensioni questo mese vs mese precedente (o ultimi 3 mesi).
- **Perché:** Vedere se la qualità percepita migliora o peggiora.
- **Dati:** `reviews` (rating, created_at) aggregate per mese.
- **Dove:** Analytics: piccolo grafico o riga “Rating medio per mese”.

---

### 2.9 GMV booking vs Revenue abbonamenti — **Basso** (chiarezza)

- **Cosa:** Due numeri distinti in Overview: “GMV booking (questo mese)” e “Revenue abbonamenti (MRR/B2B)”.
- **Perché:** Evitare confusione tra fatturato piattaforma (booking) e ricavi abbonamenti; già differenziati in Analytics, coerente averli in Overview.
- **Dati:** Già disponibili (bookings completati → GMV; subscription_invoices / MRR → revenue).
- **Dove:** Overview: due card o due righe in Pulse Check.

---

## 3. KPI futuri (quando avrai più dati)

- **Trial → Paid (reale):** quando avrai storico trial con data inizio/fine e conversione a pagante.
- **LTV per segmento (B2B/B2C):** quando avrai storico abbonamenti per utente/professionista.
- **Fill rate agenda:** % slot prenotati vs disponibili (richiede modello slot/disponibilità aggregato).
- **NPS / survey:** se aggiungi survey post-servizio o post-workout.
- **Activation D0 / Retention D7 (reali):** se popoli `profiles` o analytics con “primo workout entro 24h” e “workout a D7” (es. da `user_workout_stats` + created_at).

---

## 4. Dove mettere i nuovi KPI (sintesi)

| KPI | Overview (Pulse / Stats) | Analytics |
|-----|--------------------------|-----------|
| Churn B2B | ✅ Card + eventuale count “in scadenza” | ✅ Trend % mensile |
| Tempo medio approvazione | ✅ Card | Opzionale trend |
| Booking completati % | ✅ Card | Opzionale |
| ARPU B2B | ✅ Card o riga | ✅ Serie mensile |
| Nuove applicazioni (7 gg) | ✅ Card | ✅ Trend |
| Cancellazioni in scadenza | ✅ Card + link Cancellazioni | — |
| Utenti B2C attivi % | ✅ Card | ✅ Trend |
| Rating trend | — | ✅ Grafico/riga |
| GMV vs Revenue | ✅ Due card/righe | Già presente |

---

## 5. Ordine di implementazione suggerito

1. **Booking completati %** e **Cancellazioni in scadenza (count)** — dati già in `admin-stats` o in una query veloce su `professional_subscriptions`.
2. **Tempo medio approvazione** — una query su `professional_applications` + `professionals.approved_at`.
3. **Nuove applicazioni (7 gg)** — filtro su `professional_applications.submitted_at`.
4. **Churn B2B** — count canceled + in scadenza vs base “abbonati attivi o con storico”.
5. **ARPU B2B** — rapporto revenue B2B (da analytics) / n. professionisti paganti.
6. **Utenti B2C attivi %** — query su `profiles` + `user_workout_stats`.
7. **Rating trend** e **GMV vs Revenue** in Overview — per chiarezza e trend.

Se vuoi, il passo successivo può essere: scegliere 2–3 KPI da questo elenco e definire insieme le modifiche a `admin-stats`, `admin-analytics` e ai componenti Overview/Analytics (nomi campi, card, grafici).

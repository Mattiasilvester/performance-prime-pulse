# SuperAdmin Blueprint — Consiglio implementazione

## Cosa ho capito

Vuoi la SuperAdmin come nel blueprint: **Pulse Check** (6 KPI in header), **Performance Prime B2C**, **PrimePro B2B**, **Marketplace**, **Area operativa**, con priorità Fase 1 (MVP) → Fase 2 → Fase 3.

## Consiglio

1. **Auth**  
   Mantenere il **bypass attuale** (login con email + password + secret key) per Fase 1. La tabella `admin_users` e l’Edge Function `admin-auth-validate` sono utili quando vorrai più admin o auth “pulita”; non sono obbligatorie per far funzionare la dashboard.

2. **Edge Function `admin-stats`**  
   **Un solo endpoint** che con **Service Role** legge tutto e restituisce:
   - i **6 KPI Pulse Check** (MRR, utenti totali, professionisti attivi, booking mese, conversione trial, rating medio);
   - **applicazioni in attesa** (lista per la tabella + count);
   - **professionisti** (lista paginata/filtrata per la tabella).
   Così eviti RLS e multipli round-trip; il frontend chiama una volta e riceve tutto per Overview + tabelle.

3. **Variazione % (frecce verdi/rosse)**  
   Per Fase 1 puoi mostrare solo il **valore attuale**; la variazione rispetto a settimana/mese precedente richiede storico (tabelle snapshot o query su date). Consiglio: **Fase 1** = solo valore, **Fase 2** = aggiungere colonne/aggregati per trend e poi le frecce.

4. **Approva applicazione**  
   **Approva** = creare record in `professionals` (e una riga minima in `professional_settings`) a partire dai dati di `professional_applications`, poi aggiornare l’applicazione (status = approved, professional_id, reviewed_at). **Niente creazione utente Auth** in Fase 1: il professionista può registrarsi dopo con la stessa email (flusso PartnerRegistration) e il sistema può collegarlo in seguito. **Rifiuta** = aggiornare application (status = rejected, rejection_reason).

5. **Tabella `platform_events`**  
   Utile per l’**Activity log** (Fase 3). In Fase 1 puoi **non** crearla; quando la aggiungi, potrai popolarla con trigger su `profiles`, `professional_applications`, `bookings`, ecc.

6. **Layout e navigazione**  
   Allineare la **sidebar** al blueprint: **Overview** (Pulse Check + alert), **Utenti** (B2C), **Professionisti** (B2B + applicazioni in attesa), **Marketplace**, **Operazioni**, **Investor Report** (PDF). Puoi implementare le voci gradualmente (es. Overview + Professionisti in Fase 1, resto dopo).

7. **Priorità**  
   - **Fase 1 (MVP):** 6 card Pulse Check, tabella applicazioni in attesa con Approva/Rifiuta, tabella professionisti con filtri, conteggi utenti.  
   - **Fase 2:** Grafici trend, tabella abbonamenti utenti, KPI engagement, distribuzione categorie/geografica.  
   - **Fase 3:** Cohort retention, export PDF investitori, activity log, alert automatici.

Implementazione proposta: **Fase 1** come sopra, seguendo le priorità del blueprint senza introdurre tutto insieme.

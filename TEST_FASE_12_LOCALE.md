# 🧪 Test Fase 12 – Gestione Multi-Carta (App Locale)

Guida per testare la gestione multi-carta in ambiente locale.

---

## ✅ Prerequisiti

1. **Edge Functions deployate**  
   Le 3 funzioni devono essere online su Supabase, altrimenti le chiamate API falliranno.
   ```bash
   npx supabase functions deploy stripe-list-payment-methods --project-ref kfxoyucatvvcgmqalxsg
   npx supabase functions deploy stripe-set-default-payment-method --project-ref kfxoyucatvvcgmqalxsg
   npx supabase functions deploy stripe-detach-payment-method --project-ref kfxoyucatvvcgmqalxsg
   ```

2. **Dev server attivo**
   ```bash
   npm run dev
   ```
   App disponibile su: **http://localhost:5173** (o la porta indicata da Vite).

3. **Account Partner con subscription**  
   - Utente loggato come **partner** (non utente finale).  
   - Profilo **professional** collegato a quell’utente.  
   - Subscription attiva con **stripe_customer_id** (almeno una carta già salvata su Stripe).

4. **`.env` / variabili**  
   - `VITE_SUPABASE_URL` impostato (es. `https://kfxoyucatvvcgmqalxsg.supabase.co`).

---

## 🚀 Come arrivare alla pagina Abbonamento

1. Apri il browser su **http://localhost:5173**.
2. Fai **login** come partner (Partner Login / credenziali partner).
3. Vai al **Dashboard Partner** (sidebar o menu).
4. Nel menu laterale clicca **Abbonamento** (icona CreditCard).  
   **URL diretto:** `http://localhost:5173/partner/dashboard/abbonamento`

---

## 📋 Checklist test

### 1. Lista carte

- [ ] La sezione **“Metodi di pagamento”** mostra la lista delle carte.
- [ ] Per ogni carta vedi: brand (Visa/Mastercard/…), ultime 4 cifre, scadenza.
- [ ] Una carta ha il badge **“Predefinita”** (sfondo oro).
- [ ] Se non c’è ancora nessuna carta, vedi solo il pulsante **“Aggiungi nuova carta”** (e nessun errore in console).

**Se vedi “Errore nel caricamento delle carte”:**  
- Controlla in **DevTools → Network** la chiamata a `stripe-list-payment-methods`: status e body della risposta.  
- Verifica che le Edge Functions siano deployate e che l’utente abbia un professional con subscription e `stripe_customer_id`.

---

### 2. Imposta predefinita

- [ ] Su una carta **non** predefinita clicca **“Imposta predefinita”**.
- [ ] Compare un toast di successo (es. “Carta predefinita aggiornata”).
- [ ] La lista si aggiorna: il badge **“Predefinita”** passa alla carta scelta.
- [ ] Nessun errore in console.

**Se fallisce:**  
- In Network controlla la chiamata a `stripe-set-default-payment-method` (status e body).  
- In Supabase → Edge Functions → Logs puoi vedere eventuali errori lato server.

---

### 3. Rimuovi carta (con conferma)

- [ ] Su una carta **non** predefinita clicca l’icona **cestino** (Rimuovi).
- [ ] Compare un overlay di conferma: “Rimuovere questa carta?” con **Annulla** e **Rimuovi**.
- [ ] Clic **Annulla**: l’overlay si chiude, nessuna carta rimossa.
- [ ] Riapri il cestino sulla stessa carta e clic **Rimuovi**.
- [ ] Toast di successo (es. “Carta rimossa con successo”) e la carta sparisce dalla lista.

**Se hai una sola carta:**  
- [ ] Il pulsante rimuovi può essere presente, ma la API deve rispondere con errore (es. “Non puoi rimuovere l’unica carta…”).  
- [ ] L’app deve mostrare un toast con quel messaggio (nessun crash).

**Se provi a rimuovere la carta predefinita:**  
- [ ] L’API deve rispondere con errore (es. “Non puoi rimuovere la carta predefinita…”).  
- [ ] Toast con messaggio di errore, carta non rimossa.

---

### 4. Aggiungi nuova carta

- [ ] Clic **“Aggiungi nuova carta”**.
- [ ] Si apre il modal Stripe (AddStripeCardModal) per inserire i dati carta.
- [ ] Inserisci una carta di test Stripe (es. `4242 4242 4242 4242`) e completa il flusso.
- [ ] Dopo il successo il modal si chiude.
- [ ] La lista carte si aggiorna (o fai un refresh della pagina) e la nuova carta compare.
- [ ] Toast di conferma (es. “Carta aggiunta” / “Abbonamento attivato…” a seconda del flusso).

---

### 5. Aggiornamento dati (refetch)

- [ ] Dopo “Imposta predefinita” o “Rimuovi carta”, le altre card della pagina (es. riepilogo abbonamento) si aggiornano se usano gli stessi dati (refetch).
- [ ] Nessun dato “vecchio” rimasto in vista (es. ultime 4 cifre della carta predefinita aggiornate).

---

## 🔍 Debug in locale

### Console browser (F12 → Console)

- Nessun errore rosso quando carichi la pagina Abbonamento.
- Nessun errore quando clicchi “Imposta predefinita”, “Rimuovi”, “Aggiungi nuova carta”.
- Se ci sono errori, annota il messaggio e lo stack trace.

### Network (F12 → Network)

- Filtra per “stripe” o “functions” per vedere le chiamate alle Edge Functions.
- **stripe-list-payment-methods**: metodo POST, status **200**, body con `success: true` e `payment_methods` (array).
- **stripe-set-default-payment-method**: POST, body `{ payment_method_id: "pm_xxx" }`, status **200**, `success: true`.
- **stripe-detach-payment-method**: POST, body `{ payment_method_id: "pm_xxx" }`, status **200**, `success: true`.
- Se status **4xx/5xx**: apri la risposta e leggi il body (es. `error: "messaggio"`) e confronta con i messaggi toast.

### Carte di test Stripe

Usa i numeri di test Stripe (es. **4242 4242 4242 4242**), qualsiasi scadenza futura e CVC a 3 cifre.  
Documentazione: https://stripe.com/docs/testing

---

## ❌ Problemi comuni

| Problema | Cosa controllare |
|----------|-------------------|
| “Errore nel caricamento delle carte” | Edge Functions deployate? Utente con professional e subscription con `stripe_customer_id`? |
| Lista sempre vuota | In Stripe Dashboard il customer ha almeno un payment method? |
| “Non autenticato” | Session Supabase valida? Riprova login partner. |
| “Professional non trovato” | Tabella `professionals`: esiste una riga con `user_id` = utente loggato? |
| “Nessuna subscription trovata” | Tabella `professional_subscriptions`: esiste una riga per quel `professional_id` con `stripe_customer_id`? |
| CORS / network error | Le funzioni usano gli stessi CORS delle altre Edge Functions; se il problema persiste, controlla i log della funzione su Supabase. |

---

## ✅ Test completato

Quando tutti i punti della checklist sono ok in locale:

- Lista carte corretta.
- Imposta predefinita funziona e aggiorna la UI.
- Rimuovi carta con conferma e messaggi di errore corretti (una sola carta / carta predefinita).
- Aggiungi nuova carta tramite modal e lista aggiornata.
- Nessun errore in console e risposte API coerenti in Network.

A quel punto il flusso Fase 12 è validato in ambiente locale.

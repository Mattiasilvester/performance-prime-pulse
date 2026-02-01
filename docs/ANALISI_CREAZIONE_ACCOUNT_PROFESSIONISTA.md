# Analisi problemi creazione account professionista

**Data:** 1 Febbraio 2026  
**Errore console:** `403 Forbidden` su `POST /rest/v1/professionals` + **"new row violates row-level security policy for table 'professional_subscriptions'"** (codice PostgreSQL `42501` = insufficient_privilege).

---

## 1. Cosa succede in pratica

1. L’utente completa l’onboarding partner e invia il form di registrazione.
2. Il client chiama `professionalAuthService.register()` che:
   - fa `signUp` su Supabase Auth (ok);
   - se c’è sessione, fa SELECT su `professionals` per `user_id`;
   - se non trova il record, fa **INSERT** in `professionals` (fallback client).
3. La richiesta **POST** a `/rest/v1/professionals` (INSERT in `professionals`) viene accettata dal server, ma **prima di restituire 201** qualcosa tenta un INSERT in **`professional_subscriptions`**.
4. Quell’INSERT in `professional_subscriptions` **fallisce per RLS** → Supabase restituisce **403** e il messaggio indica la violazione sulla tabella **`professional_subscriptions`**, non su `professionals`.

Quindi: il blocco non è sull’INSERT in `professionals`, ma su un’operazione collegata che scrive in **`professional_subscriptions`**.

---

## 2. Possibili cause (in ordine di probabilità)

### A. Trigger su `professionals` che inserisce in `professional_subscriptions`

- In Supabase può esistere un trigger **AFTER INSERT** su `public.professionals` che crea una riga di abbonamento (trial) in `professional_subscriptions` per ogni nuovo professionista.
- Se il trigger è **SECURITY INVOKER** (default), viene eseguito con l’utente della sessione corrente. L’INSERT in `professional_subscriptions` viene quindi controllato da RLS con `auth.uid()` = utente appena registrato.
- Se su `professional_subscriptions` **non** esiste una policy che consente all’utente di inserire la riga per il **proprio** `professional_id`, l’INSERT fallisce → **403** e messaggio “new row violates row-level security policy for table 'professional_subscriptions'”.

### B. RLS su `professional_subscriptions` troppo restrittiva

- La tabella `professional_subscriptions` ha RLS abilitata.
- Probabile che esistano solo policy per **SELECT** (e magari UPDATE), ma **nessuna policy INSERT** per l’utente autenticato.
- Oppure la policy INSERT richiede una condizione che non è soddisfatta nel contesto “nuovo professionista” (es. subscription già esistente, ruolo particolare, ecc.).

### C. Trigger creato fuori dalle migrazioni del repo

- Il trigger che inserisce in `professional_subscriptions` potrebbe essere stato creato a mano in Supabase o da un altro tool (es. Lovable) e **non** essere presente nelle migrazioni in repo.
- Quindi il comportamento dipende da cosa c’è realmente nel DB del progetto, non solo dai file SQL del repo.

### D. Flusso “conferma email” vs “senza conferma”

- Con **conferma email disattivata**: dopo `signUp` c’è subito sessione; il fallback client fa INSERT in `professionals` con l’utente autenticato → il trigger (se esiste) parte in quel contesto → RLS su `professional_subscriptions` viene valutata.
- Con **conferma email attivata**: il trigger su `auth.users` crea il professional; in quel caso il trigger su `professionals` (se esiste) gira in contesto **SECURITY DEFINER** della funzione su `auth.users`, quindi potrebbe bypassare RLS. Il problema 403 si vede soprattutto quando è il **client** a fare INSERT in `professionals` (fallback con sessione).

### E. Policy INSERT su altre tabelle collegate

- Oltre a `professional_subscriptions`, potrebbero esistere altri trigger su `professionals` che inseriscono in altre tabelle (es. `professional_settings`). In quel caso si vedrebbero errori RLS su quelle tabelle. Il messaggio attuale punta solo a **`professional_subscriptions`**.

---

## 3. Riepilogo problemi che possono impedire la creazione dell’account

| # | Problema | Descrizione | Priorità |
|---|----------|-------------|----------|
| 1 | **RLS su `professional_subscriptions` senza INSERT per il proprio professional** | Manca (o è troppo stretta) una policy INSERT che permetta all’utente autenticato di creare la riga in `professional_subscriptions` quando `professional_id` è il proprio (cioè `professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())`). | Alta |
| 2 | **Trigger su `professionals` in contesto utente** | Un trigger AFTER INSERT su `professionals` che inserisce in `professional_subscriptions` viene eseguito come utente corrente; senza policy INSERT adeguata → 403. | Alta |
| 3 | **Trigger non presente nelle migrazioni** | Il trigger che scrive in `professional_subscriptions` potrebbe esistere solo nel DB (creato a mano o da altro tool), quindi non è visibile dal repo e va verificato in Supabase. | Media |
| 4 | **Mancanza di policy SELECT/UPDATE su `professional_subscriptions`** | Dopo aver risolto l’INSERT, l’app potrebbe fare SELECT/UPDATE sulla subscription; se mancano policy per “proprio professional_id”, si possono avere altri 403. | Media |
| 5 | **Conferma email e doppio flusso** | Con conferma email: professional creato dal trigger su `auth.users`; senza: professional creato dal client (fallback). Il 403 osservato è coerente con il flusso “INSERT da client” + trigger su `professionals` + RLS su `professional_subscriptions`. | Bassa (spiegazione, non bug) |

---

## 4. Soluzione consigliata

Aggiungere **policy RLS** sulla tabella **`professional_subscriptions`** in modo che:

1. **INSERT**: l’utente autenticato possa inserire **solo** la riga per il proprio professionista:  
   `professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())`.
2. **SELECT / UPDATE** (e eventualmente DELETE, se previsto): stessa condizione “solo il proprio professional_id”, così l’app e i trigger possono leggere/aggiornare la subscription del nuovo professionista.

Implementazione: migrazione SQL che:

- abilita RLS su `professional_subscriptions` (se non già attiva);
- crea policy per **INSERT** con `WITH CHECK` come sopra;
- crea policy per **SELECT** e **UPDATE** con `USING` / `WITH CHECK` basate su `professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())`.

Dopo aver applicato la migrazione, ripetere la registrazione partner e verificare che non compaiano più 403 e che non ci siano più messaggi RLS su `professional_subscriptions`.

---

## 5. Verifiche utili in Supabase

1. **Trigger su `professionals`**  
   SQL Editor:
   ```sql
   SELECT tgname, proname
   FROM pg_trigger t
   JOIN pg_proc p ON t.tgfoid = p.oid
   JOIN pg_class c ON t.tgrelid = c.oid
   WHERE c.relname = 'professionals';
   ```
2. **Policy attuali su `professional_subscriptions`**  
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'professional_subscriptions';
   ```
3. **Funzione del trigger**  
   Se esiste un trigger che chiama una funzione, controllare se la funzione è **SECURITY INVOKER** o **SECURITY DEFINER** (le definizioni sono in `pg_proc`).

---

## 6. Soluzione applicata (Febbraio 2026)

I problemi sono stati risolti con due fix:

1. **RLS 42501:** la funzione `create_trial_subscription` (trigger AFTER INSERT su `professionals`) è stata portata a **SECURITY DEFINER** con `SET search_path = public, pg_temp`, così l’INSERT in `professional_subscriptions` bypassa RLS correttamente.
2. **CHECK `prof_sub_plan_check`:** la funzione inserisce `plan = 'business'` e `price_cents = 5000` (50€/mese); aggiunti default sulle colonne per coerenza.

Documentazione completa e regole per sviluppo futuro: **`docs/FIX_REGISTRAZIONE_PROFESSIONISTI.md`**.

Migrazioni che replicano la fix: `20260201120000_professional_subscriptions_rls_insert.sql` (policy RLS per il client) e `20260201140000_create_trial_subscription_security_definer.sql` (funzione trigger + default).

---

## 7. Riferimenti

- Errore PostgreSQL **42501**: insufficient_privilege.
- Supabase RLS: ogni INSERT/UPDATE/DELETE/SELECT è consentito solo se almeno una policy lo permette.
- Trigger **AFTER INSERT** su una tabella vengono eseguiti nella stessa transazione dell’INSERT; se un trigger fallisce (es. per RLS), l’intera transazione fallisce e il client riceve 403.

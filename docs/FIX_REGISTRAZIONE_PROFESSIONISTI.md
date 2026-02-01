# Fix completato: registrazione professionisti (403 + CHECK constraint)

**Data:** Febbraio 2026  
**Stato:** Applicato in Supabase e replicato in migrazioni per versionamento.

---

## Contesto

Durante la registrazione di un nuovo professionista dal flusso onboarding partner si verificavano due errori consecutivi che impedivano la creazione dell’account. Entrambi sono stati risolti direttamente nel database Supabase; le fix sono state incorporate nelle migrazioni per nuovi ambienti e per riferimento futuro.

---

## Problema 1: Errore RLS 42501 su `professional_subscriptions`

### Sintomo

Alla registrazione di un nuovo professionista, errore 403 con codice `42501`:

```
new row violates row-level security policy for table "professional_subscriptions"
```

### Causa

Catena di trigger durante la registrazione:

1. Utente si registra → trigger `on_auth_user_created_professional` su `auth.users` → `handle_new_professional_signup` (**SECURITY DEFINER**).
2. Riga creata in `professionals` → trigger `on_professional_created_subscription` su `professionals` → `create_trial_subscription` (**SECURITY INVOKER**).
3. `create_trial_subscription` fa INSERT in `professional_subscriptions` → RLS blocca → 403.

`create_trial_subscription` girava con i permessi dell’utente (SECURITY INVOKER); l’INSERT nella tabella con RLS veniva quindi bloccato.

### Fix applicata

La funzione è stata portata a **SECURITY DEFINER** con `search_path` sicuro:

- Migrazione: `20260201140000_create_trial_subscription_security_definer.sql`  
- La funzione `create_trial_subscription()` è definita con `SECURITY DEFINER` e `SET search_path TO public, pg_temp`.

In questo modo l’INSERT in `professional_subscriptions` viene eseguito con i privilegi del proprietario della funzione e non è bloccato da RLS.

---

## Problema 2: CHECK constraint `prof_sub_plan_check` violato

### Sintomo

Dopo aver risolto l’errore RLS, nuovo errore 400 (codice `23514`):

```
new row for relation "professional_subscriptions" violates check constraint "prof_sub_plan_check"
```

### Causa

Il CHECK su `professional_subscriptions` ammette solo:

```sql
plan IS NULL OR plan IN ('business', 'prime_business')
```

La funzione inseriva `plan = 'basic'`, non consentito. Inoltre `price_cents` era 2500 (25€) invece di 5000 (50€/mese).

### Fix applicata

Nella stessa migrazione `20260201140000_create_trial_subscription_security_definer.sql`:

- INSERT con `plan = 'business'` e `price_cents = 5000`.
- Default sulle colonne: `plan` DEFAULT `'business'`, `price_cents` DEFAULT `5000`.

---

## Catena trigger attuale (post-fix)

1. **auth.users** INSERT → `handle_new_professional_signup` (SECURITY DEFINER) → crea riga in `professionals`.
2. **professionals** INSERT → `create_trial_subscription` (SECURITY DEFINER) → crea riga in `professional_subscriptions` (trial 3 mesi, 50€/mese).

---

## Regole per sviluppo futuro

1. **Piano abbonamento professionisti:** `'business'`, 50€/mese (5000 centesimi), 3 mesi di free trial. Non usare `'basic'` (non ammesso dal CHECK).

2. **Valori ammessi per `plan`:** solo `NULL`, `'business'`, `'prime_business'` (vincolo `prof_sub_plan_check`).

3. **Valori ammessi per `status`:** es. `'trialing'`, `'active'`, `'past_due'`, `'canceled'`, `'incomplete'`, `'unpaid'` (vincolo `prof_sub_status_check`).

4. **Funzioni trigger su tabelle con RLS:** se la funzione deve inserire/aggiornare in tabelle con RLS, deve essere **SECURITY DEFINER** con `SET search_path = public, pg_temp`.

5. **Non modificare** `handle_new_professional_signup` e `create_trial_subscription` senza verificare CHECK constraint e RLS sulle tabelle coinvolte.

6. **Migrazioni correlate:**
   - `20260201120000_professional_subscriptions_rls_insert.sql`: policy RLS per INSERT/SELECT/UPDATE da client sul proprio `professional_id`.
   - `20260201140000_create_trial_subscription_security_definer.sql`: fix funzione trigger + default colonne.

---

## Verifica post-fix

- Tabella `professionals`: riga creata con `approval_status = 'approved'`, `user_id` collegato.
- Tabella `professional_subscriptions`: `plan = 'business'`, `status = 'trialing'`, `price_cents = 5000`, trial 3 mesi.
- Tabella `auth.users`: account auth creato e collegato al professionista.

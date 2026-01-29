# 🔍 ANALISI COMPLETA PROBLEMA - stripe-reactivate-subscription

**Data:** 27 Gennaio 2025  
**Errori identificati:** 401 "Invalid user token" e 404 "Professional not found"

---

## 📊 ANALISI ERRORI

### **Errore 1: 401 "Invalid user token" (Dashboard Supabase)**

**Quando si verifica:**
- Test dalla dashboard Supabase con "service role"

**Causa:**
- Quando si testa dalla dashboard con "service role", **non viene passato un JWT token valido**
- La funzione cerca di autenticare l'utente con `supabase.auth.getUser(token)`, ma il token non è presente o non è valido
- **Questo è normale** quando si testa dalla dashboard senza un JWT token reale

**Soluzione:**
- Per testare dalla dashboard, devi aggiungere un header `Authorization: Bearer YOUR_JWT_TOKEN`
- Oppure testa direttamente dall'app (consigliato)

---

### **Errore 2: 404 "Professional not found" (Dall'app)**

**Quando si verifica:**
- Chiamata dall'app quando si clicca "Riattiva abbonamento"

**Causa possibile:**
1. **Il professional non esiste** per l'utente che sta chiamando
2. **Problema con RLS policies** (anche se con Service Role Key dovrebbero essere bypassate)
3. **user_id non corrisponde** tra `auth.users` e `professionals.user_id`

**Analisi:**
- La funzione autentica correttamente l'utente (`user.id` viene trovato)
- Ma la query `professionals.eq('user_id', user.id)` non trova risultati
- Questo significa che o:
  - Il professional non esiste nel database
  - C'è un problema con la query (tipo di dato, formato, etc.)

---

## 🔧 MODIFICHE APPLICATE

Ho aggiunto **logging dettagliato** per diagnosticare il problema:

1. **Log del token** (primi 20 caratteri per sicurezza)
2. **Log dettagliato dell'errore di autenticazione** (se presente)
3. **Log della query professional** con risultato completo
4. **Log di debug** che mostra alcuni professional esistenti (per confronto)
5. **Messaggi di errore più dettagliati** con `user_id` e `user_email`

---

## 🚀 PROSSIMI STEP

### **Step 1: Deploy Funzione Aggiornata**

```bash
supabase functions deploy stripe-reactivate-subscription
```

### **Step 2: Verifica Database**

Esegui questa query per verificare se il professional esiste:

```sql
-- Verifica se esiste un professional per l'utente
SELECT 
  p.id as professional_id,
  p.user_id,
  p.email as professional_email,
  u.id as auth_user_id,
  u.email as auth_user_email
FROM professionals p
RIGHT JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'EMAIL_DEL_TUO_UTENTE'
LIMIT 1;
```

**Se la query non restituisce risultati:**
- Il professional non esiste → Devi crearlo
- Oppure c'è un problema con l'associazione `user_id`

**Se la query restituisce risultati:**
- Il professional esiste → Il problema è nella query della funzione
- Verifica che `user_id` sia dello stesso tipo (UUID) in entrambe le tabelle

### **Step 3: Test dall'App con Logging**

1. Deploy funzione aggiornata
2. Vai su `/abbonamento`
3. Apri console browser (F12)
4. Clicca "Riattiva abbonamento"
5. Controlla i log nella console

### **Step 4: Verifica Logs Supabase**

1. Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/functions/stripe-reactivate-subscription
2. Tab "Logs"
3. Cerca:
   - `[STRIPE REACTIVATE] User authenticated: ...`
   - `[STRIPE REACTIVATE] Professional query result: ...`
   - `[STRIPE REACTIVATE] Debug - Sample professionals: ...`

Questi log ti diranno esattamente cosa sta succedendo.

---

## 🔍 POSSIBILI SOLUZIONI

### **Soluzione 1: Professional Non Esiste**

Se il professional non esiste, devi crearlo:

```sql
-- Crea professional per l'utente
INSERT INTO professionals (user_id, email, ...)
SELECT id, email, ...
FROM auth.users
WHERE email = 'EMAIL_DEL_TUO_UTENTE'
AND NOT EXISTS (
  SELECT 1 FROM professionals WHERE user_id = auth.users.id
);
```

### **Soluzione 2: Problema con Tipo Dato user_id**

Se `user_id` ha tipo diverso, verifica:

```sql
-- Verifica tipo colonna
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'professionals'
  AND column_name = 'user_id';
```

Dovrebbe essere `uuid` o `text`.

### **Soluzione 3: Problema con RLS Policies**

Anche se con Service Role Key le RLS dovrebbero essere bypassate, verifica:

```sql
-- Verifica RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'professionals';
```

---

## 📋 CHECKLIST DEBUG

- [ ] Deploy funzione aggiornata con logging
- [ ] Verifica database: professional esiste?
- [ ] Test dall'app con console aperta
- [ ] Verifica logs Supabase
- [ ] Confronta `user_id` tra `auth.users` e `professionals`
- [ ] Verifica tipo dato `user_id`
- [ ] Verifica RLS policies (se necessario)

---

## 🎯 RISULTATO ATTESO

Dopo il deploy e i test, i logs dovrebbero mostrare:

**Se tutto funziona:**
```
[STRIPE REACTIVATE] User authenticated: abc123...
[STRIPE REACTIVATE] Professional query result: { professional: { id: '...', email: '...' }, error: null }
[STRIPE REACTIVATE] Professional found: abc123...
```

**Se c'è un problema:**
```
[STRIPE REACTIVATE] Professional query result: { professional: null, error: {...} }
[STRIPE REACTIVATE] Debug - Sample professionals: [...]
```

Questi log ti diranno esattamente qual è il problema.

---

**Deploy la funzione aggiornata e condividi i logs per identificare la causa esatta! 🔍**

# 🔐 CONFIGURAZIONE SECRETS SERVER-SIDE

## ⚠️ IMPORTANTE

Le secrets `VITE_ADMIN_SECRET_KEY` e `VITE_N8N_WEBHOOK_SECRET` sono state rimosse dal bundle frontend per sicurezza.

**Ora devono essere configurate solo server-side su Supabase.**

---

## 📋 SECRETS DA CONFIGURARE

### 1. ADMIN_SECRET_KEY

**Uso:** Validazione secret key durante login SuperAdmin

**Edge Function:** `admin-auth-validate`

**Configurazione:**

```bash
# Login a Supabase CLI
supabase login

# Imposta secret (sostituisci con il valore reale)
supabase secrets set ADMIN_SECRET_KEY=PP_SUPERADMIN_2025_SECURE_KEY_CHANGE_ME
```

**Verifica:**

```bash
# Lista secrets configurate
supabase secrets list
```

---

### 2. N8N_WEBHOOK_SECRET

**Uso:** Autenticazione chiamate webhook N8N per email (benvenuto, reset password, verifica)

**Edge Function:** `n8n-webhook-proxy`

**Configurazione:**

```bash
# Imposta secret (sostituisci con il valore reale da N8N)
supabase secrets set N8N_WEBHOOK_SECRET=your_n8n_webhook_secret_here
```

**Verifica:**

```bash
# Lista secrets configurate
supabase secrets list
```

---

## 🚀 DEPLOY EDGE FUNCTIONS

Dopo aver configurato le secrets, deploya le Edge Functions:

```bash
# Deploy admin-auth-validate
supabase functions deploy admin-auth-validate

# Deploy n8n-webhook-proxy
supabase functions deploy n8n-webhook-proxy
```

---

## ✅ VERIFICA

### Test admin-auth-validate:

```bash
curl -X POST https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/admin-auth-validate \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "PP_SUPERADMIN_2025_SECURE_KEY_CHANGE_ME"}'
```

**Risposta attesa:** `{"valid": true}`

### Test n8n-webhook-proxy:

```bash
curl -X POST "https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/n8n-webhook-proxy?type=welcome" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "name": "Test", "email": "test@example.com"}'
```

---

## 📝 NOTE

- **NON** aggiungere queste secrets a `.env` con prefisso `VITE_`
- Le secrets sono ora gestite solo server-side tramite Supabase Secrets
- Il bundle frontend non contiene più riferimenti a queste secrets
- Le Edge Functions leggono le secrets da `Deno.env.get('ADMIN_SECRET_KEY')` e `Deno.env.get('N8N_WEBHOOK_SECRET')`

---

## 🔄 MIGRAZIONE DA .env

Se hai già configurato queste secrets in `.env`:

1. **Copia i valori** da `.env`
2. **Rimuovi** le righe con `VITE_ADMIN_SECRET_KEY` e `VITE_N8N_WEBHOOK_SECRET` da `.env`
3. **Configura** le secrets su Supabase usando i comandi sopra
4. **Deploya** le Edge Functions

---

*Ultimo aggiornamento: 12 Novembre 2025*


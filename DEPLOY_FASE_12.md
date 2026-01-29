# 🚀 DEPLOY FASE 12: GESTIONE MULTI-CARTA STRIPE

## 📋 Comandi di Deploy Completi

### **1. Deploy Edge Function: stripe-list-payment-methods**

```bash
npx supabase functions deploy stripe-list-payment-methods --project-ref kfxoyucatvvcgmqalxsg
```

**URL dopo deploy:**
```
https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-list-payment-methods
```

---

### **2. Deploy Edge Function: stripe-set-default-payment-method**

```bash
npx supabase functions deploy stripe-set-default-payment-method --project-ref kfxoyucatvvcgmqalxsg
```

**URL dopo deploy:**
```
https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-set-default-payment-method
```

---

### **3. Deploy Edge Function: stripe-detach-payment-method**

```bash
npx supabase functions deploy stripe-detach-payment-method --project-ref kfxoyucatvvcgmqalxsg
```

**URL dopo deploy:**
```
https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-detach-payment-method
```

---

## 🔧 Deploy Tutte le Funzioni in Un Comando

```bash
# Deploy tutte e 3 le Edge Functions
npx supabase functions deploy stripe-list-payment-methods --project-ref kfxoyucatvvcgmqalxsg && \
npx supabase functions deploy stripe-set-default-payment-method --project-ref kfxoyucatvvcgmqalxsg && \
npx supabase functions deploy stripe-detach-payment-method --project-ref kfxoyucatvvcgmqalxsg
```

---

## ✅ Verifica Deploy

Dopo il deploy, verifica che le funzioni siano attive:

```bash
# Test 1: Lista payment methods (richiede autenticazione)
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-list-payment-methods \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Test 2: Set default (richiede autenticazione + payment_method_id)
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-set-default-payment-method \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method_id": "pm_xxxxx"}'

# Test 3: Detach (richiede autenticazione + payment_method_id)
curl -X POST \
  https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-detach-payment-method \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method_id": "pm_xxxxx"}'
```

---

## 🔐 Variabili d'Ambiente Richieste

Le Edge Functions richiedono queste variabili d'ambiente (già configurate in Supabase):

- ✅ `STRIPE_SECRET_KEY` - Chiave segreta Stripe
- ✅ `SUPABASE_URL` - URL del progetto Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key per accesso admin

**Verifica variabili:**
```bash
# Nel dashboard Supabase: Settings → Edge Functions → Secrets
```

---

## 📝 Note Importanti

1. **Autenticazione**: Tutte le funzioni richiedono header `Authorization: Bearer <token>`
2. **CORS**: Le funzioni gestiscono automaticamente CORS preflight
3. **Error Handling**: Tutte le funzioni restituiscono `{ success: boolean, error?: string }`
4. **Logging**: I log sono disponibili nel dashboard Supabase → Edge Functions → Logs

---

## 🧪 Test Manuale Post-Deploy

1. **Apri l'app** e vai alla pagina Abbonamento
2. **Verifica lista carte**: Dovresti vedere tutte le carte salvate
3. **Testa "Imposta predefinita"**: Cambia carta predefinita e verifica badge
4. **Testa "Rimuovi carta"**: Prova a rimuovere una carta non predefinita
5. **Verifica protezioni**: 
   - Non puoi rimuovere l'unica carta
   - Non puoi rimuovere la carta predefinita

---

## 🐛 Troubleshooting

### Errore: "Function not found"
- Verifica che il deploy sia completato: `supabase functions list`
- Controlla che il nome della funzione sia corretto

### Errore: "Unauthorized"
- Verifica che l'header `Authorization` contenga un token valido
- Controlla che l'utente sia autenticato

### Errore: "Professional not found"
- Verifica che l'utente abbia un record nella tabella `professionals`
- Controlla che `user_id` corrisponda all'utente autenticato

### Errore: "Nessuna subscription trovata"
- Verifica che esista una subscription per il professional
- Controlla che `stripe_customer_id` sia presente

---

**Deploy completato! 🎉**

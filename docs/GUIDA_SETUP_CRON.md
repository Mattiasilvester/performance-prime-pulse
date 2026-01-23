# 🚀 GUIDA RAPIDA: Setup Cron Job Promemoria

## 📍 URL CORRETTO

Il tuo repository GitHub è:
- **Username**: `Mattiasilvester`
- **Repository**: `performance-prime-pulse`

---

## ✅ STEP 1: Aggiungi Secret su GitHub

1. **Vai su questo URL:**
   ```
   https://github.com/Mattiasilvester/performance-prime-pulse/settings/secrets/actions
   ```

2. **Clicca su "New repository secret"** (bottone verde in alto a destra)

3. **Compila:**
   - **Name**: `SUPABASE_ANON_KEY`
   - **Secret**: La tua anon key di Supabase
     - Vai su: https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/settings/api
     - Copia la chiave `anon` `public` (quella che inizia con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

4. **Clicca "Add secret"**

---

## ✅ STEP 2: Commit e Push Workflow

Il file `.github/workflows/booking-reminders-cron.yml` è già creato. Ora:

```bash
cd /Users/mattiasilvestrelli/Prime-puls-HUB

# Aggiungi il file
git add .github/workflows/booking-reminders-cron.yml

# Commit
git commit -m "Add cron job for booking reminders"

# Push
git push
```

---

## ✅ STEP 3: Verifica

1. **Vai su GitHub:**
   ```
   https://github.com/Mattiasilvester/performance-prime-pulse/actions
   ```

2. **Dovresti vedere:**
   - Workflow "Booking Reminders Cron"
   - Si eseguirà automaticamente ogni 15 minuti
   - Puoi anche eseguirlo manualmente cliccando "Run workflow"

---

## 🧪 TEST MANUALE

Puoi testare il workflow manualmente:

1. Vai su: https://github.com/Mattiasilvester/performance-prime-pulse/actions
2. Clicca su "Booking Reminders Cron"
3. Clicca su "Run workflow" → "Run workflow"
4. Controlla i log per vedere se funziona

---

## ⚠️ IMPORTANTE

- Il workflow si eseguirà **automaticamente ogni 15 minuti**
- Non devi fare nulla dopo il setup
- I promemoria verranno creati automaticamente

---

**URL Corretti:**
- Secrets: https://github.com/Mattiasilvester/performance-prime-pulse/settings/secrets/actions
- Actions: https://github.com/Mattiasilvester/performance-prime-pulse/actions

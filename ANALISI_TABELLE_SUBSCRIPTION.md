# 📊 ANALISI TABELLE SUBSCRIPTION - MODIFICHE NECESSARIE

**Data:** 27 Gennaio 2025  
**Modifiche Frontend:** Nome piano "Pro" → "Prime Business", Prezzo €35 → €50

---

## ✅ TABELLE ESISTENTI

### 1. `professional_subscriptions`
**Stato:** ✅ **ESISTE** (usata nelle funzioni Stripe)

**Colonne rilevanti:**
- `plan` - Tipo: VARCHAR/TEXT, Valore attuale: `'business'` (non `'pro'`)
- `price_cents` - Tipo: INTEGER, Valore attuale: potrebbe essere `3500` (€35) o `5000` (€50)
- `stripe_price_id` - Riferimento al Price ID in Stripe

**Nota:** Il campo `plan` nel database è già `'business'`, non `'pro'`. Il nome "Pro" era solo nel frontend.

---

## 🔍 MODIFICHE NECESSARIE

### ❌ **NON SERVE CREARE TABELLE**
- La tabella `professional_subscriptions` esiste già
- La tabella `subscription_invoices` esiste già

### ❌ **NON SERVE ELIMINARE TABELLE**
- Nessuna tabella obsoleta identificata

### ⚠️ **POSSIBILE AGGIORNAMENTO DATI ESISTENTI**

Se ci sono subscription esistenti con:
- `price_cents = 3500` (€35) → dovrebbero essere aggiornate a `5000` (€50)
- `stripe_price_id` che punta al vecchio price Stripe → dovrebbe essere aggiornato al nuovo price ID

**Query SQL consigliata (se necessario):**
```sql
-- Aggiorna price_cents per subscription esistenti
UPDATE professional_subscriptions 
SET 
  price_cents = 5000,  -- €50 in centesimi
  updated_at = NOW()
WHERE price_cents = 3500;  -- Vecchio prezzo €35

-- Verifica quante subscription sono state aggiornate
SELECT COUNT(*) 
FROM professional_subscriptions 
WHERE price_cents = 5000;
```

**IMPORTANTE:** 
- Il campo `plan` nel database è già `'business'`, quindi non serve aggiornarlo
- Il nome "Prime Business" è solo una label nel frontend (oggetto `PLANS` in `PaymentsModal.tsx`)
- Il prezzo reale viene da Stripe tramite `stripe_price_id`, quindi l'aggiornamento deve essere fatto anche in Stripe Dashboard

---

## 📝 RIEPILOGO

| Azione | Necessaria? | Note |
|--------|-------------|------|
| Creare tabelle | ❌ NO | Tutte le tabelle esistono già |
| Eliminare tabelle | ❌ NO | Nessuna tabella obsoleta |
| Aggiornare dati | ⚠️ OPZIONALE | Solo se ci sono subscription con `price_cents = 3500` |
| Aggiornare Stripe | ✅ SÌ | Creare nuovo Price ID per €50/mese in Stripe Dashboard |

---

## 🎯 CONCLUSIONE

**Nessuna modifica strutturale al database necessaria.**

Le modifiche fatte sono solo nel frontend:
- ✅ Nome piano aggiornato in `PLANS` object
- ✅ Prezzo aggiornato in `PLANS` object
- ✅ Carta placeholder aggiunta per development

**Azioni consigliate:**
1. Verificare in Stripe Dashboard se esiste un Price ID per €50/mese
2. Se non esiste, crearlo e aggiornare le funzioni Stripe per usarlo
3. (Opzionale) Aggiornare `price_cents` nel database per subscription esistenti

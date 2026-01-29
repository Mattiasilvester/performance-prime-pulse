# Fix: Remote migration versions not found in local

Quando `npx supabase db push` dà **"Remote migration versions not found in local migrations directory"**, il remoto ha migrazioni nella history che non esistono nei tuoi file locali.

---

## Passo 1: Login Supabase (se non già fatto)

```bash
npx supabase login
```

Apri il link nel browser, autorizza, poi torna al terminale.

---

## Passo 2: Riparare la history migrazioni

Segna come **reverted** le migrazioni che il remoto ha in history ma che non hai in locale (così Supabase non le considera più e può applicare le tue).

Copia e incolla questo comando **per intero** nel terminale:

```bash
npx supabase migration repair --status reverted 20250618062328 20250618122321 20250619032408 20250619042003 20250619045557 20250723065326 20250723082207 20250724033435 20250724125314 20250725081357 20250728022249 20250909081526 20250909081738 20250909082626 20250909083033 20250915053816 20250915054029 20250915054102 20250915054142 20250915054200 20250923011254
```

**Cosa fa:** aggiorna solo la tabella di history sul remoto (marca quelle versioni come “revertite”). **Non** modifica lo schema del database (non droppa tabelhe/colonne).

---

## Passo 3: Push delle migrazioni locali

Dopo il repair, riesegui:

```bash
npx supabase db push
```

Dovrebbero essere applicate le tue migrazioni locali:
- `20250127_add_cancellation_reason.sql`
- `20250128_add_paypal_support.sql`

(Se una era già applicata, Supabase la salterà.)

---

## Se il repair non basta

Se dopo il repair hai ancora errori:

1. **Allineare il progetto al remoto (solo se vuoi che il remoto sia la fonte di verità):**
   ```bash
   npx supabase db pull
   ```
   Questo genera un file di migrazione con lo schema attuale del remoto. Poi puoi riprovare `db push` (eventualmente dopo aver integrato le tue migrazioni 20250127/20250128).

2. **Verificare il link al progetto:**
   ```bash
   npx supabase link --project-ref kfxoyucatvvcgmqalxsg
   ```

---

## Riepilogo ordine

1. `npx supabase login`
2. `npx supabase migration repair --status reverted 20250618062328 ...` (comando lungo sopra)
3. `npx supabase db push`

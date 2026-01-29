# Analisi errore duplicate key su schema_migrations

## Problema

`supabase db push` fallisce con:
```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(20250128) already exists.
```

## Causa

Il CLI Supabase ricava la **version** dal nome del file di migrazione prendendo **solo le cifre consecutive dall’inizio** del nome, fino al primo carattere non numerico (es. `_`).

| Nome file | Version estratta | Esito |
|-----------|------------------|--------|
| `20250128_add_paypal_support.sql` | **20250128** | Conflitto se 20250128 già in DB |
| `20250128_01_fix_prof_sub_plan_check.sql` | **20250128** | Stesso valore: underscore ferma l’estrazione |
| `20250128_02_add_paypal_support.sql` | **20250128** | Stesso valore |
| `20250129_professionals_rls_....sql` | **20250129** | OK se 20250129 non esiste |

Quindi **tutte** le migrazioni il cui nome inizia con `20250128_` producono `version = 20250128`. Se nel DB è già presente una riga con quella version (da un push precedente o da un altro file), l’INSERT in `schema_migrations` va in conflitto.

## Soluzioni tentate (e perché non bastavano)

1. **Rinominare in `20250128_01_...` e `20250128_02_...`**  
   La version resta **20250128** perché il CLI prende solo le cifre iniziali. Il conflitto rimane.

2. **Eliminare il file duplicato**  
   Evita di avere due file con lo stesso prefisso numerico, ma se nel DB è già registrata `20250128` (es. da un vecchio `20250128_add_paypal_support.sql`), il CLI può comunque considerare “pending” un altro file con prefisso `20250128` e riprovare a inserire la stessa version.

## Soluzione corretta

Usare un **prefisso numerico univoco** per ogni migrazione, **senza underscore nel numero**: ad esempio timestamp completo `YYYYMMDDHHmmss` (14 cifre).

- `20250128120000_fix_prof_sub_plan_check.sql` → version **20250128120000**
- `20250128120100_add_paypal_support.sql` → version **20250128120100**
- `20250129120000_professionals_rls_insert_select_update.sql` → version **20250129120000**

Così ogni migrazione ha una version diversa e non si hanno più duplicate key su `schema_migrations`.

## Regola per il futuro

- Nome migrazione: **solo cifre** nel prefisso (es. `YYYYMMDDHHmmss`), poi `_` e descrizione.
- Evitare: `20250128_01_...` (la version diventa comunque `20250128`).

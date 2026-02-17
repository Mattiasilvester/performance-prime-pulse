# Deploy Vercel — Configurazione e troubleshooting

## Progetti possibili

1. **App principale (root)** – sito da root del repo, build `pnpm build`, output `dist`.
2. **PrimePro (app-pro)** – `pro.performanceprime.it`, build da workspace `packages/app-pro`.

---

## 1. Deploy app principale (root)

- **Root Directory:** *(vuoto, root del repo)*
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Install Command:** `corepack enable && pnpm install` (opzionale se in `vercel.json`)

Il file `vercel.json` in root è già impostato per questo caso.

---

## 2. Deploy PrimePro (pro.performanceprime.it)

Per evitare errori di install in monorepo (workspace pnpm), **non** usare Root Directory = `packages/app-pro`. Usa la root del repo e comandi che partono da lì:

- **Root Directory:** *(vuoto, root del repo)*
- **Build Command:** `pnpm build:pro`
- **Output Directory:** `packages/app-pro/dist`
- **Install Command:** `corepack enable && pnpm install`

In questo modo:
- `pnpm install` viene eseguito dalla root e installa tutti i workspace (incluso `@pp/shared` per app-pro).
- `pnpm build:pro` esegue `pnpm -C packages/app-pro build` e produce `packages/app-pro/dist`.

---

## Errori comuni e fix

### Install fallisce (corepack / pnpm)

- In **Vercel → Project Settings → General**:
  - **Node.js Version:** 18.x o 20.x.
- In **Settings → Environment Variables** (opzionale):
  - `ENABLE_EXPERIMENTAL_COREPACK=1` se serve corepack.
- Oppure usa come Install Command solo: `pnpm install` (Vercel rileva `pnpm-lock.yaml` e usa pnpm).

### `ERR_PNPM_OUTDATED_LOCKFILE` — lockfile non aggiornato

Se compare:
`Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with packages/app-pro/package.json`

- **Fix immediato:** nel `vercel.json` è impostato `installCommand` con `--no-frozen-lockfile`, così l’install su Vercel non usa il frozen-lockfile e il deploy può completare.
- **Fix definitivo (consigliato):** in locale, dalla **root del repo**, esegui `pnpm install`, poi fai commit e push di `pnpm-lock.yaml`. Quando il lockfile è allineato a tutti i `package.json` del workspace, puoi ripristinare in `vercel.json` l’install senza `--no-frozen-lockfile` (solo `corepack enable && pnpm install`) per avere install riproducibili.

### Build fallisce con "Cannot find module" / workspace

- Stai deployando **app-pro** ma hai Root Directory = `packages/app-pro`: passa a Root = *(root repo)*, Build = `pnpm build:pro`, Output = `packages/app-pro/dist`.

### Build passa in locale ma fallisce su Vercel

- Controlla che le **variabili d’ambiente** usate in build (es. `VITE_*`) siano impostate nel progetto Vercel.
- Controlla i log di build su Vercel (step di install e build) e confronta con quanto fai in locale (`pnpm install` poi `pnpm build` o `pnpm build:pro`).

### package.json

- In root è impostato `"engines": { "node": ">=18" }` per allineare la Node usata da Vercel.

---

## Verifica locale prima del deploy

```bash
# App principale
pnpm install && pnpm build

# PrimePro
pnpm install && pnpm build:pro
```

Se uno di questi fallisce in locale, correggere prima; la stessa sequenza viene usata su Vercel.

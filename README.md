# Performance Prime

Piattaforma fitness-tech con AI Coach, marketplace professionisti, e-commerce sportivo.

## Struttura Monorepo

```
performance-prime/
├── packages/
│   ├── shared/        # @pp/shared - Codice condiviso
│   ├── app-user/      # Performance Prime - App utenti
│   └── app-pro/       # PrimePro - Dashboard professionisti
├── supabase/          # Database e Edge Functions
└── .github/           # CI/CD workflows
```

## Quick Start

### Prerequisiti

- Node.js >= 18
- pnpm >= 9

### Installazione

```bash
pnpm install
```

### Sviluppo

```bash
# App utenti (Performance Prime) - porta 5173
pnpm dev:user

# App professionisti (PrimePro) - porta 5174
pnpm dev:pro
```

### Build

```bash
# Build singola app
pnpm build:user
pnpm build:pro

# Build tutte le app
pnpm build:all
```

## Packages

### @pp/shared

Codice condiviso tra le app:
- Types (generati da Supabase)
- Supabase client
- Services condivisi (bookings, reviews)
- Hooks (useAuth)
- Utils (date, storage, dom helpers)

### @pp/app-user (Performance Prime)

App per gli utenti:
- Landing page
- Onboarding
- PrimeBot (AI Coach)
- Workout e piani di allenamento
- Diario allenamenti
- Prenotazione professionisti

### @pp/app-pro (PrimePro)

Dashboard per professionisti:
- Gestione agenda e disponibilità
- Prenotazioni e clienti
- Report e analytics
- Gestione costi
- Abbonamento e pagamenti
- SuperAdmin

## Database

Il database Supabase è condiviso tra le app. Le migration sono in `supabase/migrations/`.

```bash
# Genera types TypeScript
npx supabase gen types typescript --project-id <project-id> > packages/shared/src/types/database.ts
```

## Deploy

Ogni app ha il suo progetto Vercel separato:
- **app-user**: Root Directory = `packages/app-user`
- **app-pro**: Root Directory = `packages/app-pro`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI**: shadcn/ui, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL + PostGIS + Auth + Storage + Edge Functions)
- **Pagamenti**: Stripe
- **AI**: OpenAI GPT-4

## Brand

- Colori: Nero (#000000) e Oro (#EEBA2B)
- Font: System fonts

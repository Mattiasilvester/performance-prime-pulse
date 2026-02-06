# Landing page professionisti — versione originale recuperata

**Data ricerca:** 5 Febbraio 2026  
**Esito:** La landing professionisti **esisteva** ed è stata **rimossa** durante il cleanup del monorepo.

---

## Cosa è successo

- **File originale:** `src/pages/Partner.tsx` (circa **579 righe**).
- **Commit di rimozione:** `ef691e8` — *"chore: cleanup - remove legacy src/, update docs for monorepo"* (3 Febbraio 2026).
- **Motivo:** Con il passaggio al monorepo (`packages/app-pro/`) la vecchia cartella `src/` è stata eliminata. La pagina `Partner.tsx` non è stata ricreata in `packages/app-pro/`; la route `/` è stata impostata come redirect a `/partner/login`. Solo in seguito è stata creata la nuova `PartnerLandingPage.tsx` (contenuto attuale in `packages/app-pro/src/pages/partner/PartnerLandingPage.tsx`).

---

## Struttura della landing originale (`Partner.tsx`)

La pagina usava tre componenti ancora presenti in app-pro:

- **PartnerHeader** — logo Prime Pro, CTA "Inizia la prova gratuita"
- **PartnerFooter** — colonne (Performance Prime, Link utili, Contatti), copyright
- **PartnerInterfaceSection** — sezione "L'interfaccia" con tab Agenda / Gestione Clienti e anteprima

**Sezioni della landing (in ordine):**

1. **Hero** — Sfondo blu scuro `#001f3f`, titolo *"Meno caos, più clienti giusti, più tempo"*, badge "3 mesi di prova gratuita", CTA "Inizia la prova gratuita" e "Scopri le funzionalità".
2. **Il problema che conosci bene** — 4 card (gestione clienti frammentata, WhatsApp, appuntamenti, tempo perso).
3. **La soluzione** — 6 feature (Agenda interattiva, Gestione appuntamenti, Reminder, Storico cliente, Gestione progetto, Tempo risparmiato).
4. **L'interfaccia** — `PartnerInterfaceSection` (tab Agenda / Clienti).
5. **Nuovi contatti e matching** — 2 card (Contatti da utenti attivi, Matching intelligente).
6. **I benefici** — 4 metriche (ore risparmiate, -70% stress, clienti ordinati, 24/7).
7. **Pricing** — "3 mesi di prova gratuita", €0/3 mesi, lista "Tutto incluso", CTA "Inizia la prova gratuita".
8. **CTA finale** — "Pronto a trasformare la gestione dei tuoi clienti?" + bottone "Registrati come professionista".

Stile: tema partner (`.partner-theme`, `.partner-bg`), colori `#001f3f` e accent, motion con Framer Motion.

---

## Come recuperare il file dalla history Git

Per **visualizzare** l’intero file com’era prima della rimozione:

```bash
git show "ef691e8~1:src/pages/Partner.tsx"
```

Per **salvare** il contenuto in un file (es. per confronto o riuso):

```bash
git show "ef691e8~1:src/pages/Partner.tsx" > docs/Partner_original.tsx
```

**Nota:** Il file recuperato ha path `src/` e import da `@/components/partner/...`. Per usarlo in `packages/app-pro` andrebbe:
- salvato come `packages/app-pro/src/pages/partner/PartnerOriginal.tsx` (o altro nome),
- aggiornati gli import (es. `@/components/...` già corretti se la base è app-pro),
- eventualmente adattati gli stili (classi `partner-*` e variabili CSS del tema partner).

---

## Situazione attuale

- **Landing attiva:** `packages/app-pro/src/pages/partner/PartnerLandingPage.tsx` — creata ex novo (hero "Il gestionale smart che lavora per te", screenshot con tab, social proof, features, Come funziona, CTA, footer).
- **Componenti della vecchia landing ancora in app-pro:**  
  `PartnerHeader.tsx`, `PartnerFooter.tsx`, `PartnerInterfaceSection.tsx` (usati oggi solo nelle pagine legal: Termini, Privacy, Cookie).

Se vuoi riallineare la landing attuale alla struttura o ai testi di quella originale, puoi usare questo report e il file recuperato con `git show` come riferimento.

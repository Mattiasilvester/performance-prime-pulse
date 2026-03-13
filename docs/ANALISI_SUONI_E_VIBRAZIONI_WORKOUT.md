# Analisi suoni e vibrazioni — QuickWorkout e ActiveWorkout (post-migrazione)

**Solo analisi, nessuna modifica al codice.**

---

## 1. Git history (riferimento)

- **QuickWorkout.tsx:** `git log --oneline` mostra un solo commit recente (`c655f820`); la versione con timer-in-card è quella attuale. Una versione precedente in un altro path del monorepo (`src/pages/QuickWorkout.tsx`) aveva `playBeep` e `AudioContext` (beep inizio, ripresa, nuovo esercizio, completamento).
- **ActiveWorkout.tsx:** commit `9a30806b`, `ed39076e`. La versione **pre-migrazione** (vecchio layout fullscreen) definiva:
  - `playRestStartSound()` → `playBeep(750, 220)` — inizio timer recupero
  - `playRestTickSound()` → `playBeep(950, 120)` — tick ultimi secondi recupero (es. ultimi 3 s)
  - `playRestEndSound()` → `playBeep(1100, 220)` + doppio beep + `playBeep(1300, 260)` — fine recupero
  - `handleTerminateSession` → `navigator.vibrate([100, 50, 100])` — terminazione sessione

---

## 2. ActiveWorkout.tsx (attuale, post-migrazione)

### 2.1 Dove sono definiti playBeep e AudioContext

- **AudioContext:** `audioContextRef = useRef<AudioContext | null>(null)` (riga ~151). Inizializzato in un `useEffect` al primo click/touch su documento (`window.AudioContext` o `webkitAudioContext`).
- **playBeep:** `useCallback((frequency = 800, duration = 200) => { ... })` (righe ~158–175). Usa `audioContextRef.current`; se non disponibile esce senza fallback visivo (il vecchio flash giallo è stato rimosso). Riprende il context se `state === 'suspended'`, crea oscillatore + gain, suona il beep.

### 2.2 Dove viene chiamato playBeep **attualmente**

| Contesto | Riga (circa) | Chiamata |
|----------|--------------|----------|
| **Fine timer recupero** (in `startRecoveryTimer`, quando `prev <= 1`) | ~216 | `playBeep(750, 200)` |
| **Fine timer recupero** (in `handlePlayPauseTimer`, interval quando `prev <= 1`) | ~380 | `playBeep(750, 200)` |

Quindi: **solo alla fine del timer recupero in alto** (un beep 750 Hz, 200 ms). Nessun beep nel countdown in-card (timed), né all’avvio recupero, né ai tick finali.

### 2.3 Dove era chiamato nel vecchio layout (logica residua / riferimenti)

Nel vecchio ActiveWorkout (pre-migrazione, layout fullscreen con “Avvia Recupero” e timer recupero in-page):

- **Inizio recupero:** `handleStartRest` → `playRestStartSound()` → `playBeep(750, 220)`.
- **Tick ultimi secondi recupero:** nel `setInterval` del recupero, quando `prev <= 3 && prev > 1` → `playRestTickSound()` → `playBeep(950, 120)`.
- **Fine recupero:** quando `prev <= 1` → `playRestEndSound()` → `playBeep(1100, 220)` + doppio beep + `playBeep(1300, 260)`.

Nella versione attuale **mancano**:

- Beep all’**inizio** del timer recupero.
- Beep **tick** negli ultimi 3 secondi del recupero.
- Beep (e eventuale tick) nel **countdown in-card** per esercizi timed (inizio esercizio, ultimi 3 s, fine esercizio).

### 2.4 Vibrazione in ActiveWorkout (attuale)

| Evento | Riga (circa) | Implementazione |
|--------|----------------|------------------|
| **Fine timer recupero** | ~217, ~381 | `navigator.vibrate([100, 50, 100])` |
| **Fine countdown card** (esercizio timed, arriva a 0) | ~252, ~283 | `navigator.vibrate(50)` |
| **Click su Serie** (non timed) | ~314 | `navigator.vibrate(50)` |
| **Completa esercizio** (non timed, bottone “Completato”) | ~337 | `navigator.vibrate(80)` |

**Manca:** vibrazione esplicita su “Completa allenamento” (fine workout). EsecuzioneWorkout usa `[200, 100, 200, 100, 400]` per ultimo esercizio; in ActiveWorkout il completamento è un unico bottone, quindi si può decidere se aggiungere un pattern “completamento workout” (es. come ultimo esercizio).

---

## 3. QuickWorkout.tsx (attuale, post-migrazione)

### 3.1 playBeep e AudioContext

- **Non presenti.** In `packages/app-user/src/pages/QuickWorkout.tsx` non compaiono `playBeep`, `AudioContext` né `audioContextRef`. Tutto l’audio è stato rimosso o non portato nel layout migrato.

### 3.2 Vibrazione (attuale)

| Evento | Riga (circa) | Implementazione |
|--------|----------------|------------------|
| **Fine timer recupero** (in `startRecoveryTimer` e in `handlePlayPauseTimer`) | ~171, ~322 | `navigator.vibrate([100, 50, 100])` |
| **Completa esercizio** (handleExerciseComplete) | ~185 | `navigator.vibrate(50)` |
| **Ultimo esercizio completato** | ~190 | `navigator.vibrate([200, 100, 200, 100, 400])` |
| **Fine countdown in card** | ~218, ~251 | `navigator.vibrate(50)` |

Quindi in QuickWorkout **tutte le vibrazioni** legate a recupero, completamento esercizio e countdown card ci sono; **manca completamente l’audio** (nessun beep).

### 3.3 Cosa manca rispetto ad ActiveWorkout

- **Audio:** tutto. In ActiveWorkout c’è almeno il beep a fine recupero; in QuickWorkout nessun suono.
- **Coerenza:** per parità con ActiveWorkout andrebbero aggiunti in QuickWorkout:
  - Init `AudioContext` (click/touch)
  - `playBeep` (stessa firma/stile di ActiveWorkout)
  - Beep a **fine timer recupero** (come in ActiveWorkout)
  - Opzionale: beep all’inizio recupero e tick ultimi secondi recupero (se si vogliono allineare anche questi).

---

## 4. Altri file (pattern suoni/vibrazioni)

**Grep in `packages/app-user/src` (`.tsx` / `.ts`):**

| File | Contenuto |
|------|-----------|
| **ActiveWorkout.tsx** | `playBeep`, `AudioContext`, vibrazione (v. sopra). |
| **QuickWorkout.tsx** | Solo vibrazione, nessun playBeep/AudioContext. |
| **EsecuzioneWorkout.tsx** | Solo vibrazione: fine recupero `[100, 50, 100]`, click serie `50`, completa esercizio `80`, ultimo esercizio `[200, 100, 200, 100, 400]`. Nessun playBeep. |
| **ExerciseCard.tsx** | `AudioContext` usato per un beep (es. completamento); `navigator.vibrate(50)` e `[50, 50, 50]` per azioni. |
| **CustomWorkoutDisplay.tsx** | Solo vibrazione: `50` su azioni, `[100, 50, 100]` su “terminazione”. |
| **Onboarding (Step1Goals, Step2Experience, Step3Preferences)** | Solo vibrazione su interazioni (30 ms, 20 ms, 50 ms). |

**Pattern comune:**  
- Vibrazione: `'vibrate' in navigator` poi `navigator.vibrate(durata | array)`.  
- Audio: `AudioContext` + oscillatore + gain (come in ActiveWorkout ed ExerciseCard).  
- Init audio: spesso al primo user interaction (click/touch) per politiche browser/iOS.

---

## 5. Mappa evento → suono/vibrazione (ideale vs attuale)

### 5.1 Tabella unificata

| Evento | Suono ideale (vecchio / Esecuzione) | Vibrazione ideale | ActiveWorkout (attuale) | QuickWorkout (attuale) |
|--------|-------------------------------------|-------------------|--------------------------|-------------------------|
| **Inizio countdown esercizio timed** (click “Inizia”) | Beep inizio (es. 800 Hz) | Opz. 50 ms | ❌ nessuno | ❌ nessuno |
| **Tick ultimi 3 s countdown card** | Beep tick (es. 950 Hz) | — | ❌ | ❌ |
| **Fine countdown esercizio timed** (card → 0) | Beep fine (es. 1000 Hz) | ✅ 50 ms | ✅ 50 ms | ✅ 50 ms |
| **Inizio timer recupero** | Beep inizio recupero (es. 750 Hz) | — | ❌ | ❌ |
| **Tick ultimi 3 s timer recupero** | Beep tick (es. 950 Hz) | — | ❌ | ❌ |
| **Fine timer recupero** | Beep fine (es. 750–1100 Hz) | ✅ [100, 50, 100] | ✅ playBeep(750,200) + vibrate | ❌ beep, ✅ vibrate |
| **Click serie** (non timed) | — | ✅ 50 ms | ✅ 50 ms | N/A (tutti timed) |
| **Completa esercizio** (non timed, bottone) | — | ✅ 80 ms | ✅ 80 ms | N/A |
| **Ultimo esercizio completato** | — | ✅ [200,100,200,100,400] | — (un solo “Completa allenamento”) | ✅ [200,100,200,100,400] |
| **Completa allenamento** (bottone finale) | — | Pattern “completamento” | ❌ nessuna vibrazione | N/A (naviga dopo salvataggio) |

### 5.2 Dove sono già implementati (nuovo layout)

- **ActiveWorkout:**  
  - Fine timer recupero: beep (750, 200) + vibrate [100, 50, 100].  
  - Fine countdown card: vibrate 50.  
  - Click serie: vibrate 50.  
  - Completa esercizio (non timed): vibrate 80.  

- **QuickWorkout:**  
  - Fine timer recupero: solo vibrate [100, 50, 100].  
  - Fine countdown card: vibrate 50.  
  - Completa esercizio: vibrate 50; ultimo esercizio: [200, 100, 200, 100, 400].  

### 5.3 Dove mancano e andrebbero aggiunti

**ActiveWorkout:**

1. **Inizio countdown card** (click “Inizia”): beep inizio (es. 800 Hz, 200 ms); opzionale vibrate 50.
2. **Tick ultimi 3 s countdown card:** beep tick (es. 950 Hz) ogni secondo quando `activeCardSeconds` è 3, 2, 1 (o solo a 3 e 1).
3. **Fine countdown card:** aggiungere beep fine (es. 1000 Hz) oltre alla vibrazione già presente.
4. **Inizio timer recupero:** beep (es. 750 Hz) quando si chiama `startRecoveryTimer` (inizio recupero).
5. **Tick ultimi 3 s timer recupero:** nel `setInterval` del recupero, quando `prev <= 3 && prev > 1` chiamare un beep tick (es. 950 Hz).
6. **Completa allenamento:** vibrazione “completamento” (es. [200, 100, 200, 100, 400] o [100, 50, 100]) al click.

**QuickWorkout:**

1. **Audio:** introdurre `AudioContext` + `playBeep` (come in ActiveWorkout) e init al primo click/touch.
2. **Fine timer recupero:** aggiungere `playBeep(750, 200)` dove oggi c’è solo vibrate [100, 50, 100].
3. **Opzionale (parità con ActiveWorkout):** beep inizio countdown card (“Inizia”), tick ultimi 3 s card, beep fine countdown card; beep inizio recupero, tick ultimi 3 s recupero.

---

## 6. Differenze QuickWorkout vs ActiveWorkout

| Aspetto | ActiveWorkout | QuickWorkout |
|---------|----------------|--------------|
| **playBeep / AudioContext** | Presente, usato solo a fine recupero | Assente |
| **Beep fine recupero** | Sì | No (solo vibrazione) |
| **Beep countdown card** | No (solo vibrate a 0) | No |
| **Beep inizio recupero / tick recupero** | No | No |
| **Vibrazione fine recupero** | [100, 50, 100] | [100, 50, 100] |
| **Vibrazione fine countdown card** | 50 ms | 50 ms |
| **Vibrazione ultimo esercizio** | N/A (un solo bottone finale) | [200, 100, 200, 100, 400] |
| **Vibrazione “Completa allenamento”** | Nessuna | — |

In sintesi: in ActiveWorkout l’audio c’è ma è ridotto (solo fine recupero); in QuickWorkout l’audio è assente. Entrambi non hanno più i beep “inizio recupero”, “tick ultimi secondi” e i beep legati al countdown in-card del vecchio layout.

---

## 7. Riepilogo

- **Già presenti nel nuovo layout:**  
  - ActiveWorkout: beep e vibrazione a **fine timer recupero**; vibrazione a fine countdown card, click serie, completa esercizio (non timed).  
  - QuickWorkout: tutte le **vibrazioni** (recupero, countdown card, completamento esercizio/ultimo).  

- **Da recuperare/reintegrare:**  
  - **ActiveWorkout:** beep (e opz. vibrazione) inizio countdown card; beep tick ultimi 3 s card; beep fine countdown card; beep inizio recupero; beep tick ultimi 3 s recupero; vibrazione su “Completa allenamento”.  
  - **QuickWorkout:** intero layer **audio** (AudioContext + playBeep); almeno beep a fine recupero; opzionale stesso set di beep di ActiveWorkout per countdown card e recupero.  

- **Riferimento pattern:**  
  - Init: primo click/touch su documento.  
  - Beep: `playBeep(freq, duration)` con oscillatore + gain (come in ActiveWorkout e ExerciseCard).  
  - Vibrazione: `'vibrate' in navigator` e `navigator.vibrate(...)` (pattern come in EsecuzioneWorkout e CustomWorkoutDisplay).

---

*Analisi completata senza modifiche al codice. File: `packages/app-user` (QuickWorkout, ActiveWorkout).*

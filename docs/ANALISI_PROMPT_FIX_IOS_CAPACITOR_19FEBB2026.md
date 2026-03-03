# Analisi del prompt "FIX iOS Capacitor — Buco nero + Spazio dashboard"

**Data:** 19 Febbraio 2026

---

## Valutazione generale

Il prompt è **ben strutturato**: contesto chiaro, 7 tentativi già fatti (evita ripetizioni), strategia a step, regole di sicurezza, file coinvolti e ordine di esecuzione. È utilizzabile così com’è, con le correzioni sotto.

---

## Migliorie consigliate al prompt

### 1. **Rimuovere `scrollEnabled: false` dalla config iOS (critico)**

Nel blocco `ios: { ... }` il prompt indica:

```ts
scrollEnabled: false
```

**Problema:** In Capacitor questa opzione imposta `isScrollEnabled` sull’`UIScrollView` del WebView. Con `false` **tutta l’app non scrolla** (pagine, liste, modal). È quasi certamente un refuso.

**Modifica al prompt:**  
Eliminare `scrollEnabled: false` dall’esempio di config, oppure specificare: “Non impostare `scrollEnabled: false` (disabiliterebbe lo scroll dell’app).”

---

### 2. **BUG 2: correzione formula `max()`**

Il prompt propone:

```ts
paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)'
```

**Problema:** `max(59px, 20px)` = 59px, quindi **non riduce** lo spazio. Serve un valore più basso del safe area (es. una percentuale).

**Modifica al prompt:**  
Sostituire con l’approccio “compact” già descritto nel prompt:

- Classe CSS tipo `.capacitor-safe-top-compact` con  
  `padding-top: calc(env(safe-area-inset-top, 0px) * 0.6);`
- Oppure inline:  
  `paddingTop: 'calc(env(safe-area-inset-top, 0px) * 0.6)'`  
  solo su Capacitor, così i ~59px diventano ~35px.

---

### 3. **Percorso LaunchScreen**

Il prompt cita:

`packages/app-pro/ios/App/App/LaunchScreen.storyboard`

**Reale percorso:**  
`packages/app-pro/ios/App/App/Base.lproj/LaunchScreen.storyboard`  
(il file “LaunchScreen.storyboard” nel gruppo è un variant group; il contenuto Base è in `Base.lproj/`).

**Modifica al prompt:**  
Aggiornare la sezione “FILE PROBABILMENTE COINVOLTI” con il path corretto.

---

### 4. **Config SplashScreen: merge, non sostituzione**

Il prompt mostra un `capacitor.config.ts` completo. Nel repo esiste già una config con `plugins.SplashScreen` e `plugins.StatusBar`.

**Modifica al prompt:**  
Scrivere esplicitamente: “Aggiornare **solo** le chiavi del plugin SplashScreen (e eventualmente ios), senza sostituire l’intero file”, ed elencare le chiavi da cambiare/aggiungere (es. `launchAutoHide`, `launchShowDuration`, `showSpinner`, ecc.).

---

### 5. **Branch (dev vs main)**

Il prompt dice: “Lavora su `dev`, NON su `main`”.

**Suggerimento:**  
Aggiungere: “Se il repo è attualmente su `main`, chiedere all’utente se lavorare su `dev` o procedere su `main`.”  
Così si evita di cambiare branch senza conferma.

---

### 6. **LaunchScreen già bianco**

Nel progetto attuale, `LaunchScreen.storyboard` usa già `systemBackgroundColor` (bianco) per la view. Lo STEP 2 potrebbe non richiedere modifiche.

**Modifica al prompt:**  
In STEP 2 aggiungere: “Se il LaunchScreen ha già `systemBackgroundColor` o `white` come sfondo, considerare lo step già soddisfatto e passare allo step successivo.”

---

## Riepilogo modifiche al prompt

| # | Dove | Cosa fare |
|---|------|-----------|
| 1 | STEP 3, blocco `ios` | Rimuovere `scrollEnabled: false` |
| 2 | BUG 2, primo snippet | Sostituire `max(..., 20px)` con `calc(... * 0.6)` (o classe compact) |
| 3 | File coinvolti | Path LaunchScreen → `.../Base.lproj/LaunchScreen.storyboard` |
| 4 | STEP 3, config | Chiarire: “aggiornare solo SplashScreen (e ios), non sostituire tutto” |
| 5 | Regole | Branch: “se su main, chiedere se usare dev o main” |
| 6 | STEP 2 | “Se sfondo già bianco, step già OK” |

Con queste integrazioni il prompt resta valido e riduce rischi (scroll disabilitato, formula sbagliata, path errati, branch non chiaro).

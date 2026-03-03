# Analisi — Layout iOS Capacitor: buco nero landing + spazio eccessivo dashboard

**Data:** 2026-02-17  
**Contesto:** App PrimePro su Capacitor iOS (iPhone 17 Pro, Dynamic Island). `overlaysWebView` attivo, plugin StatusBar in config, AppDelegate con `window.backgroundColor = .white`.

---

## PROBLEMA 1 — LANDING: buco nero al primo render

**Sintomo:** All’apertura dell’app compare un grosso blocco nero (~150px) tra la Dynamic Island e la navbar "Prime Pro | Accedi | Inizia Gratis". Dopo qualche secondo o dopo scroll il layout si sistema e la navbar finisce subito sotto la Dynamic Island.

**Ipotesi:** `StatusBar.setOverlaysWebView({ overlay: true })` viene eseguito in un `useEffect` in `App.tsx`, quindi **dopo** il primo paint. Al primo frame il WebView non è ancora sotto la status bar e si vede lo spazio nero; quando l’overlay viene attivato, il layout si aggiorna.

**Verifica effettuata:**

1. **App.tsx (app-pro)**  
   - È presente un `useEffect` che, su `Capacitor.isNativePlatform()`, fa dynamic import di `@capacitor/status-bar` e chiama `setOverlaysWebView` e `setStyle`.  
   - Conferma: l’overlay viene applicato **dopo** il primo render (ordine: mount → paint → useEffect → overlay).

2. **capacitor.config.ts**  
   - **Non** c’è un blocco `ios: { ... }`.  
   - Sono presenti solo `plugins.SplashScreen` e `plugins.StatusBar` (overlaysWebView, style, backgroundColor).

3. **Config Capacitor (doc ufficiale)**  
   - In `ios` è prevista l’opzione **`contentInset`**:  
     `'automatic' | 'scrollableAxes' | 'never' | 'always'`.  
   - Imposta `contentInsetAdjustmentBehavior` sull’`UIScrollView` del WebView.  
   - **Default documentato:** `'never'`.  
   - Con `never` il WebView non applica inset automatici per la safe area; il padding va gestito in CSS con `env(safe-area-inset-top)`.

4. **Progetto iOS**  
   - **ViewController:** in `Main.storyboard` il view controller è `CAPBridgeViewController` (modulo Capacitor).  
   - **Non** esiste un `ViewController.swift` custom nel repo; non c’è codice che imposti `webView?.scrollView.contentInsetAdjustmentBehavior`.  
   - **AppDelegate.swift:** solo `window?.backgroundColor` e `rootViewController?.view.backgroundColor = .white`.

**Conclusioni problema 1**

- Il buco nero al primo frame è coerente con l’ipotesi: **overlay attivato in ritardo da JS** (useEffect).  
- **Soluzione consigliata (nativa):**  
  - Aggiungere in `capacitor.config.ts` un blocco esplicito `ios: { contentInset: 'never', backgroundColor: '#FFFFFF' }` per allinearsi al comportamento desiderato e alla doc (e per essere indipendenti dal default della versione Capacitor in uso).  
  - **Opzionale / avanzato:** attivare l’overlay il prima possibile lato nativo (es. nel ViewController o prima che il WebView faccia il primo layout), invece che dal solo JS in useEffect, per evitare il primo frame con buco nero. Questo richiederebbe codice nativo (subclass di CAPBridgeViewController o hook nel ciclo di vita).

---

## PROBLEMA 2 — DASHBOARD: spazio eccessivo sopra "Benvenuto"

**Sintomo:** Troppo spazio bianco tra Dynamic Island e la riga "Benvenuto, Mattia!".

**Verifica effettuata**

1. **PartnerDashboard.tsx**  
   - Container principale:  
     `className="min-h-screen bg-gray-50"` + **`style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}`**.  
   - Wrapper riga hamburger + benvenuto:  
     **`className="md:hidden flex items-center gap-3 px-4 pt-1 pb-1"`**  
     → c’è **`pt-1`** (4px) oltre al `paddingTop` safe-area del container.

2. **PartnerLandingPage.tsx**  
   - Container principale:  
     **`style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}`** sul div `min-h-screen bg-white`.  
   - La navbar interna (`sticky top-0`) ha `h-16`, `px-4 sm:px-6`, nessun `pt-*`/`mt-*` aggiuntivo in cima.  
   - Altri `pt-*` / `mt-*` nel file sono su sezioni/componenti sotto la fold (prezzi, feedback, footer, modal), **non** nella zona Dynamic Island → navbar.

**Conclusioni problema 2**

- L’unico padding “extra” nella zona sopra/sotto la Dynamic Island in dashboard è **`pt-1`** sul wrapper della riga hamburger + benvenuto.  
- Rimuovere **solo** quel `pt-1` (portare a `pb-1` senza `pt-1`, es. `px-4 pb-1`) ridurrebbe di 4px lo spazio tra safe area e "Benvenuto".  
- Con `contentInset: 'never'`, il WebView parte dalla cima; `env(safe-area-inset-top)` da solo (~59px su iPhone 17 Pro) dovrebbe essere sufficiente; ogni `pt-*` aggiuntivo in quella riga aggiunge spazio.

---

## RIEPILOGO INTERVENTI CONSIGLIATI

| Dove | Cosa fare |
|------|-----------|
| **capacitor.config.ts** | Aggiungere `ios: { contentInset: 'never', backgroundColor: '#FFFFFF' }`. |
| **PartnerDashboard.tsx** | Rimuovere `pt-1` dal wrapper della riga hamburger+benvenuto (es. lasciare `px-4 pb-1` o solo `px-4` e un solo padding verticale minimo se serve). |
| **PartnerLandingPage.tsx** | Nessun cambiamento necessario per padding/margin in zona Dynamic Island → navbar (nessun pt/mt extra lì). |
| **AppDelegate / ViewController** | Nessuna modifica obbligatoria per questa analisi; eventuale ottimizzazione “overlay subito” solo se si vuole eliminare il primo frame nero con codice nativo. |

**NON toccare:** PartnerSidebar.tsx, routing, auth (come da richiesta).

---

## RIFERIMENTI

- Capacitor Config (schema): https://capacitorjs.com/docs/config  
- iOS: `contentInset` → `UIScrollView.contentInsetAdjustmentBehavior`, default documentato `'never'`.  
- File ispezionati: `packages/app-pro/ios/App/App/AppDelegate.swift`, `Main.storyboard`, `capacitor.config.ts`, `App.tsx`, `PartnerDashboard.tsx`, `PartnerLandingPage.tsx`.

# 🔍 ANALISI PROFONDA — iOS Capacitor Buco Nero
## PrimePro — 19 Febbraio 2026

---

## STEP 1 — CONTENUTO FILE NATIVI E CONFIG

### 1. MyViewController.swift (contenuto completo)

```swift
import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        print("✅ MyViewController is being used!")

        self.view.backgroundColor = UIColor.white

        if let webView = self.webView {
            webView.backgroundColor = UIColor.white
            webView.isOpaque = false
            webView.scrollView.backgroundColor = UIColor.white
            webView.scrollView.contentInsetAdjustmentBehavior = .never
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        self.view.backgroundColor = UIColor.white
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }
}
```

---

### 2. AppDelegate.swift (contenuto completo)

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Sfondo bianco per eliminare buco nero (primo frame prima che il WebView sia pronto)
        self.window?.backgroundColor = UIColor.white
        self.window?.rootViewController?.view.backgroundColor = UIColor.white
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Ripristina sfondo bianco (alcuni device riapplicano default dopo background)
        self.window?.backgroundColor = UIColor.white
        self.window?.rootViewController?.view.backgroundColor = UIColor.white
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }
}
```

---

### 3. Main.storyboard (path: ios/App/App/Base.lproj/Main.storyboard)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="14111" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" colorMatched="YES" initialViewController="BYZ-38-t0r">
    <device id="retina4_7" orientation="portrait">
        <adaptation id="fullscreen"/>
    </device>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="14088"/>
    </dependencies>
    <scenes>
        <!--Bridge View Controller-->
        <scene sceneID="tne-QT-ifu">
            <objects>
                <viewController id="BYZ-38-t0r" customClass="MyViewController" customModule="App" sceneMemberID="viewController"/>
                <placeholder placeholderIdentifier="IBFirstResponder" id="dkx-z0-nzr" sceneMemberID="firstResponder"/>
            </objects>
        </scene>
    </scenes>
</document>
```

---

### 4. LaunchScreen.storyboard (path: ios/App/App/Base.lproj/LaunchScreen.storyboard)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="17132" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    ...
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <imageView key="view" ... image="Splash" ...>
                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                    </imageView>
                </viewController>
                ...
            </objects>
        </scene>
    </scenes>
    <resources>
        <image name="Splash" width="1366" height="1366"/>
        <systemColor name="systemBackgroundColor">
            <color white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
        </systemColor>
    </resources>
</document>
```

(LaunchScreen usa `systemBackgroundColor` = bianco.)

---

### 5. Info.plist (contenuto completo)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
        <string>PrimePro</string>
	...
	<key>UIStatusBarStyle</key>
	<string>UIStatusBarStyleDarkContent</string>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<false/>
</dict>
</plist>
```

**Nota critica:** `UIViewControllerBasedStatusBarAppearance` = **false**. La documentazione del prompt richiedeva **YES**; con **false** lo stile della status bar è gestito da Info.plist (e da plugin) e **non** da `preferredStatusBarStyle` del ViewController.

---

### 6. capacitor.config.ts (contenuto completo)

```typescript
import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'it.performanceprime.pro',
  appName: 'PrimePro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
```

---

### 7. Podfile (contenuto completo)

```ruby
require_relative '../../../../node_modules/.pnpm/@capacitor+ios@7.4.5_@capacitor+core@7.4.5/node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '14.0'
use_frameworks!
install! 'cocoapods', :disable_input_output_paths => true

def capacitor_pods
  pod 'Capacitor', :path => '...'
  pod 'CapacitorCordova', :path => '...'
  pod 'CapacitorSplashScreen', :path => '...'
  pod 'CapacitorStatusBar', :path => '...'
end

target 'App' do
  capacitor_pods
end
...
```

---

### 8. Podfile.lock — versioni

- **Capacitor:** 7.4.5  
- **CapacitorStatusBar:** 7.0.5  
- **CapacitorSplashScreen:** 7.0.5  

---

## RISPOSTE ALLE DOMANDE A–F

### Domanda A — MyViewController è collegato?

**Sì.** In `Main.storyboard` il ViewController ha:
- `customClass="MyViewController"`
- `customModule="App"`

Quindi le modifiche in `MyViewController.swift` sono collegate al ViewController usato dall’app.

---

### Domanda B — Quale versione di Capacitor iOS?

- **Capacitor:** 7.4.5  
- **CapacitorStatusBar:** 7.0.5  

Con Capacitor 7.x il comportamento di `overlaysWebView` e safe area può differire da versioni precedenti; va verificata la documentazione specifica 7.x.

---

### Domanda C — Info.plist ha le chiavi giuste?

- **UIViewControllerBasedStatusBarAppearance** = **false** (il prompt suggeriva **YES**). Con **false** lo stile della status bar non è delegato al ViewController (`preferredStatusBarStyle` può essere ignorato).
- **UIStatusBarStyle** = **UIStatusBarStyleDarkContent** — presente e coerente con status bar scura.
- **UIStatusBarHidden** — non presente (corretto).

**Possibile problema:** con `UIViewControllerBasedStatusBarAppearance = false` il sistema potrebbe applicare un layout/colore di default alla zona status bar che interferisce con il WebView overlay.

---

### Domanda D — Il build usa il file Swift giusto?

**Sì.** In `App.xcodeproj/project.pbxproj`:
- `MyViewController.swift` è in **Sources** (`MyViewController.swift in Sources`).
- Il file è referenziato nel target di build.

Quindi `MyViewController.swift` viene compilato nel target App.

---

### Domanda E — viewport-fit=cover è nel HTML compilato?

**Sì.** In `packages/app-pro/dist/index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

`viewport-fit=cover` è presente nel build.

---

### Domanda F — Prime 30 righe di dist/index.html

```html
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/jpeg" href="/images/logo-pp-no-bg.jpg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#FFFFFF" />
    <title>PrimePro - Gestionale professionisti</title>
    <script type="module" crossorigin src="/assets/index-....js"></script>
    ...
    <link rel="stylesheet" crossorigin href="/assets/index-....css">
  </head>
  <body style="background-color: #FFFFFF; margin: 0; padding: 0;">
    <div id="root"></div>
  </body>
</html>
```

Viewport e theme-color sono corretti; il CSS safe-area può funzionare grazie a `viewport-fit=cover`.

---

## STEP 2 — TEST DIAGNOSTICO AGGIUNTO

In **PartnerLandingPage.tsx** è stato aggiunto (temporaneamente) il blocco di debug **prima** della navbar:

1. **Box rosso** (opacity 0.5):  
   `position: fixed; top: 0; left: 0; right: 0; height: env(safe-area-inset-top, 50px); background: red; z-index: 9999`

2. **Box blu** (testo "DEBUG: WebView top edge"):  
   `position: fixed; top: 0; left: 0; width: 100%; padding: 4px 8px; background: blue; color: white; font-size: 10px; z-index: 99999`

**Come interpretare sul simulatore:**

- Se il box **blu** è **sotto** la Dynamic Island → il WebView **non** si estende sotto la status bar (`overlaysWebView` non efficace o applicato tardi).
- Se il box **blu** è **dietro/sotto** la Dynamic Island (sopra il contenuto) → il WebView si estende correttamente sotto la status bar.
- Se il box **rosso** ha **altezza ~0** → `env(safe-area-inset-top)` non applicato (es. viewport-fit non rispettato o safe area non passata al WebView).
- Se il box **rosso** ha **altezza ~59px** (o simile) → `env(safe-area-inset-top)` funziona.

---

## STEP 3 — COMANDI ESEGUITI

```bash
pnpm build:pro   # OK, 0 errori
npx cap sync ios  # eseguito da packages/app-pro
```

---

## ISTRUZIONI PER BUILD E TEST SU SIMULATORE

1. **Sync (già fatto):**
   ```bash
   cd packages/app-pro && pnpm build && npx cap sync ios
   ```

2. **Apri Xcode:**
   ```bash
   npx cap open ios
   ```

3. **In Xcode:**
   - **Product → Clean Build Folder (⇧⌘K)**
   - Seleziona **iPhone 17 Pro** (o altro con Dynamic Island)
   - **Run (⌘R)**

4. **Sulla landing (non loggato):**
   - Controlla se vedi il box **rosso** (semi-trasparente) in alto e il box **blu** con scritto "DEBUG: WebView top edge".
   - Verifica **posizione** del box blu rispetto alla Dynamic Island (sotto vs dietro).
   - Verifica **altezza** del box rosso (≈ 0 vs ≈ 59px).

5. **Rimuovere il debug** dopo il test (eliminare i due `div` di debug da `PartnerLandingPage.tsx`).

---

## SINTESI DIAGNOSTICA

| Controllo | Esito |
|-----------|--------|
| MyViewController collegato in Main.storyboard | ✅ Sì |
| MyViewController nel target App | ✅ Sì |
| Capacitor / CapacitorStatusBar | 7.4.5 / 7.0.5 |
| viewport-fit=cover in dist | ✅ Sì |
| theme-color e body bianco | ✅ Sì |
| UIViewControllerBasedStatusBarAppearance | ⚠️ **false** (prompt suggeriva YES) |

**Punto da approfondire:** con `UIViewControllerBasedStatusBarAppearance = false`, il sistema potrebbe riservare o colorare la zona status bar in modo che il “buco” sopra il contenuto non sia controllato dal nostro ViewController. Il test con i box rosso/blu sul simulatore confermerà se il WebView si estende sotto la Dynamic Island e se `env(safe-area-inset-top)` ha valore.

---

*Analisi completata il 19 Febbraio 2026. Nessun fix applicato; solo diagnostica e aggiunta temporanea del debug in landing.*

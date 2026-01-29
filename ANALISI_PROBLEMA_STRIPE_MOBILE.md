# 🔍 ANALISI PROFONDA PROBLEMA STRIPE MOBILE

## PROBLEMA
Su mobile, quando si clicca/tocca un input Stripe, il click non corrisponde all'input selezionato.

## CAUSE IDENTIFICATE

### 1. **Script `index.html` - `touchmove` con `stopPropagation()`** 🔴 CRITICO
**File:** `index.html` righe 144-148
```javascript
document.body.addEventListener('touchmove', function(e) {
  if (e.target === document.body) {
    e.stopPropagation();  // ⚠️ Questo blocca eventi touch su iframe!
  }
}, { passive: true });
```
**Problema:** Questo listener potrebbe intercettare eventi touch anche sugli iframe Stripe, bloccandoli.

### 2. **Z-index degli iframe troppo basso**
**File:** `src/index.css` righe 1034-1038
```css
iframe[src*="js.stripe.com"] {
  pointer-events: auto !important;
  z-index: 1 !important;  /* ⚠️ Troppo basso rispetto al modal z-[99999] */
}
```
**Problema:** Gli iframe hanno `z-index: 1` mentre il modal ha `z-[99999]`. Anche se gli iframe sono dentro il modal, potrebbero esserci problemi di stacking context.

### 3. **Overlay del modal potrebbe intercettare touch**
**File:** `AddStripeCardModal.tsx` riga 315-323
```tsx
<div 
  className="fixed inset-0 z-[99999] ..."
  onClick={(e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>
```
**Problema:** L'overlay ha `fixed inset-0` che copre tutto lo schermo. Anche se usa `e.target === e.currentTarget`, su mobile i touch events potrebbero essere intercettati prima di raggiungere gli iframe.

### 4. **CSS `touch-action: pan-y` su body**
**File:** `index.html` riga 128, `mobile-fix.css` riga 118
```css
touch-action: pan-y;
```
**Problema:** `pan-y` permette solo scroll verticale, ma potrebbe interferire con i touch sugli iframe.

### 5. **Container PaymentElement con `isolation: isolate`**
**File:** `AddStripeCardModal.tsx` riga 210
```tsx
isolation: 'isolate',  // Crea nuovo stacking context
```
**Problema:** Questo crea un nuovo stacking context che potrebbe isolare gli iframe dal resto del DOM, causando problemi di z-index.

## SOLUZIONI PROPOSTE

### Soluzione 1: Modificare script `index.html` per escludere iframe Stripe
```javascript
document.body.addEventListener('touchmove', function(e) {
  // NON bloccare se l'evento proviene da un iframe Stripe
  const target = e.target;
  if (target.closest && target.closest('iframe[src*="js.stripe.com"]')) {
    return; // Lascia passare l'evento
  }
  if (e.target === document.body) {
    e.stopPropagation();
  }
}, { passive: true });
```

### Soluzione 2: Aumentare z-index degli iframe Stripe
```css
iframe[src*="js.stripe.com"],
iframe[src*="hooks.stripe.com"] {
  pointer-events: auto !important;
  z-index: 100000 !important; /* Più alto del modal */
  position: relative !important;
}
```

### Soluzione 3: Aggiungere `pointer-events: none` all'overlay quando si tocca un iframe
```tsx
<div 
  className="fixed inset-0 z-[99999] ..."
  style={{ pointerEvents: 'auto' }}
  onTouchStart={(e) => {
    const target = e.target as HTMLElement;
    if (target.closest('iframe[src*="js.stripe.com"]')) {
      // Se si tocca un iframe, disabilita pointer-events sull'overlay
      e.currentTarget.style.pointerEvents = 'none';
      setTimeout(() => {
        e.currentTarget.style.pointerEvents = 'auto';
      }, 100);
    }
  }}
>
```

### Soluzione 4: Rimuovere `isolation: isolate` e usare z-index più alti
```tsx
<div 
  style={{ 
    position: 'relative',
    zIndex: 100000,  // Più alto del modal
  }}
>
```

### Soluzione 5: Aggiungere `touch-action: manipulation` specificamente agli iframe
```css
iframe[src*="js.stripe.com"] {
  touch-action: manipulation !important; /* Permette tap senza delay */
}
```

## RACCOMANDAZIONE
Applicare **TUTTE** le soluzioni insieme per massima compatibilità:
1. Modificare script `index.html` per escludere iframe
2. Aumentare z-index degli iframe a 100000
3. Aggiungere `touch-action: manipulation` agli iframe
4. Rimuovere o modificare `isolation: isolate`
5. Aggiungere handler `onTouchStart` per gestire overlay

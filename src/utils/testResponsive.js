// utils/testResponsive.js

const testButtonVisibility = () => {
  const buttons = document.querySelectorAll('.btn-avvia, .btn-completato, .btn-termina-sessione, .btn-termina-allenamento, .btn-completa');
  
  console.log('🧪 TEST PULSANTI - Inizio verifica...');
  
  buttons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
    
    console.log(`Pulsante ${index + 1}:`, {
      text: button.textContent?.trim(),
      position: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      isVisible: isVisible,
      size: {
        width: rect.width,
        height: rect.height
      }
    });
    
    if (!isVisible) {
      console.error('❌ PULSANTE FUORI SCHERMO:', {
        element: button,
        position: rect,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
      
      // Aggiungi classe debug
      button.classList.add('debug-button-position');
    } else {
      console.log('✅ Pulsante visibile:', button.textContent?.trim());
    }
    
    // Test click handler
    const hasClickHandler = button.onclick || button.hasAttribute('onClick') || button.getAttribute('data-testid');
    if (!hasClickHandler) {
      console.error('❌ PULSANTE SENZA CLICK HANDLER:', button);
    } else {
      console.log('✅ Click handler presente:', button.textContent?.trim());
    }
    
    // Test touch target size
    const minTouchTarget = 44; // 44px minimo per mobile
    if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
      console.warn('⚠️ TOUCH TARGET TROPPO PICCOLO:', {
        element: button,
        size: {
          width: rect.width,
          height: rect.height
        },
        minimum: minTouchTarget
      });
    }
  });
  
  // Test safe areas
  const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
  console.log('📱 Safe Area Bottom:', safeAreaBottom);
  
  // Test viewport height
  const vh = window.innerHeight;
  const cssVh = getComputedStyle(document.documentElement).getPropertyValue('--vh');
  console.log('📏 Viewport Height:', {
    window: vh,
    css: cssVh
  });
};

const testButtonClick = () => {
  const buttons = document.querySelectorAll('.btn-avvia, .btn-completato, .btn-termina-sessione, .btn-termina-allenamento, .btn-completa');
  
  console.log('🖱️ TEST CLICK PULSANTI...');
  
  buttons.forEach((button, index) => {
    // Simula click per test
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    console.log(`Testando click su: ${button.textContent?.trim()}`);
    
    // Verifica se il pulsante è cliccabile
    const isClickable = !button.disabled && button.style.pointerEvents !== 'none';
    
    if (isClickable) {
      console.log('✅ Pulsante cliccabile:', button.textContent?.trim());
    } else {
      console.error('❌ Pulsante non cliccabile:', button.textContent?.trim());
    }
  });
};

const testResponsiveLayout = () => {
  console.log('📱 TEST LAYOUT RESPONSIVE...');
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  };
  
  console.log('Viewport:', viewport);
  
  // Test safe areas
  const safeAreas = {
    top: env('safe-area-inset-top'),
    right: env('safe-area-inset-right'),
    bottom: env('safe-area-inset-bottom'),
    left: env('safe-area-inset-left')
  };
  
  console.log('Safe Areas:', safeAreas);
  
  // Test action buttons container
  const actionContainers = document.querySelectorAll('.action-buttons-container');
  actionContainers.forEach((container, index) => {
    const rect = container.getBoundingClientRect();
    console.log(`Action Container ${index + 1}:`, {
      position: rect,
      isVisible: rect.bottom <= window.innerHeight
    });
  });
};

// Funzione helper per env()
function env(property) {
  return getComputedStyle(document.documentElement).getPropertyValue(`env(${property})`);
}

// Esegui test su resize e orientation change
window.addEventListener('resize', () => {
  console.log('🔄 RESIZE EVENT');
  setTimeout(() => {
    testButtonVisibility();
    testResponsiveLayout();
  }, 100);
});

window.addEventListener('orientationchange', () => {
  console.log('🔄 ORIENTATION CHANGE');
  setTimeout(() => {
    testButtonVisibility();
    testResponsiveLayout();
  }, 500);
});

// Test iniziale
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 TEST INIZIALE PULSANTI');
  setTimeout(() => {
    testButtonVisibility();
    testButtonClick();
    testResponsiveLayout();
  }, 1000);
});

// Esporta funzioni per test manuali
window.testButtons = {
  visibility: testButtonVisibility,
  click: testButtonClick,
  responsive: testResponsiveLayout
};

console.log('🧪 Test utilities caricate. Usa window.testButtons.visibility() per testare manualmente.');

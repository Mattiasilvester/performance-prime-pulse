import { useEffect } from 'react';

export default function MobileScrollFix() {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // TEMPORANEAMENTE DISABILITATO per fix schermo nero mobile
    if (!isMobile) return;
    
    // Rimuovi console.log per produzione
    // console.log('MobileScrollFix: Mobile detected, applying minimal fixes only');
    
    const fixMobileScroll = () => {
      // Fix body
      document.body.style.cssText = `
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        position: relative !important;
        height: auto !important;
        min-height: 100vh !important;
        touch-action: pan-y !important;
        overscroll-behavior: auto !important;
      `;
      
      // Fix html
      document.documentElement.style.cssText = `
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        position: relative !important;
        height: auto !important;
        touch-action: pan-y !important;
      `;
      
      // Fix root
      const root = document.getElementById('root');
      if (root) {
        root.style.cssText = `
          overflow: visible !important;
          min-height: 100vh !important;
          touch-action: pan-y !important;
        `;
      }
      
      // DISABILITATO: Rimozione positioning fixed che causa schermo nero
      // document.querySelectorAll('*').forEach(el => {
      //   const computed = window.getComputedStyle(el);
      //   const htmlEl = el as HTMLElement;
      //   
      //   if (computed.position === 'fixed' && !isProtected) {
      //     htmlEl.style.position = 'relative';
      //   }
      //   
      //   if (computed.touchAction === 'none') {
      //     htmlEl.style.touchAction = 'auto';
      //   }
      // });
    };
    
    // REFRESH DETECTION E FIX
    const handlePageShow = (event: PageTransitionEvent) => {
      // Rimuovi console.log per produzione
      // console.log('Page show event:', event.persisted ? 'back/forward cache' : 'normal load');
      
      // Detecta refresh
      if (performance.navigation && performance.navigation.type === 1) {
        // Rimuovi console.log per produzione
        // console.log('Refresh detected - applying scroll fix');
        
        // Reset completo
        setTimeout(() => {
          fixMobileScroll();
          
          // Trick iOS con scrollTo
          window.scrollTo(0, 1);
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 10);
          
          // Rimuovi console.log per produzione
          // console.log('Refresh scroll fix applied');
        }, 100);
      }
    };
    
    // Applica fix
    fixMobileScroll();
    
    // Riapplica dopo delay
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(fixMobileScroll, delay)
    );
    
    // Listener per orientamento
    window.addEventListener('orientationchange', fixMobileScroll);
    
    // Listener per refresh
    window.addEventListener('pageshow', handlePageShow);
    
    // Previeni il bounce di iOS ma permetti scroll
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target === document.body) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('orientationchange', fixMobileScroll);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  return null;
}

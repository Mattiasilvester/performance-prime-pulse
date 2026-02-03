import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti(trigger: boolean = true) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (trigger && !hasRun.current) {
      hasRun.current = true;
      
      // ✅ VERSIONE TESTATA E FUNZIONANTE
      const colors = ['#FFD700', '#EEBA2B', '#000000'];
      
      // Rileva mobile
      const isMobile = window.innerWidth < 768;
      
      console.log('🎉 Confetti triggered - isMobile:', isMobile);
      
      // ✅ PARAMETRI TESTATI CHE FUNZIONANO
      const baseConfig = {
        colors: colors,
        gravity: 0.6, // ✅ Non troppo lento (era 0.5)
        ticks: 400, // ✅ Durata ragionevole (era 500)
        startVelocity: 30, // ✅ Velocità moderata (era 25)
        decay: 0.9, // ✅ Decay normale (era 0.88)
        zIndex: 9999,
        disableForReducedMotion: false
      };

      // ✅ ANIMAZIONE 1: Esplosione centrale con parametri conservativi
      confetti({
        ...baseConfig,
        particleCount: isMobile ? 80 : 100, // ✅ Ridotto per performance
        spread: 70,
        origin: { 
          y: isMobile ? 0.25 : 0.1, // ✅ Non troppo in alto
          x: 0.5 
        },
        scalar: isMobile ? 1.8 : 1.3, // ✅ Non troppo grande
        angle: 90
      });
      
      console.log('🎊 Animazione 1 eseguita');

      // ✅ ANIMAZIONE 2: Sinistra dopo 150ms
      setTimeout(() => {
        confetti({
          ...baseConfig,
          particleCount: isMobile ? 40 : 50,
          spread: 55,
          origin: { x: 0, y: isMobile ? 0.3 : 0.15 },
          scalar: isMobile ? 1.6 : 1.2,
          angle: 60
        });
        console.log('🎉 Animazione 2 eseguita');
      }, 150);

      // ✅ ANIMAZIONE 3: Destra dopo 250ms
      setTimeout(() => {
        confetti({
          ...baseConfig,
          particleCount: isMobile ? 40 : 50,
          spread: 55,
          origin: { x: 1, y: isMobile ? 0.3 : 0.15 },
          scalar: isMobile ? 1.6 : 1.2,
          angle: 120
        });
        console.log('🎊 Animazione 3 eseguita');
      }, 250);

      // ✅ ANIMAZIONE BONUS: Pioggia continua (opzionale ma efficace)
      let rainCount = 0;
      const rainInterval = setInterval(() => {
        rainCount++;
        
        // Pioggia leggera per 5 secondi
        if (rainCount > 50) { // 50 * 100ms = 5 secondi
          clearInterval(rainInterval);
          console.log('🌧️ Pioggia completata');
          return;
        }
        
        // Mini-pioggia continua
        confetti({
          ...baseConfig,
          particleCount: 2,
          spread: 40,
          origin: { 
            x: Math.random(), 
            y: isMobile ? 0.25 : 0.1 
          },
          scalar: isMobile ? 1.4 : 1.0,
          ticks: 300
        });
      }, 100); // Ogni 100ms

      // ✅ Cleanup dopo 8 secondi (tempo sufficiente)
      const cleanup = setTimeout(() => {
        clearInterval(rainInterval);
        confetti.reset();
        console.log('🧹 Confetti cleanup completato');
      }, 8000);

      return () => {
        clearInterval(rainInterval);
        clearTimeout(cleanup);
      };
    }
  }, [trigger]);
}

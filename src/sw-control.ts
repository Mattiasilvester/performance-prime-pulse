// src/sw-control.ts
(function bootstrapSWControl() {
  const isProd =
    typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.PROD;

  if (isProd && "serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        // Registra il SW solo se esiste davvero /sw.js
        const res = await fetch("/sw.js", { method: "HEAD" });
        if (res.ok) {
          await navigator.serviceWorker.register("/sw.js");
        } else {
          // Nessun SW da registrare: rimuovi eventuali registrazioni pregresse
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {
        // In caso di errore di rete: non registrare nulla
      }
    });
  } else {
    // DEV: ambiente sempre pulito - rimuovi TUTTI i SW incluso Progressier
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => {
          console.log(`🧹 DEV: Deregistering SW: ${r.scope}`);
          r.unregister();
        });
      });
    }
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => {
          // Cancella TUTTE le cache, incluse quelle PWA comuni
          // Pattern: progressier, workbox, pwa, vite
          const allCaches = keys.filter(k => /progressier|workbox|pwa|vite/i.test(k) || true);
          return Promise.all(allCaches.map((k) => caches.delete(k)));
        });
    }
  }
})();
/**
 * DEV-only mobile hard refresh utilities.
 * - Forza reload quando la pagina viene ripristinata dal bfcache (iOS/Android).
 * - Applica un cache-buster (?v=timestamp) solo in DEV e solo una volta per sessione.
 */
(function mobileDevHardRefresh() {
  if (!(import.meta as any)?.env?.DEV) return;

  // 1) Force reload when returned from bfcache (Safari/Chrome mobile)
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    // Quando persisted è true, la pagina è stata ripristinata dalla cache in memoria (stale)
    if ((e as any).persisted) {
      // Hard reload per forzare fetch fresco
      window.location.reload();
    }
  });

  // 2) One-shot cache-buster per mobile viewport/UA
  try {
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSmallViewport = Math.min(window.innerWidth, window.innerHeight) <= 840;
    const key = '__pp_dev_cache_busted';
    const already = sessionStorage.getItem(key);
    if ((isMobileUA || isSmallViewport) && !already) {
      const url = new URL(window.location.href);
      // Evita di accumulare parametri ad ogni navigazione
      url.searchParams.set('v', String(Date.now()));
      sessionStorage.setItem(key, '1');
      if (window.location.href !== url.toString()) {
        window.location.replace(url.toString());
      }
    }
  } catch {
    // no-op in caso di errori di sessionStorage/URL
  }
})();

// Export vuoto per renderlo un modulo valido
export {};

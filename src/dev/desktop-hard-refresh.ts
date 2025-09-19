/**
 * DEV-only desktop hard refresh.
 * - Ricarica la pagina se viene ripristinata dal bfcache (pageshow.persisted).
 * - Applica un cache-buster (?v=timestamp) una sola volta per sessione.
 */
(function desktopDevHardRefresh() {
  if (!(import.meta as any)?.env?.DEV) return;

  // 1) Force reload quando si rientra dal bfcache (tipico con Device Toolbar)
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if ((e as any).persisted) {
      window.location.reload();
    }
  });

  // 2) One-shot cache-buster per DEV (indipendente dallo user agent)
  try {
    const key = '__pp_dev_cache_busted_desktop';
    if (!sessionStorage.getItem(key)) {
      const url = new URL(window.location.href);
      url.searchParams.set('v', String(Date.now()));
      sessionStorage.setItem(key, '1');
      if (window.location.href !== url.toString()) {
        window.location.replace(url.toString());
      }
    }
  } catch {
    // no-op
  }
})();

// Export vuoto per renderlo un modulo valido
export {};

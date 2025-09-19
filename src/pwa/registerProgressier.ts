/**
 * Progressier PWA registration - PROD only
 */
export function registerProgressier() {
  // Carica manifest
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = 'https://progressier.app/57xt3KDGgRIDatj1qtpm/progressier.json';
  document.head.appendChild(manifest);

  // Carica script Progressier
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://progressier.app/57xt3KDGgRIDatj1qtpm/script.js';
  document.head.appendChild(script);
}

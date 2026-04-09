import posthog from 'posthog-js'

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY
  const host = import.meta.env.VITE_POSTHOG_HOST

  if (!key) return // non inizializzare se manca la chiave

  posthog.init(key, {
    api_host: host ?? 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // disabilitato per ora, abilitiamo manualmente
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,        // nasconde input utente (email, password, ecc.)
      maskInputOptions: {
        password: true,
        email: true,
      },
    },
    enable_recording_console_log: false,
    sanitize_properties: (properties) => {
      if (properties['$current_url']) {
        const url = new URL(properties['$current_url'])
        // Rimuove hash e search params con token sensibili
        if (url.hash.includes('access_token') ||
            url.hash.includes('refresh_token') ||
            url.searchParams.has('access_token')) {
          properties['$current_url'] = url.origin + url.pathname
        }
      }
      return properties
    },
  })
}

export { posthog }

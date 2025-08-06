// Analytics service con Plausible - Privacy-first e GDPR compliant
// Script ufficiale Plausible con outbound links tracking

interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

interface AnalyticsUser {
  id?: string;
  email?: string;
  plan?: string;
}

class Analytics {
  private isEnabled: boolean = true;
  private domain: string = 'performanceprime.it';
  private scriptLoaded: boolean = false;

  constructor() {
    // Controlla se l'utente ha disabilitato analytics
    this.isEnabled = !localStorage.getItem('analytics_disabled');
    this.init();
  }

  private init() {
    if (!this.isEnabled) return;

    // Carica script Plausible ufficiale in modo asincrono
    if (!this.scriptLoaded) {
      // Script principale Plausible
      const script = document.createElement('script');
      script.defer = true;
      script.setAttribute('data-domain', this.domain);
      script.src = 'https://plausible.io/js/script.outbound-links.js';
      document.head.appendChild(script);

      // Inizializza funzione plausible
      const initScript = document.createElement('script');
      initScript.textContent = `
        window.plausible = window.plausible || function() { 
          (window.plausible.q = window.plausible.q || []).push(arguments) 
        }
      `;
      document.head.appendChild(initScript);

      this.scriptLoaded = true;
    }
  }

  // Traccia evento personalizzato
  track(eventName: string, properties?: Record<string, string | number | boolean>) {
    if (!this.isEnabled) return;

    try {
      // Usa l'API ufficiale di Plausible per eventi custom
      if (window.plausible) {
        window.plausible(eventName, { props: properties });
      }
    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  }

  // Traccia navigazione pagina
  trackPageView(pageName: string, properties?: Record<string, string | number | boolean>) {
    this.track('page_view', {
      page: pageName,
      ...properties
    });
  }

  // Traccia azioni utente
  trackUserAction(action: string, properties?: Record<string, string | number | boolean>) {
    this.track('user_action', {
      action,
      ...properties
    });
  }

  // Traccia feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, string | number | boolean>) {
    this.track('feature_usage', {
      feature,
      ...properties
    });
  }

  // Traccia errori
  trackError(error: string, properties?: Record<string, string | number | boolean>) {
    this.track('error', {
      error,
      ...properties
    });
  }

  // Traccia funnel di conversione
  trackConversion(funnel: string, step: string, properties?: Record<string, string | number | boolean>) {
    this.track('conversion', {
      funnel,
      step,
      ...properties
    });
  }

  // Traccia performance
  trackPerformance(metric: string, value: number, properties?: Record<string, string | number | boolean>) {
    this.track('performance', {
      metric,
      value,
      ...properties
    });
  }

  // Abilita/disabilita analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      localStorage.removeItem('analytics_disabled');
      this.init();
    } else {
      localStorage.setItem('analytics_disabled', 'true');
    }
  }

  // Controlla se analytics è abilitato
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  // Identifica utente (anonimo)
  identify(userId: string, traits?: Record<string, string | number | boolean>) {
    if (!this.isEnabled) return;

    this.track('user_identified', {
      user_id: userId,
      ...traits
    });
  }

  // Traccia eventi specifici dell'app
  trackAuth(action: 'login' | 'register' | 'logout' | 'password_reset') {
    this.trackUserAction(`auth_${action}`);
  }

  trackWorkout(action: 'start' | 'complete' | 'pause' | 'cancel', workoutType?: string) {
    this.trackUserAction(`workout_${action}`, {
      workout_type: workoutType
    });
  }

  trackAICoach(action: 'chat_start' | 'plan_generated' | 'plan_saved', planType?: string) {
    this.trackUserAction(`ai_coach_${action}`, {
      plan_type: planType
    });
  }

  trackSettings(action: 'view' | 'update', setting?: string) {
    this.trackUserAction(`settings_${action}`, {
      setting
    });
  }

  trackSubscription(action: 'view' | 'upgrade' | 'downgrade', plan?: string) {
    this.trackUserAction(`subscription_${action}`, {
      plan
    });
  }
}

// Istanza globale
export const analytics = new Analytics();

// Hook React per analytics
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackAuth: analytics.trackAuth.bind(analytics),
    trackWorkout: analytics.trackWorkout.bind(analytics),
    trackAICoach: analytics.trackAICoach.bind(analytics),
    trackSettings: analytics.trackSettings.bind(analytics),
    trackSubscription: analytics.trackSubscription.bind(analytics),
    setEnabled: analytics.setEnabled.bind(analytics),
    isEnabled: analytics.isAnalyticsEnabled.bind(analytics)
  };
};

// Tipi per TypeScript
declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

export default analytics; 
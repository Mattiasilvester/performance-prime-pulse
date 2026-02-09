// Servizio per gestire suoni e vibrazioni per notifiche professionali

class NotificationSoundService {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;

  /**
   * Inizializza l'audio context (richiede user interaction)
   */
  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !('AudioContext' in window) && !('webkitAudioContext' in window)) {
        console.log('[Sound] Audio non supportato');
        return false;
      }

      // Crea audio context solo quando necessario (lazy initialization)
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        this.audioContext = AudioCtx ? new AudioCtx() : null;
      }

      // Resume se sospeso (richiede user interaction)
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      return true;
    } catch (error) {
      console.error('[Sound] Errore inizializzazione audio:', error);
      return false;
    }
  }

  /**
   * Riproduce un suono di notifica
   */
  async playNotificationSound(type: 'default' | 'success' | 'warning' | 'info' = 'default'): Promise<void> {
    if (!this.soundEnabled) {
      return;
    }

    try {
      // Inizializza se non già fatto
      const initialized = await this.initialize();
      if (!initialized || !this.audioContext) {
        return;
      }

      // Resume se sospeso
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Frequenze e durate diverse per tipo
      let frequency: number;
      let duration: number;

      switch (type) {
        case 'success':
          frequency = 800; // Suono più alto e piacevole
          duration = 200;
          break;
        case 'warning':
          frequency = 600; // Suono medio
          duration = 250;
          break;
        case 'info':
          frequency = 700; // Suono neutro
          duration = 150;
          break;
        default:
          frequency = 750; // Suono standard
          duration = 200;
      }

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine'; // Onda sinusoidale (suono più dolce)

      // Volume moderato (0.2 = 20%)
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('[Sound] Errore riproduzione suono:', error);
      // Non bloccare se il suono fallisce
    }
  }

  /**
   * Attiva vibrazione (solo su dispositivi mobili)
   */
  async vibrate(pattern: number | number[] = 200): Promise<void> {
    if (!this.vibrationEnabled) {
      return;
    }

    try {
      if ('vibrate' in navigator) {
        // Pattern vibrazione: [vibra, pausa, vibra]
        const vibrationPattern = typeof pattern === 'number' 
          ? [pattern] 
          : pattern;

        navigator.vibrate(vibrationPattern);
      }
    } catch (error) {
      console.error('[Sound] Errore vibrazione:', error);
      // Non bloccare se la vibrazione fallisce
    }
  }

  /**
   * Riproduce suono e vibrazione insieme
   */
  async playNotification(type: 'default' | 'success' | 'warning' | 'info' = 'default'): Promise<void> {
    // Riproduci suono e vibrazione in parallelo
    await Promise.all([
      this.playNotificationSound(type),
      this.vibrate([200, 50, 100]) // Vibra 200ms, pausa 50ms, vibra 100ms
    ]);
  }

  /**
   * Abilita/disabilita suoni
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    // Salva preferenza in localStorage
    localStorage.setItem('pp_notification_sound_enabled', JSON.stringify(enabled));
  }

  /**
   * Abilita/disabilita vibrazioni
   */
  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
    // Salva preferenza in localStorage
    localStorage.setItem('pp_notification_vibration_enabled', JSON.stringify(enabled));
  }

  /**
   * Ottieni stato suoni
   */
  isSoundEnabled(): boolean {
    const saved = localStorage.getItem('pp_notification_sound_enabled');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return this.soundEnabled; // Default: abilitato
  }

  /**
   * Ottieni stato vibrazioni
   */
  isVibrationEnabled(): boolean {
    const saved = localStorage.getItem('pp_notification_vibration_enabled');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return this.vibrationEnabled; // Default: abilitato
  }

  /**
   * Carica preferenze da localStorage all'avvio
   */
  loadPreferences(): void {
    this.soundEnabled = this.isSoundEnabled();
    this.vibrationEnabled = this.isVibrationEnabled();
  }
}

// Singleton instance
export const notificationSoundService = new NotificationSoundService();

// Carica preferenze all'avvio
if (typeof window !== 'undefined') {
  notificationSoundService.loadPreferences();
}

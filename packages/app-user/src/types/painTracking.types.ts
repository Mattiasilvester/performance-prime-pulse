// =====================================================
// TYPES: Sistema Dolori Dettagliato per PrimeBot
// Data: 27 Novembre 2025
// =====================================================

export interface PainDetail {
  zona: string;                    // 'spalla', 'schiena', 'ginocchio', etc.
  aggiunto_il: string;             // ISO date: '2024-11-27'
  descrizione: string | null;      // 'dolore acuto lato sinistro'
  fonte: 'onboarding' | 'chat';    // da dove è stato aggiunto
}

export interface PainCheckResult {
  hasPain: boolean;
  pains: PainDetail[];
  oldestPain: PainDetail | null;
  persistentPains: PainDetail[];  // era painOverTwoMonths, ora dolori > 2 settimane
  totalPains: number;
  // Campo legacy per retrocompatibilità
  /** @deprecated Usa persistentPains invece */
  painOverTwoMonths?: PainDetail[];
}

export interface PainUpdateResult {
  success: boolean;
  error?: string;
  updatedPains: PainDetail[];
}

// Mapping zone per messaggi user-friendly
export const ZONE_LABELS: Record<string, string> = {
  'spalla': 'la spalla',
  'schiena': 'la schiena',
  'ginocchio': 'il ginocchio',
  'caviglia': 'la caviglia',
  'polso': 'il polso',
  'gomito': 'il gomito',
  'anca': 'l\'anca',
  'collo': 'il collo',
  'petto': 'il petto',
  'addome': 'l\'addome',
  'braccio': 'il braccio',
  'coscia': 'la coscia',
};

// Emoji per risposte positive (quando dolore passa)
export const HAPPY_EMOJIS = ['😄', '🎉', '💪', '🙌', '😊', '✨', '🥳'];

export function getRandomHappyEmoji(): string {
  return HAPPY_EMOJIS[Math.floor(Math.random() * HAPPY_EMOJIS.length)];
}

export function getZoneLabel(zona: string): string {
  return ZONE_LABELS[zona.toLowerCase()] || zona;
}

export function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Soglia per suggerire consulto medico (2 settimane = 14 giorni)
export const PAIN_WARNING_THRESHOLD_DAYS = 14;

export function isPainPersistent(dateString: string): boolean {
  return daysSince(dateString) >= PAIN_WARNING_THRESHOLD_DAYS;
}

// Mantieni anche la vecchia per retrocompatibilità ma deprecata
/** @deprecated Usa isPainPersistent invece */
export function isOverTwoMonths(dateString: string): boolean {
  return daysSince(dateString) > 60;
}

export function formatTimeAgo(dateString: string): string {
  const days = daysSince(dateString);
  if (days < 7) return 'qualche giorno fa';
  if (days < 30) return `${Math.floor(days / 7)} settimane fa`;
  if (days < 60) return 'circa un mese fa';
  return `${Math.floor(days / 30)} mesi fa`;
}


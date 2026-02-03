/**
 * Stub for app-user: no professional context (B2C only).
 * Returns null so components that need professionalId can skip professional-specific logic.
 */
export function useProfessionalId(): string | null {
  return null;
}

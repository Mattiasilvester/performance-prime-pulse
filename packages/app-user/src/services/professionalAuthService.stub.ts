/**
 * Stub per app-user (B2C): professionalAuthService non è usato.
 * useProfessionalId in B2C usa solo la query a professionals; questo stub evita l'import da codice pro-only.
 */
import type { User } from '@supabase/supabase-js';

export const professionalAuthService = {
  async ensureProfessionalFromMetadata(_user: User): Promise<{ id: string } | null> {
    return null;
  },
};

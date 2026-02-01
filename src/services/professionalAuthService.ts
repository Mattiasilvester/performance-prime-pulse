import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface ProfessionalRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  category: 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata' | 'altro';
  city: string;
  bio?: string;
  company_name?: string;
  titolo_studio?: string;
  certificazioni?: string[];
  customCategory?: string;
  modalita?: 'online' | 'presenza' | 'entrambi';
  prezzo_seduta?: number | null;
  prezzo_fascia?: '€' | '€€' | '€€€';
}

/** Normalizza category per DB: 'altro' e 'other' → 'pt'. */
function toCategoryDb(category: string): 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata' {
  if (category === 'altro' || category === 'other') return 'pt';
  return category as 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata';
}

/** Payload per INSERT in professionals (stessi campi usati da trigger/fallback). */
function buildProfessionalInsertPayload(
  userId: string,
  source: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    category: string;
    city: string;
    bio?: string | null;
    company_name?: string | null;
    titolo_studio?: string | null;
    certificazioni?: string[] | null;
    modalita?: string | null;
    prezzo_seduta?: number | null;
    prezzo_fascia?: string | null;
  }
) {
  const companyName = source.company_name || `${source.first_name || ''} ${source.last_name || ''}`.trim() || 'Professionista';
  const categoryDb = toCategoryDb(source.category || 'pt');
  return {
    user_id: userId,
    first_name: source.first_name || '',
    last_name: source.last_name || '',
    email: (source.email || '').toLowerCase(),
    phone: source.phone || '',
    category: categoryDb,
    zona: source.city || '',
    bio: source.bio ?? null,
    company_name: companyName,
    titolo_studio: source.titolo_studio ?? null,
    specializzazioni: Array.isArray(source.certificazioni) ? source.certificazioni : [],
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
    attivo: true,
    is_partner: false,
    modalita: source.modalita || 'entrambi',
    prezzo_seduta: source.prezzo_seduta ?? null,
    prezzo_fascia: source.prezzo_fascia || '€€',
    rating: 0,
    reviews_count: 0,
    birth_date: '1990-01-01',
    birth_place: source.city || '',
    vat_number: 'PENDING',
    vat_address: 'Da completare',
    vat_postal_code: '00000',
    vat_city: source.city || '',
  };
}

export const professionalAuthService = {
  // Registra nuovo professionista.
  // Il record in professionals viene creato dal trigger su auth.users (handle_new_professional_signup),
  // così funziona anche con "Confirm email" attiva (dopo signUp non c'è sessione → niente 403).
  async register(data: ProfessionalRegistrationData) {
    const emailLower = data.email.toLowerCase();
    const companyName = data.company_name || `${data.first_name} ${data.last_name}`;

    // 1. Crea account in Supabase Auth con TUTTI i dati professional in options.data
    // (il trigger handle_new_professional_signup li usa per inserire in public.professionals)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'professional',
          first_name: data.first_name,
          last_name: data.last_name,
          email: emailLower,
          phone: data.phone,
          category: data.category,
          city: data.city,
          bio: data.bio ?? null,
          company_name: companyName,
          titolo_studio: data.titolo_studio ?? null,
          certificazioni: data.certificazioni ?? [],
          modalita: data.modalita ?? 'entrambi',
          prezzo_seduta: data.prezzo_seduta ?? null,
          prezzo_fascia: data.prezzo_fascia ?? '€€',
          birth_date: '1990-01-01',
          birth_place: data.city,
          vat_number: 'PENDING',
          vat_address: 'Da completare',
          vat_postal_code: '00000',
          vat_city: data.city,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Errore nella creazione account');

    // 2. Record professional creato dal trigger; se c'è sessione lo recuperiamo (o creiamo con fallback)
    let professional: Record<string, unknown> | null = null;
    if (authData.session) {
      let { data: profRow } = await supabase
        .from('professionals')
        .select()
        .eq('user_id', authData.user.id)
        .maybeSingle();
      // Fallback: se il trigger non ha creato il record, creiamolo dal client
      if (!profRow) {
        const payload = buildProfessionalInsertPayload(authData.user.id, {
          first_name: data.first_name,
          last_name: data.last_name,
          email: emailLower,
          phone: data.phone,
          category: data.category,
          city: data.city,
          bio: data.bio ?? null,
          company_name: companyName,
          titolo_studio: data.titolo_studio ?? null,
          certificazioni: data.certificazioni ?? [],
          modalita: data.modalita ?? 'entrambi',
          prezzo_seduta: data.prezzo_seduta ?? null,
          prezzo_fascia: data.prezzo_fascia ?? '€€',
        });
        const { error: insertError } = await supabase.from('professionals').insert(payload);
        if (insertError) {
          console.warn('[professionalAuthService] Fallback insert dopo signUp:', insertError.message, insertError);
        }
        if (!insertError) {
          const res = await supabase
            .from('professionals')
            .select()
            .eq('user_id', authData.user.id)
            .maybeSingle();
          profRow = res.data ?? null;
        }
        // Se insert fallito (es. duplicate per trigger ritardato), riprova a leggere
        if (!profRow && insertError) {
          const res = await supabase
            .from('professionals')
            .select()
            .eq('user_id', authData.user.id)
            .maybeSingle();
          profRow = res.data ?? null;
        }
        // Ultimo tentativo: attesa breve (trigger async) + refetch, poi insert da user_metadata
        if (!profRow) {
          await new Promise((r) => setTimeout(r, 800));
          const { data: refetched } = await supabase
            .from('professionals')
            .select()
            .eq('user_id', authData.user.id)
            .maybeSingle();
          profRow = refetched ?? null;
        }
        if (!profRow && authData.user.user_metadata) {
          const meta = authData.user.user_metadata as Record<string, unknown>;
          const metaPayload = buildProfessionalInsertPayload(authData.user.id, {
            first_name: (meta.first_name as string) || '',
            last_name: (meta.last_name as string) || '',
            email: ((meta.email as string) || authData.user.email || '').toLowerCase(),
            phone: (meta.phone as string) || '',
            category: (meta.category as string) || 'pt',
            city: (meta.city as string) || '',
            bio: (meta.bio as string) ?? null,
            company_name: (meta.company_name as string) ?? null,
            titolo_studio: (meta.titolo_studio as string) ?? null,
            certificazioni: Array.isArray(meta.certificazioni) ? (meta.certificazioni as string[]) : [],
            modalita: (meta.modalita as string) ?? 'entrambi',
            prezzo_seduta: (meta.prezzo_seduta as number) ?? null,
            prezzo_fascia: (meta.prezzo_fascia as string) ?? '€€',
          });
          const { error: metaInsertError } = await supabase.from('professionals').insert(metaPayload);
          if (metaInsertError) {
            console.warn('[professionalAuthService] Insert da user_metadata:', metaInsertError.message);
          } else {
            const res = await supabase
              .from('professionals')
              .select()
              .eq('user_id', authData.user.id)
              .maybeSingle();
            profRow = res.data ?? null;
          }
        }
      }
      professional = profRow ?? null;
    }

    return {
      user: authData.user,
      professional,
      requiresEmailConfirmation: !authData.session,
    };
  },

  // Login professionista
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Verifica che sia un professionista (.maybeSingle evita 406 se record non ancora creato dal trigger)
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profError) throw profError;
    if (!professional) {
      throw new Error('Account non trovato come professionista');
    }

    return { user: data.user, professional };
  },

  // Verifica se email già esistente
  async checkEmailExists(email: string): Promise<boolean> {
    const { data } = await supabase
      .from('professionals')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    return !!data;
  },

  /**
   * Crea il record in professionals da user_metadata se manca (es. trigger fallito o conferma email).
   * Da usare quando l'utente è loggato ma professionalId è null (es. dashboard).
   */
  async ensureProfessionalFromMetadata(user: User): Promise<{ id: string } | null> {
    const { data: existing } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) return existing;

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    if (!meta || (meta.role as string) !== 'professional') return null;

    const payload = buildProfessionalInsertPayload(user.id, {
      first_name: (meta.first_name as string) || '',
      last_name: (meta.last_name as string) || '',
      email: ((meta.email as string) || user.email || '').toLowerCase(),
      phone: (meta.phone as string) || '',
      category: (meta.category as string) || 'pt',
      city: (meta.city as string) || '',
      bio: (meta.bio as string) ?? null,
      company_name: (meta.company_name as string) ?? null,
      titolo_studio: (meta.titolo_studio as string) ?? null,
      certificazioni: Array.isArray(meta.certificazioni) ? (meta.certificazioni as string[]) : [],
      modalita: (meta.modalita as string) ?? 'entrambi',
      prezzo_seduta: (meta.prezzo_seduta as number) ?? null,
      prezzo_fascia: (meta.prezzo_fascia as string) ?? '€€',
    });
    const { error } = await supabase.from('professionals').insert(payload);
    if (error) {
      console.warn('[professionalAuthService] ensureProfessionalFromMetadata:', error.message);
      return null;
    }
    const { data: created } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    return created ?? null;
  },
};


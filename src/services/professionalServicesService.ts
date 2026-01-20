import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ProfessionalService {
  id: string;
  professional_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_online: boolean;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceData {
  professional_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_online?: boolean;
  is_active?: boolean;
  color?: string;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  is_online?: boolean;
  is_active?: boolean;
  color?: string;
}

// ============================================
// FETCH SERVICES FOR PROFESSIONAL
// ============================================

export async function getServicesByProfessional(professionalId: string): Promise<ProfessionalService[]> {
  try {
    const { data, error } = await supabase
      .from('professional_services')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Errore fetch servizi professionista:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Errore getServicesByProfessional:', error);
    return [];
  }
}

// ============================================
// FETCH SINGLE SERVICE
// ============================================

export async function getServiceById(serviceId: string): Promise<ProfessionalService | null> {
  try {
    const { data, error } = await supabase
      .from('professional_services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Errore fetch servizio:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Errore getServiceById:', error);
    return null;
  }
}

// ============================================
// CREATE SERVICE
// ============================================

export async function createService(serviceData: CreateServiceData): Promise<ProfessionalService | null> {
  try {
    const { data, error } = await supabase
      .from('professional_services')
      .insert({
        professional_id: serviceData.professional_id,
        name: serviceData.name,
        description: serviceData.description || null,
        duration_minutes: serviceData.duration_minutes,
        price: serviceData.price,
        is_online: serviceData.is_online ?? false,
        is_active: serviceData.is_active ?? true,
        color: serviceData.color || '#EEBA2B',
      })
      .select()
      .single();

    if (error) {
      console.error('Errore creazione servizio:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Errore createService:', error);
    return null;
  }
}

// ============================================
// UPDATE SERVICE
// ============================================

export async function updateService(
  serviceId: string,
  updateData: UpdateServiceData
): Promise<ProfessionalService | null> {
  try {
    const { data, error } = await supabase
      .from('professional_services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Errore aggiornamento servizio:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Errore updateService:', error);
    return null;
  }
}

// ============================================
// DELETE SERVICE
// ============================================

export async function deleteService(serviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('professional_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('Errore eliminazione servizio:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Errore deleteService:', error);
    return false;
  }
}

// ============================================
// DEACTIVATE SERVICE (soft delete)
// ============================================

export async function deactivateService(serviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('professional_services')
      .update({ is_active: false })
      .eq('id', serviceId);

    if (error) {
      console.error('Errore disattivazione servizio:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Errore deactivateService:', error);
    return false;
  }
}

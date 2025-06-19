
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  surname: string;
  birth_place: string;
  bio: string;
  avatarUrl: string;
  email: string;
}

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return {
      id: profile.id,
      name: profile.first_name || '',
      surname: profile.last_name || '',
      birth_place: profile.phone || 'Milano, Italia', // Usando phone come placeholder per birth_place
      bio: 'Appassionato di fitness e benessere',
      avatarUrl: '👨‍💼',
      email: profile.email || user.email || ''
    };
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

export const updateUserProfile = async (formData: { name: string; surname: string; birthPlace: string }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.name,
        last_name: formData.surname,
        phone: formData.birthPlace, // Usando phone come placeholder per birth_place
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

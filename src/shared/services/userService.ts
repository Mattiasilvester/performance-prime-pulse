
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  surname: string;
  birth_place: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  email: string;
  birth_date?: Date | null;
}

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    console.log('Fetching user profile...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }

    console.log('User ID:', user.id);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors if no profile exists

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!profile) {
      console.log('No profile found, creating default profile...');
      // Create a default profile if none exists
      const defaultProfile: UserProfile = {
        id: user.id,
        name: user.email?.split('@')[0] || 'Utente',
        surname: '',
        birth_place: '',
        phone: '',
        bio: 'Appassionato di fitness e benessere',
        avatarUrl: '👨‍💼',
        email: user.email || '',
        birth_date: null
      };
      
      // Try to insert the default profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: defaultProfile.name,
          last_name: defaultProfile.surname,
          birth_place: defaultProfile.birth_place,
          phone: defaultProfile.phone,
          avatar_url: defaultProfile.avatarUrl,
          email: defaultProfile.email
        });

      if (insertError) {
        console.error('Error creating default profile:', insertError);
      } else {
        console.log('Default profile created successfully');
      }
      
      return defaultProfile;
    }

    console.log('Profile found:', profile);
    return {
      id: profile.id,
      name: profile.first_name || '',
      surname: profile.last_name || '',
      birth_place: profile.birth_place || '',
      phone: profile.phone || '',
      bio: 'Appassionato di fitness e benessere',
      avatarUrl: profile.avatar_url || '👨‍💼',
      email: profile.email || user.email || '',
      birth_date: profile.birth_date ? new Date(profile.birth_date) : null
    };
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

export const updateUserProfile = async (formData: { name: string; surname: string; birthPlace: string; phone?: string; birthDate?: string; avatarUrl?: string }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {
      first_name: formData.name,
      last_name: formData.surname,
      birth_place: formData.birthPlace,
      updated_at: new Date().toISOString()
    };

    if (formData.phone) {
      updateData.phone = formData.phone;
    }

    if (formData.birthDate) {
      updateData.birth_date = formData.birthDate;
    }

    if (formData.avatarUrl) {
      updateData.avatar_url = formData.avatarUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadAvatar = async (file: File): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

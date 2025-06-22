
import React, { useState, useEffect, useRef } from 'react';
import { Edit, MapPin, Calendar, Trophy, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchUserProfile, updateUserProfile, type UserProfile as UserProfileType } from '@/services/userService';
import { fetchWorkoutStats, WorkoutStats } from '@/services/workoutStatsService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [stats, setStats] = useState<WorkoutStats>({ total_workouts: 0, total_hours: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', surname: '', birthPlace: '' });
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const profileData = await fetchUserProfile();
        if (profileData) {
          setProfile(profileData);
          setForm({
            name: profileData.name,
            surname: profileData.surname,
            birthPlace: profileData.birth_place,
          });
        }

        const statsData = await fetchWorkoutStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePhotoClick = () => {
    if (editing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileImage(data.publicUrl);
      toast.success('Foto profilo aggiornata con successo');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Errore nel caricamento della foto');
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      await updateUserProfile(form);
      setEditing(false);
      setProfile({
        ...profile,
        name: form.name,
        surname: form.surname,
        birth_place: form.birthPlace
      });
      toast.success('Profilo aggiornato con successo');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Errore nell\'aggiornamento del profilo');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name,
        surname: profile.surname,
        birthPlace: profile.birth_place,
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-black rounded-2xl shadow-sm border-2 border-[#EEBA2B] p-6">
        <div className="text-center text-white">Caricamento profilo...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-black rounded-2xl shadow-sm border-2 border-[#EEBA2B] p-6">
        <div className="text-center text-white">Errore nel caricamento del profilo</div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-2xl shadow-sm border-2 border-[#EEBA2B] overflow-hidden">
      {/* Cover */}
      <div className="h-32" style={{ background: 'linear-gradient(135deg, #000000 0%, #C89116 100%)' }}></div>
      
      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-12 left-6">
          <div 
            className={`w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-4xl relative ${editing ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={handlePhotoClick}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-xl" />
            ) : (
              profile.avatarUrl
            )}
            {editing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
        
        {/* Edit Button */}
        <div className="flex justify-end pt-4">
          {editing ? (
            <div className="flex gap-2">
              <Button 
                onClick={handleCancel}
                variant="outline" 
                size="sm" 
                className="bg-gray-600 text-white border-gray-600 hover:bg-gray-700"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSave}
                variant="outline" 
                size="sm" 
                className="bg-[#EEBA2B] text-black border-[#EEBA2B] hover:bg-[#EEBA2B]/90"
              >
                Salva
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setEditing(true)}
              variant="outline" 
              size="sm" 
              className="bg-[#EEBA2B] text-black border-[#EEBA2B] hover:bg-[#EEBA2B]/90"
            >
              <Edit className="h-4 w-4 mr-2 text-black" />
              Modifica
            </Button>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="mt-4">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Nome</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Cognome</label>
                <Input
                  value={form.surname}
                  onChange={(e) => setForm({ ...form, surname: e.target.value })}
                  placeholder="Cognome"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Luogo di nascita</label>
                <Input
                  value={form.birthPlace}
                  onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                  placeholder="Luogo di nascita"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-[#EEBA2B]">
                {profile.name} {profile.surname}
              </h3>
              <p className="text-white mb-4">{profile.bio}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_workouts}</div>
                  <div className="text-sm text-white">Allenamenti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.total_hours}h</div>
                  <div className="text-sm text-white">Ore totali</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-white">
                  <MapPin className="h-4 w-4 mr-2 text-white" />
                  <span>{profile.birth_place}</span>
                </div>
                <div className="flex items-center text-sm text-white">
                  <Calendar className="h-4 w-4 mr-2 text-white" />
                  <span>Membro da Gennaio 2024</span>
                </div>
                <div className="flex items-center text-sm text-white">
                  <Trophy className="h-4 w-4 mr-2 text-white" />
                  <span>Livello: Intermedio</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

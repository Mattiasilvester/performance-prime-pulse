import React, { useState, useEffect } from 'react';
import { Edit, MapPin, Calendar, Trophy, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchUserProfile, updateUserProfile, uploadAvatar, type UserProfile as UserProfileType } from '@/services/userService';
import { fetchWorkoutStats, WorkoutStats } from '@/services/workoutStatsService';
import { useToast } from '@/hooks/use-toast';

export const UserProfile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [stats, setStats] = useState<WorkoutStats>({ total_workouts: 0, total_hours: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', surname: '', birthPlace: '' });
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading profile data...');
      setLoading(true);
      try {
        const profileData = await fetchUserProfile();
        console.log('Profile data received:', profileData);
        if (profileData) {
          setProfile(profileData);
          setForm({
            name: profileData.name,
            surname: profileData.surname,
            birthPlace: profileData.birth_place,
          });
        } else {
          console.log('No profile data received');
        }

        const statsData = await fetchWorkoutStats();
        console.log('Stats data received:', statsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
        console.log('Loading completed');
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      let avatarUrl = profile.avatarUrl;
      
      // Upload new avatar if one was selected
      if (imageFile) {
        avatarUrl = await uploadAvatar(imageFile);
      }
      
      await updateUserProfile({
        name: form.name,
        surname: form.surname,
        birthPlace: form.birthPlace,
        avatarUrl
      });
      
      setEditing(false);
      setProfile({
        ...profile,
        name: form.name,
        surname: form.surname,
        birth_place: form.birthPlace,
        avatarUrl
      });
      
      // Reset image states
      setImageFile(null);
      setProfileImage(null);
      
      toast({
        title: "Profilo aggiornato con successo!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Errore nell'aggiornamento del profilo",
        variant: "destructive",
        duration: 3000,
      });
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
    // Reset image states
    setImageFile(null);
    setProfileImage(null);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImageFile(file); // Save the file for upload
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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
      <div className="h-32" style={{ background: 'linear-gradient(135deg, #000000 0%, #C89116 100%)' }}></div>
      
      <div className="relative px-6 pb-6">
        <div className="absolute -top-12 left-6">
          <div className="relative w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-4xl overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : profile.avatarUrl && profile.avatarUrl.startsWith('http') ? (
              <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{profile.avatarUrl || '👨‍💼'}</span>
            )}
            {editing && (
              <button
                onClick={handleImageUpload}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
              >
                <Camera className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          {editing ? (
            <div className="flex gap-2">
              <Button 
                onClick={handleCancel}
                variant="outline" 
                size="sm" 
                className="border-border-primary text-text-primary hover:bg-surface-secondary hover:text-text-primary"
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

import React, { useState, useEffect } from 'react';
import { Edit, MapPin, Calendar, Trophy, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateUserProfile, uploadAvatar, type UserProfile as UserProfileType } from '@/services/userService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { fetchWorkoutStats, WorkoutStats } from '@/services/workoutStatsService';
import { useToast } from '@/hooks/use-toast';

export const UserProfile = () => {
  const { toast } = useToast();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const [stats, setStats] = useState<WorkoutStats>({ total_workouts: 0, total_hours: "0m" });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', surname: '', birthPlace: '' });
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (profile) {
          setForm({
            name: profile.name,
            surname: profile.surname,
            birthPlace: profile.birth_place,
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
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      
      let avatarUrl = profile.avatarUrl;
      
      // Upload new avatar if one was selected
      if (imageFile) {
        avatarUrl = await uploadAvatar(imageFile);
      } else if (profileImage) {
        // Se non c'è imageFile ma c'è profileImage, usa quello
        avatarUrl = profileImage;
      }
      
      await updateUserProfile({
        name: form.name,
        surname: form.surname,
        birthPlace: form.birthPlace,
        avatarUrl
      });
      
      // Ricarica i dati tramite hook
      refetch();
      
      setEditing(false);
      
      // Reset image states
      setImageFile(null);
      setProfileImage(null);
      
      toast({
        title: "Profilo aggiornato con successo!",
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Errore durante il salvataggio:', error);
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

  if (loading || profileLoading) {
    return (
      <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
        <div className="text-center text-[#8A8A96]">Caricamento profilo...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
        <div className="text-center text-[#8A8A96]">Errore nel caricamento del profilo</div>
      </div>
    );
  }

  const displayAvatar = profileImage ?? (profile.avatarUrl && (profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('data:image/')) ? profile.avatarUrl : null);
  const initial = (profile.name?.[0] || '') + (profile.surname?.[0] || '') || '?';
  const livello = 'Intermedio';
  const obiettivo = profile.bio || 'Salute';

  return (
    <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] overflow-hidden p-6">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div
            className="rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#0A0A0C] w-[88px] h-[88px]"
            style={{ background: displayAvatar ? 'transparent' : 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profilo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[32px] font-bold text-[#0A0A0C]">{initial}</span>
            )}
          </div>
          <button
            type="button"
            onClick={editing ? handleImageUpload : () => setEditing(true)}
            className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] rounded-full bg-[#16161A] border-2 border-[#0A0A0C] flex items-center justify-center"
          >
            <Camera className="w-3.5 h-3.5 text-[#8A8A96]" />
          </button>
        </div>
        <h3 className="text-[22px] font-bold text-[#F0EDE8] text-center mt-4">
          {profile.name} {profile.surname}
        </h3>
        <p className="text-[13px] text-[#8A8A96] text-center mt-1">
          Livello {livello} · Obiettivo {obiettivo}
        </p>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-bold text-[#F0EDE8]">{stats.total_workouts}</span>
            <span className="text-[11px] text-[#8A8A96] uppercase tracking-wider">Workout</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-bold text-[#F0EDE8]">{stats.total_hours}</span>
            <span className="text-[11px] text-[#8A8A96] uppercase tracking-wider">Ore</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-bold text-[#F0EDE8]">0</span>
            <span className="text-[11px] text-[#8A8A96] uppercase tracking-wider">Streak</span>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#F0EDE8] mb-1">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome"
                className="bg-[#1E1E24] border-[rgba(255,255,255,0.06)] text-[#F0EDE8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#F0EDE8] mb-1">Cognome</label>
              <Input
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                placeholder="Cognome"
                className="bg-[#1E1E24] border-[rgba(255,255,255,0.06)] text-[#F0EDE8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#F0EDE8] mb-1">Luogo di nascita</label>
              <Input
                value={form.birthPlace}
                onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                placeholder="Luogo di nascita"
                className="bg-[#1E1E24] border-[rgba(255,255,255,0.06)] text-[#F0EDE8]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="border-[rgba(255,255,255,0.06)] text-[#F0EDE8] hover:bg-[#1E1E24]"
            >
              Annulla
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              size="sm"
              className="bg-[#EEBA2B] text-[#0A0A0C] border-0 hover:bg-[#EEBA2B]/90"
            >
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

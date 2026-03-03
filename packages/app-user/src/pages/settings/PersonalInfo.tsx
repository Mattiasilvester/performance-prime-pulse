
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FastDatePicker } from '@/components/ui/fast-date-picker';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { fetchUserProfile, updateUserProfile, uploadAvatar } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { analytics } from '@/services/analytics';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    luogoNascita: '',
    dataNascita: null as Date | null,
    telefono: '',
    avatarUrl: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          setFormData({
            nome: profile.name || '',
            cognome: profile.surname || '',
            luogoNascita: profile.birth_place || '',
            dataNascita: profile.birth_date || null,
            telefono: profile.phone || '',
            avatarUrl: profile.avatarUrl || ''
          });
          setAvatarPreview(profile.avatarUrl || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    
    // Traccia visualizzazione pagina
    analytics.trackSettings('view', 'personal_info');
  }, []);

  const handleSave = async () => {
    try {
      let avatarUrl = formData.avatarUrl;
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }
      
      await updateUserProfile({
        name: formData.nome,
        surname: formData.cognome,
        birthPlace: formData.luogoNascita,
        phone: formData.telefono,
        birthDate: formData.dataNascita ? format(formData.dataNascita, 'yyyy-MM-dd') : undefined,
        avatarUrl
      });
      
      // Traccia aggiornamento profilo
      analytics.trackSettings('update', 'personal_info');
      
      toast({
        title: "Informazioni personali aggiornate con successo.",
        duration: 3000,
      });
      
      // Naviga automaticamente alla pagina precedente dopo il salvataggio
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Traccia errore
      analytics.trackError('profile_update_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        section: 'personal_info'
      });
      
      toast({
        title: "Errore nell'aggiornamento delle informazioni.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Traccia upload avatar
      analytics.trackUserAction('avatar_upload', {
        file_size: file.size,
        file_type: file.type
      });
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData({ ...formData, avatarUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Traccia rimozione avatar
    analytics.trackUserAction('avatar_remove');
  };

  const inputClass = 'bg-[#1A1A1F] border border-[rgba(255,255,255,0.1)] rounded-[14px] text-[#F0EDE8] placeholder:text-[#5C5C66] focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] px-4 py-3';
  const labelClass = 'text-sm font-medium text-[#8A8A96] mb-2';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-6 pt-6">
        <div className="max-w-md mx-auto w-full">
          <div className="text-[#8A8A96] text-center">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-6">
      <div className="max-w-md mx-auto w-full pt-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-[#8A8A96] hover:text-[#EEBA2B] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[#F0EDE8]">Informazioni personali</h1>
        </div>
        <p className="text-[13px] text-[#8A8A96] mb-4">Aggiorna i tuoi dati personali</p>
      </div>

      <div className="max-w-md mx-auto w-full">
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#EEBA2B]"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#1E1E24] border-2 border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                    <span className="text-[#EEBA2B] text-2xl">👤</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#1E1E24] border border-[rgba(255,255,255,0.06)] text-[#8A8A96] hover:text-[#F0EDE8] hover:bg-[#1E1E24]/80 rounded-[14px]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Carica foto profilo
              </Button>
            </div>

            <div>
              <Label htmlFor="nome" className={labelClass}>Nome</Label>
              <Input
                id="nome"
                type="text"
                className={cn('border-0', inputClass)}
                placeholder="Inserisci il tuo nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cognome" className={labelClass}>Cognome</Label>
              <Input
                id="cognome"
                type="text"
                className={cn('border-0', inputClass)}
                placeholder="Inserisci il tuo cognome"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="data-nascita" className={labelClass}>Data di nascita</Label>
              <FastDatePicker
                date={formData.dataNascita}
                onDateChange={(date) => setFormData({ ...formData, dataNascita: date })}
                placeholder="Seleziona data di nascita"
              />
            </div>
            <div>
              <Label htmlFor="luogo-nascita" className={labelClass}>Luogo di nascita</Label>
              <Input
                id="luogo-nascita"
                type="text"
                className={cn('border-0', inputClass)}
                placeholder="Inserisci il luogo di nascita"
                value={formData.luogoNascita}
                onChange={(e) => setFormData({ ...formData, luogoNascita: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="telefono" className={labelClass}>Numero di telefono</Label>
              <Input
                id="telefono"
                type="tel"
                className={cn('border-0', inputClass)}
                placeholder="Inserisci il numero di telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <Button
              type="button"
              onClick={handleSave}
              className="w-full rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0"
              style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}
            >
              Salva modifiche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;

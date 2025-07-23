
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

const PersonalInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    dataNascita: null as Date | null,
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
            dataNascita: profile.birth_date || null,
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
        birthPlace: formData.dataNascita ? format(formData.dataNascita, 'yyyy-MM-dd') : '',
        avatarUrl
      });
      
      toast({
        title: "Informazioni personali aggiornate con successo.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
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
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData({ ...formData, avatarUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-md mx-auto">
          <div className="text-white text-center">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>
        
        <div className="bg-black border-2 border-[#EEBA2B] rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Informazioni personali</h2>
          
          <div className="space-y-4">
            {/* Avatar Upload Section */}
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
                  <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-[#EEBA2B] flex items-center justify-center">
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
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-black border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black"
              >
                <Upload className="h-4 w-4 mr-2" />
                Carica foto profilo
              </Button>
            </div>
            
            <div>
              <Label htmlFor="nome" className="text-white">Nome</Label>
              <Input
                id="nome"
                type="text"
                className="bg-black border-gray-500 text-white"
                placeholder="Inserisci il tuo nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="cognome" className="text-white">Cognome</Label>
              <Input
                id="cognome"
                type="text"
                className="bg-black border-gray-500 text-white"
                placeholder="Inserisci il tuo cognome"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="data-nascita" className="text-white">Data di nascita</Label>
              <FastDatePicker
                date={formData.dataNascita}
                onDateChange={(date) => setFormData({ ...formData, dataNascita: date })}
                placeholder="Seleziona data di nascita"
              />
            </div>
            
            <Button 
              onClick={handleSave}
              className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black"
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

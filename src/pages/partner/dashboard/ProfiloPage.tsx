/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isPlaceholderValue } from '@/utils/placeholders';
import {
  User,
  Camera,
  Pencil,
  MapPin,
  Star,
  X
} from 'lucide-react';

interface ProfessionalProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  bio: string | null;
  foto_url: string | null;
  specializzazioni: string[] | null;
  zona: string | null;
  titolo_studio: string | null;
  company_name: string | null;
  modalita: string;
  prezzo_seduta: number | null;
  anni_esperienza?: number;
  vat_number: string | null;
  vat_address: string | null;
  vat_city: string | null;
  vat_postal_code: string | null;
  pec_email: string | null;
  sdi_code: string | null;
}

const categoryLabels: Record<string, string> = {
  pt: 'Personal Trainer',
  nutrizionista: 'Nutrizionista',
  fisioterapista: 'Fisioterapista',
  mental_coach: 'Mental Coach',
  osteopata: 'Osteopata',
  altro: 'Altro'
};

export default function ProfiloPage() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Carica profilo
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Profilo professionista non trovato');
        return;
      }

      setProfile(data as ProfessionalProfile);
    } catch (error: any) {
      console.error('Errore caricamento profilo:', error);
      toast.error('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  // Funzioni semplici per gestione modifica
  const startEdit = (field: string, value: any) => {
    setEditingField(field);
    setEditValue(String(value || ''));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Validazioni base (warning) per dati fiscali — non bloccano il salvataggio
  const validateVatNumber = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    const digits = trimmed.replace(/^IT/i, '').replace(/\D/g, '');
    if (digits.length !== 11) {
      toast.warning('P.IVA italiana: 11 cifre (opzionale prefisso IT). Verifica il valore.');
      return false;
    }
    return true;
  };
  const validatePostalCode = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (!/^\d{5}$/.test(trimmed)) {
      toast.warning('CAP: 5 cifre. Verifica il valore.');
      return false;
    }
    return true;
  };

  const saveEdit = async (field: string) => {
    if (!profile || !editingField) return;

    const valueToSave = field === 'prezzo_seduta' ? (editValue ? parseInt(editValue) : null) : (editValue.trim() || null);
    if (field === 'vat_number' && valueToSave != null) {
      validateVatNumber(String(valueToSave));
    }
    if (field === 'vat_postal_code' && valueToSave != null) {
      validatePostalCode(String(valueToSave));
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = { [field]: valueToSave };

      const { error } = await supabase
        .from('professionals')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      toast.success('Modifica salvata con successo');
      setEditingField(null);
      setEditValue('');
    } catch (error: any) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  // Upload foto profilo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validazione file
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload su Supabase Storage
      // Usa bucket 'avatars' (già esistente) con path dedicato per professionisti
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/professional-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Permette sovrascrittura se esiste già
        });

      if (uploadError) throw uploadError;

      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Aggiorna database
      const { error: updateError } = await supabase
        .from('professionals')
        .update({ foto_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Aggiorna stato locale
      setProfile({ ...profile, foto_url: publicUrl });
      toast.success('Foto profilo aggiornata');
    } catch (error: any) {
      console.error('Errore upload foto:', error);
      toast.error('Errore nel caricamento della foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Gestione specializzazioni
  const [specializations, setSpecializations] = useState<string[]>([]);

  const handleAddSpecialization = (value: string) => {
    if (value.trim()) {
      setSpecializations([...specializations, value.trim()]);
    }
  };

  const handleRemoveSpecialization = (index: number) => {
    setSpecializations(specializations.filter((_, i) => i !== index));
  };

  const saveSpecializations = async () => {
    if (!profile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('professionals')
        .update({ specializzazioni: specializations })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, specializzazioni: specializations } : null);
      toast.success('Specializzazioni salvate');
      setEditingField(null);
      setSpecializations([]);
    } catch (error: any) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore nel salvataggio');
    }
  };


  if (!loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Profilo non trovato</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between py-2 border-b border-gray-50">
                    <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Profilo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Foto Profilo */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile.foto_url ? (
                  <img
                    src={profile.foto_url}
                    alt="Foto profilo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {/* Overlay upload al hover */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploadingPhoto ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            {/* Info Profilo */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#EEBA2B]" />
                  <span>{categoryLabels[profile.category] || profile.category}</span>
                </div>
                {profile.zona && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.zona}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottoni Azione */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Anteprima
            </button>
          </div>
        </div>
      </div>

      {/* Grid 2 Colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonna Sinistra */}
        <div className="space-y-6">
          {/* Card Informazioni Base */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Base</h2>
            <div className="space-y-0">
              {/* Nome */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Nome</span>
                  {editingField === 'first_name' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => saveEdit('first_name')}
                          className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 break-words mt-1">{profile.first_name || '-'}</p>
                  )}
                </div>
                {editingField !== 'first_name' && (
                  <button 
                    onClick={() => startEdit('first_name', profile.first_name)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>

              {/* Cognome */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Cognome</span>
                  {editingField === 'last_name' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => saveEdit('last_name')}
                          className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 break-words mt-1">{profile.last_name || '-'}</p>
                  )}
                </div>
                {editingField !== 'last_name' && (
                  <button 
                    onClick={() => startEdit('last_name', profile.last_name)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>

              {/* Email (readonly) */}
              <div className="py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Email</span>
                <p className="text-gray-400 mt-1">{profile.email}</p>
              </div>

              {/* Telefono */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Telefono</span>
                  {editingField === 'phone' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => saveEdit('phone')}
                          className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 break-words mt-1">{profile.phone || '-'}</p>
                  )}
                </div>
                {editingField !== 'phone' && (
                  <button 
                    onClick={() => startEdit('phone', profile.phone)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>

              {/* Studio / Ragione sociale */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Studio / Ragione sociale</span>
                  <p className="text-xs text-gray-400 mt-0.5">Es. Studio Rossi, PT Marco Bianchi (non l&apos;indirizzo)</p>
                  {editingField === 'company_name' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => saveEdit('company_name')}
                          className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 break-words mt-1">{profile.company_name || '-'}</p>
                  )}
                </div>
                {editingField !== 'company_name' && (
                  <button 
                    onClick={() => startEdit('company_name', profile.company_name)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>

              {/* Titolo di studio */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Titolo di studio</span>
                  {editingField === 'titolo_studio' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => saveEdit('titolo_studio')}
                          className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 break-words mt-1">{profile.titolo_studio || '-'}</p>
                  )}
                </div>
                {editingField !== 'titolo_studio' && (
                  <button 
                    onClick={() => startEdit('titolo_studio', profile.titolo_studio)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card Dati fiscali (Report Commercialista) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Dati fiscali</h2>
            <p className="text-sm text-gray-500 mb-4">Per il Report per Commercialista (P.IVA e indirizzo)</p>
            <div className="space-y-0">
              {/* P.IVA */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">P.IVA</span>
                  {editingField === 'vat_number' ? (
                    <div className="mt-1">
                      <input type="text" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="11 cifre (opz. prefisso IT)" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent" />
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => saveEdit('vat_number')} className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors">Salva</button>
                        <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`break-words mt-1 ${isPlaceholderValue(profile.vat_number) ? 'text-gray-500 italic' : 'text-gray-900'}`}>{profile.vat_number ?? '—'}</p>
                      {isPlaceholderValue(profile.vat_number) && <span className="text-xs text-amber-600">Da completare</span>}
                    </>
                  )}
                </div>
                {editingField !== 'vat_number' && (
                  <button type="button" onClick={() => startEdit('vat_number', profile.vat_number)} className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
              {/* Indirizzo (sede fiscale) */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Indirizzo (sede fiscale)</span>
                  {editingField === 'vat_address' ? (
                    <div className="mt-1">
                      <input type="text" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Via, numero civico" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent" />
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => saveEdit('vat_address')} className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors">Salva</button>
                        <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`break-words mt-1 ${isPlaceholderValue(profile.vat_address) ? 'text-gray-500 italic' : 'text-gray-900'}`}>{profile.vat_address ?? '—'}</p>
                      {isPlaceholderValue(profile.vat_address) && <span className="text-xs text-amber-600">Da completare</span>}
                    </>
                  )}
                </div>
                {editingField !== 'vat_address' && (
                  <button type="button" onClick={() => startEdit('vat_address', profile.vat_address)} className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
              {/* Città */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Città</span>
                  {editingField === 'vat_city' ? (
                    <div className="mt-1">
                      <input type="text" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent" />
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => saveEdit('vat_city')} className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors">Salva</button>
                        <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`break-words mt-1 ${isPlaceholderValue(profile.vat_city) ? 'text-gray-500 italic' : 'text-gray-900'}`}>{profile.vat_city ?? '—'}</p>
                      {isPlaceholderValue(profile.vat_city) && <span className="text-xs text-amber-600">Da completare</span>}
                    </>
                  )}
                </div>
                {editingField !== 'vat_city' && (
                  <button type="button" onClick={() => startEdit('vat_city', profile.vat_city)} className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
              {/* CAP */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">CAP</span>
                  {editingField === 'vat_postal_code' ? (
                    <div className="mt-1">
                      <input type="text" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="5 cifre" maxLength={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent" />
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => saveEdit('vat_postal_code')} className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors">Salva</button>
                        <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`break-words mt-1 ${isPlaceholderValue(profile.vat_postal_code) ? 'text-gray-500 italic' : 'text-gray-900'}`}>{profile.vat_postal_code ?? '—'}</p>
                      {isPlaceholderValue(profile.vat_postal_code) && <span className="text-xs text-amber-600">Da completare</span>}
                    </>
                  )}
                </div>
                {editingField !== 'vat_postal_code' && (
                  <button type="button" onClick={() => startEdit('vat_postal_code', profile.vat_postal_code)} className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
              {/* PEC (opzionale) */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">PEC (opzionale)</span>
                  {editingField === 'pec_email' ? (
                    <div className="mt-1">
                      <input type="email" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="email@pec.it" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent" />
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => saveEdit('pec_email')} className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors">Salva</button>
                        <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`break-words mt-1 ${isPlaceholderValue(profile.pec_email) ? 'text-gray-500' : 'text-gray-900'}`}>
                      {isPlaceholderValue(profile.pec_email) ? '—' : (profile.pec_email ?? '—')}
                    </p>
                  )}
                </div>
                {editingField !== 'pec_email' && (
                  <button type="button" onClick={() => startEdit('pec_email', profile.pec_email)} className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
              {/* Codice SDI (opzionale) */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Codice SDI (opzionale)</span>
                  {editingField === 'sdi_code' ? (
                    <div className="mt-1">
                      <input type="text" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="es. 7 caratteri" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent" />
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => saveEdit('sdi_code')} className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors">Salva</button>
                        <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`break-words mt-1 ${isPlaceholderValue(profile.sdi_code) ? 'text-gray-500' : 'text-gray-900'}`}>
                      {isPlaceholderValue(profile.sdi_code) ? '—' : (profile.sdi_code ?? '—')}
                    </p>
                  )}
                </div>
                {editingField !== 'sdi_code' && (
                  <button type="button" onClick={() => startEdit('sdi_code', profile.sdi_code)} className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Colonna Destra */}
        <div className="space-y-6">
          {/* Card Profilo Professionale */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profilo Professionale</h2>
            <div className="space-y-0">
              {/* Categoria */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">Categoria</span>
                  {editingField === 'category' ? (
                    <div className="mt-1">
                      <select
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      >
                        <option value="pt">Personal Trainer</option>
                        <option value="nutrizionista">Nutrizionista</option>
                        <option value="fisioterapista">Fisioterapista</option>
                        <option value="mental_coach">Mental Coach</option>
                        <option value="osteopata">Osteopata</option>
                        <option value="altro">Altro</option>
                      </select>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => saveEdit('category')}
                          className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 break-words mt-1">
                      {categoryLabels[profile.category] || profile.category}
                    </p>
                  )}
                </div>
                {editingField !== 'category' && (
                  <button 
                    onClick={() => startEdit('category', profile.category)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                  </button>
                )}
              </div>

              {/* Specializzazioni */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Specializzazioni</span>
                  {editingField !== 'specializzazioni' && (
                    <button
                      onClick={() => {
                        setEditingField('specializzazioni');
                        setSpecializations(profile.specializzazioni || []);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                    </button>
                  )}
                </div>
                {editingField === 'specializzazioni' ? (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#EEBA2B]/20 text-[#B8860B] rounded-full text-sm"
                        >
                          {spec}
                          <button
                            onClick={() => handleRemoveSpecialization(index)}
                            className="hover:text-[#EEBA2B]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Aggiungi specializzazione (premi Enter)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          handleAddSpecialization(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={saveSpecializations}
                        className="px-3 py-1.5 bg-[#EEBA2B] hover:bg-[#D4A826] text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(null);
                          setSpecializations([]);
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.specializzazioni && profile.specializzazioni.length > 0 ? (
                      profile.specializzazioni.map((spec, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#EEBA2B]/20 text-[#B8860B] rounded-full text-sm"
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Nessuna specializzazione</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bio/Descrizione */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500">Bio/Descrizione</span>
                  {editingField !== 'bio' && (
                    <button
                      onClick={() => startEdit('bio', profile.bio)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-400 hover:text-[#EEBA2B] transition-colors" />
                    </button>
                  )}
                </div>
                {editingField === 'bio' ? (
                  <div>
                    <textarea
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={4}
                      maxLength={500}
                      minLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Minimo 50 caratteri (attuali: {editValue.length})
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => saveEdit('bio')}
                        className="px-3 py-1.5 bg-[#EEBA2B] text-white rounded-lg text-sm font-medium hover:bg-[#D4A826] transition-colors"
                      >
                        Salva
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 break-words whitespace-pre-wrap overflow-hidden max-w-full">
                    {profile.bio || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Anteprima */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Anteprima Profilo</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {profile.foto_url ? (
                    <img
                      src={profile.foto_url}
                      alt={profile.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-[#EEBA2B] font-medium">
                    {categoryLabels[profile.category] || profile.category}
                  </p>
                  {profile.zona && (
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {profile.zona}
                    </p>
                  )}
                  {profile.prezzo_seduta && (
                    <p className="text-gray-900 font-semibold mt-2">
                      € {profile.prezzo_seduta}/sessione
                    </p>
                  )}
                </div>
              </div>
              {profile.specializzazioni && profile.specializzazioni.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.specializzazioni.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#EEBA2B]/20 text-[#B8860B] rounded-full text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}
              {profile.bio && (
                <p className="mt-4 text-gray-600 text-sm line-clamp-3 break-words whitespace-pre-wrap overflow-hidden max-w-full">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

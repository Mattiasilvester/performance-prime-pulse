
import { useState, useEffect } from 'react';
import { X, Plus, Upload, FileText, Edit3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useFileAccess } from '@/hooks/useFileAccess';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

interface WorkoutCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onWorkoutCreated?: () => void;
}

const workoutTypes = [
  { id: 'cardio', name: 'Cardio', color: '#38B6FF' },
  { id: 'forza', name: 'Forza', color: '#BC1823' },
  { id: 'hiit', name: 'HIIT', color: '#FF5757' },
  { id: 'mobilita', name: 'Mobilità', color: '#8C52FF' },
  { id: 'personalizzato', name: 'Il tuo allenamento', color: '#c89116' },
];

export const WorkoutCreationModal = ({ isOpen, onClose, selectedDate, onWorkoutCreated }: WorkoutCreationModalProps) => {
  const [selectedType, setSelectedType] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '', reps: '', rest: '' }
  ]);
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creationMethod, setCreationMethod] = useState<'manual' | 'file' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { hasConsent } = useFileAccess();

  // Reset form when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      setSelectedType('');
      setCustomTitle('');
      setExercises([{ name: '', sets: '', reps: '', rest: '' }]);
      setDuration('');
      setCreationMethod(null);
      setUploadedFile(null);
    }
  }, [isOpen, selectedDate]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', rest: '' }]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const updated = exercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    );
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validazione file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      if (file.size > maxSize) {
        alert('File troppo grande. Massimo 10MB consentiti.');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert('Tipo file non supportato. Usa JPEG, PNG o PDF.');
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleManualCreation = () => {
    setCreationMethod('manual');
  };

  const handleFileCreation = () => {
    setCreationMethod('file');
  };

  const handleSave = async () => {
    if ((creationMethod === 'manual' && !selectedType) || (creationMethod === 'file' && !uploadedFile)) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let workoutTitle = '';
      let workoutType = '';
      let exercisesData = [];

      if (creationMethod === 'manual') {
        workoutTitle = selectedType === 'personalizzato' ? customTitle : 
          workoutTypes.find(t => t.id === selectedType)?.name || '';
        workoutType = selectedType;
        exercisesData = exercises.filter(ex => ex.name.trim() !== '');
      } else if (creationMethod === 'file') {
        workoutTitle = uploadedFile?.name.split('.')[0] || 'Allenamento da File';
        workoutType = 'personalizzato';
        exercisesData = []; // Nessun esercizio per file
      }

      const { data, error } = await supabase
        .from('custom_workouts')
        .insert({
          user_id: user.id,
          title: workoutTitle,
          workout_type: workoutType,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          exercises: exercisesData as any,
          total_duration: duration ? parseInt(duration) : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Se c'è un file caricato, salvalo come allegato
      if (creationMethod === 'file' && uploadedFile && data) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `workout-attachments/${data.id}/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('workout-files')
          .upload(filePath, uploadedFile);

        if (!uploadError) {
          // Salva record allegato
          await supabase
            .from('workout_attachments')
            .insert({
              workout_id: data.id,
              user_id: user.id,
              file_name: uploadedFile.name,
              file_path: filePath,
              file_size: uploadedFile.size,
              file_type: uploadedFile.type,
              mime_type: uploadedFile.type,
            });
        }
      }

      onClose();
      if (onWorkoutCreated) {
        onWorkoutCreated();
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNow = async () => {
    if ((creationMethod === 'manual' && !selectedType) || (creationMethod === 'file' && !uploadedFile)) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let workoutTitle = '';
      let workoutType = '';
      let exercisesData = [];

      if (creationMethod === 'manual') {
        workoutTitle = selectedType === 'personalizzato' ? customTitle : 
          workoutTypes.find(t => t.id === selectedType)?.name || '';
        workoutType = selectedType;
        exercisesData = exercises.filter(ex => ex.name.trim() !== '');
      } else if (creationMethod === 'file') {
        workoutTitle = uploadedFile?.name.split('.')[0] || 'Allenamento da File';
        workoutType = 'personalizzato';
        exercisesData = []; // Nessun esercizio per file
      }

      // SEMPRE creare l'allenamento per OGGI quando si clicca "Inizia Allenamento"
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('custom_workouts')
        .insert({
          user_id: user.id,
          title: workoutTitle,
          workout_type: workoutType,
          scheduled_date: todayString, // Sempre oggi per "Inizia Allenamento"
          exercises: exercisesData as any,
          total_duration: duration ? parseInt(duration) : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Se c'è un file caricato, salvalo come allegato
      if (creationMethod === 'file' && uploadedFile && data) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `workout-attachments/${data.id}/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('workout-files')
          .upload(filePath, uploadedFile);

        if (!uploadError) {
          // Salva record allegato
          await supabase
            .from('workout_attachments')
            .insert({
              workout_id: data.id,
              user_id: user.id,
              file_name: uploadedFile.name,
              file_path: filePath,
              file_size: uploadedFile.size,
              file_type: uploadedFile.type,
              mime_type: uploadedFile.type,
            });
        }
      }

      onClose();
      if (onWorkoutCreated) {
        onWorkoutCreated();
      }
      navigate('/workouts', { state: { startCustomWorkout: data.id } });
    } catch (error) {
      console.error('Error creating workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-black border-2 border-[#c89116] rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-pp-gold">Crea Allenamento</h3>
          <button onClick={onClose} className="text-white hover:text-pp-gold">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scelta metodo di creazione */}
        {!creationMethod && (
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-4">
              Come vuoi creare il tuo allenamento?
            </label>
            <div className="space-y-3">
              <Card 
                className="bg-black border-2 border-[#c89116] hover:border-[#c89116]/80 cursor-pointer transition-all"
                onClick={handleManualCreation}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Edit3 className="h-6 w-6 text-[#c89116]" />
                    <div>
                      <h4 className="text-white font-medium">Inserimento Manuale</h4>
                      <p className="text-gray-400 text-sm">Crea il tuo allenamento passo dopo passo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`border-2 transition-all ${
                  hasConsent === false 
                    ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-50' 
                    : 'bg-black border-[#c89116] hover:border-[#c89116]/80 cursor-pointer'
                }`}
                onClick={hasConsent !== false ? handleFileCreation : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Upload className={`h-6 w-6 ${hasConsent === false ? 'text-gray-500' : 'text-[#c89116]'}`} />
                    <div>
                      <h4 className="text-white font-medium">Carica File</h4>
                      <p className="text-gray-400 text-sm">
                        {hasConsent === false 
                          ? 'Consenso accesso file richiesto nelle impostazioni'
                          : 'Carica un\'immagine o PDF del tuo allenamento'
                        }
                      </p>
                      {hasConsent === false && (
                        <div className="flex items-center gap-1 mt-2 text-orange-400 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Vai in Impostazioni → Privacy</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tipo di allenamento - solo se metodo manuale */}
        {creationMethod === 'manual' && (
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              Tipo di allenamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workoutTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedType === type.id
                      ? 'border-[#c89116] bg-[#c89116]/20 text-pp-gold'
                      : 'border-white/20 text-white hover:border-white/40'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Titolo personalizzato - solo se metodo manuale */}
        {creationMethod === 'manual' && selectedType === 'personalizzato' && (
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              Nome del tuo allenamento
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full p-3 bg-black border border-white/20 rounded-lg text-white"
              placeholder="Inserisci il nome..."
            />
          </div>
        )}

        {/* Caricamento file - solo se metodo file */}
        {creationMethod === 'file' && (
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-4">
              Carica il tuo allenamento
            </label>
            <div className="border-2 border-dashed border-[#c89116]/50 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="workout-file-upload"
              />
              <label
                htmlFor="workout-file-upload"
                className="cursor-pointer block"
              >
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-[#c89116] mb-4" />
                  <p className="text-white font-medium mb-2">Clicca per caricare un file</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Supporta JPEG, PNG e PDF (max 10MB)
                  </p>
                  <Button 
                    type="button"
                    className="bg-[#c89116] text-black hover:bg-[#c89116]/80"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('workout-file-upload')?.click();
                    }}
                  >
                    Sfoglia File
                  </Button>
                </div>
              </label>
            </div>
            
            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">{uploadedFile.name}</p>
                    <p className="text-green-400/70 text-sm">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Esercizi - solo se metodo manuale */}
        {creationMethod === 'manual' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-white text-sm font-medium">Esercizi</label>
              <button
                onClick={addExercise}
                className="text-pp-gold hover:text-pp-gold/80 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi
              </button>
            </div>
            
            {exercises.map((exercise, index) => (
              <div key={index} className="mb-3 p-3 border border-white/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">Esercizio {index + 1}</span>
                  {exercises.length > 1 && (
                    <button
                      onClick={() => removeExercise(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  placeholder="Nome esercizio"
                  className="w-full p-2 mb-2 bg-black border border-white/20 rounded text-white text-sm"
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                    placeholder="Serie"
                    className="p-2 bg-black border border-white/20 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    placeholder="Rip."
                    className="p-2 bg-black border border-white/20 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={exercise.rest}
                    onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                    placeholder="Rec."
                    className="p-2 bg-black border border-white/20 rounded text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Durata - solo se metodo manuale */}
        {creationMethod === 'manual' && (
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Durata (minuti)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 bg-black border border-white/20 rounded-lg text-white"
              placeholder="Es. 45"
            />
          </div>
        )}

        {/* Bottoni */}
        <div className="flex space-x-3">
          {creationMethod === 'manual' ? (
            <>
              <Button
                onClick={handleSave}
                disabled={!selectedType || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-black font-medium"
              >
                Salva
              </Button>
              <Button
                onClick={handleStartNow}
                disabled={!selectedType || isLoading}
                className="flex-1 bg-[#c89116] hover:bg-[#c89116]/80 text-black font-medium"
              >
                Inizia Allenamento
              </Button>
            </>
          ) : creationMethod === 'file' ? (
            <>
              <Button
                onClick={handleSave}
                disabled={!uploadedFile || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-black font-medium"
              >
                Salva con File
              </Button>
              <Button
                onClick={handleStartNow}
                disabled={!uploadedFile || isLoading}
                className="flex-1 bg-[#c89116] hover:bg-[#c89116]/80 text-black font-medium"
              >
                Inizia con File
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

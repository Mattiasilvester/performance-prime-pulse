import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  // Reset form when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      setSelectedType('');
      setCustomTitle('');
      setExercises([{ name: '', sets: '', reps: '', rest: '' }]);
      setDuration('');
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

  const handleSave = async () => {
    if (!selectedType) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workoutTitle = selectedType === 'personalizzato' ? customTitle : 
        workoutTypes.find(t => t.id === selectedType)?.name || '';

      const { data, error } = await supabase
        .from('custom_workouts')
        .insert({
          user_id: user.id,
          title: workoutTitle,
          workout_type: selectedType,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          exercises: exercises.filter(ex => ex.name.trim() !== '') as any,
          total_duration: duration ? parseInt(duration) : null,
        })
        .select()
        .single();

      if (error) throw error;

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
    if (!selectedType) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workoutTitle = selectedType === 'personalizzato' ? customTitle : 
        workoutTypes.find(t => t.id === selectedType)?.name || '';

      const { data, error } = await supabase
        .from('custom_workouts')
        .insert({
          user_id: user.id,
          title: workoutTitle,
          workout_type: selectedType,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          exercises: exercises.filter(ex => ex.name.trim() !== '') as any,
          total_duration: duration ? parseInt(duration) : null,
        })
        .select()
        .single();

      if (error) throw error;

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

        {/* Tipo di allenamento */}
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

        {/* Titolo personalizzato */}
        {selectedType === 'personalizzato' && (
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

        {/* Esercizi */}
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

        {/* Durata */}
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

        {/* Bottoni */}
        <div className="flex space-x-3">
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
        </div>
      </div>
    </div>
  );
};

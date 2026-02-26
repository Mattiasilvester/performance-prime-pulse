// ===== WORKOUT RESULTS - GESTIONE MULTI-GIORNO =====

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  Repeat, 
  Timer, 
  Coffee, 
  FileText,
  AlertCircle,
  Info
} from 'lucide-react';
import { ParsedWorkoutResult, WorkoutExercise } from '@/services/WorkoutParser';

interface WorkoutResultsProps {
  parsedWorkout: ParsedWorkoutResult;
  onDaySelect?: (dayIndex: number) => void;
}

const WorkoutResults: React.FC<WorkoutResultsProps> = ({ 
  parsedWorkout,
  onDaySelect
}) => {
  const [selectedDay, setSelectedDay] = useState(parsedWorkout.giorno);

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    onDaySelect?.(dayIndex);
  };

  const renderExercise = (exercise: WorkoutExercise, index: number) => (
    <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#c89116] font-medium">{index + 1}.</span>
          <span className="text-white font-medium">{exercise.nome}</span>
          {exercise.origine === 'suggerito' && (
            <Badge variant="secondary" className="text-xs">
              Suggerito
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          {exercise.ripetizioni && (
            <div className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              <span>{exercise.ripetizioni}</span>
            </div>
          )}
          
          {exercise.tempo && (
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>{exercise.tempo}</span>
            </div>
          )}
          
          {exercise.riposo && (
            <div className="flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              <span>Riposo: {exercise.riposo}</span>
            </div>
          )}
          
          {exercise.note && (
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>{exercise.note}</span>
            </div>
          )}
        </div>
      </div>
      
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    </div>
  );

  const renderSection = (title: string, exercises: WorkoutExercise[], icon: React.ReactNode) => (
    <Card className="bg-black border border-[#c89116]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#c89116]">
          {icon}
          {title} ({exercises.length} esercizi)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exercises.length > 0 ? (
          <div className="space-y-3">
            {exercises.map((exercise, index) => renderExercise(exercise, index))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">Nessun esercizio in questa sezione</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header con informazioni */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Allenamento Analizzato - Giorno {selectedDay}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Selezione giorno se multipli */}
      {parsedWorkout.giorno > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Sono stati rilevati più giorni di allenamento. Quale vuoi visualizzare?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: parsedWorkout.giorno }, (_, i) => i + 1).map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  onClick={() => handleDaySelect(day)}
                  className={selectedDay === day ? "bg-[#c89116] text-white" : ""}
                >
                  Giorno {day}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Riscaldamento */}
      {renderSection(
        'Riscaldamento',
        parsedWorkout.riscaldamento,
        <Clock className="w-5 h-5 text-orange-400" />
      )}

      <Separator className="bg-[#c89116]/30" />

      {/* Esercizi Principali */}
      {renderSection(
        'Esercizi Principali',
        parsedWorkout.esercizi,
        <FileText className="w-5 h-5 text-[#c89116]" />
      )}

      <Separator className="bg-[#c89116]/30" />

      {/* Stretching */}
      {renderSection(
        'Stretching',
        parsedWorkout.stretching,
        <Coffee className="w-5 h-5 text-green-400" />
      )}

      {/* Informazioni aggiuntive */}
      <Card className="bg-black border border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>
              {parsedWorkout.riscaldamento.filter(e => e.origine === 'suggerito').length + 
               parsedWorkout.stretching.filter(e => e.origine === 'suggerito').length} 
              esercizi suggeriti automaticamente
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutResults;

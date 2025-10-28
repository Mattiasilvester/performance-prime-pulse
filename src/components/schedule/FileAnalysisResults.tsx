import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dumbbell, 
  Clock, 
  Repeat, 
  Coffee, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  RefreshCcw
} from 'lucide-react';
import { FileAnalysisResult, ExtractedExercise, WorkoutSection } from '../../services/fileAnalysis';
import { DebugPanel } from './DebugPanel';

interface FileAnalysisResultsProps {
  result: FileAnalysisResult;
  onClose?: () => void;
}

export const FileAnalysisResults: React.FC<FileAnalysisResultsProps> = ({ 
  result, 
  onClose 
}) => {
  console.log('🔴 [DEBUG] FileAnalysisResults - result ricevuto:', result);
  console.log('🔴 [DEBUG] FileAnalysisResults - exercises:', result?.exercises);
  console.log('🔴 [DEBUG] FileAnalysisResults - sections:', result?.sections);
  
  if (result?.exercises?.length > 0) {
    console.log('🔴 [DEBUG] Struttura primo esercizio:', result.exercises[0]);
    console.log('🔴 [DEBUG] Campi esercizio:', Object.keys(result.exercises[0]));
  }
  const getSectionIcon = (sectionName: string) => {
    switch (sectionName.toLowerCase()) {
      case 'riscaldamento':
        return <Clock className="h-4 w-4" />;
      case 'esercizi principali':
        return <Dumbbell className="h-4 w-4" />;
      case 'stretching':
        return <Coffee className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSectionColor = (sectionName: string) => {
    switch (sectionName.toLowerCase()) {
      case 'riscaldamento':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'esercizi principali':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'stretching':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      default:
        return 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30';
    }
  };


  const renderExercise = (exercise: ExtractedExercise, index: number) => (
    <div key={index} className="p-3 bg-[#2D3748] rounded-lg border border-[#FFD700]/20">
      <div className="font-medium text-white mb-1">{exercise.name}</div>
      <div className="text-sm text-[#9CA3AF] flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Repeat className="h-3 w-3" />
          {exercise.sets} x {exercise.reps}
        </span>
        {exercise.rest && (
          <span className="text-sm text-[#9CA3AF] flex items-center gap-1">
            <RefreshCcw className="h-3 w-3" />
            Riposo: {exercise.rest.replace(/[🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄]\s*1\s*x\s*/g, '').replace(/^\s*/, '').trim().replace(/^[🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄]+\s*/, '')} tra le serie
          </span>
        )}
      </div>
    </div>
  );

  const renderSection = (section: WorkoutSection) => (
    <div key={section.name} className="mb-4 bg-[#374151] rounded-lg border border-[#FFD700]/30">
      <div className="p-4 border-b border-[#FFD700]/20">
        <div className="flex items-center gap-2">
          {getSectionIcon(section.name)}
          <span className="text-white font-medium text-lg">{section.name}</span>
          <Badge className={`${getSectionColor(section.name)} border border-[#FFD700]/30`}>
            {section.exercises.length} esercizi
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {section.exercises.map((exercise, index) => renderExercise(exercise, index))}
        </div>
      </div>
    </div>
  );


  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Header semplificato */}
      <div className="mb-6 p-4 bg-[#374151] rounded-lg border border-[#FFD700]/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {result.workoutTitle || 'Allenamento'}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#FFD700]" />
            <span className="text-sm text-[#9CA3AF]">
              Durata: {result.duration}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-[#FFD700]" />
            <span className="text-sm text-[#9CA3AF]">
              {result.exercises.length} esercizi
            </span>
          </div>
        </div>
      </div>


      {/* Lista esercizi per sezioni */}
      {result.sections.length > 0 ? (
        <div className="space-y-4">
          {result.sections.map(renderSection)}
        </div>
      ) : (
        <div className="text-center py-8 bg-[#374151] rounded-lg border border-[#FFD700]/30">
          <FileText className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
          <p className="text-[#9CA3AF]">Nessun esercizio trovato nel file</p>
        </div>
      )}

    </div>
  );
};

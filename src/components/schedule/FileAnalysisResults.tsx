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
  Calendar
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
        return 'bg-blue-100 text-blue-800';
      case 'esercizi principali':
        return 'bg-green-100 text-green-800';
      case 'stretching':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderExercise = (exercise: ExtractedExercise, index: number) => (
    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{exercise.name}</div>
        <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            {exercise.sets} x {exercise.reps}
          </span>
          {exercise.rest && (
            <span className="flex items-center gap-1">
              <Coffee className="h-3 w-3" />
              {exercise.rest}
            </span>
          )}
        </div>
        {exercise.notes && (
          <div className="text-xs text-gray-500 mt-1 italic">
            {exercise.notes}
          </div>
        )}
      </div>
      <Badge className={getConfidenceColor(exercise.confidence)}>
        {exercise.confidence}%
      </Badge>
    </div>
  );

  const renderSection = (section: WorkoutSection) => (
    <Card key={section.name} className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getSectionIcon(section.name)}
          <span>{section.name}</span>
          <Badge className={getSectionColor(section.name)}>
            {section.exercises.length} esercizi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {section.exercises.map((exercise, index) => renderExercise(exercise, index))}
      </CardContent>
    </Card>
  );

  // Controlla se ci sono warnings critici
  const hasCriticalWarnings = result.metadata.warnings.some(warning => 
    warning.includes('PDF non contiene testo') || 
    warning.includes('Regex non hanno trovato match')
  );

  return (
    <div className="space-y-4">
      {/* Header con informazioni principali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {result.workoutTitle}
            </div>
            <Badge className={getConfidenceColor(result.metadata.confidence)}>
              {result.metadata.confidence}% accuratezza
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Durata stimata: {result.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-gray-500" />
              <span>{result.exercises.length} esercizi totali</span>
            </div>
          </div>
          
          {/* Multi-giorno info */}
          {result.multiDay && result.daysFound && result.daysFound.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Multi-Giorno Rilevato</span>
              </div>
              <div className="text-sm text-blue-700">
                <p>Giorni trovati nel file:</p>
                <ul className="list-disc list-inside mt-1">
                  {result.daysFound.map((day, index) => (
                    <li key={index}>{day}</li>
                  ))}
                </ul>
                <p className="mt-2 text-blue-600">
                  <strong>Nota:</strong> Viene mostrato solo il primo giorno. Per visualizzare altri giorni, 
                  carica il file specifico per quel giorno.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warnings critici */}
      {hasCriticalWarnings && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              {result.metadata.warnings
                .filter(warning => 
                  warning.includes('PDF non contiene testo') || 
                  warning.includes('Regex non hanno trovato match')
                )
                .map((warning, index) => (
                  <div key={index} className="text-sm">• {warning}</div>
                ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings non critici */}
      {result.metadata.warnings.length > 0 && !hasCriticalWarnings && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              {result.metadata.warnings.map((warning, index) => (
                <div key={index} className="text-sm">• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sezioni esercizi */}
      {result.sections.length > 0 ? (
        <div className="space-y-4">
          {result.sections.map(renderSection)}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun esercizio trovato nel file</p>
          </CardContent>
        </Card>
      )}

      {/* Debug Panel (solo se DEBUG_ANALYSIS è attivo) */}
      {result.metadata.debug && (
        <DebugPanel
          debugInfo={result.metadata.debug}
          warnings={result.metadata.warnings}
          confidence={result.metadata.confidence}
          extractionSource={result.metadata.source}
        />
      )}
    </div>
  );
};

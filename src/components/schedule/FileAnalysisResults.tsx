import { useState } from 'react';
import { X, Check, AlertTriangle, Edit3, FileText, Flame, Dumbbell, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileAnalysisResult, ExtractedExercise, WorkoutSection } from '@/services/fileAnalysis';

interface FileAnalysisResultsProps {
  result: FileAnalysisResult;
  onAccept: (exercises: ExtractedExercise[], title?: string, duration?: string) => void;
  onReject: () => void;
  onEdit: () => void;
}

export const FileAnalysisResults = ({ result, onAccept, onReject, onEdit }: FileAnalysisResultsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = () => {
    setIsLoading(true);
    // Combina tutti gli esercizi da tutte le sezioni
    const allExercises = result.sections.flatMap(section => section.exercises);
    onAccept(allExercises, result.workoutTitle, result.duration);
    setIsLoading(false);
  };

  const confidenceColor = result.confidence > 0.7 ? 'text-green-400' : 
                         result.confidence > 0.5 ? 'text-yellow-400' : 'text-red-400';

  const confidenceText = result.confidence > 0.7 ? 'Alta' :
                        result.confidence > 0.5 ? 'Media' : 'Bassa';

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'warmup':
        return <Flame className="h-4 w-4 text-orange-400" />;
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-[#c89116]" />;
      case 'cooldown':
        return <Heart className="h-4 w-4 text-green-400" />;
      default:
        return <Dumbbell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'warmup':
        return 'border-orange-500/30 bg-orange-950/20';
      case 'workout':
        return 'border-[#c89116]/30 bg-[#c89116]/10';
      case 'cooldown':
        return 'border-green-500/30 bg-green-950/20';
      default:
        return 'border-gray-500/30 bg-gray-950/20';
    }
  };

  const totalExercises = result.sections.reduce((sum, section) => sum + section.exercises.length, 0);

  return (
    <div className="space-y-4">
      {/* Header con informazioni */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#c89116]" />
          <h3 className="text-white font-medium">Risultati Analisi</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Confidenza:</span>
          <span className={`text-sm font-medium ${confidenceColor}`}>
            {confidenceText} ({Math.round(result.confidence * 100)}%)
          </span>
        </div>
      </div>

      {/* Informazioni workout */}
      {(result.workoutTitle || result.duration) && (
        <Card className="bg-black border border-[#c89116]/30">
          <CardContent className="p-4">
            <div className="space-y-2">
              {result.workoutTitle && (
                <div>
                  <span className="text-gray-400 text-sm">Titolo: </span>
                  <span className="text-white font-medium">{result.workoutTitle}</span>
                </div>
              )}
              {result.duration && (
                <div>
                  <span className="text-gray-400 text-sm">Durata: </span>
                  <span className="text-white font-medium">{result.duration} minuti</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezioni trovate */}
      <Card className="bg-black border border-[#c89116]/30">
        <CardHeader>
          <CardTitle className="text-[#c89116] text-lg">
            Sezioni Riconosciute ({result.sections.length}) - {totalExercises} Esercizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.sections.length > 0 ? (
            <div className="space-y-4">
              {result.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className={`border rounded-lg p-4 ${getSectionColor(section.type)}`}>
                  {/* Header sezione */}
                  <div className="flex items-center gap-2 mb-3">
                    {getSectionIcon(section.type)}
                    <h4 className="text-white font-medium">{section.title}</h4>
                    <span className="text-gray-400 text-sm">({section.exercises.length} esercizi)</span>
                    {section.time && (
                      <span className="text-orange-400 text-sm">• {section.time}</span>
                    )}
                  </div>
                  
                  {/* Lista esercizi della sezione */}
                  {section.exercises.length > 0 ? (
                    <div className="space-y-2">
                      {section.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#c89116] font-medium">{exerciseIndex + 1}.</span>
                              <span className="text-white font-medium">{exercise.name}</span>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-400">
                              {exercise.sets && (
                                <span>Serie: {exercise.sets}</span>
                              )}
                              {exercise.reps && (
                                <span>Ripetizioni: {exercise.reps}</span>
                              )}
                              {exercise.repeats && (
                                <span>Ripetute: {exercise.repeats}</span>
                              )}
                              {exercise.time && (
                                <span>Tempo: {exercise.time}</span>
                              )}
                              {exercise.rest && (
                                <span>Riposo: {exercise.rest}</span>
                              )}
                              {exercise.notes && (
                                <span>Note: {exercise.notes}</span>
                              )}
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-green-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-gray-400 text-sm">Nessun esercizio riconosciuto in questa sezione</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-400">Nessuna sezione riconosciuta</p>
              <p className="text-gray-500 text-sm">Il file potrebbe non contenere sezioni o il formato non è riconosciuto</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testo estratto (debug) */}
      {result.confidence < 0.7 && (
        <Card className="bg-black border border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Testo Estratto (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 p-3 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
              {result.rawText}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Azioni */}
      <div className="flex gap-3">
        <Button
          onClick={handleAccept}
          disabled={isLoading || totalExercises === 0}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? 'Caricamento...' : 'Accetta Esercizi'}
        </Button>
        
        <Button
          onClick={onEdit}
          disabled={isLoading}
          variant="outline"
          className="border-[#c89116] text-[#c89116] hover:bg-[#c89116]/10"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Modifica
        </Button>
        
        <Button
          onClick={onReject}
          disabled={isLoading}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <X className="h-4 w-4 mr-2" />
          Rifiuta
        </Button>
      </div>
    </div>
  );
};

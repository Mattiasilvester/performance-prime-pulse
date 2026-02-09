import React, { useState } from 'react';
import { parseWorkoutFile, ParsedWorkoutResult } from '../services/WorkoutParser';
import ManualWorkoutInput from './ManualWorkoutInput';
import WorkoutResults from './WorkoutResults';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, FileText, PenTool, FileImage } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import './WorkoutUploader.css';

interface WorkoutUploaderProps {
  onWorkoutLoaded?: (workout: ParsedWorkoutResult) => void;
}

const WorkoutUploader: React.FC<WorkoutUploaderProps> = ({ onWorkoutLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkoutResult | null>(null);
  
  // Stati per il flusso UI
  const [showOptions, setShowOptions] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Error handling
  const { handleError } = useErrorHandler({
    context: { component: 'WorkoutUploader' }
  });
  
  // Handler per upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validazione file
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('File troppo grande. Dimensione massima: 10MB');
      return;
    }
    
    const allowedTypes = ['text/plain', 'application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo di file non supportato. Usa file di testo, PDF o immagini.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setParsedWorkout(null);
    
    try {
      // Usa il nuovo parser
      const result = await parseWorkoutFile(file);
      setParsedWorkout(result);
      
      // Callback per notificare il componente padre
      if (onWorkoutLoaded) {
        onWorkoutLoaded(result);
      }
      
    } catch (err: unknown) {
      const errorInfo = handleError(err, { action: 'parseWorkoutFile' });
      setError(errorInfo.userMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler per mostrare opzioni
  const handleShowOptions = () => {
    setShowOptions(true);
    setShowManualInput(false);
    setShowFileUpload(false);
  };

  // Handler per input manuale
  const handleManualInput = async (testo: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // DEBUG: "✅ Testo inserito manualmente:", testo);
      // TODO: Implementare parsing del testo
      
    } catch (err: unknown) {
      console.error('❌ Errore:', err);
      setError(`Errore: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset
  const reset = () => {
    setError(null);
    setParsedWorkout(null);
    setShowOptions(false);
    setShowManualInput(false);
    setShowFileUpload(false);
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Handler per opzioni
  const handleOptionSelect = (option: 'manual' | 'import') => {
    if (option === 'manual') {
      setShowManualInput(true);
      setShowFileUpload(false);
      setShowOptions(false);
    } else {
      setShowFileUpload(true);
      setShowManualInput(false);
      setShowOptions(false);
    }
  };
  
  return (
    <div className="workout-uploader">
      {/* Schermata principale - Pulsante + Nuovo */}
      {!showOptions && !showManualInput && !showFileUpload && !parsedWorkout && (
        <div className="main-screen">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">📋 Nuovo Allenamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <ErrorFallback
                  type="unknown"
                  message={error}
                  onRetry={() => setError(null)}
                  className="mb-4"
                />
              ) : (
                <Button 
                  onClick={handleShowOptions}
                  className="w-full h-16 text-lg"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  + Nuovo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schermata opzioni */}
      {showOptions && (
        <div className="options-screen">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Scegli il metodo di inserimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleOptionSelect('manual')}
                variant="outline"
                className="w-full h-16 text-lg justify-start"
                size="lg"
              >
                <PenTool className="mr-3 h-5 w-5" />
                Inserisci a mano
              </Button>
              
              <Button 
                onClick={() => handleOptionSelect('import')}
                variant="outline"
                className="w-full h-16 text-lg justify-start"
                size="lg"
              >
                <FileImage className="mr-3 h-5 w-5" />
                Importa da PDF/Foto
              </Button>
              
              <Button 
                onClick={reset}
                variant="ghost"
                className="w-full"
              >
                ← Indietro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schermata input manuale */}
      {showManualInput && (
        <div className="manual-input-screen">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">📝 Inserisci manualmente</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualWorkoutInput onSave={handleManualInput} />
              <Button 
                onClick={reset}
                variant="ghost"
                className="w-full mt-4"
              >
                ← Indietro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schermata import file */}
      {showFileUpload && (
        <div className="file-upload-screen">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">📄 Importa da PDF/Foto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                id="file-input"
                type="file"
                accept=".pdf,.txt,image/*"
                onChange={handleFileUpload}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              
              <label htmlFor="file-input" className={`upload-area ${isLoading ? 'loading' : ''}`}>
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    <p>Analisi in corso...</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">📄</div>
                    <p>Clicca per caricare un file</p>
                    <small>PDF, TXT, Immagini • Max 50MB</small>
                  </>
                )}
              </label>
              
              <Button 
                onClick={reset}
                variant="ghost"
                className="w-full"
              >
                ← Indietro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risultati parsing */}
      {parsedWorkout && (
        <div className="results-section">
          <div className="results-header">
            <h2>✅ Scheda analizzata con successo!</h2>
            <Button onClick={reset} variant="outline">🔄 Nuova analisi</Button>
          </div>
          
          <WorkoutResults parsedWorkout={parsedWorkout} />
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <h3>❌ Errore durante l'analisi</h3>
          <p>{error}</p>
          <Button onClick={reset} variant="outline">🔄 Riprova</Button>
        </div>
      )}
    </div>
  );
};

export default WorkoutUploader;

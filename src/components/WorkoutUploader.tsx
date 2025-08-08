import React, { useState } from 'react';
import SchedaParser, { ParsedScheda } from '../services/SchedaParser';
import ManualWorkoutInput from './ManualWorkoutInput';
import SchedaView from './SchedaView';
import './WorkoutUploader.css';

interface WorkoutUploaderProps {
  onWorkoutLoaded?: (workout: any) => void;
}

const WorkoutUploader: React.FC<WorkoutUploaderProps> = ({ onWorkoutLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedScheda, setParsedScheda] = useState<ParsedScheda | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<any>(null);
  
  // Handler per upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setParsedScheda(null);
    setProcessingInfo(null);
    
    try {
      console.log('📤 Caricamento file:', file.name);
      
      // STEP 1: Parsa scheda con SchedaParser (include SafeTextExtractor)
      const schedaParsed = await SchedaParser.parseScheda(file);
      
      console.log("✅ Scheda parsata:", schedaParsed);
      
      // STEP 2: Prepara informazioni di processamento
      setProcessingInfo({
        fonte: schedaParsed.metadata.fonte,
        confidenzaMedia: schedaParsed.metadata.confidenzaMedia,
        warning: schedaParsed.metadata.warning,
        sezioniRilevate: schedaParsed.metadata.sezioniRilevate,
        totaleEsercizi: schedaParsed.esercizi.length,
        totaleRiscaldamento: schedaParsed.riscaldamento.length,
        totaleStretching: schedaParsed.stretching.length
      });
      
      // STEP 3: Converti in formato compatibile con SchedaView
      const schedaCompatibile = convertToSchedaViewFormat(schedaParsed);
      
      setParsedScheda(schedaParsed);
      onWorkoutLoaded?.(schedaCompatibile);
      
    } catch (err: any) {
      console.error('❌ Errore:', err);
      setError(`Errore: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler per input manuale
  const handleManualInput = async (testo: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setParsedScheda(null);
      setProcessingInfo(null);
      
      // Crea un file temporaneo dal testo
      const file = new File([testo], 'manual-input.txt', { type: 'text/plain' });
      
      // Usa il SchedaParser per processare il testo
      const schedaParsed = await SchedaParser.parseScheda(file);
      
      // Prepara informazioni di processamento
      setProcessingInfo({
        fonte: schedaParsed.metadata.fonte,
        confidenzaMedia: schedaParsed.metadata.confidenzaMedia,
        warning: schedaParsed.metadata.warning,
        sezioniRilevate: schedaParsed.metadata.sezioniRilevate,
        totaleEsercizi: schedaParsed.esercizi.length,
        totaleRiscaldamento: schedaParsed.riscaldamento.length,
        totaleStretching: schedaParsed.stretching.length
      });
      
      // Converti in formato compatibile
      const schedaCompatibile = convertToSchedaViewFormat(schedaParsed);
      
      setParsedScheda(schedaParsed);
      onWorkoutLoaded?.(schedaCompatibile);
      
    } catch (err: any) {
      console.error('❌ Errore input manuale:', err);
      setError(`Errore: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler per modifica esercizio
  const handleEditEsercizio = (esercizio: any, index: number, section: string) => {
    console.log('Modifica esercizio:', { esercizio, index, section });
    // TODO: Implementare modal di modifica
  };
  
  // Handler per eliminazione esercizio
  const handleDeleteEsercizio = (index: number, section: string) => {
    console.log('Elimina esercizio:', { index, section });
    // TODO: Implementare conferma e eliminazione
  };
  
  // Reset
  const reset = () => {
    setParsedScheda(null);
    setError(null);
    setProcessingInfo(null);
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) input.value = '';
  };
  
  // Converti formato ParsedScheda in formato SchedaView
  const convertToSchedaViewFormat = (parsedScheda: ParsedScheda) => {
    return {
      riscaldamento: {
        presente: parsedScheda.riscaldamento.length > 0,
        esercizi: parsedScheda.riscaldamento.map(e => ({
          name: e.nome,
          series: e.serie || 1,
          reps: e.ripetizioni_durata,
          rest: e.riposo || '60s',
          notes: e.note,
          confidence: e.confidence
        })),
        generato: parsedScheda.riscaldamento.some(e => e.note?.includes('automaticamente'))
      },
      schedaGiornaliera: {
        esercizi: parsedScheda.esercizi.map(e => ({
          name: e.nome,
          series: e.serie || 1,
          reps: e.ripetizioni_durata,
          rest: e.riposo || '90s',
          notes: e.note,
          confidence: e.confidence
        }))
      },
      stretching: {
        presente: parsedScheda.stretching.length > 0,
        esercizi: parsedScheda.stretching.map(e => ({
          name: e.nome,
          series: e.serie || 1,
          reps: e.ripetizioni_durata,
          rest: e.riposo || '30s',
          notes: e.note,
          confidence: e.confidence
        })),
        generato: parsedScheda.stretching.some(e => e.note?.includes('automaticamente'))
      },
      metadata: {
        fonte: parsedScheda.metadata.fonte,
        tipoAllenamento: parsedScheda.giorno,
        durataStimata: `${parsedScheda.esercizi.length * 5} min`,
        difficolta: parsedScheda.metadata.confidenzaMedia > 0.8 ? 'Avanzato' : 'Intermedio'
      }
    };
  };
  
  return (
    <div className="workout-uploader">
      {!parsedScheda ? (
        <>
          <h2>📋 Carica la tua scheda di allenamento</h2>
          
          {/* Upload file */}
          <div className="upload-section">
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
            
            {error && (
              <div className="error-box">
                <p>⚠️ {error}</p>
              </div>
            )}
          </div>
          
          {/* Divisore */}
          <div className="divider">
            <span>OPPURE</span>
          </div>
          
          {/* Input manuale */}
          <ManualWorkoutInput onSave={handleManualInput} />
        </>
      ) : (
        /* RISULTATO - SCHEDA STRUTTURATA */
        <div className="result-section">
          <div className="result-header">
            <h3>✅ Scheda caricata con successo!</h3>
            <div className="result-actions">
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                className="debug-button"
              >
                {showDebug ? '🔒 Nascondi Debug' : '🔍 Mostra Debug'}
              </button>
              <button onClick={reset} className="reset-button">
                🔄 Carica un'altra scheda
              </button>
            </div>
          </div>
          
          {showDebug && processingInfo && (
            <div className="debug-section">
              <h4>🔍 Debug Informazioni</h4>
              
              <details>
                <summary>Informazioni di processamento</summary>
                <div className="processing-info">
                  <p><strong>Fonte:</strong> {processingInfo.fonte}</p>
                  <p><strong>Confidenza media:</strong> {(processingInfo.confidenzaMedia * 100).toFixed(1)}%</p>
                  <p><strong>Giorno:</strong> {parsedScheda.giorno}</p>
                  <p><strong>Sezioni rilevate:</strong></p>
                  <ul>
                    {processingInfo.sezioniRilevate.map((sezione: string, i: number) => (
                      <li key={i}>{sezione}</li>
                    ))}
                  </ul>
                  <p><strong>Statistiche:</strong></p>
                  <ul>
                    <li>Esercizi: {processingInfo.totaleEsercizi}</li>
                    <li>Riscaldamento: {processingInfo.totaleRiscaldamento}</li>
                    <li>Stretching: {processingInfo.totaleStretching}</li>
                  </ul>
                  {processingInfo.warning.length > 0 && (
                    <>
                      <p><strong>Warning:</strong></p>
                      <ul>
                        {processingInfo.warning.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </details>
              
              <details>
                <summary>Struttura JSON completa</summary>
                <pre className="debug-text">
                  {JSON.stringify(parsedScheda, null, 2)}
                </pre>
              </details>
            </div>
          )}
          
          <SchedaView 
            scheda={convertToSchedaViewFormat(parsedScheda)}
            onEdit={handleEditEsercizio}
            onDelete={handleDeleteEsercizio}
          />
        </div>
      )}
    </div>
  );
};

export default WorkoutUploader;

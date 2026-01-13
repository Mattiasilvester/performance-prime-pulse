import React, { useState, useEffect } from 'react';
import { Play, X, Target, FileText, AlertTriangle, Lightbulb, Wind, Clock, RefreshCw, BookOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exerciseDescriptions } from '@/data/exerciseDescriptions';
import { getExerciseGifUrlAsync } from '@/data/exerciseGifs';
import { getExerciseDetails, ExerciseDetail } from '@/data/exerciseDetails';

interface ExerciseGifLinkProps {
  exerciseName: string;
  className?: string;
  buttonClassName?: string;
}

// Componente Badge per muscoli
const MuscleBadge = ({ name, isPrimary }: { name: string; isPrimary: boolean }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isPrimary
        ? 'bg-[#EEBA2B]/20 text-[#EEBA2B] border border-[#EEBA2B]/30'
        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
    }`}
  >
    {name}
  </span>
);

// Componente Titolo Sezione
const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon}
    <h3 className="text-[#EEBA2B] font-semibold text-lg">{title}</h3>
  </div>
);

// Sezione Muscoli Coinvolti
const MusclesSection = ({ muscles }: { muscles: ExerciseDetail['muscles'] }) => (
  <div className="space-y-4">
    <SectionTitle icon={<Target className="h-5 w-5 text-[#EEBA2B]" />} title="Muscoli Coinvolti" />
    
    {muscles.primary.length > 0 && (
      <div>
        <p className="text-zinc-400 text-sm mb-2 font-medium">Primari</p>
        <div className="flex flex-wrap gap-2">
          {muscles.primary.map((muscle, index) => (
            <MuscleBadge key={index} name={muscle} isPrimary={true} />
          ))}
        </div>
      </div>
    )}
    
    {muscles.secondary.length > 0 && (
      <div>
        <p className="text-zinc-400 text-sm mb-2 font-medium">Secondari</p>
        <div className="flex flex-wrap gap-2">
          {muscles.secondary.map((muscle, index) => (
            <MuscleBadge key={index} name={muscle} isPrimary={false} />
          ))}
        </div>
      </div>
    )}
  </div>
);

// Sezione Esecuzione
const ExecutionSection = ({ execution }: { execution: ExerciseDetail['execution'] }) => (
  <div className="space-y-4">
    <SectionTitle icon={<FileText className="h-5 w-5 text-[#EEBA2B]" />} title="Come Eseguirlo" />
    
    <div>
      <p className="text-zinc-300 font-medium mb-2">Posizione iniziale</p>
      <p className="text-zinc-400 text-sm leading-relaxed">{execution.setup}</p>
    </div>
    
    {execution.steps.length > 0 && (
      <div>
        <p className="text-zinc-300 font-medium mb-2">Esecuzione</p>
        <ol className="space-y-2">
          {execution.steps.map((step, index) => (
            <li key={index} className="text-zinc-400 text-sm leading-relaxed flex gap-2">
              <span className="text-[#EEBA2B] font-semibold flex-shrink-0">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    )}
    
    <div className="flex items-start gap-2 bg-zinc-900/50 rounded-lg p-3">
      <Wind className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-zinc-300 font-medium text-sm mb-1">Respirazione</p>
        <p className="text-zinc-400 text-sm">{execution.breathing}</p>
      </div>
    </div>
    
    {execution.tempo && (
      <div className="flex items-start gap-2 bg-zinc-900/50 rounded-lg p-3">
        <Clock className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-zinc-300 font-medium text-sm mb-1">Tempo</p>
          <p className="text-zinc-400 text-sm">{execution.tempo}</p>
        </div>
      </div>
    )}
  </div>
);

// Sezione Errori Comuni
const MistakesSection = ({ mistakes }: { mistakes: string[] }) => (
  <div className="space-y-3">
    <SectionTitle icon={<AlertTriangle className="h-5 w-5 text-[#EEBA2B]" />} title="Errori Comuni" />
    <ul className="space-y-2">
      {mistakes.map((mistake, index) => (
        <li key={index} className="text-zinc-400 text-sm leading-relaxed flex gap-2">
          <span className="text-[#EEBA2B] flex-shrink-0">•</span>
          <span>{mistake}</span>
        </li>
      ))}
    </ul>
  </div>
);

// Sezione Suggerimenti e Varianti
const TipsSection = ({ tips, variations }: { tips: string[]; variations?: ExerciseDetail['variations'] }) => (
  <div className="space-y-4">
    <SectionTitle icon={<Lightbulb className="h-5 w-5 text-[#EEBA2B]" />} title="Suggerimenti" />
    
    <ul className="space-y-2">
      {tips.map((tip, index) => (
        <li key={index} className="text-zinc-400 text-sm leading-relaxed flex gap-2">
          <span className="text-[#EEBA2B] flex-shrink-0">•</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
    
    {variations && (variations.easier || variations.harder) && (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="h-4 w-4 text-[#EEBA2B]" />
          <p className="text-zinc-300 font-medium text-sm">Varianti</p>
        </div>
        {variations.easier && (
          <p className="text-zinc-400 text-sm">
            <span className="text-green-400 font-medium">Più facile:</span> {variations.easier}
          </p>
        )}
        {variations.harder && (
          <p className="text-zinc-400 text-sm">
            <span className="text-red-400 font-medium">Più difficile:</span> {variations.harder}
          </p>
        )}
      </div>
    )}
  </div>
);

// Helper per badge difficoltà
const getDifficultyBadge = (difficulty: string) => {
  const colors = {
    'Principiante': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Intermedio': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Avanzato': 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  
  const color = colors[difficulty as keyof typeof colors] || colors['Intermedio'];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
      {difficulty}
    </span>
  );
};

export const ExerciseGifLink: React.FC<ExerciseGifLinkProps> = ({ 
  exerciseName, 
  className = "",
  buttonClassName = ""
}) => {
  const [showGif, setShowGif] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [gifUrl, setGifUrl] = useState<string>('https://example.com/gifs/default-exercise.gif');
  const [isLoadingGif, setIsLoadingGif] = useState(false);

  // Ottiene i dettagli completi dell'esercizio
  const details = getExerciseDetails(exerciseName);
  const hasDetails = details !== null;

  // Fallback: descrizione semplice se non ci sono dettagli
  const getExerciseDescription = (exerciseName: string): string => {
    return exerciseDescriptions[exerciseName] || 'Descrizione non disponibile per questo esercizio.';
  };

  // Carica l'URL GIF quando il modal si apre
  useEffect(() => {
    if (showGif) {
      setIsLoadingGif(true);
      getExerciseGifUrlAsync(exerciseName)
        .then(url => {
          setGifUrl(url);
          setIsLoadingGif(false);
        })
        .catch(error => {
          console.error('Error loading GIF URL:', error);
          setGifUrl('https://example.com/gifs/default-exercise.gif');
          setIsLoadingGif(false);
        });
    }
  }, [showGif, exerciseName]);

  const handleGifClick = () => {
    setShowGif(!showGif);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Link GIF */}
      <Button
        onClick={handleGifClick}
        variant="ghost"
        size="sm"
        className={buttonClassName || "text-pp-gold hover:text-yellow-400 hover:bg-pp-gold/10 p-1 h-auto flex items-center"}
        title="Visualizza dettagli esercizio"
      >
        <Play className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">GIF</span>
      </Button>

      {/* Modal */}
      {showGif && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-[99999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleGifClick();
            }
          }}
        >
          <div className="bg-black rounded-xl w-full max-w-[600px] max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Fisso */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl sm:text-2xl mb-3">{details?.name || exerciseName}</h3>
                <div className="flex flex-wrap gap-2">
                  {details && (
                    <>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EEBA2B] text-black">
                        {details.category}
                        {details.subcategory && ` - ${details.subcategory}`}
                      </span>
                      {getDifficultyBadge(details.difficulty)}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {details.equipment}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Button
                onClick={handleGifClick}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white ml-4 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Contenuto Scrollabile */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-6">
                {/* Sezione GIF */}
                <div>
                  <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center relative border border-zinc-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80 flex items-center justify-center rounded-lg z-10">
                      <div className="text-center text-white p-6">
                        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#EEBA2B] to-yellow-400 text-black px-6 py-3 rounded-full font-semibold text-sm shadow-lg mb-3">
                          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                          <span>🎬 GIF in arrivo!</span>
                          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-zinc-300 text-xs opacity-75">
                          Stiamo creando video dimostrativi<br />professionali per ogni esercizio.
                        </p>
                      </div>
                    </div>
                    <img
                      src={gifUrl}
                      alt={`GIF dimostrativa per ${exerciseName}`}
                      className="max-w-full max-h-full object-contain rounded-lg opacity-0"
                      onError={() => {
                        // Se l'immagine non carica, mantieni l'overlay
                        setIsLoadingGif(false);
                      }}
                    />
                  </div>
                </div>

                {/* Bottone Dettagli Esercizio (solo se disponibili) */}
                {hasDetails && details && (
                  <div>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="w-full flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#EEBA2B]" />
                        <span className="text-white font-medium">Dettagli esercizio</span>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} 
                      />
                    </button>
                  </div>
                )}

                {/* Sezioni Dettagliate (solo se disponibili e aperte) */}
                {hasDetails && details && showDetails && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="border-t border-zinc-800 pt-6">
                      <MusclesSection muscles={details.muscles} />
                    </div>

                    <div className="border-t border-zinc-800 pt-6">
                      <ExecutionSection execution={details.execution} />
                    </div>

                    <div className="border-t border-zinc-800 pt-6">
                      <MistakesSection mistakes={details.commonMistakes} />
                    </div>

                    <div className="border-t border-zinc-800 pt-6">
                      <TipsSection tips={details.tips} variations={details.variations} />
                    </div>
                  </div>
                )}

                {/* Fallback: solo descrizione semplice (se non ci sono dettagli) */}
                {!hasDetails && (
                  <div className="border-t border-zinc-800 pt-6">
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <p className="text-white text-sm leading-relaxed mb-3">
                        {getExerciseDescription(exerciseName)}
                      </p>
                      <p className="text-zinc-500 text-xs italic">
                        ⏳ Descrizione dettagliata in arrivo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Fisso */}
            <div className="p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
              <Button
                onClick={handleGifClick}
                className="w-full bg-[#EEBA2B] hover:bg-yellow-600 text-black font-semibold"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

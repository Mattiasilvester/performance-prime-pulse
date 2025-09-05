import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exerciseDescriptions } from '@/data/exerciseDescriptions';
import { getExerciseGifUrl } from '@/data/exerciseGifs';

interface ExerciseGifLinkProps {
  exerciseName: string;
  className?: string;
}

export const ExerciseGifLink: React.FC<ExerciseGifLinkProps> = ({ 
  exerciseName, 
  className = "" 
}) => {
  const [showGif, setShowGif] = useState(false);

  // Ottiene l'URL della GIF dall'archivio centralizzato
  const getGifUrl = (exerciseName: string): string => {
    return getExerciseGifUrl(exerciseName);
  };

  const getExerciseDescription = (exerciseName: string): string => {
    return exerciseDescriptions[exerciseName] || 'Descrizione non disponibile per questo esercizio.';
  };

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
        className="text-pp-gold hover:text-yellow-400 hover:bg-pp-gold/10 p-1 h-auto"
        title="Visualizza GIF dell'esercizio"
      >
        <Play className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">GIF</span>
      </Button>

      {/* Modal GIF */}
      {showGif && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold text-lg">{exerciseName}</h3>
              <Button
                onClick={handleGifClick}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Descrizione */}
            <div className="p-4 bg-gray-800">
              <p className="text-white text-sm leading-relaxed">
                {getExerciseDescription(exerciseName)}
              </p>
            </div>

            {/* GIF */}
            <div className="p-4">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <img
                  src={getGifUrl(exerciseName)}
                  alt={`GIF dimostrativa per ${exerciseName}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback se l'immagine non carica
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="text-center text-gray-400">
                          <Play className="h-12 w-12 mx-auto mb-2" />
                          <p>GIF non disponibile</p>
                          <p class="text-xs">URL: ${getGifUrl(exerciseName)}</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <Button
                onClick={handleGifClick}
                className="w-full bg-pp-gold hover:bg-yellow-600 text-black font-semibold"
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

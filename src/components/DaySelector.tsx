// ===== COMPONENTE SELEZIONE GIORNO =====

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Dumbbell } from 'lucide-react';

interface DaySelectorProps {
  giorni: Array<{
    nome: string;
    esercizi: Array<{
      nome: string;
      ripetizioni_durata: string;
    }>;
  }>;
  onDaySelect: (dayIndex: number) => void;
  onCancel: () => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  giorni,
  onDaySelect,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[45] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4">
        <Card className="bg-gray-900 border-gray-700 text-white">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Calendar className="w-6 h-6 text-yellow-400" />
              Giorni di Allenamento Rilevati
            </CardTitle>
            <CardDescription className="text-gray-300">
              Sono stati rilevati {giorni.length} giorni di allenamento. 
              Seleziona quale vuoi visualizzare:
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {giorni.map((giorno, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-700 rounded-lg hover:border-yellow-400 transition-colors cursor-pointer bg-gray-800"
                  onClick={() => onDaySelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-bold text-lg">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {giorno.nome}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {giorno.esercizi.length} esercizi
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-400">
                      <Dumbbell className="w-4 h-4" />
                      <span className="text-sm">
                        {giorno.esercizi.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Preview primi 3 esercizi */}
                  {giorno.esercizi.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <Clock className="w-3 h-3" />
                        <span>Preview esercizi:</span>
                      </div>
                      <div className="space-y-1">
                        {giorno.esercizi.slice(0, 3).map((esercizio, esercizioIndex) => (
                          <div key={esercizioIndex} className="text-gray-300 text-sm">
                            • {esercizio.nome} - {esercizio.ripetizioni_durata}
                          </div>
                        ))}
                        {giorno.esercizi.length > 3 && (
                          <div className="text-gray-500 text-sm">
                            ... e altri {giorno.esercizi.length - 3} esercizi
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Annulla
              </Button>
              <Button
                onClick={() => onDaySelect(0)}
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300"
              >
                Seleziona Primo Giorno
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DaySelector;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOnboardingSummary } from '@/hooks/useOnboardingData';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Clock,
  Edit,
  Loader2,
  Package
} from 'lucide-react';

interface OnboardingPreferencesCardProps {
  // Props rimosse: onGeneratePlan, isGenerating non più necessarie
}

export const OnboardingPreferencesCard = ({}: OnboardingPreferencesCardProps) => {
  const { summary, loading } = useOnboardingSummary();
  const navigate = useNavigate();

  const obiettivoLabels: Record<string, string> = {
    massa: 'Massa Muscolare',
    dimagrire: 'Dimagrimento',
    resistenza: 'Resistenza',
    tonificare: 'Tonificazione',
  };

  const livelloLabels: Record<string, string> = {
    principiante: 'Principiante',
    intermedio: 'Intermedio',
    avanzato: 'Avanzato',
  };

  const luoghiLabels: Record<string, string> = {
    casa: 'Casa',
    palestra: 'Palestra',
    outdoor: 'Outdoor',
  };

  const attrezziLabels: Record<string, string> = {
    manubri: 'Manubri',
    bilanciere: 'Bilanciere',
    kettlebell: 'Kettlebell',
    elastici: 'Elastici di resistenza',
    panca: 'Panca',
  };

  const luoghi = summary?.luoghi || [];

  const handleModify = () => {
    console.log('🔘 Click Modifica Preferenze');
    console.log('📍 Navigating to: /onboarding?mode=edit&step=1');
    console.log('🔍 Current location:', window.location.href);
    navigate('/onboarding?mode=edit&step=1', { replace: true });
    console.log('✅ Navigate chiamato');
  };

  if (loading) {
    return (
      <Card className="bg-surface-secondary border-white/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-pp-gold" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-surface-secondary border-white/10">
        <CardHeader>
          <CardTitle className="text-white">⚠️ Preferenze non disponibili</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70 text-sm">
            Completa l'onboarding per vedere le tue preferenze.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-secondary border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-pp-gold" />
          Le tue preferenze
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ✅ STEP 3: Layout 5 card orizzontali RESPONSIVE su tutti i dispositivi */}
        {/* Mobile: scroll orizzontale, Tablet: 3 colonne, Desktop: 5 colonne */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:pb-0 lg:grid-cols-5">
          {summary.obiettivo && (
            <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 flex-shrink-0 min-w-[100px] sm:min-w-0">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-1">Obiettivo</p>
              <p className="text-xs sm:text-sm text-white font-medium text-center truncate">
                {obiettivoLabels[summary.obiettivo] || summary.obiettivo}
              </p>
            </div>
          )}

          {summary.livello && (
            <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 flex-shrink-0 min-w-[100px] sm:min-w-0">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-1">Livello</p>
              <p className="text-xs sm:text-sm text-white font-medium text-center truncate">
                {livelloLabels[summary.livello] || summary.livello}
              </p>
            </div>
          )}

          {summary.frequenza && (
            <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 flex-shrink-0 min-w-[100px] sm:min-w-0">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-1">Frequenza</p>
              <p className="text-xs sm:text-sm text-white font-medium text-center truncate">
                <span className="hidden sm:inline">{summary.frequenza} {summary.frequenza === 1 ? 'volta' : 'volte'}/settimana</span>
                <span className="sm:hidden">{summary.frequenza} {summary.frequenza === 1 ? 'volta' : 'volte'}/sett</span>
              </p>
            </div>
          )}

          {luoghi.length > 0 && (
            <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 flex-shrink-0 min-w-[100px] sm:min-w-0">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-1">Luoghi</p>
              <p className="text-xs sm:text-sm text-white font-medium text-center truncate">
                {luoghi.map((l: string) => luoghiLabels[l] || l).join(', ')}
              </p>
            </div>
          )}

          {summary.durata && (
            <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 flex-shrink-0 min-w-[100px] sm:min-w-0">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-1">Durata sessione</p>
              <p className="text-xs sm:text-sm text-white font-medium text-center truncate">
                <span className="hidden sm:inline">{summary.durata} minuti</span>
                <span className="sm:hidden">{summary.durata} min</span>
              </p>
            </div>
          )}

          {/* Attrezzatura (mostra solo se presente e se ha Casa/Outdoor) */}
          {summary.attrezzatura !== undefined && 
           luoghi.some((l: string) => l === 'casa' || l === 'outdoor') && (
            <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 flex-shrink-0 min-w-[100px] sm:min-w-0">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-1">Attrezzatura</p>
              <p className="text-xs sm:text-sm text-white font-medium text-center truncate">
                {summary.attrezzatura ? 'Sì' : 'No'}
              </p>
            </div>
          )}
        </div>

        {/* Lista Attrezzi (mostra solo se attrezzatura = Sì e ha attrezzi) */}
        {summary.attrezzatura === true && 
         summary.attrezzi && 
         summary.attrezzi.length > 0 && 
         luoghi.some((l: string) => l === 'casa' || l === 'outdoor') && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-2">Attrezzi posseduti:</p>
            <div className="flex flex-wrap gap-2">
              {summary.attrezzi
                .filter((a: string) => a !== 'altro')
                .map((attrezzo: string) => (
                  <span
                    key={attrezzo}
                    className="text-xs px-2 py-1 bg-white/10 text-white rounded-full border border-white/20"
                  >
                    {attrezziLabels[attrezzo] || attrezzo}
                  </span>
                ))}
              {summary.attrezzi.includes('altro') && summary.altriAttrezzi && (
                <span className="text-xs px-2 py-1 bg-white/10 text-white rounded-full border border-white/20">
                  {summary.altriAttrezzi}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ✅ MODIFICA 1: Solo bottone "Modifica Preferenze", rimosso "Crea Piano" */}
        <div className="pt-2">
          <Button
            onClick={handleModify}
            variant="outline"
            className="w-full border-white/20 hover:bg-white/10 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifica Preferenze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


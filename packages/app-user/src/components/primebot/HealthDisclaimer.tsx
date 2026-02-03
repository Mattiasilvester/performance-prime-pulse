import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Shield, UserCheck } from 'lucide-react';
import { supabase } from '@pp/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface HealthDisclaimerProps {
  userId: string;
  disclaimerType: 'workout_plan' | 'onboarding' | 'primebot_question';
  onAccept: () => void; // Callback quando utente accetta
  context?: Record<string, unknown>; // Info aggiuntive per audit
  userHasLimitations?: boolean; // Se true, mostra versione più enfatizzata
  compact?: boolean; // Versione compatta per uso inline
}

const DISCLAIMER_TEXT = `I programmi di allenamento generati da PrimeBot sono suggerimenti basati sulle 
informazioni fornite e NON sostituiscono il parere di un professionista qualificato.

Se hai dolori, infortuni, patologie o condizioni mediche particolari, ti consigliamo 
di consultare un medico, fisioterapista o personal trainer certificato prima di 
iniziare qualsiasi programma di allenamento.`;

const DISCLAIMER_TEXT_COMPACT = `I programmi di allenamento sono suggerimenti e NON sostituiscono il parere di un professionista qualificato. Consulta un medico o trainer certificato se hai dolori, infortuni o condizioni mediche.`;

/**
 * Componente HealthDisclaimer - Disclaimer salute per piani allenamento
 * 
 * Mostra un disclaimer professionale prima di generare/visualizzare piani allenamento.
 * Include checkbox obbligatorio e bottone per trovare professionisti.
 */
export function HealthDisclaimer({
  userId,
  disclaimerType,
  onAccept,
  context = {},
  userHasLimitations = false,
  compact = false,
}: HealthDisclaimerProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    setIsAccepted(checked === true);
  };

  const handleFindProfessional = () => {
    // Naviga alla pagina professionisti (o schedule se non esiste ancora)
    // TODO: Creare pagina dedicata /professionals se necessario
    navigate('/professionisti');
  };

  const handleContinue = async () => {
    if (!isAccepted || isSaving) return;

    setIsSaving(true);

    try {
      // Salva acknowledgment nella tabella audit
      const { error } = await supabase
        .from('health_disclaimer_acknowledgments')
        .insert({
          user_id: userId,
          disclaimer_type: disclaimerType,
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          context: context || {},
        });

      if (error) {
        console.error('Error saving health disclaimer acknowledgment:', error);
        // Non bloccare il flusso se c'è un errore di salvataggio
      }

      // Chiama callback per procedere
      onAccept();
    } catch (error) {
      console.error('Error in handleContinue:', error);
      // Non bloccare il flusso anche in caso di errore
      onAccept();
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = userHasLimitations ? AlertTriangle : Shield;
  const textToShow = compact ? DISCLAIMER_TEXT_COMPACT : DISCLAIMER_TEXT;

  if (compact) {
    return (
      <div
        className={cn(
          'rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-4',
          userHasLimitations
            ? 'border-amber-300 dark:border-amber-800'
            : 'border-amber-200 dark:border-amber-900/50'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent
              className={cn(
                'h-5 w-5',
                userHasLimitations
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-amber-500 dark:text-amber-600'
              )}
            />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {textToShow}
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="health-disclaimer-compact"
                checked={isAccepted}
                onCheckedChange={handleCheckboxChange}
                className="border-amber-400 data-[state=checked]:bg-[#EEBA2B] data-[state=checked]:border-[#EEBA2B]"
              />
              <label
                htmlFor="health-disclaimer-compact"
                className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer select-none"
              >
                Ho letto e compreso
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFindProfessional}
                className="border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Trova Professionista
              </Button>
              <Button
                size="sm"
                onClick={handleContinue}
                disabled={!isAccepted || isSaving}
                className={cn(
                  'bg-[#EEBA2B] text-black hover:bg-[#EEBA2B]/90',
                  (!isAccepted || isSaving) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSaving ? 'Salvataggio...' : 'Continua'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-6 space-y-4',
        userHasLimitations
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
          : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
      )}
    >
      {/* Header con icona */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div
            className={cn(
              'p-2 rounded-lg',
              userHasLimitations
                ? 'bg-amber-100 dark:bg-amber-900/50'
                : 'bg-amber-100/50 dark:bg-amber-900/30'
            )}
          >
            <IconComponent
              className={cn(
                'h-6 w-6',
                userHasLimitations
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-amber-500 dark:text-amber-600'
              )}
            />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {userHasLimitations
              ? 'Importante: Consulta un Professionista'
              : 'Disclaimer Salute'}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {textToShow}
          </p>
        </div>
      </div>

      {/* Checkbox obbligatorio */}
      <div className="flex items-center gap-3 pt-2 border-t border-amber-200 dark:border-amber-900/50">
        <Checkbox
          id="health-disclaimer"
          checked={isAccepted}
          onCheckedChange={handleCheckboxChange}
          className="border-amber-400 data-[state=checked]:bg-[#EEBA2B] data-[state=checked]:border-[#EEBA2B]"
        />
        <label
          htmlFor="health-disclaimer"
          className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer select-none flex-1"
        >
          Ho letto e compreso il disclaimer sopra
        </label>
      </div>

      {/* Bottoni azione */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleFindProfessional}
          className="border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black flex-1 sm:flex-none"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Trova un Professionista
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isAccepted || isSaving}
          className={cn(
            'bg-[#EEBA2B] text-black hover:bg-[#EEBA2B]/90 flex-1 sm:flex-none',
            (!isAccepted || isSaving) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSaving ? 'Salvataggio...' : 'Ho capito, continua'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Versione semplificata del disclaimer per uso ripetuto
 * Banner compatto da mostrare inline nei messaggi o nelle card
 */
export function DisclaimerBanner({
  userId,
  disclaimerType,
  onAccept,
  context = {},
}: Omit<HealthDisclaimerProps, 'compact' | 'userHasLimitations'>) {
  return (
    <HealthDisclaimer
      userId={userId}
      disclaimerType={disclaimerType}
      onAccept={onAccept}
      context={context}
      compact={true}
      userHasLimitations={false}
    />
  );
}


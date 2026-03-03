import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export type ActionButtonState = 'idle' | 'loading' | 'success' | 'error';

export interface ActionButtonProps {
  actionType: string;
  label: string;
  payload: Record<string, unknown>;
  onAction: () => Promise<void>;
  disabled?: boolean;
}

export function ActionButton({
  actionType,
  label,
  payload,
  onAction,
  disabled = false,
}: ActionButtonProps) {
  const [state, setState] = useState<ActionButtonState>('idle');

  const handleClick = async () => {
    if (disabled || state === 'loading') return;

    setState('loading');

    try {
      await onAction();
      setState('success');
      
      // Reset a idle dopo 2 secondi
      setTimeout(() => {
        setState('idle');
      }, 2000);
    } catch (error) {
      console.error('Errore esecuzione azione:', error);
      setState('error');
      toast.error('Errore durante l\'esecuzione dell\'azione', {
        description: error instanceof Error ? error.message : 'Riprova più tardi',
      });
      
      // Reset a idle dopo 3 secondi
      setTimeout(() => {
        setState('idle');
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Caricamento...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            <span>Completato!</span>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="w-4 h-4 mr-2 text-red-500" />
            <span>Errore</span>
          </>
        );
      default:
        return label;
    }
  };

  const getButtonStyles = () => {
    const baseStyles = 'w-full transition-all duration-200';
    
    switch (state) {
      case 'loading':
        return `${baseStyles} bg-[#EEBA2B]/80 text-black cursor-wait`;
      case 'success':
        return `${baseStyles} bg-green-600 text-white`;
      case 'error':
        return `${baseStyles} bg-red-600 text-white`;
      default:
        return `${baseStyles} bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-medium`;
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
      className={getButtonStyles()}
      variant="default"
    >
      {getButtonContent()}
    </Button>
  );
}


/**
 * Componenti di fallback per stati di errore
 * Fornisce UI consistenti per diversi tipi di errori
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Shield, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  type?: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  className?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  type = 'unknown',
  message,
  onRetry,
  onGoHome,
  showRetry = true,
  className = ''
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: <WifiOff className="w-16 h-16 text-orange-500" />,
          title: 'Problemi di Connessione',
          defaultMessage: 'Controlla la tua connessione internet e riprova.',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      case 'auth':
        return {
          icon: <Shield className="w-16 h-16 text-red-500" />,
          title: 'Sessione Scaduta',
          defaultMessage: 'Effettua di nuovo l\'accesso per continuare.',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'validation':
        return {
          icon: <FileX className="w-16 h-16 text-yellow-500" />,
          title: 'Dati Non Validi',
          defaultMessage: 'Controlla i dati inseriti e riprova.',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'server':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-purple-500" />,
          title: 'Errore del Server',
          defaultMessage: 'Il server sta riscontrando problemi. Riprova tra poco.',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      default:
        return {
          icon: <AlertTriangle className="w-16 h-16 text-gray-500" />,
          title: 'Qualcosa è Andato Storto',
          defaultMessage: 'Si è verificato un errore imprevisto. Riprova tra poco.',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="mb-4">
        {config.icon}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {config.title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
        {message || config.defaultMessage}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Riprova
          </Button>
        )}
        
        {onGoHome && (
          <Button
            onClick={onGoHome}
            variant="outline"
          >
            Torna alla Home
          </Button>
        )}
      </div>
    </div>
  );
};

interface LoadingFallbackProps {
  message?: string;
  className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Caricamento in corso...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
};

interface EmptyStateFallbackProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyStateFallback: React.FC<EmptyStateFallbackProps> = ({
  title,
  message,
  icon,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
        {message}
      </p>
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

/**
 * Hook personalizzato per la gestione degli errori
 * Fornisce funzioni helper per gestire errori in modo consistente
 */

import { useCallback } from 'react';
import { errorHandler, ErrorContext } from '@/services/errorHandler';
import { toast } from 'sonner';

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: Partial<ErrorContext>;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const {
    showToast = true,
    logError = true,
    context = {}
  } = options;

  /**
   * Gestisce un errore con toast e logging
   */
  const handleError = useCallback((
    error: unknown, 
    customContext: Partial<ErrorContext> = {}
  ) => {
    const fullContext: ErrorContext = {
      ...context,
      ...customContext,
      timestamp: new Date()
    };

    // Gestisci l'errore con il servizio centralizzato
    const errorInfo = errorHandler.handleError(error, fullContext);

    // Mostra toast se abilitato
    if (showToast) {
      const toastOptions = {
        duration: errorInfo.severity === 'critical' ? 10000 : 5000,
        action: errorInfo.shouldRetry ? {
          label: 'Riprova',
          onClick: () => {
            // Implementa logica di retry se necessario
            window.location.reload();
          }
        } : undefined
      };

      switch (errorInfo.severity) {
        case 'critical':
          toast.error(errorInfo.userMessage, toastOptions);
          break;
        case 'high':
          toast.error(errorInfo.userMessage, toastOptions);
          break;
        case 'medium':
          toast.warning(errorInfo.userMessage, toastOptions);
          break;
        case 'low':
          toast.info(errorInfo.userMessage, toastOptions);
          break;
      }
    }

    return errorInfo;
  }, [showToast, logError, context]);

  /**
   * Gestisce errori di rete specificamente
   */
  const handleNetworkError = useCallback((
    error: unknown,
    customContext: Partial<ErrorContext> = {}
  ) => {
    return handleError(error, {
      ...customContext,
      action: 'network_request'
    });
  }, [handleError]);

  /**
   * Gestisce errori di autenticazione specificamente
   */
  const handleAuthError = useCallback((
    error: unknown,
    customContext: Partial<ErrorContext> = {}
  ) => {
    return handleError(error, {
      ...customContext,
      action: 'authentication'
    });
  }, [handleError]);

  /**
   * Gestisce errori di validazione specificamente
   */
  const handleValidationError = useCallback((
    error: unknown,
    customContext: Partial<ErrorContext> = {}
  ) => {
    return handleError(error, {
      ...customContext,
      action: 'validation'
    });
  }, [handleError]);

  /**
   * Wrapper per async functions con gestione errori automatica
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    customContext: Partial<ErrorContext> = {}
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error, customContext);
        return null;
      }
    };
  }, [handleError]);

  /**
   * Wrapper per sync functions con gestione errori automatica
   */
  const withSyncErrorHandling = useCallback(<T extends any[], R>(
    syncFn: (...args: T) => R,
    customContext: Partial<ErrorContext> = {}
  ) => {
    return (...args: T): R | null => {
      try {
        return syncFn(...args);
      } catch (error) {
        handleError(error, customContext);
        return null;
      }
    };
  }, [handleError]);

  /**
   * Verifica se ci sono errori critici recenti
   */
  const hasRecentCriticalErrors = useCallback((minutes: number = 5) => {
    return errorHandler.hasRecentCriticalErrors(minutes);
  }, []);

  /**
   * Ottiene il log degli errori
   */
  const getErrorLog = useCallback(() => {
    return errorHandler.getErrorLog();
  }, []);

  /**
   * Pulisce il log degli errori
   */
  const clearErrorLog = useCallback(() => {
    errorHandler.clearErrorLog();
  }, []);

  return {
    handleError,
    handleNetworkError,
    handleAuthError,
    handleValidationError,
    withErrorHandling,
    withSyncErrorHandling,
    hasRecentCriticalErrors,
    getErrorLog,
    clearErrorLog
  };
};


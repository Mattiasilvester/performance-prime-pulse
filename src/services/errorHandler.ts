/**
 * Servizio centralizzato per la gestione degli errori
 * Fornisce messaggi user-friendly e logging sicuro
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
}

export interface ErrorInfo {
  message: string;
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  shouldRetry: boolean;
  error?: Error;
  context?: ErrorContext;
}

class ErrorHandler {
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;

  /**
   * Gestisce un errore e restituisce informazioni strutturate
   */
  handleError(error: unknown, context: ErrorContext = {}): ErrorInfo {
    const errorInfo = this.analyzeError(error, context);
    this.logError(errorInfo, context);
    return errorInfo;
  }

  /**
   * Analizza un errore e determina il tipo e la severità
   */
  private analyzeError(error: unknown, context: ErrorContext): ErrorInfo {
    const errorMessage = this.getErrorMessage(error);
    const errorType = this.getErrorType(error);
    const severity = this.getSeverity(error, errorType);
    const userMessage = this.getUserFriendlyMessage(error, errorType);
    const shouldRetry = this.shouldRetry(error, errorType);

    return {
      message: errorMessage,
      type: errorType,
      severity,
      userMessage,
      shouldRetry,
      error: error instanceof Error ? error : undefined,
      context
    };
  }

  /**
   * Estrae il messaggio di errore dall'oggetto error
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Errore sconosciuto';
  }

  /**
   * Determina il tipo di errore
   */
  private getErrorType(error: unknown): ErrorInfo['type'] {
    const message = this.getErrorMessage(error).toLowerCase();
    
    // Errori di rete
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('offline')) {
      return 'network';
    }
    
    // Errori di autenticazione
    if (message.includes('401') || 
        message.includes('unauthorized') ||
        message.includes('token') ||
        message.includes('session') ||
        message.includes('auth')) {
      return 'auth';
    }
    
    // Errori di validazione
    if (message.includes('validation') || 
        message.includes('invalid') ||
        message.includes('required') ||
        message.includes('format')) {
      return 'validation';
    }
    
    // Errori del server
    if (message.includes('500') || 
        message.includes('502') ||
        message.includes('503') ||
        message.includes('server') ||
        message.includes('internal')) {
      return 'server';
    }
    
    return 'unknown';
  }

  /**
   * Determina la severità dell'errore
   */
  private getSeverity(error: unknown, type: ErrorInfo['type']): ErrorInfo['severity'] {
    const message = this.getErrorMessage(error).toLowerCase();
    
    // Errori critici
    if (type === 'auth' || 
        message.includes('critical') ||
        message.includes('fatal')) {
      return 'critical';
    }
    
    // Errori ad alta severità
    if (type === 'server' || 
        message.includes('database') ||
        message.includes('storage')) {
      return 'high';
    }
    
    // Errori di media severità
    if (type === 'network' || 
        message.includes('timeout')) {
      return 'medium';
    }
    
    // Errori a bassa severità
    return 'low';
  }

  /**
   * Genera messaggi user-friendly
   */
  private getUserFriendlyMessage(error: unknown, type: ErrorInfo['type']): string {
    const message = this.getErrorMessage(error).toLowerCase();
    
    switch (type) {
      case 'network':
        if (message.includes('offline') || message.includes('disconnected')) {
          return 'Connessione internet assente. Controlla la tua rete e riprova.';
        }
        if (message.includes('timeout')) {
          return 'La richiesta sta impiegando troppo tempo. Riprova tra poco.';
        }
        return 'Problemi di connessione. Controlla la tua rete e riprova.';
        
      case 'auth':
        if (message.includes('401') || message.includes('unauthorized')) {
          return 'Sessione scaduta. Effettua di nuovo l\'accesso.';
        }
        if (message.includes('token')) {
          return 'Token di accesso non valido. Effettua di nuovo l\'accesso.';
        }
        return 'Problema di autenticazione. Effettua di nuovo l\'accesso.';
        
      case 'validation':
        if (message.includes('email')) {
          return 'Indirizzo email non valido. Controlla e riprova.';
        }
        if (message.includes('password')) {
          return 'Password non valida. Controlla i requisiti e riprova.';
        }
        if (message.includes('required')) {
          return 'Compila tutti i campi obbligatori.';
        }
        return 'Dati inseriti non validi. Controlla e riprova.';
        
      case 'server':
        if (message.includes('500')) {
          return 'Errore interno del server. Riprova tra poco.';
        }
        if (message.includes('503')) {
          return 'Servizio temporaneamente non disponibile. Riprova tra poco.';
        }
        return 'Problema del server. Riprova tra poco.';
        
      case 'unknown':
      default:
        if (message.includes('undefined') || message.includes('null')) {
          return 'Ops! Qualcosa è andato storto. Riprova tra poco.';
        }
        if (message.includes('typeerror') || message.includes('referenceerror')) {
          return 'Ops! Qualcosa è andato storto. Riprova tra poco.';
        }
        return 'Ops! Qualcosa è andato storto. Riprova tra poco.';
    }
  }

  /**
   * Determina se l'errore può essere ritentato
   */
  private shouldRetry(error: unknown, type: ErrorInfo['type']): boolean {
    const message = this.getErrorMessage(error).toLowerCase();
    
    // Non ritentare errori di validazione o auth
    if (type === 'validation' || type === 'auth') {
      return false;
    }
    
    // Ritenta errori di rete e server
    if (type === 'network' || type === 'server') {
      return true;
    }
    
    // Ritenta timeout
    if (message.includes('timeout')) {
      return true;
    }
    
    return false;
  }

  /**
   * Log sicuro degli errori per debug
   */
  private logError(errorInfo: ErrorInfo, context: ErrorContext): void {
    const logEntry = {
      ...errorInfo,
      context: {
        ...context,
        timestamp: context.timestamp || new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Aggiungi al log interno (limitato)
    this.errorLog.unshift(logEntry);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log solo in sviluppo
    if (import.meta.env.DEV) {
      console.group(`🚨 Error [${errorInfo.severity.toUpperCase()}]`);
      console.error('Message:', errorInfo.message);
      console.error('User Message:', errorInfo.userMessage);
      console.error('Context:', context);
      console.error('Stack:', errorInfo.error instanceof Error ? errorInfo.error.stack : 'N/A');
      console.groupEnd();
    }

    // In produzione, invia a servizio di monitoring (opzionale)
    if (import.meta.env.PROD && errorInfo.severity === 'critical') {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Invia errori critici a servizio di monitoring
   */
  private sendToMonitoring(logEntry: any): void {
    // Implementa invio a servizio di monitoring (Sentry, LogRocket, etc.)
    // Per ora solo log locale
    try {
      const criticalErrors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      criticalErrors.push(logEntry);
      localStorage.setItem('critical_errors', JSON.stringify(criticalErrors.slice(-10)));
    } catch (e) {
      // Ignora errori di storage
    }
  }


  /**
   * Ottiene il log degli errori
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * Pulisce il log degli errori
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Verifica se ci sono errori critici recenti
   */
  hasRecentCriticalErrors(minutes: number = 5): boolean {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorLog.some(error => 
      error.severity === 'critical' && 
      error.context?.timestamp && 
      new Date(error.context.timestamp) > cutoff
    );
  }
}

// Esporta istanza singleton
export const errorHandler = new ErrorHandler();

// Esporta anche la classe per testing
export { ErrorHandler };

// Utility per gestire messaggi errore Stripe in italiano
export function getStripeErrorMessage(error: unknown): string {
  const err = error as { code?: string; type?: string; message?: string } | null | undefined;
  const errorCode = err?.code || err?.type || '';
  const errorMessage = err?.message || '';

  // Mappa codici Stripe a messaggi italiani
  const errorMessages: Record<string, string> = {
    // Errori carta
    'card_declined': 'La carta è stata rifiutata. Controlla i dati o prova un\'altra carta.',
    'expired_card': 'La carta è scaduta. Aggiungi una nuova carta.',
    'incorrect_cvc': 'Il codice di sicurezza (CVC) non è corretto. Controlla e riprova.',
    'insufficient_funds': 'Fondi insufficienti sulla carta. Verifica il saldo disponibile.',
    'invalid_expiry_month': 'Il mese di scadenza non è valido.',
    'invalid_expiry_year': 'L\'anno di scadenza non è valido.',
    'invalid_number': 'Il numero di carta non è valido. Controlla e riprova.',
    'processing_error': 'Si è verificato un errore durante l\'elaborazione. Riprova più tardi.',
    
    // Errori subscription
    'subscription_creation_failed': 'Impossibile creare l\'abbonamento. Riprova o contatta il supporto.',
    'payment_method_required': 'È necessario aggiungere un metodo di pagamento per attivare l\'abbonamento.',
    
    // Errori generici
    'authentication_required': 'Autenticazione richiesta. Effettua il login e riprova.',
    'rate_limit': 'Troppe richieste. Attendi qualche istante e riprova.',
  };

  // Cerca messaggio specifico
  for (const [code, message] of Object.entries(errorMessages)) {
    if (errorCode.includes(code) || errorMessage.toLowerCase().includes(code)) {
      return message;
    }
  }

  // Fallback: messaggio generico ma informativo
  if (errorMessage) {
    return `Errore: ${errorMessage}`;
  }

  return 'Si è verificato un errore durante l\'operazione. Riprova più tardi o contatta il supporto.';
}

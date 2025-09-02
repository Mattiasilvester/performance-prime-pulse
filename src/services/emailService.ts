import { supabase } from '@/integrations/supabase/client';

export const emailService = {
  async sendWelcomeEmail(email: string) {
    try {
      // Usa Supabase Edge Functions per inviare email
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: email,
          subject: 'Benvenut* in Performance Prime',
          message: 'Benvenut* in Performance Prime, la registrazione è stata effettuata con successo.'
        }
      });

      if (error) {
        console.error('Errore invio email:', error);
        throw error;
      }

      console.log('Email di benvenuto inviata:', data);
      return true;
    } catch (error) {
      console.error('Errore servizio email:', error);
      return false;
    }
  }
};

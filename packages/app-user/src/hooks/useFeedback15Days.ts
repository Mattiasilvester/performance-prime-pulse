import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFeedback15Days(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    
    const checkAndSendFeedback = async () => {
      try {
        // Prendi profilo utente
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, feedback_15d_sent')
          .eq('id', userId)
          .maybeSingle();
          
        if (!profile || profile.feedback_15d_sent) return;
        
        // Calcola giorni dalla registrazione
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Se sono passati 15+ giorni, invia feedback
        if (daysSinceSignup >= 15) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          let fetchOk = false;
          try {
            await fetch('https://gurfadigitalsolution.app.n8n.cloud/webhook/pp/feedback-15d', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                form_url: 'https://tally.so/r/nW4OxJ',
                days_since_signup: daysSinceSignup
              }),
              signal: controller.signal,
            });
            fetchOk = true;
          } catch {
            // silent fail
          } finally {
            clearTimeout(timeoutId);
          }
          if (!fetchOk) return;
          
          // Marca come inviato
          await supabase
            .from('profiles')
            .update({ feedback_15d_sent: true })
            .eq('id', userId);
        }
      } catch (error) {
        // Silenzioso - non interferire
      }
    };
    
    const delayId = setTimeout(() => checkAndSendFeedback(), 2000);
    const interval = setInterval(checkAndSendFeedback, 3600000);
    
    return () => {
      clearTimeout(delayId);
      clearInterval(interval);
    };
  }, [userId]);
}

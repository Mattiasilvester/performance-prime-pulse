import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ResetPassword from '@/pages/ResetPassword';

export const ResetPasswordDebug = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('=== RESET PASSWORD DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Hash:', window.location.hash);
    
    // Check for error parameters in hash
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const hashParams = new URLSearchParams(hash.substring(1)); // Remove the #
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');
      
      console.log('Error detected:', { error, errorCode, errorDescription });
      
      if (errorCode === 'otp_expired') {
        toast({
          title: "Link scaduto",
          description: "Il link per il reset della password è scaduto. Richiedi un nuovo link di reset.",
          variant: "destructive",
          duration: 8000,
        });
        
        // Redirect to auth page after showing error
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
        
        return;
      }
    }
    
    console.log('=== END DEBUG ===');
  }, [searchParams, navigate, toast]);

  // Don't render ResetPassword if there's an error
  if (window.location.hash.includes('error=')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-4xl">!</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-pp-gold">Link Scaduto</h1>
          <p className="text-xl text-pp-gold/80 mb-8">
            Il link per il reset della password è scaduto.<br/>
            Verrai reindirizzato alla pagina di login per richiedere un nuovo link.
          </p>
        </div>
      </div>
    );
  }

  return <ResetPassword />;
};
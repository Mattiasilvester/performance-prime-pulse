import { useState } from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileAccessBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  isVisible: boolean;
}

export const FileAccessBanner = ({ onAccept, onDecline, isVisible }: FileAccessBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[45] lg:left-8 lg:right-8">
      <Card className="bg-black border-2 border-[#c89116] shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Shield className="h-6 w-6 text-[#c89116]" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Accesso ai File del PC
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Performance Prime richiede il tuo consenso per accedere ai file del tuo computer 
                    per caricare allegati agli allenamenti (immagini e PDF). 
                    I tuoi file rimangono privati e sicuri.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onAccept();
                    setIsDismissed(true);
                  }}
                  className="bg-[#c89116] text-black hover:bg-[#c89116]/80 text-sm"
                >
                  Accetta
                </Button>
                <Button
                  onClick={() => {
                    onDecline();
                    setIsDismissed(true);
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm"
                >
                  Rifiuta
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

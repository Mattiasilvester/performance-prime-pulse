import { Zap, HelpCircle, CheckCircle } from 'lucide-react';

export interface GoogleWelcomeScreenProps {
  userName: string;
  onContinue: () => void;
}

const BENEFITS = [
  'Allenamenti personalizzati sul tuo livello',
  'PrimeBot conosce i tuoi obiettivi e limitazioni',
  'Piani nutrizione calibrati su di te',
];

export function GoogleWelcomeScreen({ userName, onContinue }: GoogleWelcomeScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
      style={{ backgroundColor: '#0A0A0C' }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        {/* 1. Logo/icona */}
        <div className="flex items-center justify-center" style={{ color: '#EEBA2B' }}>
          <Zap size={48} strokeWidth={2} />
        </div>

        {/* 2. Titolo */}
        <h1
          className="font-bold text-white"
          style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24 }}
        >
          Benvenuto in Performance Prime!
        </h1>

        {/* 3. Sottotitolo con nome Google */}
        <p
          className="text-center"
          style={{ color: '#8A8A96', fontSize: 14 }}
        >
          Ciao {userName}, il tuo account Google è stato collegato con successo.
        </p>

        {/* 4. Spazio verticale */}
        <div className="h-2" />

        {/* 5. Card spiegazione */}
        <div
          className="w-full rounded-xl p-5 text-left"
          style={{
            backgroundColor: '#16161A',
            border: '1px solid rgba(238, 186, 43, 0.3)',
            borderRadius: 12,
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: '#EEBA2B', fontSize: 16, fontWeight: 700 }}>
            <HelpCircle size={16} className="flex-shrink-0" />
            <span>Perché dobbiamo farti alcune domande?</span>
          </div>
          <p
            className="whitespace-pre-line"
            style={{ color: '#8A8A96', fontSize: 13, lineHeight: 1.6 }}
          >
            {`Performance Prime è un'app di allenamento personalizzato con AI Coach (PrimeBot).

Per offrirti piani di allenamento e nutrizione su misura, PrimeBot ha bisogno di conoscerti: i tuoi obiettivi, il tuo livello di fitness, eventuali limitazioni fisiche e le tue preferenze.

Ci vorranno meno di 2 minuti. Senza questi dati, PrimeBot non può personalizzare la tua esperienza.`}
          </p>
        </div>

        {/* 6. Lista benefici */}
        <ul className="w-full flex flex-col gap-2 text-left">
          {BENEFITS.map((text) => (
            <li key={text} className="flex items-center gap-2">
              <CheckCircle size={14} className="flex-shrink-0" style={{ color: '#EEBA2B' }} />
              <span style={{ color: '#8A8A96', fontSize: 13 }}>{text}</span>
            </li>
          ))}
        </ul>

        {/* 7. Bottone primario */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full font-bold rounded-xl transition-opacity hover:opacity-95"
          style={{
            backgroundColor: '#EEBA2B',
            color: '#000',
            height: 52,
            borderRadius: 12,
          }}
        >
          Inizia la configurazione →
        </button>

        {/* 8. Testo piccolo sotto il bottone */}
        <p
          className="text-center"
          style={{ color: 'rgba(138, 138, 150, 0.6)', fontSize: 11 }}
        >
          Potrai modificare queste informazioni in qualsiasi momento dal tuo profilo.
        </p>
      </div>
    </div>
  );
}

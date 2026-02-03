import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@pp/shared';
import { useAuth } from '@pp/shared';
import { 
  getMatchedProfessionals, 
  ProfessionalWithMatch,
  getCategoryLabel,
  getCategoryIcon 
} from '@/services/professionalsService';

interface MatchQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: ProfessionalWithMatch[]) => void;
}

interface QuizAnswer {
  obiettivo?: string;
  tipo_supporto?: string;
  modalita_preferita?: string;
  ha_limitazioni?: boolean;
  frequenza?: string;
  livello_esperienza?: string;
}

const QUIZ_QUESTIONS = [
  {
    id: 'obiettivo',
    question: 'Qual è il tuo obiettivo principale?',
    emoji: '🎯',
    options: [
      { value: 'massa', label: 'Aumentare massa muscolare', emoji: '💪' },
      { value: 'dimagrire', label: 'Perdere peso / Dimagrire', emoji: '🔥' },
      { value: 'resistenza', label: 'Migliorare resistenza', emoji: '🏃' },
      { value: 'tonificare', label: 'Tonificare il corpo', emoji: '✨' },
    ]
  },
  {
    id: 'tipo_supporto',
    question: 'Che tipo di supporto cerchi?',
    emoji: '🤝',
    options: [
      { value: 'allenamento', label: 'Allenamento / Personal Training', emoji: '🏋️' },
      { value: 'nutrizione', label: 'Nutrizione / Dieta', emoji: '🥗' },
      { value: 'recupero', label: 'Fisioterapia / Recupero', emoji: '🏥' },
      { value: 'mentale', label: 'Mental Coaching', emoji: '🧠' },
    ]
  },
  {
    id: 'modalita_preferita',
    question: 'Preferisci essere seguito online o in presenza?',
    emoji: '📍',
    options: [
      { value: 'online', label: 'Online (da casa)', emoji: '💻' },
      { value: 'presenza', label: 'In presenza', emoji: '🏢' },
      { value: 'entrambi', label: 'Entrambi vanno bene', emoji: '🔄' },
    ]
  },
  {
    id: 'ha_limitazioni',
    question: 'Hai limitazioni fisiche o infortuni?',
    emoji: '⚠️',
    options: [
      { value: 'no', label: 'No, sono in forma', emoji: '✅' },
      { value: 'si', label: 'Sì, ho alcune limitazioni', emoji: '🩹' },
    ]
  },
  {
    id: 'frequenza',
    question: 'Quanto spesso vorresti essere seguito?',
    emoji: '📅',
    options: [
      { value: '1x', label: '1 volta a settimana', emoji: '1️⃣' },
      { value: '2-3x', label: '2-3 volte a settimana', emoji: '🔄' },
      { value: 'daily', label: 'Tutti i giorni', emoji: '📆' },
      { value: 'consulenza', label: 'Solo consulenza iniziale', emoji: '💬' },
    ]
  },
  {
    id: 'livello_esperienza',
    question: 'Qual è il tuo livello di esperienza?',
    emoji: '📊',
    options: [
      { value: 'principiante', label: 'Principiante (mai allenato)', emoji: '🌱' },
      { value: 'intermedio', label: 'Intermedio (1-2 anni)', emoji: '🌿' },
      { value: 'avanzato', label: 'Avanzato (3+ anni)', emoji: '🌳' },
    ]
  },
];

const MatchQuiz: React.FC<MatchQuizProps> = ({ isOpen, onClose, onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [limitazioniTesto, setLimitazioniTesto] = useState('');

  if (!isOpen) return null;

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;

  const handleSelectOption = (value: string) => {
    setSelectedOption(value);
  };

  const handleNext = async () => {
    if (!selectedOption) return;

    // Salva risposta
    const newAnswers = { 
      ...answers, 
      [currentQuestion.id]: currentQuestion.id === 'ha_limitazioni' 
        ? selectedOption === 'si' 
        : selectedOption 
    };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (isLastQuestion) {
      // Calcola risultati
      setIsCalculating(true);
      try {
        // Salva le limitazioni fisiche se l'utente le ha specificate
        if (newAnswers.ha_limitazioni === true && limitazioniTesto.trim() && user?.id) {
          try {
            await supabase
              .from('user_onboarding_responses')
              .upsert({
                user_id: user.id,
                ha_limitazioni: true,
                limitazioni_fisiche: limitazioniTesto.trim(),
              }, { onConflict: 'user_id' });
          } catch (error) {
            console.error('Errore salvataggio limitazioni:', error);
            // Non bloccare il flusso se il salvataggio fallisce
          }
        }
        
        // Converti risposte quiz in formato onboarding
        const onboardingData = {
          obiettivo: newAnswers.obiettivo as 'massa' | 'dimagrire' | 'resistenza' | 'tonificare',
          livello_esperienza: newAnswers.livello_esperienza as 'principiante' | 'intermedio' | 'avanzato',
          ha_limitazioni: newAnswers.ha_limitazioni as boolean,
          consigli_nutrizionali: newAnswers.tipo_supporto === 'nutrizione',
        };
        
        const results = await getMatchedProfessionals(onboardingData);
        
        // Filtra per tipo supporto se specificato
        let filteredResults = results;
        if (newAnswers.tipo_supporto === 'allenamento') {
          filteredResults = results.filter(p => p.category === 'pt');
        } else if (newAnswers.tipo_supporto === 'nutrizione') {
          filteredResults = results.filter(p => p.category === 'nutrizionista');
        } else if (newAnswers.tipo_supporto === 'recupero') {
          filteredResults = results.filter(p => p.category === 'fisioterapista' || p.category === 'osteopata');
        } else if (newAnswers.tipo_supporto === 'mentale') {
          filteredResults = results.filter(p => p.category === 'mental_coach');
        }

        // Filtra per modalità
        if (newAnswers.modalita_preferita && newAnswers.modalita_preferita !== 'entrambi') {
          filteredResults = filteredResults.filter(p => 
            p.modalita === newAnswers.modalita_preferita || p.modalita === 'entrambi'
          );
        }

        // Se non ci sono risultati con tutti i filtri, usa risultati originali
        if (filteredResults.length === 0) {
          filteredResults = results;
        }

        // Normalizza match score in base al numero di risultati
        // Se c'è solo 1 risultato, è un match perfetto (100%)
        if (filteredResults.length === 1) {
          filteredResults[0].matchScore = 100;
        }
        // Se ci sono 2 risultati, il primo è 100% e il secondo proporzionale
        else if (filteredResults.length === 2) {
          filteredResults[0].matchScore = 100;
          // Il secondo mantiene il suo score relativo ma aumentato
          filteredResults[1].matchScore = Math.min(95, filteredResults[1].matchScore + 20);
        }
        // Se ci sono 3+ risultati, il primo è 100% e gli altri proporzionali
        else if (filteredResults.length >= 3) {
          const maxScore = filteredResults[0].matchScore;
          filteredResults.forEach((r, index) => {
            if (index === 0) {
              r.matchScore = 100;
            } else {
              // Scala proporzionalmente: se il primo era 80 e il secondo 60, 
              // ora il primo è 100 e il secondo diventa 75 (60/80*100)
              r.matchScore = Math.round((r.matchScore / maxScore) * 100);
            }
          });
        }

        // Simula un po' di delay per UX migliore
        await new Promise(resolve => setTimeout(resolve, 1500));

        onComplete(filteredResults.slice(0, 3));
      } catch (error) {
        console.error('Errore calcolo match:', error);
        onComplete([]);
      } finally {
        setIsCalculating(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setSelectedOption(null);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAnswers({});
    setSelectedOption(null);
    setLimitazioniTesto('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 to-black 
                      border border-gray-700 rounded-2xl p-6 shadow-2xl">
        {/* Header con close button */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Domanda {currentStep + 1} di {QUIZ_QUESTIONS.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#EEBA2B] to-yellow-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isCalculating ? (
          /* Loading state */
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#EEBA2B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl font-bold text-white mb-2">Analizzo le tue risposte...</p>
            <p className="text-gray-400">Sto cercando i professionisti perfetti per te</p>
          </div>
        ) : (
          <>
            {/* Question */}
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">{currentQuestion.emoji}</span>
              <h2 className="text-xl font-bold text-white">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                    flex items-center gap-3
                    ${selectedOption === option.value 
                      ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 text-white' 
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                    }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-medium">{option.label}</span>
                  {selectedOption === option.value && (
                    <span className="ml-auto text-[#EEBA2B]">✓</span>
                  )}
                </button>
              ))}

              {/* Domanda condizionale: Quali limitazioni? */}
              {currentQuestion.id === 'ha_limitazioni' && (selectedOption === 'si' || answers.ha_limitazioni === true) && (
                <div className="mt-6 space-y-3">
                  <p className="text-white text-lg font-medium">
                    📝 Quali limitazioni hai?
                  </p>
                  <p className="text-gray-400 text-sm">
                    Descrivi brevemente le tue limitazioni fisiche (es: mal di schiena, ginocchio operato, ernia...)
                  </p>
                  <textarea
                    value={limitazioniTesto}
                    onChange={(e) => setLimitazioniTesto(e.target.value)}
                    placeholder="Scrivi qui le tue limitazioni..."
                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 
                               focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] focus:outline-none
                               resize-none min-h-[120px]"
                    maxLength={500}
                  />
                  <p className="text-gray-500 text-xs text-right">
                    {limitazioniTesto.length}/500 caratteri
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-300
                           hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Indietro
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!selectedOption}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all
                  flex items-center justify-center gap-2
                  ${selectedOption
                    ? 'bg-[#EEBA2B] text-black hover:bg-[#d4a826]'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isLastQuestion ? '🎯 Trova i tuoi match' : 'Avanti'}
                {!isLastQuestion && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchQuiz;


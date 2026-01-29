import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { professionalAuthService } from '@/services/professionalAuthService';
import { toast } from 'sonner';
import { ProgressBar } from '@/components/partner/onboarding/ProgressBar';
import { StepPersonalInfo } from '@/components/partner/onboarding/StepPersonalInfo';
import { StepPassword } from '@/components/partner/onboarding/StepPassword';
import { StepCategory } from '@/components/partner/onboarding/StepCategory';
import { StepProfessionalInfo } from '@/components/partner/onboarding/StepProfessionalInfo';
import { StepBio } from '@/components/partner/onboarding/StepBio';
import { StepModalitaPrezzi } from '@/components/partner/onboarding/StepModalitaPrezzi';

const TOTAL_STEPS = 6;

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  category: string;
  customCategory: string;
  city: string;
  titolo_studio: string;
  certificazioni: string[];
  studio_sede: string;
  bio: string;
  modalita: 'online' | 'presenza' | 'entrambi';
  prezzo_seduta: number | null;
  prezzo_fascia: '€' | '€€' | '€€€';
}

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    category: '',
    customCategory: '',
    city: '',
    titolo_studio: '',
    certificazioni: [],
    studio_sede: '',
    bio: '',
    modalita: 'entrambi',
    prezzo_seduta: null,
    prezzo_fascia: '€€'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: string, value: string | string[] | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Rimuovi errore quando l'utente modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (error) setError(null);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.first_name.trim()) newErrors.first_name = 'Il nome è obbligatorio';
        if (!formData.last_name.trim()) newErrors.last_name = 'Il cognome è obbligatorio';
        if (!formData.email.trim()) {
          newErrors.email = 'L\'email è obbligatoria';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Formato email non valido';
          }
        }
        if (emailError) newErrors.email = emailError;
        if (!formData.phone.trim()) newErrors.phone = 'Il telefono è obbligatorio';
        break;

      case 2:
        if (!formData.password) {
          newErrors.password = 'La password è obbligatoria';
        } else {
          const isPasswordValid = 
            formData.password.length >= 8 &&
            /[a-z]/.test(formData.password) &&
            /[A-Z]/.test(formData.password) &&
            /[0-9]/.test(formData.password);
          
          if (!isPasswordValid) {
            newErrors.password = 'La password non soddisfa i requisiti di sicurezza';
          }
        }
        if (!formData.password_confirm) {
          newErrors.password_confirm = 'Conferma la password';
        } else if (formData.password !== formData.password_confirm) {
          newErrors.password_confirm = 'Le password non coincidono';
        }
        break;

      case 3:
        if (!formData.category) {
          newErrors.category = 'Seleziona una categoria';
        }
        if (formData.category === 'altro') {
          if (!formData.customCategory.trim()) {
            newErrors.customCategory = 'Specifica la tua professione';
          } else if (formData.customCategory.trim().length < 3) {
            newErrors.customCategory = 'La professione deve essere di almeno 3 caratteri';
          }
        }
        break;

      case 4:
        if (!formData.city.trim()) newErrors.city = 'La città è obbligatoria';
        if (!formData.titolo_studio.trim()) newErrors.titolo_studio = 'Il titolo di studio è obbligatorio';
        if (formData.certificazioni.length === 0) {
          newErrors.certificazioni = 'Aggiungi almeno una certificazione';
        }
        if (!formData.studio_sede.trim()) newErrors.studio_sede = 'Il nome studio/sede è obbligatorio';
        break;

      case 5:
        if (!formData.bio.trim()) {
          newErrors.bio = 'La descrizione è obbligatoria';
        } else if (formData.bio.trim().length < 50) {
          newErrors.bio = 'La descrizione deve essere di almeno 50 caratteri';
        }
        break;

      case 6:
        if (!formData.modalita) {
          newErrors.modalita = 'Seleziona una modalità di lavoro';
        }
        // prezzo_seduta è opzionale, ma se inserito deve essere valido
        if (formData.prezzo_seduta !== null && formData.prezzo_seduta !== undefined) {
          if (formData.prezzo_seduta < 0 || formData.prezzo_seduta > 1000) {
            newErrors.prezzo_seduta = 'Il prezzo deve essere tra 0 e 1000€';
          }
        }
        // prezzo_fascia è sempre presente (default o calcolato)
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailBlur = async () => {
    if (!formData.email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Formato email non valido');
      return;
    }

    setIsCheckingEmail(true);
    try {
      const exists = await professionalAuthService.checkEmailExists(formData.email);
      if (exists) {
        setEmailError('Questa email è già registrata');
      } else {
        setEmailError(null);
      }
    } catch (err) {
      setEmailError('Errore durante la verifica email');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      // Se siamo allo step 2 e la password non è valida, mostra toast
      if (currentStep === 2) {
        const isPasswordValid = 
          formData.password.length >= 8 &&
          /[a-z]/.test(formData.password) &&
          /[A-Z]/.test(formData.password) &&
          /[0-9]/.test(formData.password);
        
        if (!isPasswordValid) {
          toast.error('La password non soddisfa i requisiti di sicurezza', {
            description: 'Assicurati che la password contenga almeno 8 caratteri, una minuscola, una maiuscola e un numero'
          });
        }
      }
      return;
    }

    // Se siamo allo step 1, verifica email prima di procedere
    if (currentStep === 1 && formData.email) {
      await handleEmailBlur();
      if (emailError) {
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Se categoria è "altro", aggiungi la categoria custom al bio
      let bioWithCategory = formData.bio.trim();
      if (formData.category === 'altro' && formData.customCategory.trim()) {
        bioWithCategory = `Categoria: ${formData.customCategory.trim()}\n\n${bioWithCategory}`;
      }

      const result = await professionalAuthService.register({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        category: (formData.category === 'other' ? 'altro' : formData.category) as 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata' | 'altro',
        city: formData.city.trim(),
        bio: bioWithCategory,
        company_name: formData.studio_sede.trim(),
        titolo_studio: formData.titolo_studio.trim(),
        certificazioni: formData.certificazioni,
        customCategory: formData.customCategory.trim() || undefined,
        modalita: formData.modalita,
        prezzo_seduta: formData.prezzo_seduta,
        prezzo_fascia: formData.prezzo_fascia
      });

      if (result.requiresEmailConfirmation) {
        toast.success('Registrazione completata', {
          description: 'Controlla la tua email per confermare l\'account. Poi potrai accedere alla dashboard.'
        });
        navigate('/partner/login');
        return;
      }
      navigate('/partner/dashboard');
    } catch (err: unknown) {
      console.error('Errore registrazione:', err);
      
      const error = err instanceof Error ? err : new Error('Errore durante la registrazione');
      const errorMessage = error.message.toLowerCase();
      
      // Controlla se è errore password debole
      if (errorMessage.includes('password') && 
          (errorMessage.includes('weak') || 
           errorMessage.includes('guess') ||
           errorMessage.includes('common') ||
           errorMessage.includes('compromised'))) {
        
        // Torna allo step 2 per far cambiare la password
        setCurrentStep(2);
        setErrors({ password: 'Questa password è troppo comune. Scegli una password più sicura e unica.' });
        toast.error('Password troppo comune', {
          description: 'Torna indietro e scegli una password più sicura e unica'
        });
        setLoading(false);
        return;
      }

      // Email già registrata (Auth): torna allo step 1 e mostra errore sotto l'email
      if (errorMessage.includes('already registered') || errorMessage.includes('già registrat')) {
        setEmailError('Questa email è già registrata. Usa un\'altra email o accedi al tuo account.');
        setCurrentStep(1);
        setError(null);
        toast.error('Email già in uso', {
          description: 'Questa email è già registrata. Usa un\'altra email o accedi.'
        });
        setLoading(false);
        return;
      }
      
      // Altri errori
      const message = error.message || 'Errore durante la registrazione. Riprova più tardi.';
      setError(message);
      toast.error('Errore durante la registrazione', {
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.first_name.trim() && formData.last_name.trim() && formData.email.trim() && formData.phone.trim() && !emailError;
      case 2: {
        const passwordValid =
          formData.password.length >= 8 &&
          /[a-z]/.test(formData.password) &&
          /[A-Z]/.test(formData.password) &&
          /[0-9]/.test(formData.password);
        return passwordValid && formData.password === formData.password_confirm;
      }
      case 3:
        if (!formData.category) return false;
        if (formData.category === 'altro') {
          return formData.customCategory.trim().length >= 3;
        }
        return true;
      case 4:
        return formData.city.trim() && formData.titolo_studio.trim() && formData.certificazioni.length > 0 && formData.studio_sede.trim();
      case 5:
        return formData.bio.trim().length >= 50;
      case 6:
        // modalita è sempre presente (default: 'entrambi')
        // prezzo_seduta è opzionale, ma se presente deve essere valido
        if (formData.prezzo_seduta !== null && formData.prezzo_seduta !== undefined) {
          return formData.prezzo_seduta >= 0 && formData.prezzo_seduta <= 1000;
        }
        return true; // Se prezzo_seduta non è inserito, va bene (usa prezzo_fascia)
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen partner-theme partner-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold partner-heading mb-2">
            Inizia la tua prova gratuita
          </h1>
          <p className="text-lg partner-muted-text">6 mesi gratis, nessun vincolo</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Form Card */}
        <div className="partner-card rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StepPersonalInfo
                key="step1"
                data={{
                  first_name: formData.first_name,
                  last_name: formData.last_name,
                  email: formData.email,
                  phone: formData.phone
                }}
                onChange={updateFormData}
                errors={errors}
                onEmailBlur={handleEmailBlur}
                isCheckingEmail={isCheckingEmail}
              />
            )}

            {currentStep === 2 && (
              <StepPassword
                key="step2"
                data={{
                  password: formData.password,
                  password_confirm: formData.password_confirm
                }}
                onChange={updateFormData}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <StepCategory
                key="step3"
                selectedCategory={formData.category}
                onSelect={(category) => {
                  updateFormData('category', category);
                  // Reset customCategory se si cambia categoria
                  if (category !== 'altro') {
                    updateFormData('customCategory', '');
                  }
                }}
                customCategory={formData.customCategory}
                onCustomCategoryChange={(value) => updateFormData('customCategory', value)}
                error={errors.category}
                customCategoryError={errors.customCategory}
              />
            )}

            {currentStep === 4 && (
              <StepProfessionalInfo
                key="step4"
                data={{
                  city: formData.city,
                  titolo_studio: formData.titolo_studio,
                  certificazioni: formData.certificazioni,
                  studio_sede: formData.studio_sede
                }}
                onChange={updateFormData}
                errors={errors}
              />
            )}

            {currentStep === 5 && (
              <StepBio
                key="step5"
                bio={formData.bio}
                onChange={(value) => updateFormData('bio', value)}
                error={errors.bio}
              />
            )}

            {currentStep === 6 && (
              <StepModalitaPrezzi
                key="step6"
                data={{
                  modalita: formData.modalita,
                  prezzo_seduta: formData.prezzo_seduta,
                  prezzo_fascia: formData.prezzo_fascia
                }}
                onChange={updateFormData}
                errors={errors}
              />
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`
                w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 text-sm
                flex items-center justify-center gap-2 transition-colors
                ${currentStep === 1
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <ArrowLeft className="w-4 h-4" />
              Indietro
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`
                  w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 text-sm
                  bg-gradient-to-r from-[var(--partner-accent)] to-orange-500 
                  text-white font-semibold rounded-xl
                  hover:shadow-lg hover:scale-[1.02] 
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2
                  ${!canProceed() ? 'bg-gray-300 text-gray-500' : ''}
                `}
              >
                Continua
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className={`
                  w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 text-sm
                  bg-gradient-to-r from-[var(--partner-accent)] to-orange-500 
                  text-white font-semibold rounded-xl
                  hover:shadow-lg hover:scale-[1.02] 
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2
                  ${!canProceed() || loading ? 'bg-gray-300 text-gray-500' : ''}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrazione in corso...</span>
                  </>
                ) : (
                  <>
                    Completa registrazione
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Link login */}
        <p className="text-center partner-muted-text mt-6">
          Hai già un account?{' '}
          <Link to="/partner/login" className="partner-accent-text hover:underline font-medium">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

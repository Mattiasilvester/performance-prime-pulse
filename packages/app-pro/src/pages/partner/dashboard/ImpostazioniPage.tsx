import { useState } from 'react';
import { Tag, Bell, CreditCard, Lock, User, MapPin, FileText, Link as LinkIcon, Globe, ChevronRight, Wallet, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import { notificationSoundService } from '@/services/notificationSoundService';
import SpecializzazioniModal from '@/components/partner/settings/SpecializzazioniModal';
import LinguaModal from '@/components/partner/settings/LinguaModal';
import SocialLinksModal from '@/components/partner/settings/SocialLinksModal';
import NotificationsModal from '@/components/partner/settings/NotificationsModal';
import PrivacyModal from '@/components/partner/settings/PrivacyModal';
import CoverageAreaModal from '@/components/partner/settings/CoverageAreaModal';
import CancellationPolicyModal from '@/components/partner/settings/CancellationPolicyModal';
import AccountModal from '@/components/partner/settings/AccountModal';
import PaymentsModal from '@/components/partner/settings/PaymentsModal';
import AcceptPaymentMethodsModal from '@/components/partner/settings/AcceptPaymentMethodsModal';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const settingsSections: SettingSection[] = [
  {
    id: 'specializzazioni',
    title: 'Specializzazioni',
    description: 'Tag professionali',
    icon: Tag
  },
  {
    id: 'notifiche',
    title: 'Notifiche',
    description: 'Email e push',
    icon: Bell
  },
  {
    id: 'pagamenti',
    title: 'Pagamenti',
    description: 'Fatturazione e abbonamento',
    icon: CreditCard
  },
  {
    id: 'pagamenti-accettati',
    title: 'Pagamenti Accettati',
    description: 'Metodi accettati dai clienti',
    icon: Wallet
  },
  {
    id: 'privacy',
    title: 'Privacy',
    description: 'Visibilità profilo',
    icon: Lock
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Password e sicurezza',
    icon: User
  },
  {
    id: 'area-copertura',
    title: 'Area di Copertura',
    description: 'Zone di lavoro',
    icon: MapPin
  },
  {
    id: 'politiche-cancellazione',
    title: 'Politiche Cancellazione',
    description: 'Regole no-show',
    icon: FileText
  },
  {
    id: 'link-social',
    title: 'Link Social',
    description: 'Portfolio e social',
    icon: LinkIcon
  },
  {
    id: 'lingua',
    title: 'Lingua',
    description: 'Lingue parlate',
    icon: Globe
  }
];

export default function ImpostazioniPage() {
  const professionalId = useProfessionalId();
  const [showSpecializzazioniModal, setShowSpecializzazioniModal] = useState(false);
  const [showLinguaModal, setShowLinguaModal] = useState(false);
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCoverageAreaModal, setShowCoverageAreaModal] = useState(false);
  const [showCancellationPolicyModal, setShowCancellationPolicyModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showAcceptPaymentMethodsModal, setShowAcceptPaymentMethodsModal] = useState(false);

  const handleCardClick = (section: SettingSection) => {
    if (section.id === 'specializzazioni') {
      setShowSpecializzazioniModal(true);
    } else if (section.id === 'lingua') {
      setShowLinguaModal(true);
    } else if (section.id === 'link-social') {
      setShowSocialLinksModal(true);
    } else if (section.id === 'notifiche') {
      // BUG 2 fix: sblocca AudioContext al primo tap su Notifiche (suono notifiche su iOS)
      notificationSoundService.initialize().catch(() => {});
      setShowNotificationsModal(true);
    } else if (section.id === 'privacy') {
      setShowPrivacyModal(true);
    } else if (section.id === 'area-copertura') {
      setShowCoverageAreaModal(true);
    } else if (section.id === 'politiche-cancellazione') {
      setShowCancellationPolicyModal(true);
    } else if (section.id === 'account') {
      setShowAccountModal(true);
    } else if (section.id === 'pagamenti') {
      setShowPaymentsModal(true);
    } else if (section.id === 'pagamenti-accettati') {
      setShowAcceptPaymentMethodsModal(true);
    } else {
      toast.info(`Sezione ${section.title} in arrivo...`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Impostazioni</h1>
        <p className="text-gray-500">Configura le tue preferenze</p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rivedi guida - tour onboarding: rimuove "tour done" e ricarica overview per far ripartire il tour */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (professionalId) {
              localStorage.removeItem(`pp_dashboard_tour_done_${professionalId}`);
            } else {
              const keys = Object.keys(localStorage).filter((k) => k.startsWith('pp_dashboard_tour_done'));
              keys.forEach((k) => localStorage.removeItem(k));
            }
            window.location.href = '/partner/dashboard';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (professionalId) {
                localStorage.removeItem(`pp_dashboard_tour_done_${professionalId}`);
              } else {
                const keys = Object.keys(localStorage).filter((k) => k.startsWith('pp_dashboard_tour_done'));
                keys.forEach((k) => localStorage.removeItem(k));
              }
              window.location.href = '/partner/dashboard';
            }
          }}
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:border-[#EEBA2B] hover:shadow-sm transition-all duration-200 text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#EEBA2B]/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h3 className="font-semibold text-gray-900">Rivedi guida</h3>
          </div>
          <p className="text-sm text-gray-500">Rivedi il tour guidato per scoprire tutte le funzionalità di PrimePro.</p>
        </div>

        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => handleCardClick(section)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-[#EEBA2B] transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Icon + Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
                      <Icon className="w-6 h-6 text-[#EEBA2B]" />
                    </div>
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Right: Arrow */}
                <div className="flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#EEBA2B] transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal Specializzazioni */}
      {showSpecializzazioniModal && (
        <SpecializzazioniModal
          onClose={() => setShowSpecializzazioniModal(false)}
          onSuccess={() => {
            toast.success('Specializzazioni aggiornate!');
            setShowSpecializzazioniModal(false);
          }}
        />
      )}

      {/* Modal Lingua */}
      {showLinguaModal && (
        <LinguaModal
          onClose={() => setShowLinguaModal(false)}
          onSuccess={() => {
            setShowLinguaModal(false);
          }}
        />
      )}

      {/* Modal Link Social */}
      {showSocialLinksModal && (
        <SocialLinksModal
          onClose={() => setShowSocialLinksModal(false)}
          onSuccess={() => {
            setShowSocialLinksModal(false);
          }}
        />
      )}

      {/* Modal Notifiche */}
      {showNotificationsModal && (
        <NotificationsModal
          onClose={() => setShowNotificationsModal(false)}
          onSuccess={() => {
            toast.success('Preferenze notifiche aggiornate!');
            setShowNotificationsModal(false);
          }}
        />
      )}

      {/* Modal Privacy */}
      {showPrivacyModal && (
        <PrivacyModal
          onClose={() => setShowPrivacyModal(false)}
          onSuccess={() => {
            toast.success('Impostazioni privacy aggiornate!');
            setShowPrivacyModal(false);
          }}
        />
      )}

      {/* Modal Area di Copertura */}
      {showCoverageAreaModal && (
        <CoverageAreaModal
          onClose={() => setShowCoverageAreaModal(false)}
          onSuccess={() => {
            toast.success('Area di copertura aggiornata!');
            setShowCoverageAreaModal(false);
          }}
        />
      )}

      {/* Modal Politiche Cancellazione */}
      {showCancellationPolicyModal && (
        <CancellationPolicyModal
          onClose={() => setShowCancellationPolicyModal(false)}
          onSuccess={() => {
            toast.success('Politiche di cancellazione aggiornate!');
            setShowCancellationPolicyModal(false);
          }}
        />
      )}

      {/* Modal Account */}
      {showAccountModal && (
        <AccountModal
          onClose={() => setShowAccountModal(false)}
          onSuccess={() => {
            toast.success('Account aggiornato con successo!');
            setShowAccountModal(false);
          }}
        />
      )}

      {/* Modal Pagamenti */}
      {showPaymentsModal && (
        <PaymentsModal
          onClose={() => setShowPaymentsModal(false)}
          onSuccess={() => {
            setShowPaymentsModal(false);
          }}
        />
      )}

      {/* Modal Pagamenti Accettati */}
      {showAcceptPaymentMethodsModal && (
        <AcceptPaymentMethodsModal
          onClose={() => setShowAcceptPaymentMethodsModal(false)}
          onSuccess={() => {
            toast.success('Metodi di pagamento accettati aggiornati!');
            setShowAcceptPaymentMethodsModal(false);
          }}
        />
      )}
    </div>
  );
}

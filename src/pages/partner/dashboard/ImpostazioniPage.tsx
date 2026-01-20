import { useState } from 'react';
import { Tag, Bell, CreditCard, Lock, User, MapPin, FileText, Link as LinkIcon, Globe, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import SpecializzazioniModal from '@/components/partner/settings/SpecializzazioniModal';
import LinguaModal from '@/components/partner/settings/LinguaModal';
import SocialLinksModal from '@/components/partner/settings/SocialLinksModal';

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
    description: 'Stripe e fatturazione',
    icon: CreditCard
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
  const [showSpecializzazioniModal, setShowSpecializzazioniModal] = useState(false);
  const [showLinguaModal, setShowLinguaModal] = useState(false);
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);

  const handleCardClick = (section: SettingSection) => {
    if (section.id === 'specializzazioni') {
      setShowSpecializzazioniModal(true);
    } else if (section.id === 'lingua') {
      setShowLinguaModal(true);
    } else if (section.id === 'link-social') {
      setShowSocialLinksModal(true);
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
    </div>
  );
}

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Quando inizia la fatturazione?',
    answer: 'La fatturazione inizia automaticamente al termine del periodo di prova gratuito di 3 mesi. Ti invieremo un promemoria via email 14 giorni prima della scadenza.',
  },
  {
    question: 'Posso cancellare in qualsiasi momento?',
    answer: 'Sì, puoi cancellare il tuo abbonamento in qualsiasi momento. Continuerai ad avere accesso alle funzionalità premium fino alla fine del periodo di fatturazione corrente.',
  },
  {
    question: 'Quali metodi di pagamento accettate?',
    answer: 'Accettiamo tutte le principali carte di credito e debito (Visa, Mastercard, American Express). I pagamenti sono gestiti in modo sicuro da Stripe.',
  },
  {
    question: 'Cosa succede ai miei dati se cancello?',
    answer: 'I tuoi dati rimarranno salvati per 30 giorni dopo la cancellazione. Durante questo periodo puoi riattivare il tuo account e recuperare tutto. Dopo 30 giorni, i dati verranno eliminati definitivamente.',
  },
  {
    question: 'Posso ottenere un rimborso?',
    answer: 'Offriamo un rimborso completo entro i primi 14 giorni dall\'inizio dell\'abbonamento a pagamento. Dopo questo periodo, non sono previsti rimborsi ma puoi cancellare in qualsiasi momento.',
  },
  {
    question: 'Come posso contattare il supporto?',
    answer: 'Puoi contattarci via email a supporto@performanceprime.it o tramite la chat di supporto disponibile nella sezione Assistenza. Rispondiamo entro 24 ore lavorative.',
  },
];

export function SubscriptionFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Domande frequenti</h2>
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {FAQ_ITEMS.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Question */}
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </button>

            {/* Answer */}
            {openIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Non trovi la risposta che cerchi?{' '}
          <a
            href="/partner/assistenza"
            className="text-[#EEBA2B] hover:text-[#d4a826] font-medium transition-colors"
          >
            Contatta il supporto
          </a>
        </p>
      </div>
    </div>
  );
}

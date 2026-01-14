import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Filter } from 'lucide-react';

export function PartnerInterfaceSection() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'clienti'>('agenda');

  return (
    <section className="partner-section-bg py-12 sm:py-14 lg:py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="inline-block partner-accent-text text-xs font-bold uppercase tracking-widest mb-3">
            L'INTERFACCIA
          </div>
          <h2 className="partner-heading text-3xl sm:text-4xl font-bold mb-3">
            Semplice, intuitiva, professionale
          </h2>
          <p className="text-base sm:text-lg partner-muted-text max-w-2xl mx-auto">
            Un'interfaccia pensata per farti lavorare meglio, non per complicarti la vita.
          </p>
        </motion.div>

        {/* Toggle Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex rounded-full bg-gray-100 p-1.5 gap-3">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === 'agenda'
                  ? 'bg-[#001f3f] text-white shadow-sm'
                  : 'bg-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Agenda Interattiva
            </button>
            <button
              onClick={() => setActiveTab('clienti')}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === 'clienti'
                  ? 'bg-[#001f3f] text-white shadow-sm'
                  : 'bg-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Gestione Clienti
            </button>
          </div>
        </motion.div>

        {/* Screenshot Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] border border-gray-200">
            <div className="h-[280px] sm:h-[340px] lg:h-[420px] bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center relative">
              {activeTab === 'agenda' ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-16 h-16 text-[#001f3f] mx-auto mb-3 opacity-80" />
                    <p className="text-gray-700 font-semibold text-base">Agenda Interattiva</p>
                    <p className="text-xs text-gray-500 mt-1">app.performanceprime.it</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-[#001f3f] mx-auto mb-3 opacity-80" />
                    <p className="text-gray-700 font-semibold text-base">Gestione Clienti</p>
                    <p className="text-xs text-gray-500 mt-1">app.performanceprime.it</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Highlights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8"
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-[#001f3f]/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-[#001f3f]" />
            </div>
            <h3 className="text-sm font-semibold partner-foreground-text mb-2">
              Vista settimanale
            </h3>
            <p className="text-sm partner-muted-text leading-relaxed">
              Visualizza tutti gli appuntamenti a colpo d'occhio
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-[#001f3f]/10 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-[#001f3f]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold partner-foreground-text mb-2">
              Drag & drop
            </h3>
            <p className="text-sm partner-muted-text leading-relaxed">
              Sposta gli appuntamenti con un semplice trascinamento
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-[#001f3f]/10 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6 text-[#001f3f]" />
            </div>
            <h3 className="text-sm font-semibold partner-foreground-text mb-2">
              Filtri avanzati
            </h3>
            <p className="text-sm partner-muted-text leading-relaxed">
              Trova subito ciò che cerchi con i filtri rapidi
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


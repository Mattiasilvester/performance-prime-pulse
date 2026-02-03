import React from 'react';
import { ChallengeModalData } from '@/types/medalSystem';

interface ChallengeModalProps {
  modalData: ChallengeModalData;
  onClose: () => void;
  onStartChallenge?: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  modalData,
  onClose,
  onStartChallenge
}) => {
  if (!modalData.isOpen) return null;

  const isCompleted = modalData.progress >= modalData.target;
  const isChallengeActive = modalData.challengeType === 'kickoff_7days' && !isCompleted;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[45] p-4">
      <div className="bg-gray-900 border border-pp-gold/30 rounded-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-pp-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">{modalData.icon}</span>
          </div>
          <h2 className="text-2xl font-bold text-pp-gold mb-2">{modalData.title}</h2>
          <p className="text-pp-gold/80">{modalData.description}</p>
        </div>

        {/* Progress Section */}
        {isChallengeActive && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-pp-gold/80">Progresso</span>
              <span className="text-sm font-semibold text-pp-gold">
                {modalData.progress}/{modalData.target}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-pp-gold h-3 rounded-full transition-all duration-300"
                style={{ width: `${(modalData.progress / modalData.target) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-pp-gold/60 mt-2 text-center">
              {modalData.daysRemaining} giorni rimanenti
            </p>
          </div>
        )}

        {/* Completion Section */}
        {isCompleted && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-center">
              <span className="text-2xl mb-2 block">🎉</span>
              <p className="text-green-400 font-semibold">Sfida Completata!</p>
              <p className="text-green-300 text-sm mt-1">
                Hai sbloccato il badge Kickoff Champion!
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isChallengeActive ? (
            <button
              onClick={onClose}
              className="w-full bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Continua Allenamento
            </button>
          ) : isCompleted ? (
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Vedi Medaglie
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  onStartChallenge?.();
                  onClose();
                }}
                className="w-full bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Accetta Sfida
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Più tardi
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {isCompleted 
              ? 'Il badge è stato aggiunto alla tua collezione!'
              : 'Completa la sfida per sbloccare medaglie esclusive'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

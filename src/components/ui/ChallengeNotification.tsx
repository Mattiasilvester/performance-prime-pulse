import React from 'react';

interface ChallengeNotificationProps {
  message: string;
  type: 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const ChallengeNotification: React.FC<ChallengeNotificationProps> = ({
  message,
  type,
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '🎉';
      case 'info':
        return '🔥';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50';
      case 'info':
        return 'bg-pp-gold/20 border-pp-gold/50';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50';
      default:
        return 'bg-blue-500/20 border-blue-500/50';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-pp-gold';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`${getBgColor()} border rounded-lg p-4 shadow-lg backdrop-blur-sm`}>
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{getIcon()}</div>
          <div className="flex-1">
            <p className={`${getTextColor()} font-medium text-sm`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${getTextColor()} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

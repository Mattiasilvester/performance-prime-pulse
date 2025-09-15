import { MessageCircle } from 'lucide-react';

export default function FeedbackWidget() {
  return (
    <button
      data-tally-open="mDL24Z"
      data-tally-emoji-text="💪"
      data-tally-emoji-animation="wave"
      className="fixed bottom-24 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all hover:scale-110 feedback-widget"
      style={{ bottom: '96px !important' }}
      aria-label="Dai il tuo feedback"
    >
      <MessageCircle size={20} />
    </button>
  );
}

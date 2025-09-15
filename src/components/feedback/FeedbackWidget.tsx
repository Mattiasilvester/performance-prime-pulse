import { MessageCircle } from 'lucide-react';

export default function FeedbackWidget() {
  return (
    <button
      data-tally-open="mDL24Z"
      data-tally-emoji-text="💪"
      data-tally-emoji-animation="wave"
      className="fixed bottom-24 right-4 sm:bottom-20 sm:right-6 z-[99999] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all hover:scale-110"
      aria-label="Dai il tuo feedback"
    >
      <MessageCircle size={24} />
    </button>
  );
}

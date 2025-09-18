import { MessageCircle } from 'lucide-react';

export default function FeedbackWidget() {
  return (
    <button
      data-tally-open="mDL24Z"
      data-tally-emoji-text="💪"
      data-tally-emoji-animation="wave"
      className="feedback-widget fixed bottom-24 right-4 z-[60] w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
      aria-label="Dai il tuo feedback"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
}

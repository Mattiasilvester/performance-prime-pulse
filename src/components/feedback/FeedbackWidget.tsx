import { MessageCircle } from 'lucide-react';

export default function FeedbackWidget() {
  return (
    <button
      data-tally-open="mDL24Z"
      data-tally-emoji-text="💪"
      data-tally-emoji-animation="wave"
      className="feedback-widget fixed bottom-20 right-4 z-[60] w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
      aria-label="Dai il tuo feedback"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
}

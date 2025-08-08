// MessageBubble Component
// Bubble per singolo messaggio PrimeBot

import React from 'react';
import { ChatMessage } from '@/hooks/usePrimeBotChat';
import { Button } from '@/components/ui/button';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onChoiceSelect?: (choice: any) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onChoiceSelect 
}) => {
  const isUser = message.sender === 'user';
  const isTyping = message.isTyping;

  const handleChoiceClick = (choice: any) => {
    if (onChoiceSelect) {
      onChoiceSelect(choice);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gradient-to-r from-[#EEBA2B] to-[#FFD700] text-gray-800'
        }`}>
          {isUser ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 border border-gray-200'
          }`}>
            {/* Typing Indicator */}
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">PrimeBot sta scrivendo...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </div>

          {/* Choice Buttons */}
          {message.buttons && message.buttons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.buttons.map((button) => (
                <Button
                  key={button.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleChoiceClick(button.action)}
                  className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                >
                  {button.text}
                </Button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            {message.timestamp.toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

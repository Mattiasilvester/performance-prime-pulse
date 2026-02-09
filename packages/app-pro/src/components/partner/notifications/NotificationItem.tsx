// src/components/partner/notifications/NotificationItem.tsx

import { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  X, 
  UserPlus, 
  FolderKanban, 
  Star, 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProfessionalNotification } from '@/hooks/usePartnerNotifications';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface NotificationItemProps {
  notification: ProfessionalNotification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  /** Se presente e la notifica ha data.action_url, al click si naviga a tale URL */
  onNavigateToUrl?: (url: string) => void;
}

// Icone per tipo notifica
const getNotificationIcon = (type: ProfessionalNotification['type']) => {
  switch (type) {
    case 'new_booking':
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'booking_reminder':
      return Calendar;
    case 'new_client':
      return UserPlus;
    case 'new_project':
      return FolderKanban;
    case 'new_review':
    case 'review_response':
      return Star;
    case 'custom':
      return MessageSquare;
    default:
      return MessageSquare;
  }
};

// Colori per tipo notifica
const getNotificationColor = (type: ProfessionalNotification['type']) => {
  switch (type) {
    case 'new_booking':
      return 'text-blue-600 bg-blue-50';
    case 'booking_confirmed':
      return 'text-green-600 bg-green-50';
    case 'booking_cancelled':
      return 'text-red-600 bg-red-50';
    case 'booking_reminder':
      return 'text-orange-600 bg-orange-50';
    case 'new_client':
      return 'text-purple-600 bg-purple-50';
    case 'new_project':
      return 'text-indigo-600 bg-indigo-50';
    case 'new_review':
    case 'review_response':
      return 'text-[#EEBA2B] bg-[#EEBA2B]/10';
    case 'custom':
      return 'text-[#EEBA2B] bg-[#EEBA2B]/10';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export function NotificationItem({ notification, onMarkAsRead, onRemove, onNavigateToUrl }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);
  const [isExpanded, setIsExpanded] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Formatta data relativa (es. "2 ore fa")
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: it
  });

  // Verifica se il messaggio è troncato
  // Stima: ~50 caratteri per riga, quindi ~100 caratteri per 2 righe
  // Se il messaggio è più lungo, probabilmente è troncato
  useEffect(() => {
    // Stima approssimativa: se il messaggio è più lungo di 100 caratteri, è probabilmente troncato
    // Oppure verifica effettiva se l'elemento ha scrollHeight > clientHeight
    if (messageRef.current) {
      const element = messageRef.current;
      // Verifica se il testo è effettivamente troncato
      // Con line-clamp-2, se scrollHeight > clientHeight, c'è overflow
      const hasOverflow = element.scrollHeight > element.clientHeight;
      // Oppure usa una stima basata sulla lunghezza (più affidabile)
      const estimatedLines = notification.message.length / 50; // ~50 caratteri per riga
      setIsTruncated(hasOverflow || estimatedLines > 2);
    }
  }, [notification.message]);

  const actionUrl = notification.data && typeof notification.data === 'object' && (notification.data as { action_url?: string }).action_url;

  const handleClick = (e: React.MouseEvent) => {
    // Se clicchi sul bottone elimina, non fare toggle
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Se la notifica ha action_url (es. Report settimanale), naviga e marca come letta
    if (actionUrl && onNavigateToUrl) {
      if (!notification.is_read) onMarkAsRead(notification.id);
      onNavigateToUrl(actionUrl);
      return;
    }

    // Toggle espansione se il messaggio è troncato
    if (isTruncated) {
      setIsExpanded(!isExpanded);
    }

    // Marca come letta se non già letta
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`
        relative p-3 rounded-lg border transition-all duration-200 group cursor-pointer
        ${notification.is_read
          ? 'bg-gray-50 border-gray-200 opacity-75'
          : 'bg-white border-gray-200 shadow-sm'
        }
        hover:shadow-md hover:border-[#EEBA2B]/30
      `}
      onClick={handleClick}
    >
      {/* Bottone elimina */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-full"
      >
        <X className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
      </button>

      <div className="flex gap-3 pr-6">
        {/* Icona */}
        <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Contenuto */}
        <div className="flex-1 min-w-0">
          {/* Badge "Promemoria" se type = 'custom' */}
          {notification.type === 'custom' && (
            <div className="mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EEBA2B]/10 text-[#EEBA2B] border border-[#EEBA2B]/30">
                Promemoria
              </span>
            </div>
          )}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Icona espandi/collassa se il messaggio è troncato */}
              {isTruncated && (
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              )}
              {!notification.is_read && (
                <div className="flex-shrink-0 w-2 h-2 bg-[#EEBA2B] rounded-full mt-1.5" />
              )}
            </div>
          </div>
          <p 
            ref={messageRef}
            className={`text-sm text-gray-600 mb-2 transition-all duration-200 ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
          >
            {notification.message}
          </p>
          <p className="text-xs text-gray-400">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}

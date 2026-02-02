// Componente per visualizzare un gruppo di notifiche raggruppate
import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, UserPlus, Star } from 'lucide-react';
import { NotificationGroup as NotificationGroupType } from '@/utils/notificationGrouping';
import { NotificationItem } from './NotificationItem';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface NotificationGroupProps {
  group: NotificationGroupType;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onMarkGroupAsRead: (notificationIds: string[]) => void;
  onNavigateToUrl?: (url: string) => void;
}

export function NotificationGroup({
  group,
  onMarkAsRead,
  onRemove,
  onMarkGroupAsRead,
  onNavigateToUrl,
}: NotificationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(group.latestDate, {
    addSuffix: true,
    locale: it
  });

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMarkGroupAsRead = () => {
    const unreadIds = group.notifications
      .filter(n => !n.is_read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      onMarkGroupAsRead(unreadIds);
    }
  };

  // Icona e colore basati sul tipo
  const getGroupIcon = () => {
    switch (group.type) {
      case 'new_booking':
      case 'booking_confirmed':
      case 'booking_cancelled':
        return Calendar;
      case 'new_client':
        return UserPlus;
      case 'new_review':
        return Star;
      default:
        return Calendar;
    }
  };

  const GroupIcon = getGroupIcon();

  const getGroupColor = () => {
    switch (group.type) {
      case 'new_booking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'booking_confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'booking_cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'new_client':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'new_review':
        return 'text-[#EEBA2B] bg-[#EEBA2B]/10 border-[#EEBA2B]/30';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`
        rounded-lg border transition-all duration-200
        ${group.isRead
          ? 'bg-gray-50 border-gray-200 opacity-75'
          : 'bg-white border-gray-200 shadow-sm'
        }
        hover:shadow-md hover:border-[#EEBA2B]/30
      `}
    >
      {/* Header gruppo - sempre visibile */}
      <div
        className="p-3 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icona + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 p-2 rounded-lg ${getGroupColor()}`}>
              <GroupIcon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold text-sm ${group.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                  {group.title}
                </h4>
                {!group.isRead && (
                  <div className="flex-shrink-0 w-2 h-2 bg-[#EEBA2B] rounded-full" />
                )}
              </div>
              <p className="text-xs text-gray-400">
                {timeAgo}
              </p>
            </div>
          </div>

          {/* Right: Badge count + Chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`
              px-2 py-1 rounded-full text-xs font-semibold
              ${group.isRead 
                ? 'bg-gray-200 text-gray-600' 
                : 'bg-[#EEBA2B] text-black'
              }
            `}>
              {group.count}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Notifiche raggruppate - visibili quando espanso */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50/50">
          <div className="p-2 space-y-2">
            {/* Bottone "Segna tutte come lette" se ci sono non lette */}
            {!group.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkGroupAsRead();
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#EEBA2B] hover:bg-[#EEBA2B]/10 rounded-lg transition-colors"
              >
                Segna tutte come lette
              </button>
            )}

            {/* Lista notifiche */}
            {group.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onRemove={onRemove}
                onNavigateToUrl={onNavigateToUrl}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

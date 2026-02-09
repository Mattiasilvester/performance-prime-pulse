// Utility per raggruppare notifiche simili
import { ProfessionalNotification } from '@/hooks/usePartnerNotifications';
import { format, isSameDay, differenceInHours } from 'date-fns';

export interface NotificationGroup {
  id: string;
  type: ProfessionalNotification['type'];
  title: string;
  notifications: ProfessionalNotification[];
  count: number;
  latestDate: Date;
  isRead: boolean;
}

/**
 * Raggruppa notifiche per tipo e data
 * Notifiche dello stesso tipo create nello stesso giorno vengono raggruppate
 */
export function groupNotifications(
  notifications: ProfessionalNotification[],
  groupByHours: number = 24
): (NotificationGroup | ProfessionalNotification)[] {
  if (notifications.length === 0) {
    return [];
  }

  // Tipi di notifiche che possono essere raggruppate
  const groupableTypes: ProfessionalNotification['type'][] = [
    'new_booking',
    'booking_confirmed',
    'booking_cancelled',
    'new_client',
    'new_review'
  ];

  const result: (NotificationGroup | ProfessionalNotification)[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];

    // Se già processata, salta
    if (processed.has(notification.id)) {
      continue;
    }

    // Se il tipo non è raggruppabile, aggiungi come singola notifica
    if (!groupableTypes.includes(notification.type)) {
      result.push(notification);
      processed.add(notification.id);
      continue;
    }

    // Cerca altre notifiche dello stesso tipo da raggruppare
    const group: ProfessionalNotification[] = [notification];
    const notificationDate = new Date(notification.created_at);

    for (let j = i + 1; j < notifications.length; j++) {
      const otherNotification = notifications[j];

      if (processed.has(otherNotification.id)) {
        continue;
      }

      // Se stesso tipo
      if (otherNotification.type === notification.type) {
        const otherDate = new Date(otherNotification.created_at);
        const hoursDiff = Math.abs(differenceInHours(notificationDate, otherDate));

        // Se create entro le ore specificate (default 24h), raggruppa
        if (hoursDiff <= groupByHours) {
          group.push(otherNotification);
          processed.add(otherNotification.id);
        }
      }
    }

    // Se c'è solo una notifica, aggiungi come singola
    if (group.length === 1) {
      result.push(group[0]);
      processed.add(group[0].id);
    } else {
      // Crea gruppo
      const groupData: NotificationGroup = {
        id: `group-${notification.type}-${notification.created_at}`,
        type: notification.type,
        title: getGroupTitle(notification.type, group.length),
        notifications: group.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        count: group.length,
        latestDate: new Date(
          Math.max(...group.map(n => new Date(n.created_at).getTime()))
        ),
        isRead: group.every(n => n.is_read)
      };
      result.push(groupData);
      processed.add(notification.id);
    }
  }

  return result;
}

/**
 * Genera titolo per gruppo di notifiche
 */
function getGroupTitle(type: ProfessionalNotification['type'], count: number): string {
  switch (type) {
    case 'new_booking':
      return `${count} nuove prenotazioni`;
    case 'booking_confirmed':
      return `${count} prenotazioni confermate`;
    case 'booking_cancelled':
      return `${count} prenotazioni cancellate`;
    case 'new_client':
      return `${count} nuovi clienti`;
    case 'new_review':
      return `${count} nuove recensioni`;
    default:
      return `${count} notifiche`;
  }
}

/**
 * Verifica se un elemento è un gruppo
 */
export function isNotificationGroup(
  item: NotificationGroup | ProfessionalNotification
): item is NotificationGroup {
  return 'notifications' in item && Array.isArray((item as NotificationGroup).notifications);
}

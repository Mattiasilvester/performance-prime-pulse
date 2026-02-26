import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Formatta una data in formato italiano (dd/MM/yyyy)
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: it });
  } catch {
    return dateString;
  }
}

/**
 * Formatta una data con ora in formato italiano (dd/MM/yyyy alle HH:mm)
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy 'alle' HH:mm", { locale: it });
  } catch {
    return dateString;
  }
}



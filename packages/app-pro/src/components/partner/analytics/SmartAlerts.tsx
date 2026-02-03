/**
 * Step 9: Alert intelligenti basati su analisi dati.
 */
import { useState } from 'react';
import type { SmartAlert } from '@/services/analyticsService';

const MAX_VISIBLE = 4;

const typeStyles: Record<
  SmartAlert['type'],
  { border: string; bg: string; text: string }
> = {
  success: { border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-400' },
  warning: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  info: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  danger: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
};

interface SmartAlertsProps {
  alerts: SmartAlert[];
}

export function SmartAlerts({ alerts }: SmartAlertsProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? alerts : alerts.slice(0, MAX_VISIBLE);
  const hasMore = alerts.length > MAX_VISIBLE;

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert, i) => {
        const style = typeStyles[alert.type];
        return (
          <div
            key={`${alert.type}-${i}`}
            className={`rounded-lg border p-3 ${style.border} ${style.bg} ${style.text}`}
          >
            <span className="mr-2">{alert.icon}</span>
            <span className="text-sm">{alert.message}</span>
          </div>
        );
      })}
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-[#EEBA2B] hover:underline"
        >
          Mostra tutti ({alerts.length})
        </button>
      )}
    </div>
  );
}

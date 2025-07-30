import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './AzioniRapide.module.css';

interface AzioneRapidaCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const AzioneRapidaCard = ({
  title,
  subtitle,
  icon: Icon,
  color,
  textColor,
  onClick,
  disabled = false,
  loading = false,
}: AzioneRapidaCardProps) => {
  return (
    <div className={`${styles.azioneCard} ${loading ? styles.loading : ''}`}>
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${color} ${textColor} h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pp-gold focus:ring-opacity-50 w-full`}
        aria-label={`Azione rapida: ${title}`}
        aria-describedby={`${title.toLowerCase().replace(/\s+/g, '-')}-description`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
        <div className="text-center">
          <p className="font-medium text-sm">{title}</p>
          <p 
            id={`${title.toLowerCase().replace(/\s+/g, '-')}-description`}
            className="text-xs opacity-90"
          >
            {subtitle}
          </p>
        </div>
      </Button>
    </div>
  );
}; 
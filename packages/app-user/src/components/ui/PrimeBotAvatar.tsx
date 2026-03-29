import React from 'react';

export interface PrimeBotAvatarProps {
  size?: number;
  className?: string;
  /** small = robot 28x28 (bubble). head = solo testa del robot grande (viewBox 90x118). */
  variant?: 'small' | 'head';
}

/** Robot "piccolo" — viewBox 0 0 28 28, colori #EEBA2B / #1A1A20. */
function SmallRobot({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className} aria-hidden>
      <rect x="4" y="7" width="20" height="15" rx="6" fill="#1A1A20" stroke="#EEBA2B" strokeWidth="1.2" />
      <circle cx="10" cy="14" r="2.5" fill="#EEBA2B" />
      <circle cx="18" cy="14" r="2.5" fill="#EEBA2B" />
      <circle cx="14" cy="4" r="2" fill="#EEBA2B" />
      <line x1="14" y1="6" x2="14" y2="8" stroke="#EEBA2B" strokeWidth="1.2" />
    </svg>
  );
}

/** Solo testa del robot grande — antenna, rettangolo testa, occhi, bocca. viewBox 12 0 66 60. */
function HeadRobot({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="12 0 66 60" fill="none" className={className} aria-hidden>
      <line x1="45" y1="5" x2="45" y2="14" stroke="#EEBA2B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="45" cy="4" r="4" fill="#EEBA2B" />
      <circle cx="45" cy="4" r="7" fill="rgba(238,186,43,0.15)" />
      <rect x="12" y="13" width="66" height="46" rx="22" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2.2" />
      <ellipse cx="45" cy="22" rx="22" ry="6" fill="rgba(255,255,255,0.04)" />
      <rect x="17" y="18" width="56" height="36" rx="16" fill="#0A0A0C" stroke="rgba(238,186,43,0.15)" strokeWidth="1" />
      <ellipse cx="33" cy="36" rx="10" ry="11" fill="#111118" stroke="rgba(238,186,43,0.25)" strokeWidth="1.2" />
      <ellipse cx="33" cy="36" rx="7.5" ry="8.5" fill="#EEBA2B" opacity="0.92" />
      <circle cx="33" cy="36" r="4" fill="#0A0A0C" />
      <circle cx="35.2" cy="33.5" r="1.8" fill="white" opacity="0.7" />
      <ellipse cx="57" cy="36" rx="10" ry="11" fill="#111118" stroke="rgba(238,186,43,0.25)" strokeWidth="1.2" />
      <ellipse cx="57" cy="36" rx="7.5" ry="8.5" fill="#EEBA2B" opacity="0.92" />
      <circle cx="57" cy="36" r="4" fill="#0A0A0C" />
      <circle cx="59.2" cy="33.5" r="1.8" fill="white" opacity="0.7" />
      <path d="M34 49 Q45 55 56 49" stroke="#EEBA2B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

export default function PrimeBotAvatar({ size = 28, className, variant = 'small' }: PrimeBotAvatarProps) {
  if (variant === 'head') {
    return <HeadRobot size={size} className={className} />;
  }
  return <SmallRobot size={size} className={className} />;
}

// src/components/ui/ToggleSwitch.tsx
// Toggle Switch Stile iOS/Apple - Design Standard per tutto il progetto

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

/**
 * Toggle Switch con design iOS/Apple standard.
 * 
 * Caratteristiche:
 * - Track rettangolare (pill-shape): 51px x 31px
 * - Pallino bianco: 27px che scorre dentro il track
 * - ON: Track oro (#EEBA2B), pallino a destra
 * - OFF: Track grigio (#d1d5db), pallino a sinistra
 * - Transizione smooth: 200ms cubic-bezier
 * - Accessibilità: role="switch", aria-checked, focus ring
 */
export const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false,
  id,
  'aria-label': ariaLabel 
}: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '51px',
        height: '31px',
        padding: '2px',
        borderRadius: '15.5px', // Metà dell'altezza per pill-shape perfetta
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: checked ? '#EEBA2B' : '#d1d5db',
        transition: 'background-color 200ms ease-in-out',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
        // Forza aspect ratio rettangolare (larghezza >> altezza)
        minWidth: '51px',
        maxWidth: '51px',
        minHeight: '31px',
        maxHeight: '31px',
        boxSizing: 'border-box'
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(238, 186, 43, 0.5)';
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        style={{
          display: 'block',
          width: '27px',
          height: '27px',
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)',
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          pointerEvents: 'none',
          flexShrink: 0
        }}
      />
    </button>
  );
};

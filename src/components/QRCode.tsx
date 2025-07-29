import React from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

const QRCodeComponent: React.FC<QRCodeProps> = ({ 
  url, 
  size = 200, 
  className = '' 
}) => {
  return (
    <div className={`qr-code-container ${className}`}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '12px',
          border: '3px solid #fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backgroundColor: '#fff',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img 
          src="/qr-code-mvp.png" 
          alt="QR Code per Performance Prime MVP"
          style={{
            width: size - 16,
            height: size - 16
          }}
        />
      </div>
    </div>
  );
};

export default QRCodeComponent; 
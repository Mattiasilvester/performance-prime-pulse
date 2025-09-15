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
      <div className="qr-code-canvas">
        <img 
          src="/qr-code-mvp.png" 
          alt="QR Code per Performance Prime MVP"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    </div>
  );
};

export default QRCodeComponent; 
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
  // Genera QR Code usando un servizio online
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  
  return (
    <div className={`qr-code-container ${className}`}>
      <div className="qr-code-canvas">
        <img 
          src={qrCodeUrl}
          alt="QR Code per Performance Prime MVP"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            // Fallback: mostra un QR Code di testo
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  background: white;
                  color: black;
                  font-family: monospace;
                  font-size: 12px;
                  text-align: center;
                  padding: 10px;
                  box-sizing: border-box;
                ">
                  <div style="font-weight: bold; margin-bottom: 5px;">QR CODE</div>
                  <div style="word-break: break-all;">${url}</div>
                </div>
              `;
            }
          }}
        />
      </div>
    </div>
  );
};

export default QRCodeComponent; 
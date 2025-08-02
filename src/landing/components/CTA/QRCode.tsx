import React from 'react';

const QRCode = () => {
  return (
    <div className="qr-code-container">
      <div className="qr-code">
        <div className="qr-code-placeholder">
          <div className="qr-code-icon">📱</div>
          <p className="qr-code-text">Scansiona per accedere</p>
        </div>
      </div>
      <p className="qr-code-description">
        Scansiona il QR code con il tuo smartphone per accedere direttamente all'app
      </p>
    </div>
  );
};

export default QRCode; 
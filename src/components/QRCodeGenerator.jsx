import React, { useState, useEffect } from 'react';

const QRCodeGenerator = ({ sessionUrl }) => {
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Extract session ID from URL
  const sessionId = sessionUrl.split('/session/')[1];

  const handleQRClick = () => {
    const newShowQR = !showQR;
    setShowQR(newShowQR);
    
    // Save to localStorage for the result page
    if (sessionId) {
      localStorage.setItem(`qr_show_${sessionId}`, newShowQR.toString());
    }
  };

  useEffect(() => {
    if (showQR && sessionUrl) {
      // QR kód generálása a Google Charts API-val
      const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(sessionUrl)}&chco=000000&chld=L|0`;
      setQrCodeUrl(qrUrl);
    }
  }, [showQR, sessionUrl]);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleQRClick}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          marginLeft: '10px'
        }}
      >
        {showQR ? 'QR Kód elrejtése' : 'QR Kód megjelenítése'}
      </button>
      
      {showQR && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          border: '1px solid #ddd'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h4 style={{ margin: 0, color: '#333' }}>QR Kód</h4>
            <button 
              onClick={() => setShowQR(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            style={{
              width: '200px',
              height: '200px',
              display: 'block'
            }}
          />
          <p style={{
            margin: '10px 0 0 0',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center'
          }}>
            Olvasd be a QR kódot a csatlakozáshoz
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;

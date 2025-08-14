import React, { useEffect, useState } from 'react';

const QRCodeDisplay = ({ sessionUrl }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Extract session ID from URL
  const sessionId = sessionUrl.split('/session/')[1];

  const handleClose = () => {
    if (sessionId) {
      localStorage.setItem(`qr_show_${sessionId}`, 'false');
      window.location.reload(); // Refresh to hide QR code
    }
  };

     useEffect(() => {
     if (sessionUrl) {
       // QR kód generálása a Google Charts API-val
       // A sessionUrl már a teljes URL-t tartalmazza
       const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(sessionUrl)}&chco=000000&chld=L|0`;
       setQrCodeUrl(qrUrl);
     }
   }, [sessionUrl]);

  if (!qrCodeUrl) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      border: '1px solid #ddd',
      maxWidth: '170px'
    }}>
             <div style={{
         display: 'flex',
         justifyContent: 'flex-end',
         alignItems: 'center',
         marginBottom: '8px'
       }}>
         <button 
           onClick={handleClose}
           style={{
             background: 'none',
             border: 'none',
             fontSize: '16px',
             cursor: 'pointer',
             color: '#666',
             padding: '0',
             width: '20px',
             height: '20px',
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
          width: '150px',
          height: '150px',
          display: 'block',
          margin: '0 auto'
        }}
      />
      <p style={{
        margin: '8px 0 0 0',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center'
      }}>
        Olvasd be a csatlakozáshoz
      </p>
    </div>
  );
};

export default QRCodeDisplay;

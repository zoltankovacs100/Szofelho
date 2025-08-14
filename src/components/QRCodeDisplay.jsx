import React, { useEffect, useState } from 'react';

// MŰKÖDŐ VERZIÓ - 2025.08.14 11:30
// QR kód megjelenítés QR Server API-val (https://api.qrserver.com)
// Google Charts API helyett, mert az 404-es hibát adott
const QRCodeDisplay = ({ sessionUrl }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Extract session ID from URL
  const sessionId = sessionUrl.includes('/session/') ? sessionUrl.split('/session/')[1] : null;

  const handleClose = () => {
    if (sessionId) {
      localStorage.setItem(`qr_show_${sessionId}`, 'false');
      window.location.reload(); // Refresh to hide QR code
    }
  };

     useEffect(() => {
     if (sessionUrl) {
       console.log('QRCodeDisplay - sessionUrl:', sessionUrl);
       console.log('QRCodeDisplay - sessionId:', sessionId);
       // QR kód generálása a Google Charts API-val
       // A sessionUrl már a teljes URL-t tartalmazza
       const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(sessionUrl)}`;
       console.log('QRCodeDisplay - qrUrl:', qrUrl);
       setQrCodeUrl(qrUrl);
     }
   }, [sessionUrl, sessionId]);

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

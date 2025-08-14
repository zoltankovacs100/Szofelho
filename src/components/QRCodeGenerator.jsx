import React, { useState, useEffect } from 'react';

const QRCodeGenerator = ({ sessionUrl }) => {
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Extract session ID from URL
  const sessionId = sessionUrl.split('/session/')[1];

  const handleQRClick = async () => {
    if (!showQR) {
      // Ha megnyitjuk a QR kódot, először másoljuk a linket
      setIsLoading(true);
      
      try {
        // Link másolása
        await navigator.clipboard.writeText(sessionUrl);
        
                 // Késleltetés, hogy a felhasználó lássa a másolást
         setTimeout(() => {
           // QR kód generálása a teljes URL-ből
           console.log('QRCodeGenerator - sessionUrl:', sessionUrl);
           console.log('QRCodeGenerator - sessionId:', sessionId);
           const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sessionUrl)}`;
           console.log('QRCodeGenerator - qrUrl:', qrUrl);
           setQrCodeUrl(qrUrl);
           setShowQR(true);
           setIsLoading(false);
           
           // Save to localStorage for the result page
           if (sessionId) {
             localStorage.setItem(`qr_show_${sessionId}`, 'true');
           }
         }, 500); // 500ms késleltetés
        
      } catch (err) {
        console.error('Hiba a link másolásakor: ', err);
        setIsLoading(false);
                 // Ha nem sikerül másolni, akkor is generáljuk a QR kódot
         console.log('QRCodeGenerator - sessionUrl (fallback):', sessionUrl);
         const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sessionUrl)}`;
         console.log('QRCodeGenerator - qrUrl (fallback):', qrUrl);
         setQrCodeUrl(qrUrl);
         setShowQR(true);
        
        if (sessionId) {
          localStorage.setItem(`qr_show_${sessionId}`, 'true');
        }
      }
    } else {
      // Ha bezárjuk a QR kódot
      setShowQR(false);
      setQrCodeUrl('');
      
      if (sessionId) {
        localStorage.setItem(`qr_show_${sessionId}`, 'false');
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
             <button 
         onClick={handleQRClick}
         disabled={isLoading}
         style={{
           background: isLoading ? '#6c757d' : '#28a745',
           border: 'none',
           color: 'white',
           padding: '5px 10px',
           borderRadius: '6px',
           cursor: isLoading ? 'not-allowed' : 'pointer',
           fontSize: '0.9rem',
           marginLeft: '10px',
           opacity: isLoading ? 0.7 : 1
         }}
       >
         {isLoading ? 'Másolás...' : (showQR ? 'QR Kód elrejtése' : 'QR Kód megjelenítése')}
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
             justifyContent: 'flex-end',
             alignItems: 'center',
             marginBottom: '10px'
           }}>
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

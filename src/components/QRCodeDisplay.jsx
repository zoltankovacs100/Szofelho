import React, { useEffect, useState, useRef } from 'react';

// MŰKÖDŐ VERZIÓ - DRAGGOLHATÓ QR KÓD
// QR kód megjelenítés QR Server API-val (https://api.qrserver.com)
const QRCodeDisplay = ({ sessionUrl }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const qrRef = useRef(null);

  // Extract session ID from URL
  const sessionId = sessionUrl.includes('/session/') ? sessionUrl.split('/session/')[1] : null;

  const handleClose = () => {
    if (sessionId) {
      localStorage.setItem(`qr_show_${sessionId}`, 'false');
      window.location.reload(); // Refresh to hide QR code
    }
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.qr-close-btn')) return; // Ne draggolja ha a close gombra kattintunk
    
    const rect = qrRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Bounds checking to keep QR code within viewport
    const maxX = window.innerWidth - 190; // QR width + padding
    const maxY = window.innerHeight - 210; // QR height + padding
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

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
    <div 
      ref={qrRef}
      style={{
        position: 'fixed',
        left: position.x + 'px',
        top: position.y + 'px',
        background: 'white',
        padding: window.innerWidth < 768 ? '12px' : '15px',
        borderRadius: '12px',
        boxShadow: isDragging ? 
          '0 8px 25px rgba(0, 0, 0, 0.4)' : 
          '0 6px 20px rgba(0, 0, 0, 0.25)',
        zIndex: 1000,
        border: '2px solid #2d5016',
        maxWidth: window.innerWidth < 768 ? '160px' : '180px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with drag handle and close */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid #eee'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#2d5016',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ fontSize: '14px' }}>⋮⋮</span>
          QR Kód
        </div>
        <button 
          className="qr-close-btn"
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#999',
            padding: '2px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f0f0f0';
            e.target.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = '#999';
          }}
        >
          ×
        </button>
      </div>
      
      {/* QR Code */}
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        style={{
          width: window.innerWidth < 768 ? '130px' : '150px',
          height: window.innerWidth < 768 ? '130px' : '150px',
          display: 'block',
          margin: '0 auto',
          borderRadius: '6px',
          pointerEvents: 'none'
        }}
      />
      
      {/* Description */}
      <p style={{
        margin: '12px 0 0 0',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center',
        lineHeight: '1.3'
      }}>
        📱 Olvasd be a csatlakozáshoz
      </p>
      
      {/* Drag hint */}
      <p style={{
        margin: '8px 0 0 0',
        fontSize: '10px',
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Húzd el bárhová!
      </p>
    </div>
  );
};

export default QRCodeDisplay;

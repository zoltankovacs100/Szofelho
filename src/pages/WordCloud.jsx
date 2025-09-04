import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../localDb';
import { onAuthStateChanged, collection, addDoc, onSnapshot, query, serverTimestamp, doc, getDocs } from '../localDb';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { stylePresets } from '../styles';
import QRCodeDisplay from '../components/QRCodeDisplay';

// Teljes sémák az új styles.js-ből
const schemas = {
  schema1: {
    name: 'Zöld Természetes',
    description: 'Barátságos, organikus megjelenés Comic Sans betűtípussal és természetes zöld árnyalatokkal',
    background: 'linear-gradient(135deg, #8FBC8F 0%, #9ACD32 50%, #90EE90 100%)',
    fontFamily: 'Comic Sans MS, Apple Chancery, cursive',
    colors: ['#1B4332', '#2D5016', '#52B788', '#74C69D', '#95D5B2']
  },
  schema2: {
    name: 'Sötét Modern', 
    description: 'Elegáns sötét háttér Arial Black betűtípussal és vibráló színekkel',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    fontFamily: 'Arial Black, Helvetica Neue, Arial, sans-serif',
    colors: ['#FF4500', '#FF6B35', '#32CD32', '#87CEEB', '#DDA0DD']
  },
  schema3: {
    name: 'Világos Elegáns',
    description: 'Tiszta, professzionális megjelenés Times New Roman betűtípussal',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
    fontFamily: 'Times New Roman, Georgia, serif',
    colors: ['#1B4332', '#2F5233', '#40916C', '#52B788', '#74C69D']
  },
  schema4: {
    name: 'Professzionális',
    description: 'Üzleti stílus Arial betűtípussal és egyszerű színpalettal',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
    fontFamily: 'Arial, Helvetica, sans-serif',
    colors: ['#1B4332', '#2F5233', '#E76F51', '#F4A261', '#E9C46A']
  },
  schema5: {
    name: 'Színes Oktatási',
    description: 'Élénk, inspiráló színek Verdana betűtípussal az oktatási környezethez',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 50%, #e6f3ff 100%)',
    fontFamily: 'Verdana, Trebuchet MS, sans-serif',
    colors: ['#D73527', '#E74C3C', '#F39C12', '#27AE60', '#3498DB']
  }
};

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [words, setWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const cloudContainerRef = useRef(null);

  // Csak az admin által beállított stílust használja
  const activeSchema = sessionData?.styleId && stylePresets[sessionData.styleId] ? 
    {
      ...schemas[sessionData.styleId] || schemas['schema1'],
      background: stylePresets[sessionData.styleId].background,
      fontFamily: stylePresets[sessionData.styleId].fontFamily,
      colors: stylePresets[sessionData.styleId].wordColors
    } : 
    schemas['schema1']; // Alapértelmezett séma ha nincs admin beállítás

  // Check if user is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Check if QR code should be shown
  useEffect(() => {
    if (!sessionId) return;
    const shouldShowQR = localStorage.getItem(`qr_show_${sessionId}`);
    setShowQRCode(shouldShowQR === 'true');
  }, [sessionId]);

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      const sessionsSnapshot = await getDocs(query(collection(db, 'sessions')));
      const found = sessionsSnapshot.docs.find(d => d.id === sessionId);
      if (found) {
        setSessionData(found.data());
      } else {
        setError("A munkamenet nem található.");
      }
    };
    fetchSession();
    const intervalId = setInterval(fetchSession, 1000);
    return () => clearInterval(intervalId);
  }, [sessionId]);

  // Fetch words
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;
    const fetchWords = async () => {
      const wordsRef = collection(db, 'sessions', sessionId, 'words');
      const snapshot = await getDocs(query(wordsRef));
      const wordCounts = snapshot.docs.reduce((acc, doc) => {
        const text = doc.data().text;
        acc[text] = (acc[text] || 0) + 1;
        return acc;
      }, {});
      
      const formattedWords = Object.entries(wordCounts).map(([text, count]) => ({
        text, 
        count,
        size: Math.min(16 + count * 8, 60) // Font size based on count
      }));
      
      if (isMounted) {
        setWords(currentWords => {
          if (JSON.stringify(currentWords) !== JSON.stringify(formattedWords)) {
            return formattedWords;
          }
          return currentWords;
        });
      }
    };
    fetchWords();
    const intervalId = setInterval(fetchWords, 1000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [sessionId]);

  // Generate simple word cloud
  useEffect(() => {
    if (words.length > 0 && cloudContainerRef.current) {
      generateSimpleWordCloud();
    }
  }, [words, activeSchema]);

  // Stabil pozíciók tárolása szavanként
  const [wordPositions, setWordPositions] = useState(new Map());

  const generateSimpleWordCloud = () => {
    const container = cloudContainerRef.current;
    if (!container) return;
    
    container.innerHTML = '';
    
    // Simple grid-based layout
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    words.forEach((word, index) => {
      const wordElement = document.createElement('div');
      wordElement.textContent = word.text;
      wordElement.style.cssText = `
        position: absolute;
        font-family: ${activeSchema.fontFamily};
        font-size: ${word.size}px;
        font-weight: bold;
        color: ${activeSchema.colors[index % activeSchema.colors.length]};
        cursor: pointer;
        transition: transform 0.3s ease;
        user-select: none;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      `;
      
      // Ellenőrizzük, hogy van-e már mentett pozíció erre a szóra
      let position = wordPositions.get(word.text);
      
      if (!position) {
        // Új szó esetén generálunk új pozíciót
        const x = Math.random() * (containerWidth - word.text.length * word.size * 0.6);
        const y = Math.random() * (containerHeight - word.size);
        position = { x, y };
        
        // Mentjük az új pozíciót
        setWordPositions(prev => new Map(prev).set(word.text, position));
      }
      
      wordElement.style.left = position.x + 'px';
      wordElement.style.top = position.y + 'px';
      
      // Hover effect
      wordElement.addEventListener('mouseenter', () => {
        wordElement.style.transform = 'scale(1.2)';
        wordElement.style.zIndex = '100';
      });
      
      wordElement.addEventListener('mouseleave', () => {
        wordElement.style.transform = 'scale(1)';
        wordElement.style.zIndex = 'auto';
      });
      
      wordElement.title = `"${word.text}" - ${word.count}× előfordulás`;
      container.appendChild(wordElement);
    });
  };

  const handleWordSubmit = async (e) => {
    e.preventDefault();
    const trimmedWord = inputValue.trim().toLowerCase();
    if (!trimmedWord) return;
    setError('');
    try {
      await addDoc(collection(db, 'sessions', sessionId, 'words'), {
        text: trimmedWord,
        createdAt: serverTimestamp(),
      });
      setInputValue('');
    } catch (err) {
      setError('Hiba történt a szó beküldésekor.');
    }
  };

  const saveAsPdf = () => {
    if (!cloudContainerRef.current) return;
    
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    if (sessionData?.topic) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      const titleWidth = pdf.getTextWidth(sessionData.topic);
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(sessionData.topic, titleX, 30);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('hu-HU');
      pdf.text(`Generálva: ${currentDate}`, 20, 45);
    }
    
    html2canvas(cloudContainerRef.current, { 
      backgroundColor: '#ffffff',
      useCORS: true 
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 60;
      if (yPosition + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
      pdf.save(`${sessionData?.topic || 'szofelho'}.pdf`);
    });
  };

  return (
    <div style={{ 
      fontFamily: 'Segoe UI, sans-serif',
      background: 'linear-gradient(135deg, #2d5016 0%, #1B4332 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          {sessionData?.topic && (
            <h1 style={{ 
              color: '#2c3e50', 
              marginBottom: '20px', 
              fontSize: '2.2em',
              textAlign: 'center'
            }}>
              {sessionData.topic}
            </h1>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #2d5016 0%, #1B4332 100%)',
              color: 'white',
              fontSize: '1.1rem', 
              fontWeight: '600',
              padding: '10px 18px',
              borderRadius: '10px',
              boxShadow: '0 6px 15px rgba(45, 80, 22, 0.3)'
            }}>
              📍 {window.location.hostname}/{sessionData?.pin || '______'}
            </span>
          </div>
        </div>


        {/* Word input */}
        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
          <form onSubmit={handleWordSubmit} style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '10px', 
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '400px'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Írj be egy szót..."
              style={{ 
                padding: '12px 16px', 
                border: '2px solid #ddd', 
                borderRadius: '8px', 
                fontSize: '16px',
                width: '100%',
                maxWidth: '280px',
                minWidth: '200px'
              }}
            />
            <button 
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #2d5016 0%, #1B4332 100%)',
                color: 'white',
                border: 'none',
                padding: window.innerWidth < 768 ? '14px 24px' : '12px 20px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(45, 80, 22, 0.3)',
                width: window.innerWidth < 768 ? '100%' : 'auto'
              }}
            >
              Beküldés
            </button>
          </form>
          {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* Word Cloud Container */}
        <div 
          style={{
            background: activeSchema.background,
            borderRadius: '15px',
            minHeight: '500px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.1)',
            margin: '25px 0'
          }} 
          ref={cloudContainerRef}
        >
          {words.length === 0 && (
            <div style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', 
              color: 'rgba(0,0,0,0.6)', 
              fontSize: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌟</div>
              Írj be szavakat a szófelhő létrehozásához!
            </div>
          )}
        </div>

        {/* Controls */}
        {isAdmin && words.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button 
              onClick={saveAsPdf}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '25px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(40, 167, 69, 0.3)'
              }}
            >
              📄 Mentés PDF-be
            </button>
          </div>
        )}

        {/* Status - csak szószám */}
        {words.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
            📈 {words.length} különböző szó gyűjtve
          </div>
        )}

        {/* QR Code Display - draggolható felugró ablak */}
        {showQRCode && (
          <QRCodeDisplay sessionUrl={window.location.href} />
        )}
      </div>
    </div>
  );
};

export default WordCloud;
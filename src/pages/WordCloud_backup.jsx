import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../localDb';
import { onAuthStateChanged, collection, addDoc, onSnapshot, query, serverTimestamp, doc, getDocs } from '../localDb';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { stylePresets } from '../styles';
import CanvasWordCloud from '../components/CanvasWordCloud';
import NewWordCloud from '../components/WordCloud';
import QRCodeDisplay from '../components/QRCodeDisplay';
import QRCodeGenerator from '../components/QRCodeGenerator';

// Enhanced word cloud schemas from the HTML version
const schemas = {
  schema1: {
    name: 'Zöld Természetes',
    description: 'Barátságos, organikus megjelenés Comic Sans betűtípussal és természetes zöld árnyalatokkal',
    background: 'linear-gradient(135deg, #8FBC8F 0%, #9ACD32 50%, #90EE90 100%)',
    fontFamily: 'Comic Sans MS, Apple Chancery, cursive',
    colors: {
      'size-xl': '#1B4332',
      'size-l': '#2D5016', 
      'size-m': '#52B788',
      'size-s': '#74C69D',
      'size-xs': '#95D5B2'
    }
  },
  schema2: {
    name: 'Sötét Modern',
    description: 'Elegáns sötét háttér Arial Black betűtípussal és vibráló színekkel',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    fontFamily: 'Arial Black, Helvetica Neue, Arial, sans-serif',
    colors: {
      'size-xl': '#FF4500',
      'size-l': '#FF6B35',
      'size-m': '#32CD32', 
      'size-s': '#87CEEB',
      'size-xs': '#DDA0DD'
    }
  },
  schema3: {
    name: 'Világos Elegáns',
    description: 'Tiszta, professzionális megjelenés Times New Roman betűtípussal',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
    fontFamily: 'Times New Roman, Georgia, serif',
    colors: {
      'size-xl': '#1B4332',
      'size-l': '#2F5233',
      'size-m': '#40916C',
      'size-s': '#52B788', 
      'size-xs': '#74C69D'
    }
  },
  schema4: {
    name: 'Professzionális',
    description: 'Üzleti stílus Arial betűtípussal és egyszerű színpalettal',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
    fontFamily: 'Arial, Helvetica, sans-serif',
    colors: {
      'size-xl': '#1B4332',
      'size-l': '#2F5233',
      'size-m': '#E76F51',
      'size-s': '#F4A261',
      'size-xs': '#E9C46A'
    }
  },
  schema5: {
    name: 'Színes Oktatási',
    description: 'Élénk, inspiráló színek Verdana betűtípussal az oktatási környezethez',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 50%, #e6f3ff 100%)',
    fontFamily: 'Verdana, Trebuchet MS, sans-serif',
    colors: {
      'size-xl': '#D73527',
      'size-l': '#E74C3C',
      'size-m': '#F39C12',
      'size-s': '#27AE60',
      'size-xs': '#3498DB'
    }
  }
};

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [words, setWords] = useState([]);
  const [layoutWords, setLayoutWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentSchema, setCurrentSchema] = useState('schema1');
  const [spiralType, setSpiralType] = useState('archimedean');
  const [maxWords, setMaxWords] = useState(80);
  const [isGenerating, setIsGenerating] = useState(false);
  const cloudContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const activeStyle = sessionData ? stylePresets[sessionData.styleId] || stylePresets['style-4'] : stylePresets['style-4'];
  const activeSchema = schemas[currentSchema];

  // Word cloud generation functions from HTML version
  const calculateFontSize = (frequency, maxFreq, minFreq, rank, totalWords) => {
    const minSize = 16;
    const maxSize = 75;
    
    if (maxFreq === minFreq) return maxSize;
    
    const freqWeight = 0.7;
    const rankWeight = 0.3;
    
    const logFreq = Math.log(frequency + 1);
    const logMax = Math.log(maxFreq + 1);
    const logMin = Math.log(minFreq + 1);
    const freqRatio = (logFreq - logMin) / (logMax - logMin);
    
    const rankRatio = Math.max(0, 1 - (rank / totalWords));
    const combinedRatio = freqWeight * freqRatio + rankWeight * rankRatio;
    
    return Math.round(minSize + (maxSize - minSize) * combinedRatio);
  };

  const getSizeCategory = (fontSize) => {
    if (fontSize >= 60) return 'size-xl';
    if (fontSize >= 45) return 'size-l';
    if (fontSize >= 32) return 'size-m';
    if (fontSize >= 24) return 'size-s';
    return 'size-xs';
  };

  const getRotationAngle = () => {
    const rotations = [-30, -15, 0, 15, 30];
    const weights = [0.1, 0.2, 0.4, 0.2, 0.1];
    
    let random = Math.random();
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return rotations[i];
      }
      random -= weights[i];
    }
    return 0;
  };

  const archimedeanSpiral = (size) => {
    const e = size[0] / size[1];
    return function(t) {
      return [e * (t *= 0.1) * Math.cos(t), t * Math.sin(t)];
    };
  };

  const rectangularSpiral = (size) => {
    const dx = 6;
    const dy = 6;
    let x = 0, y = 0;
    
    return function(t) {
      const sign = t < 0 ? -1 : 1;
      const step = Math.floor(Math.sqrt(1 + 4 * sign * t) - sign) & 3;
      
      switch (step) {
        case 0: x += dx; break;
        case 1: y += dy; break;
        case 2: x -= dx; break;
        default: y -= dy; break;
      }
      return [size[0] / 2 + x, size[1] / 2 + y];
    };
  };

  const checkCollision = (word, placedWords, containerWidth, containerHeight) => {
    const padding = 12;
    const wordBounds = {
      left: word.x - word.width / 2,
      top: word.y - word.height / 2,
      right: word.x + word.width / 2,
      bottom: word.y + word.height / 2
    };

    if (wordBounds.left < padding || 
        wordBounds.top < padding || 
        wordBounds.right > containerWidth - padding || 
        wordBounds.bottom > containerHeight - padding) {
      return true;
    }

    for (let placedWord of placedWords) {
      const placedBounds = {
        left: placedWord.x - placedWord.width / 2,
        top: placedWord.y - placedWord.height / 2,
        right: placedWord.x + placedWord.width / 2,
        bottom: placedWord.y + placedWord.height / 2
      };

      if (wordBounds.left < placedBounds.right + padding &&
          wordBounds.right > placedBounds.left - padding &&
          wordBounds.top < placedBounds.bottom + padding &&
          wordBounds.bottom > placedBounds.top - padding) {
        return true;
      }
    }
    return false;
  };

  const placeWord = (word, spiral, containerWidth, containerHeight, placedWords) => {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    word.x = centerX;
    word.y = centerY;

    if (!checkCollision(word, placedWords, containerWidth, containerHeight)) {
      return true;
    }

    const maxSteps = 3000;
    for (let t = 0; t < maxSteps; t++) {
      const pos = spiral(t);
      word.x = centerX + pos[0];
      word.y = centerY + pos[1];

      if (!checkCollision(word, placedWords, containerWidth, containerHeight)) {
        return true;
      }
    }
    return false;
  };

  const generateEnhancedWordCloud = async () => {
    if (isGenerating || !words.length) return;
    
    setIsGenerating(true);
    const container = cloudContainerRef.current;
    if (!container) return;

    container.innerHTML = '';
    
    // Process words similar to HTML version
    const wordFreq = {};
    words.forEach(wordObj => {
      const cleanWord = wordObj.text.toLowerCase().replace(/[^\w\s\u00C0-\u017F\u0100-\u017F]/g, '');
      if (cleanWord && cleanWord.length > 1) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + wordObj.value;
      }
    });

    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxWords)
      .map(([word, freq], index) => ({ word, freq, rank: index }));

    if (sortedWords.length === 0) return;

    const maxFreq = sortedWords[0].freq;
    const minFreq = sortedWords[sortedWords.length - 1].freq;

    const spiralSize = [container.offsetWidth, container.offsetHeight];
    const spiral = spiralType === 'archimedean' ? 
      archimedeanSpiral(spiralSize) : rectangularSpiral(spiralSize);

    const placedWords = [];

    for (let i = 0; i < sortedWords.length; i++) {
      const wordObj = sortedWords[i];
      const fontSize = calculateFontSize(wordObj.freq, maxFreq, minFreq, i, sortedWords.length);
      const rotation = getRotationAngle();
      const sizeCategory = getSizeCategory(fontSize);

      // Estimate word dimensions (simplified)
      const width = wordObj.word.length * fontSize * 0.6;
      const height = fontSize * 1.2;

      const word = {
        text: wordObj.word,
        fontSize: fontSize,
        rotation: rotation,
        width: width,
        height: height,
        freq: wordObj.freq,
        rank: i,
        sizeCategory: sizeCategory
      };

      if (placeWord(word, spiral, container.offsetWidth, container.offsetHeight, placedWords)) {
        placedWords.push(word);
        
        const wordElement = document.createElement('div');
        wordElement.className = `word ${sizeCategory}`;
        wordElement.textContent = word.text;
        wordElement.style.cssText = `
          position: absolute;
          font-family: ${activeSchema.fontFamily};
          font-size: ${word.fontSize}px;
          font-weight: bold;
          color: ${activeSchema.colors[sizeCategory]};
          left: ${Math.max(0, word.x - word.width / 2)}px;
          top: ${Math.max(0, word.y - word.height / 2)}px;
          transform: rotate(${word.rotation}deg);
          transform-origin: center center;
          cursor: pointer;
          transition: all 0.4s ease;
          user-select: none;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
          white-space: nowrap;
          overflow: hidden;
        `;
        
        wordElement.title = `"${word.text}" - ${word.freq}× előfordulás`;
        
        wordElement.addEventListener('mouseenter', () => {
          wordElement.style.transform = `rotate(${word.rotation}deg) scale(1.15)`;
          wordElement.style.zIndex = '100';
          wordElement.style.textShadow = '2px 2px 8px rgba(0,0,0,0.4)';
        });
        
        wordElement.addEventListener('mouseleave', () => {
          wordElement.style.transform = `rotate(${word.rotation}deg) scale(1)`;
          wordElement.style.zIndex = 'auto';
          wordElement.style.textShadow = '1px 1px 3px rgba(0,0,0,0.2)';
        });

        container.appendChild(wordElement);
      }

      // Allow UI updates
      if (i % 8 === 0) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }

    setIsGenerating(false);
  };

  // Check if user is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Check if QR code should be shown
  useEffect(() => {
    const shouldShowQR = localStorage.getItem(`qr_show_${sessionId}`);
    setShowQRCode(shouldShowQR === 'true');
  }, [sessionId]);
  
  // Poll for session data every second
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

  // Poll for words every second, but only update if words have changed
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
      // Increase base font size and scale less aggressively
      const formattedWords = Object.entries(wordCounts).map(([text, value]) => ({
        text, value: 13 + ((value - 1) * 5),
      }));
      if (isMounted) {
        setWords(currentWords => {
          // Only update state if the generated words array is different
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

  // Regenerate word cloud when words change or schema changes
  useEffect(() => {
    if (words.length > 0) {
      generateEnhancedWordCloud();
    }
  }, [words, currentSchema, spiralType, maxWords]);



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
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Kérdés hozzáadása a PDF tetejére
    if (sessionData?.topic) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      const titleWidth = pdf.getTextWidth(sessionData.topic);
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(sessionData.topic, titleX, 30);
      
      // Dátum hozzáadása
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('hu-HU');
      pdf.text(`Generálva: ${currentDate}`, 20, 45);
    }
    
    // Ha új WordCloud komponens van
    if (activeStyle.useNewWordCloud) {
      const canvas = cloudContainerRef.current.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40; // 20mm margó mindkét oldalon
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Ha túl hosszú a kép, akkor új oldalra kerül
        let yPosition = 60; // Kérdés alatt
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        pdf.save(`${sessionData.topic || 'szofelho'}.pdf`);
        return;
      }
    }
    
    // Ha Canvas-alapú szófelhő van
    if (activeStyle.useCanvas) {
      const canvas = cloudContainerRef.current.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40; // 20mm margó mindkét oldalon
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Ha túl hosszú a kép, akkor új oldalra kerül
        let yPosition = 60; // Kérdés alatt
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        pdf.save(`${sessionData.topic || 'szofelho'}.pdf`);
        return;
      }
    }
    
    // SVG-alapú szófelhő esetén
    html2canvas(cloudContainerRef.current, { 
        backgroundColor: activeStyle.background,
        useCORS: true 
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 60;
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
      pdf.save(`${sessionData.topic || 'szofelho'}.pdf`);
    });
  };

  const textShadow = '1px 1px 3px rgba(0,0,0,0.5)';

  const containerStyle = {
    background: activeSchema.background,
    borderRadius: '20px',
    minHeight: '600px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={{ 
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Header with session info and QR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            {sessionData?.topic && (
              <h1 style={{ 
                color: '#2c3e50', 
                marginBottom: '20px', 
                fontSize: '2.5em',
                fontWeight: '700',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}>
                {sessionData.topic}
              </h1>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.2rem', 
                fontWeight: '600',
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
              }}>
                📍 {window.location.hostname}/{sessionData?.pin || '______'}
              </span>
              
              {sessionId && (
                <QRCodeGenerator sessionUrl={window.location.href} />
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%)',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
          borderLeft: '5px solid #667eea',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50', fontSize: '18px', marginBottom: '10px' }}>
            📋 Használat
          </h3>
          <p style={{ margin: '5px 0', color: '#495057', lineHeight: '1.6', fontSize: '14px' }}>
            <strong>1.</strong> Válassz vizuális sémát • <strong>2.</strong> Írj be szavakat • <strong>3.</strong> Állítsd be a beállításokat
          </p>
        </div>

        {/* Schema selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          {Object.entries(schemas).map(([key, schema]) => (
            <div
              key={key}
              onClick={() => setCurrentSchema(key)}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '15px',
                border: currentSchema === key ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: currentSchema === key ? '0 12px 30px rgba(102, 126, 234, 0.25)' : '0 8px 25px rgba(0,0,0,0.08)',
                transform: currentSchema === key ? 'translateY(-3px)' : 'none'
              }}
            >
              <div style={{
                height: '80px',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'white',
                fontSize: '14px',
                background: schema.background,
                fontFamily: schema.fontFamily
              }}>
                {schema.name}
              </div>
              <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px', fontSize: '14px' }}>
                {schema.name}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '11px', lineHeight: '1.3' }}>
                {schema.description}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(248, 249, 250, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)'
          }}>
            <form onSubmit={handleWordSubmit}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#2c3e50', fontSize: '14px' }}>
                📝 Új szó hozzáadása
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pl. innováció, csapatmunka..."
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid #e9ecef', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginBottom: '10px'
                }}
              />
              <button 
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                Beküldés
              </button>
            </form>
            {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '10px' }}>{error}</p>}
          </div>

          <div style={{
            background: 'rgba(248, 249, 250, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)',
            minWidth: '150px'
          }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#2c3e50', fontSize: '14px' }}>
              🌀 Spirál típus
            </label>
            <select 
              value={spiralType} 
              onChange={(e) => setSpiralType(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '2px solid #e9ecef', 
                borderRadius: '6px', 
                fontSize: '14px'
              }}
            >
              <option value="archimedean">Archimédeszi</option>
              <option value="rectangular">Négyszögletes</option>
            </select>
          </div>

          <div style={{
            background: 'rgba(248, 249, 250, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)',
            minWidth: '120px'
          }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#2c3e50', fontSize: '14px' }}>
              📊 Max szavak
            </label>
            <input 
              type="range" 
              min="20" 
              max="150" 
              value={maxWords}
              onChange={(e) => setMaxWords(parseInt(e.target.value))}
              style={{ 
                width: '100%', 
                height: '6px',
                background: '#e9ecef',
                border: 'none',
                borderRadius: '3px'
              }}
            />
            <div style={{ textAlign: 'center', fontWeight: '600', color: '#667eea', marginTop: '5px', fontSize: '16px' }}>
              {maxWords}
            </div>
          </div>
        </div>

        {/* Word Cloud Container */}
        <div style={containerStyle} ref={cloudContainerRef}>
          {words.length === 0 && !isGenerating ? (
            <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.6)', fontSize: '24px', padding: '60px 40px', lineHeight: '1.6' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌟</div>
              Írj be szavakat a szófelhő létrehozásához!<br />
              <small style={{ fontSize: '16px', opacity: '0.8' }}>Professzionális Wordle-algoritmussal</small>
            </div>
          ) : isGenerating ? (
            <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.6)', fontSize: '20px', padding: '60px 40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚡</div>
              Szófelhő generálása...
            </div>
          ) : null}
        </div>

        {/* Admin controls */}
        {isAdmin && words.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
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
                boxShadow: '0 8px 20px rgba(40, 167, 69, 0.3)',
                marginRight: '10px'
              }}
            >
              📄 Mentés PDF-be
            </button>
            <button 
              onClick={() => generateEnhancedWordCloud()}
              disabled={isGenerating}
              style={{
                background: isGenerating ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '25px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              {isGenerating ? '⏳ Generálás...' : '🔄 Újragenerálás'}
            </button>
          </div>
        )}

        {/* Status info */}
        {words.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#495057', fontSize: '14px' }}>
            📈 Jelenleg {words.length} különböző szó • 🎨 {activeSchema.name} séma • 🌀 {spiralType === 'archimedean' ? 'Archimédeszi' : 'Négyszögletes'} spirál
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCloud;

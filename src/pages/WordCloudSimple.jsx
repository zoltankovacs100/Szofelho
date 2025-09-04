import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../localDb';
import { onAuthStateChanged, collection, addDoc, onSnapshot, query, serverTimestamp, doc, getDocs } from '../localDb';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCodeGenerator from '../components/QRCodeGenerator';

// Egyszerű sémák
const schemas = {
  schema1: {
    name: 'Zöld Természetes',
    description: 'Barátságos zöld színek',
    background: 'linear-gradient(135deg, #8FBC8F 0%, #9ACD32 100%)',
    fontFamily: 'Comic Sans MS, cursive',
    colors: ['#1B4332', '#2D5016', '#52B788', '#74C69D', '#95D5B2']
  },
  schema2: {
    name: 'Sötét Modern', 
    description: 'Elegáns sötét stílus',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    fontFamily: 'Arial Black, sans-serif',
    colors: ['#FF4500', '#FF6B35', '#32CD32', '#87CEEB', '#DDA0DD']
  },
  schema3: {
    name: 'Világos Elegáns',
    description: 'Tiszta professzionális megjelenés',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    fontFamily: 'Times New Roman, serif',
    colors: ['#1B4332', '#2F5233', '#40916C', '#52B788', '#74C69D']
  }
};

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [words, setWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSchema, setCurrentSchema] = useState('schema1');
  const [isGenerating, setIsGenerating] = useState(false);
  const cloudContainerRef = useRef(null);

  const activeSchema = schemas[currentSchema];

  // Check if user is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

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
  }, [words, currentSchema]);

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
      
      // Simple random positioning (improved collision detection would be better)
      const x = Math.random() * (containerWidth - word.text.length * word.size * 0.6);
      const y = Math.random() * (containerHeight - word.size);
      
      wordElement.style.left = x + 'px';
      wordElement.style.top = y + 'px';
      
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '1.1rem', 
              fontWeight: '600',
              padding: '10px 18px',
              borderRadius: '10px',
              boxShadow: '0 6px 15px rgba(102, 126, 234, 0.3)'
            }}>
              📍 {window.location.hostname}/{sessionData?.pin || '______'}
            </span>
            
            {sessionId && (
              <QRCodeGenerator sessionUrl={window.location.href} />
            )}
          </div>
        </div>

        {/* Schema selector */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50', textAlign: 'center' }}>
            🎨 Válassz stílust:
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            {Object.entries(schemas).map(([key, schema]) => (
              <div
                key={key}
                onClick={() => setCurrentSchema(key)}
                style={{
                  background: '#fff',
                  borderRadius: '10px',
                  padding: '15px',
                  border: currentSchema === key ? '3px solid #667eea' : '3px solid #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: currentSchema === key ? '0 8px 20px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                  transform: currentSchema === key ? 'translateY(-2px)' : 'none',
                  minWidth: '150px',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  height: '60px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  background: schema.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {schema.name}
                </div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '13px' }}>
                  {schema.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word input */}
        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
          <form onSubmit={handleWordSubmit} style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
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
                minWidth: '250px'
              }}
            />
            <button 
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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

        {/* Status */}
        {words.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
            📈 {words.length} különböző szó • 🎨 {activeSchema.name} séma
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCloud;
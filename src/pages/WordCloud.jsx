import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc } from 'firebase/firestore';
import cloud from 'd3-cloud';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { stylePresets } from '../styles';
import CanvasWordCloud from '../components/CanvasWordCloud';
import NewWordCloud from '../components/WordCloud';
import QRCodeDisplay from '../components/QRCodeDisplay';

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [words, setWords] = useState([]);
  const [layoutWords, setLayoutWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const cloudContainerRef = useRef(null); // Ezt a ref-et fogjuk használni a PDF mentéshez

  const activeStyle = sessionData ? stylePresets[sessionData.styleId] || stylePresets['style-4'] : stylePresets['style-4'];

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
  
  // Fetch session data
  useEffect(() => {
    if (!sessionId) return;
    const sessionDocRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
        if (doc.exists()) {
            setSessionData(doc.data());
        } else {
            setError("A munkamenet nem található.");
        }
    });
    return () => unsubscribe();
  }, [sessionId]);

  // Apply background style dynamically
  useEffect(() => {
    document.body.style.backgroundColor = activeStyle.background;
    return () => {
        document.body.style.backgroundColor = '#f0f2f5';
    }
  }, [activeStyle]);

  // Fetch words
  useEffect(() => {
    if (!sessionId) return;
    const wordsRef = collection(db, 'sessions', sessionId, 'words');
    const q = query(wordsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wordCounts = snapshot.docs.reduce((acc, doc) => {
        const text = doc.data().text;
        acc[text] = (acc[text] || 0) + 1;
        return acc;
      }, {});
      const formattedWords = Object.entries(wordCounts).map(([text, value]) => ({
        text, value: value * 15,
      }));
      setWords(formattedWords);
    });
    return () => unsubscribe();
  }, [sessionId]);

  // Generate layout
  useEffect(() => {
    if (words.length === 0 || !cloudContainerRef.current) return;
    const containerWidth = cloudContainerRef.current.offsetWidth;
    const containerHeight = cloudContainerRef.current.offsetHeight;
    cloud()
      .size([containerWidth, containerHeight])
      .words(words.map(d => ({ ...d })))
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 90 : 0))
      .font('Impact')
      .fontSize(d => d.value)
      .on('end', (generatedWords) => {
          setLayoutWords(generatedWords.map(word => ({
              ...word,
              color: activeStyle.wordColors[Math.floor(Math.random() * activeStyle.wordColors.length)]
          })));
      })
      .start();
  }, [words, activeStyle]);

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

  return (
    <div className="transparent-card" style={{ backgroundColor: activeStyle.cardColor, border: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ flex: 1, marginRight: showQRCode ? '180px' : '0px', transition: 'margin-right 0.3s ease' }}>
          {sessionData?.topic && <h2 style={{ color: activeStyle.textColor, textShadow }}>{sessionData.topic}</h2>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{ 
              color: activeStyle.textColor, 
              textShadow, 
              fontSize: '1.2rem', 
              fontWeight: '600',
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              {window.location.hostname}/{sessionData?.pin || '______'}
            </span>
            <span style={{ color: activeStyle.textColor, textShadow, fontSize: '1rem' }}>
              Írj be szavakat, és kattints a Beküldés gombra!
            </span>
          </div>
        </div>
      </div>
      
      {showQRCode && <QRCodeDisplay sessionUrl={window.location.href} />}
      
      <form onSubmit={handleWordSubmit}>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Pl. innováció, csapatmunka..."/>
        <button type="submit">Beküldés</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="wordcloud-container" ref={cloudContainerRef}>
        {activeStyle.useNewWordCloud ? (
          <NewWordCloud 
            words={words.map(word => ({ text: word.text, weight: word.value }))}
            background={activeStyle.background}
            palette={activeStyle.wordColors}
            rotations={activeStyle.rotations || [0, 0, 0, 0, -10 * Math.PI / 180, 10 * Math.PI / 180, -20 * Math.PI / 180, 20 * Math.PI / 180]}
            baseFontPx={activeStyle.baseFontPx || 18}
            maxFontPx={activeStyle.maxFontPx || 110}
            padding={activeStyle.padding || 3}
            spiralStep={activeStyle.spiralStep || 3}
            iterationsPerWord={activeStyle.iterationsPerWord || 3000}
            hoverTooltip={activeStyle.hoverTooltip !== false}
            fontFamily={sessionData.fontFamily || activeStyle.font || "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"}
          />
        ) : activeStyle.useCanvas ? (
          <CanvasWordCloud 
            words={words} 
            style={activeStyle} 
            containerRef={cloudContainerRef}
          />
        ) : (
          <svg width={cloudContainerRef.current?.offsetWidth} height={cloudContainerRef.current?.offsetHeight}>
            <g transform={`translate(${cloudContainerRef.current?.offsetWidth / 2}, ${cloudContainerRef.current?.offsetHeight / 2})`}>
                {layoutWords.map((word, i) => (
                    <text key={i} textAnchor="middle" transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                        style={{ fontSize: word.size, fontFamily: activeStyle.font || 'Impact', fill: word.color, }}>
                        {word.text}
                    </text>
                ))}
            </g>
          </svg>
        )}
      </div>

      {isAdmin && (
        <button onClick={saveAsPdf} style={{marginTop: '20px'}}>Mentés PDF-be</button>
      )}
    </div>
  );
};

export default WordCloud;

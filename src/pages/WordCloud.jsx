import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../localDb';
import { onAuthStateChanged, collection, addDoc, onSnapshot, query, serverTimestamp, doc, getDocs } from '../localDb';
import SimpleWordCloud from '../components/SimpleWordCloud';
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
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pl. innováció, csapatmunka..."
          style={{ width: '100%', padding: '12px', border: '1px solid #dddfe2', borderRadius: '6px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000', fontSize: '13px' }}
        />
        <button type="submit">Beküldés</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="wordcloud-container" ref={cloudContainerRef}>
        <SimpleWordCloud 
          words={words}
          width={800}
          height={600}
        />
      </div>

      {isAdmin && (
        <button onClick={saveAsPdf} style={{marginTop: '20px'}}>Mentés PDF-be</button>
      )}
    </div>
  );
};

export default WordCloud;

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc } from 'firebase/firestore';
import cloud from 'd3-cloud';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { stylePresets } from '../styles';

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [words, setWords] = useState([]);
  const [layoutWords, setLayoutWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const cloudContainerRef = useRef(null);

  const activeStyle = sessionData ? stylePresets[sessionData.styleId] || stylePresets['style-4'] : stylePresets['style-4'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);
  
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

  useEffect(() => {
    document.body.style.backgroundColor = activeStyle.background;
    return () => {
        document.body.style.backgroundColor = '#f0f2f5';
    }
  }, [activeStyle]);

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
    html2canvas(cloudContainerRef.current, { 
        backgroundColor: activeStyle.background,
        useCORS: true 
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sessionData.topic || 'szofelho'}.pdf`);
    });
  };

  const textShadow = '1px 1px 3px rgba(0,0,0,0.5)';

  return (
    <div 
        className="transparent-card" 
        style={{ 
            backgroundColor: activeStyle.cardColor,
            boxShadow: `0 0 50px 25px ${activeStyle.background}` // Fényudvar effektus
        }}
    >
      {sessionData?.topic && <h2 style={{ color: activeStyle.textColor, textShadow }}>{sessionData.topic}</h2>}
      <p style={{ color: activeStyle.textColor, textShadow }}>Írj be szavakat, és nézd, ahogy megjelennek a felhőben!</p>
      
      <form onSubmit={handleWordSubmit}>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Pl. innováció, csapatmunka..."/>
        <button type="submit">Beküldés</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="wordcloud-container" ref={cloudContainerRef}>
         <svg width={cloudContainerRef.current?.offsetWidth} height={cloudContainerRef.current?.offsetHeight}>
            <g transform={`translate(${cloudContainerRef.current?.offsetWidth / 2}, ${cloudContainerRef.current?.offsetHeight / 2})`}>
                {layoutWords.map((word, i) => (
                    <text key={i} textAnchor="middle" transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                        style={{ fontSize: word.size, fontFamily: 'Impact', fill: word.color, }}>
                        {word.text}
                    </text>
                ))}
            </g>
        </svg>
      </div>

      {isAdmin && (
        <div style={{marginTop: '20px', textAlign: 'center'}}>
            <button onClick={saveAsPdf}>Mentés PDF-be</button>
        </div>
      )}
    </div>
  );
};

export default WordCloud;

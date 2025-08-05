import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc } from 'firebase/firestore';
import cloud from 'd3-cloud';
import { stylePresets } from '../styles'; // Stílusok importálása

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState({ topic: '', styleId: 'style-4' }); // Alapértelmezett stílus
  const [words, setWords] = useState([]);
  const [layoutWords, setLayoutWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const activeStyle = stylePresets[sessionData.styleId] || stylePresets['style-4'];

  // Fetch session data (topic and styleId)
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
    // Cleanup function to reset background when component unmounts
    return () => {
        document.body.style.backgroundColor = '#f0f2f5'; // Visszaállítjuk az alapértelmezett háttérre
    }
  }, [activeStyle]);

  // Fetch words for the session in real-time
  useEffect(() => {
    if (!sessionId) return;
    const wordsRef = collection(db, 'sessions', sessionId, 'words');
    const q = query(wordsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedWords = [];
      snapshot.forEach(doc => {
        fetchedWords.push(doc.data().text);
      });

      const wordCounts = fetchedWords.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      const formattedWords = Object.entries(wordCounts).map(([text, value]) => ({
        text,
        value: value * 15,
      }));
      setWords(formattedWords);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Generate layout with d3-cloud
  useEffect(() => {
    if (words.length === 0 || !containerRef.current) {
      setLayoutWords([]);
      return;
    };
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    const layout = cloud()
      .size([containerWidth, containerHeight])
      .words(words.map(d => ({ ...d })))
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 90 : 0))
      .font('Impact')
      .fontSize(d => d.value)
      .on('end', (generatedWords) => {
          const coloredWords = generatedWords.map(word => ({
              ...word,
              color: activeStyle.wordColors[Math.floor(Math.random() * activeStyle.wordColors.length)]
          }));
          setLayoutWords(coloredWords);
      });

    layout.start();
  }, [words, activeStyle]);

  const handleWordSubmit = async (e) => {
    e.preventDefault();
    const trimmedWord = inputValue.trim().toLowerCase();

    if (!trimmedWord) {
      setError('A szó nem lehet üres.');
      return;
    }
    
    setError('');
    try {
      const wordsRef = collection(db, 'sessions', sessionId, 'words');
      await addDoc(wordsRef, {
        text: trimmedWord,
        createdAt: serverTimestamp(),
      });
      setInputValue('');
    } catch (err) {
      console.error(err);
      setError('Hiba történt a szó beküldésekor.');
    }
  };

  return (
    <div className="card">
      {sessionData.topic && <h2 style={{color: '#333'}}>{sessionData.topic}</h2>}
      
      <p>Írj be szavakat, és nézd, ahogy megjelennek a felhőben!</p>
      <form onSubmit={handleWordSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pl. innováció, csapatmunka..."
        />
        <button type="submit">Beküldés</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="wordcloud-container" ref={containerRef}>
         <svg
            width={containerRef.current ? containerRef.current.offsetWidth : 0}
            height={containerRef.current ? containerRef.current.offsetHeight : 0}
        >
            <g transform={`translate(${containerRef.current ? containerRef.current.offsetWidth / 2 : 0}, ${containerRef.current ? containerRef.current.offsetHeight / 2 : 0})`}>
                {layoutWords.map((word, i) => (
                    <text
                        key={i}
                        textAnchor="middle"
                        transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                        style={{ 
                            fontSize: word.size, 
                            fontFamily: 'Impact',
                            fill: word.color,
                        }}
                    >
                        {word.text}
                    </text>
                ))}
            </g>
        </svg>
      </div>
    </div>
  );
};

export default WordCloud;

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc } from 'firebase/firestore';
import cloud from 'd3-cloud';

const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

const WordCloud = () => {
  const { sessionId } = useParams();
  const [sessionTopic, setSessionTopic] = useState('');
  const [words, setWords] = useState([]);
  const [layoutWords, setLayoutWords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef(null);


  // Fetch session topic
  useEffect(() => {
    if (!sessionId) return;
    const sessionDocRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
        if (doc.exists()) {
            setSessionTopic(doc.data().topic);
        } else {
            setError("A munkamenet nem található.");
        }
    });
    return () => unsubscribe();
  }, [sessionId]);

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
        value: value * 15, // Scale value for better visualization
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
      .on('end', (words) => {
          const coloredWords = words.map(word => ({
              ...word,
              color: colors[Math.floor(Math.random() * colors.length)]
          }));
          setLayoutWords(coloredWords);
      });

    layout.start();
  }, [words]);

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
      <h1>Szófelhő</h1>
      {sessionTopic && <h2 style={{color: '#333'}}>{sessionTopic}</h2>}
      
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

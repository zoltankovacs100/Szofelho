import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs } from "firebase/firestore";
import StylePicker from '../components/StylePicker'; // Komponens importálása
import QRCodeGenerator from '../components/QRCodeGenerator';

const AdminDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [error, setError] = useState(null);
  const [copiedSessionId, setCopiedSessionId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessionsData = [];
      querySnapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() });
      });
      setSessions(sessionsData);
    }, (err) => {
      console.error("Hiba a munkamenetek lekérésekor: ", err);
      setError("Nem sikerült lekérni a munkameneteket.");
    });
    return () => unsubscribe();
  }, []);

  const createSession = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) {
        setError("A téma nem lehet üres.");
        return;
    }
    setError(null);
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      await addDoc(collection(db, "sessions"), {
        pin: pin,
        topic: newTopic,
        createdAt: new Date(),
        status: 'active',
        styleId: 'style-1' // Alapértelmezett stílus
      });
      setNewTopic('');
    } catch (e) {
      console.error("Hiba az új munkamenet létrehozásakor: ", e);
      setError("Nem sikerült új munkamenetet létrehozni.");
    }
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm("Valóban törölni akarod ezt a munkamenetet és az összes hozzá tartozó szót?")) {
        try {
            const wordsQuery = query(collection(db, `sessions/${sessionId}/words`));
            const wordsSnapshot = await getDocs(wordsQuery);
            const deletePromises = [];
            wordsSnapshot.forEach((wordDoc) => {
                deletePromises.push(deleteDoc(wordDoc.ref));
            });
            await Promise.all(deletePromises);

            const sessionDocRef = doc(db, "sessions", sessionId);
            await deleteDoc(sessionDocRef);
            
        } catch (err) {
            console.error("Hiba a törlés során: ", err);
            setError("A munkamenet törlése sikertelen.");
        }
    }
  };

  const copyDirectLink = (sessionId) => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
        setCopiedSessionId(sessionId);
        setTimeout(() => setCopiedSessionId(null), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Hiba a link másolásakor: ', err);
        setError('A link másolása sikertelen.');
    });
  };

  // KIJELENTKEZÉS FÜGGVÉNY ELTÁVOLÍTVA - JELSZÓ VÉDETTSÉG KIKAPCSOLVA

  return (
    <div className="card">
      <h2>Admin Felület</h2>
      {/* KIJELENTKEZÉS GOMB ELTÁVOLÍTVA - JELSZÓ VÉDETTSÉG KIKAPCSOLVA */}
      
      <h3>Új munkamenet</h3>
      <form onSubmit={createSession}>
          <input 
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Téma vagy kérdés a szófelhőhöz"
            required
          />
          <button type="submit">Új munkamenet létrehozása PIN-kóddal</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Aktív munkamenetek</h3>
      {sessions.length > 0 ? (
        <ul>
          {sessions.map(session => (
            <li key={session.id} style={{alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                    <button className="logout" style={{padding: '5px 10px'}} onClick={() => deleteSession(session.id)}>Törlés</button>
                    <div style={{textAlign: 'right'}}>
                        <strong>PIN: {session.pin}</strong>
                        <button onClick={() => copyDirectLink(session.id)} style={{padding: '5px 10px', fontSize: '0.9rem', marginLeft: '10px'}}>
                            {copiedSessionId === session.id ? 'Másolva!' : 'Link másolása'}
                        </button>
                        <QRCodeGenerator sessionUrl={`${window.location.origin}/session/${session.id}`} />
                    </div>
                </div>
                <div style={{width: '100%', textAlign: 'left', marginTop: '10px'}}>
                    <strong>Téma:</strong> {session.topic}<br/>
                    <small>Létrehozva: {new Date(session.createdAt.seconds * 1000).toLocaleString()}</small>
                </div>
                <StylePicker sessionId={session.id} currentStyleId={session.styleId} />
            </li>
          ))}
        </ul>
      ) : (
        <p>Nincsenek aktív munkamenetek.</p>
      )}
    </div>
  );
};

export default AdminDashboard;

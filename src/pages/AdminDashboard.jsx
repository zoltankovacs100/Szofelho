import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs } from "firebase/firestore";
import StylePicker from '../components/StylePicker';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
        styleId: 'style-1'
      });
      setNewTopic('');
    } catch (e) {
      console.error("Hiba az új munkamenet létrehozásakor: ", e);
      setError("Nem sikerült új munkamenetet létrehozni.");
    }
  };
  
  const resetSessionWords = async (sessionId) => {
    if (window.confirm("Valóban törölni akarod az összes szót ebből a munkamenetből? A munkamenet megmarad.")) {
        try {
            const wordsQuery = query(collection(db, `sessions/${sessionId}/words`));
            const wordsSnapshot = await getDocs(wordsQuery);
            const deletePromises = [];
            wordsSnapshot.forEach((wordDoc) => {
                deletePromises.push(deleteDoc(wordDoc.ref));
            });
            await Promise.all(deletePromises);
        } catch (err) {
            console.error("Hiba a szavak törlése során: ", err);
            setError("A szavak törlése sikertelen.");
        }
    }
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm("Valóban törölni akarod ezt a munkamenetet és az összes hozzá tartozó szót?")) {
        try {
            await resetSessionWords(sessionId); // Először töröljük a szavakat
            const sessionDocRef = doc(db, "sessions", sessionId);
            await deleteDoc(sessionDocRef);
        } catch (err) {
            console.error("Hiba a munkamenet törlése során: ", err);
            setError("A munkamenet törlése sikertelen.");
        }
    }
  };

  const copyDirectLink = (sessionId) => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
        setCopiedSessionId(sessionId);
        setTimeout(() => setCopiedSessionId(null), 2000);
    }).catch(err => {
        console.error('Hiba a link másolásakor: ', err);
        setError('A link másolása sikertelen.');
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error("Hiba a kijelentkezés során:", error);
    }
  };

  return (
    <div className="card">
      <h2>Admin Felület</h2>
      <button className="logout" style={{float: 'right'}} onClick={handleLogout}>Kijelentkezés</button>
      
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
                    <div>
                        <button style={{padding: '5px 10px'}} onClick={() => resetSessionWords(session.id)}>Visszaállítás</button>
                        <button className="logout" style={{padding: '5px 10px', marginLeft: '10px'}} onClick={() => deleteSession(session.id)}>Törlés</button>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <strong>PIN: {session.pin}</strong>
                        <button onClick={() => copyDirectLink(session.id)} style={{padding: '5px 10px', fontSize: '0.9rem', marginLeft: '10px'}}>
                            {copiedSessionId === session.id ? 'Másolva!' : 'Link másolása'}
                        </button>
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

import React, { useState, useEffect } from 'react';
import { db } from '../localDb';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs } from "../localDb";
import StylePicker from '../components/StylePicker';
import FontPicker from '../components/FontPicker';
import QRCodeGenerator from '../components/QRCodeGenerator';

const AdminDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [error, setError] = useState(null);
  const [copiedSessionId, setCopiedSessionId] = useState(null);

  // Poll sessions list every second
  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const sessionsData = [];
      snapshot.docs.forEach((d) => {
        sessionsData.push({ id: d.id, ...d.data() });
      });
      if (isMounted) setSessions(sessionsData);
    };
    fetchSessions();
    const intervalId = setInterval(fetchSessions, 1000);
    return () => { isMounted = false; clearInterval(intervalId); };
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
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
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
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Vista Appstore</h1>
          <p className="admin-subtitle">Szófelhő Admin Felület</p>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-section">
          <div className="section-header">
            <h2>Új munkamenet létrehozása</h2>
            <p>Hozz létre egy új szófelhő munkamenetet PIN-kóddal</p>
          </div>
          
          <form onSubmit={createSession} className="create-session-form">
            <div className="form-group">
              <input 
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Téma vagy kérdés a szófelhőhöz"
                required
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <span className="btn-icon">+</span>
              Új munkamenet létrehozása
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}
        </section>

        <section className="admin-section">
          <div className="section-header">
            <h2>Aktív munkamenetek</h2>
            <p>Kezeld a meglévő szófelhő munkameneteket</p>
          </div>
          
          {sessions.length > 0 ? (
            <div className="sessions-grid">
              {sessions.map(session => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <div className="session-info">
                      <h3 className="session-topic">{session.topic}</h3>
                                             <div className="session-meta">
                                                   <button 
                            onClick={() => window.open(`/session/${session.id}`, '_blank')}
                            className="session-pin-btn"
                          >
                            {window.location.hostname}/{session.pin}
                          </button>
                         <span className="session-date">
                           {new Date(session.createdAt.seconds * 1000).toLocaleDateString('hu-HU')}
                         </span>
                       </div>
                    </div>
                    <div className="session-actions">
                      <button 
                        onClick={() => copyDirectLink(session.id)} 
                        className="btn btn-secondary btn-sm"
                      >
                        {copiedSessionId === session.id ? '✓ Másolva!' : '🔗 Link másolása'}
                      </button>
                      <QRCodeGenerator sessionUrl={`${window.location.origin}/session/${session.id}`} />
                      <button 
                        onClick={() => deleteSession(session.id)} 
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ Törlés
                      </button>
                    </div>
                  </div>
                  
                  <div className="session-settings">
                    <div className="settings-row">
                      <StylePicker sessionId={session.id} currentStyleId={session.styleId} />
                      <FontPicker sessionId={session.id} currentFont={session.fontFamily || 'Montserrat'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>Nincsenek aktív munkamenetek</h3>
              <p>Hozz létre egy új munkamenetet a fenti űrlappal</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

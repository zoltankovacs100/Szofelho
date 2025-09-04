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
      if (isMounted) {
        setSessions(currentSessions => {
          if (JSON.stringify(currentSessions) !== JSON.stringify(sessionsData)) {
            return sessionsData;
          }
          return currentSessions;
        });
      }
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
        styleId: 'schema1' // Alapértelmezett stílus - Zöld Természetes
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
            // Először töröljük az összes szót a sessions/{sessionId}/words kollekcióból
            const wordsRef = collection(db, 'sessions', sessionId, 'words');
            const wordsSnapshot = await getDocs(wordsRef);
            const deletePromises = [];
            
            wordsSnapshot.docs.forEach((wordDoc) => {
                deletePromises.push(deleteDoc(wordDoc.ref));
            });
            
            // Várjuk meg, hogy az összes szó törlésre kerüljön
            await Promise.all(deletePromises);

            // Ezután töröljük a munkamenetet
            const sessionDocRef = doc(db, "sessions", sessionId);
            await deleteDoc(sessionDocRef);
            
            console.log(`Munkamenet ${sessionId} és ${wordsSnapshot.docs.length} szó sikeresen törölve.`);
            
        } catch (err) {
            console.error("Hiba a törlés során: ", err);
            setError(`A munkamenet törlése sikertelen: ${err.message}`);
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
                <div key={session.id} className="session-card" style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '25px',
                  marginBottom: '20px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #f0f0f0'
                }}>
                  <div className="session-header">
                    <div className="session-info">
                      <h3 className="session-topic" style={{
                        color: '#2c3e50',
                        fontSize: '1.4em',
                        marginBottom: '12px',
                        fontWeight: '700'
                      }}>{session.topic}</h3>
                      <div className="session-meta" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <button 
                          onClick={() => window.open(`/session/${session.id}`, '_blank')}
                          className="session-pin-btn"
                          style={{
                            background: 'linear-gradient(135deg, #2d5016 0%, #1B4332 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(45, 80, 22, 0.3)'
                          }}
                        >
                          📍 {window.location.hostname}/{session.pin}
                        </button>
                        <span className="session-date" style={{
                          color: '#666',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          📅 {new Date(session.createdAt.seconds * 1000).toLocaleDateString('hu-HU')}
                        </span>
                      </div>
                    </div>
                    <div className="session-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button 
                        onClick={() => copyDirectLink(session.id)} 
                        className="btn btn-secondary btn-sm"
                        style={{
                          background: copiedSessionId === session.id ? '#28a745' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedSessionId === session.id ? '✓ Másolva!' : '🔗 Link másolása'}
                      </button>
                      <QRCodeGenerator sessionUrl={`${window.location.origin}/session/${session.id}`} />
                      <button 
                        onClick={() => deleteSession(session.id)} 
                        className="btn btn-danger btn-sm"
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Törlés
                      </button>
                    </div>
                  </div>
                  
                  <div className="session-settings">
                    <div className="settings-row">
                      <StylePicker sessionId={session.id} currentStyleId={session.styleId} />
                    </div>
                    <div style={{ marginTop: '15px', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                      💡 Válassz sémát a szófelhő megjelenéséhez. A résztvevők ezt a stílust fogják látni.
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

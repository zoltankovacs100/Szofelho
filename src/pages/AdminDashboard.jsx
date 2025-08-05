import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [error, setError] = useState(null);

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
        topic: newTopic, // A téma mentése
        createdAt: new Date(),
        status: 'active'
      });
      setNewTopic(''); // Ürítjük a mezőt sikeres létrehozás után
    } catch (e) {
      console.error("Hiba az új munkamenet létrehozásakor: ", e);
      setError("Nem sikerült új munkamenetet létrehozni.");
    }
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
            <li key={session.id}>
                <span>
                    <strong>Téma:</strong> {session.topic}<br/>
                    <small>Létrehozva: {new Date(session.createdAt.seconds * 1000).toLocaleString()}</small>
                </span>
                <strong>{session.pin}</strong>
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
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

  const createSession = async () => {
    setError(null);
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      await addDoc(collection(db, "sessions"), {
        pin: pin,
        createdAt: new Date(),
        status: 'active'
      });
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
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <button type="button" onClick={createSession}>Új munkamenet</button>
        <button className="logout" onClick={handleLogout}>Kijelentkezés</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Aktív munkamenetek</h3>
      {sessions.length > 0 ? (
        <ul>
          {sessions.map(session => (
            <li key={session.id}>
                <span>Létrehozva: {new Date(session.createdAt.seconds * 1000).toLocaleString()}</span>
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

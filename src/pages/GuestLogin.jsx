import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const GuestLogin = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinSession = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.length !== 6) {
      setError('A PIN kódnak 6 számjegyből kell állnia.');
      return;
    }

    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('pin', '==', pin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Érvénytelen vagy nem létező PIN kód.');
      } else {
        const sessionDoc = querySnapshot.docs[0];
        navigate(`/session/${sessionDoc.id}`);
      }
    } catch (err) {
      console.error(err);
      setError('Hiba történt a csatlakozás során. Próbáld újra később.');
    }
  };

  return (
    <div className="card">
      <h2>Csatlakozás munkamenethez</h2>
      <form onSubmit={handleJoinSession}>
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN kód"
          maxLength="6"
        />
        <button type="submit">Csatlakozás</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default GuestLogin;

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
    <div className="guest-login-container">
      <div className="guest-login-card">
        <div className="guest-login-header">
          <h1 className="guest-login-title">PIN Kód: {pin || '______'}</h1>
          <p className="guest-login-subtitle">Írj be szavakat, és kattints a Beküldés gombra!</p>
        </div>
        
        <form onSubmit={handleJoinSession} className="guest-login-form">
          <div className="pin-input-group">
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN kód megadása"
              maxLength="6"
              className="pin-input"
              autoFocus
            />
            <button type="submit" className="pin-submit-btn">
              Csatlakozás
            </button>
          </div>
        </form>
        
        {error && <div className="pin-error">{error}</div>}
      </div>
    </div>
  );
};

export default GuestLogin;

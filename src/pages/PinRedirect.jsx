import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../localDb';
import { collection, query, where, getDocs } from '../localDb';

const PinRedirect = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const findSessionByPin = async () => {
      if (!pin || pin.length !== 6) {
        setError('Érvénytelen PIN kód.');
        setLoading(false);
        return;
      }

      try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('pin', '==', pin));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('A megadott PIN kódhoz nem található munkamenet.');
          setLoading(false);
        } else {
          const sessionDoc = querySnapshot.docs[0];
          navigate(`/session/${sessionDoc.id}`, { replace: true });
        }
      } catch (err) {
        console.error('Hiba a munkamenet keresésekor:', err);
        setError('Hiba történt a munkamenet keresése során.');
        setLoading(false);
      }
    };

    findSessionByPin();
  }, [pin, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Munkamenet keresése...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '1rem' }}>Hiba</h1>
        <p style={{ marginBottom: '2rem' }}>{error}</p>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid white',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Vissza az admin oldalra
        </button>
      </div>
    );
  }

  return null;
};

export default PinRedirect;

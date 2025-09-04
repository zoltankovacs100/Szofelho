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
      // Ellenőrizzük a PIN érvényességét - 6 számjegy
      if (!pin || !/^\d{6}$/.test(pin)) {
        setError('Érvénytelen PIN kód. A PIN-nek 6 számjegyből kell állnia.');
        setLoading(false);
        return;
      }

      try {
        console.log('PIN keresés:', pin);
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('pin', '==', pin));
        const querySnapshot = await getDocs(q);

        console.log('Talált munkamenetek száma:', querySnapshot.docs.length);

        if (querySnapshot.empty) {
          setError(`A PIN kód (${pin}) nem található. Ellenőrizd, hogy helyes-e a kód, vagy kérd meg az admin-t, hogy ellenőrizze az aktív munkameneteket.`);
          setLoading(false);
        } else {
          const sessionDoc = querySnapshot.docs[0];
          const sessionData = sessionDoc.data();
          console.log('Megtalált munkamenet:', sessionData.topic, 'ID:', sessionDoc.id);
          navigate(`/session/${sessionDoc.id}`, { replace: true });
        }
      } catch (err) {
        console.error('Hiba a munkamenet keresésekor:', err);
        setError(`Hiba történt a munkamenet keresése során: ${err.message}`);
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
        background: 'linear-gradient(135deg, #2d5016 0%, #1B4332 100%)',
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
        background: 'linear-gradient(135deg, #2d5016 0%, #1B4332 100%)',
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

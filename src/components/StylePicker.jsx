// src/components/StylePicker.jsx
import React from 'react';
import { db } from '../localDb';
import { doc, updateDoc } from '../localDb';
import { stylePresets } from '../styles';

const StylePicker = ({ sessionId, currentStyleId }) => {

  const handleStyleSelect = async (styleId) => {
    const sessionDocRef = doc(db, 'sessions', sessionId);
    try {
      await updateDoc(sessionDocRef, {
        styleId: styleId
      });
    } catch (err) {
      console.error("Hiba a stílus frissítésekor: ", err);
    }
  };

  return (
    <div style={{ marginTop: '15px' }}>
      <strong>Stílus:</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
        {Object.values(stylePresets).map(preset => (
          <div 
            key={preset.id}
            onClick={() => handleStyleSelect(preset.id)}
            style={{ 
              width: '80px', 
              height: '50px',
              backgroundColor: preset.background,
              cursor: 'pointer',
              border: `3px solid ${currentStyleId === preset.id ? '#1877f2' : 'transparent'}`,
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontSize: '0.8rem',
              textAlign: 'center'
            }}
            title={preset.name}
          >
            {preset.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StylePicker;

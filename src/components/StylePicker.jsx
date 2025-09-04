// src/components/StylePicker.jsx
import React from 'react';
import { db } from '../localDb';
import { doc, updateDoc } from '../localDb';
import { stylePresets } from '../styles';

// Csak az 5 új séma
const availableSchemas = {
  schema1: stylePresets.schema1,
  schema2: stylePresets.schema2,
  schema3: stylePresets.schema3,
  schema4: stylePresets.schema4,
  schema5: stylePresets.schema5
};

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
      <strong style={{ color: '#2c3e50', fontSize: '16px' }}>🎨 Szófelhő stílus:</strong>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '10px', 
        marginTop: '12px' 
      }}>
        {Object.entries(availableSchemas).map(([key, schema]) => (
          <div 
            key={key}
            onClick={() => handleStyleSelect(key)}
            style={{ 
              minHeight: '80px',
              background: schema.background,
              cursor: 'pointer',
              border: `3px solid ${currentStyleId === key ? '#2d5016' : '#ddd'}`,
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: schema.textColor || '#2c3e50',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '8px',
              boxShadow: currentStyleId === key ? 
                '0 8px 20px rgba(45, 80, 22, 0.3)' : 
                '0 4px 12px rgba(0,0,0,0.1)',
              transform: currentStyleId === key ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease',
              fontFamily: schema.fontFamily || 'inherit',
              textShadow: schema.background.includes('gradient') && schema.background.includes('#1a1a1a') ? 
                '1px 1px 2px rgba(0,0,0,0.8)' : 
                '1px 1px 2px rgba(0,0,0,0.3)'
            }}
            title={`${schema.name} - ${schema.description}`}
          >
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              {schema.name}
            </div>
            <div style={{ 
              fontSize: '9px', 
              opacity: 0.8, 
              lineHeight: '1.2',
              maxWidth: '110px',
              textAlign: 'center'
            }}>
              {schema.description?.substring(0, 35)}...
            </div>
            {currentStyleId === key && (
              <div style={{ 
                fontSize: '16px', 
                marginTop: '4px',
                filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'
              }}>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
      {currentStyleId && availableSchemas[currentStyleId] && (
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          background: 'rgba(45, 80, 22, 0.1)', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#495057'
        }}>
          <strong>Aktív:</strong> {availableSchemas[currentStyleId].name} - {availableSchemas[currentStyleId].description}
        </div>
      )}
    </div>
  );
};

export default StylePicker;

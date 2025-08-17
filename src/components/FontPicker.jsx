import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from '../localDb';
import { db } from '../localDb';

const FontPicker = ({ sessionId, currentFont = 'Montserrat' }) => {
  const [selectedFont, setSelectedFont] = useState(currentFont);
  const [isUpdating, setIsUpdating] = useState(false);

  const availableFonts = [
    { value: 'Poppins', label: 'Poppins - Geometrikus' },
    { value: 'Nunito', label: 'Nunito - Kerekded' },
    { value: 'Lato', label: 'Lato - Elegáns' },
    { value: 'Inter', label: 'Inter - Tech' },
    { value: 'Ubuntu', label: 'Ubuntu - Linux stílus' },
    { value: 'Source Sans 3', label: 'Source Sans 3 - Profi' },
    { value: 'Roboto', label: 'Roboto - Google stílus' },
    { value: 'Open Sans', label: 'Open Sans - Barátságos' },
    { value: 'Bungee', label: 'Bungee - Blokkos' },
    { value: 'Monoton', label: 'Monoton - Neon' },
    { value: 'Rubik Glitch', label: 'Rubik Glitch - Glitch' },
    { value: 'Creepster', label: 'Creepster - Horror' },
    { value: 'Impact', label: 'Impact - Klasszikus' },
    { value: 'Arial', label: 'Arial - Rendszer' },
    { value: 'Helvetica', label: 'Helvetica - Tiszta' }
  ];

  useEffect(() => {
    setSelectedFont(currentFont);
  }, [currentFont]);

  const handleFontChange = async (fontFamily) => {
    if (!sessionId || fontFamily === selectedFont) return;
    
    setIsUpdating(true);
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        fontFamily: fontFamily
      });
      setSelectedFont(fontFamily);
    } catch (error) {
      console.error('Hiba a betűtípus frissítésekor:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="font-picker">
      <label htmlFor={`font-select-${sessionId}`} className="font-picker-label">
        Betűtípus:
      </label>
      <select
        id={`font-select-${sessionId}`}
        value={selectedFont}
        onChange={(e) => handleFontChange(e.target.value)}
        disabled={isUpdating}
        className="font-picker-select"
        style={{ fontFamily: selectedFont }}
      >
        {availableFonts.map(font => (
          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
            {font.label}
          </option>
        ))}
      </select>
      {isUpdating && <span className="font-picker-loading">Frissítés...</span>}
    </div>
  );
};

export default FontPicker;

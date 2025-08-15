import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FontPicker = ({ sessionId, currentFont = 'Montserrat' }) => {
  const [selectedFont, setSelectedFont] = useState(currentFont);
  const [isUpdating, setIsUpdating] = useState(false);

  const availableFonts = [
    { value: 'Montserrat', label: 'Montserrat - Modern' },
    { value: 'Roboto', label: 'Roboto - Clean' },
    { value: 'Open Sans', label: 'Open Sans - Friendly' },
    { value: 'Lato', label: 'Lato - Elegant' },
    { value: 'Poppins', label: 'Poppins - Geometric' },
    { value: 'Inter', label: 'Inter - Tech' },
    { value: 'Nunito', label: 'Nunito - Rounded' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro - Professional' },
    { value: 'Ubuntu', label: 'Ubuntu - Linux Style' },
    { value: 'Impact', label: 'Impact - Classic' },
    { value: 'Arial', label: 'Arial - System' },
    { value: 'Helvetica', label: 'Helvetica - Clean' }
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

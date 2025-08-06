// src/styles.js

export const stylePresets = {
  'style-1': {
    id: 'style-1',
    name: 'Mélytenger',
    background: '#0p0c29',
    wordColors: ['#3498db', '#f1c40f', '#e74c3c', '#9b59b6', '#ecf0f1'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.25)'
  },
  'style-2': {
    id: 'style-2',
    name: 'Napsugár',
    background: '#f1c40f',
    wordColors: ['#2c3e50', '#e74c3c', '#2980b9', '#27ae60', '#ffffff'],
    textColor: '#2c3e50',
    cardColor: 'rgba(255, 255, 255, 0.3)'
  },
  'style-3': {
    id: 'style-3',
    name: 'Sötét elegancia',
    background: '#2c3e50',
    wordColors: ['#1abc9c', '#f39c12', '#d35400', '#ecf0f1', '#3498db'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.2)'
  },
  'style-4': {
    id: 'style-4',
    name: 'Pasztell álom',
    background: '#ecf0f1',
    wordColors: ['#9b59b6', '#34495e', '#16a085', '#2980b9', '#e67e22'],
    textColor: '#34495e',
    cardColor: 'rgba(255, 255, 255, 0.5)'
  },
  'style-5': {
    id: 'style-5',
    name: 'Vadvirág',
    background: '#9b59b6',
    wordColors: ['#f1c40f', '#2ecc71', '#ecf0f1', '#e74c3c', '#1abc9c'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.2)'
  },
  'style-6': {
    id: 'style-6',
    name: 'Tűz és jég',
    background: '#e74c3c',
    wordColors: ['#ecf0f1', '#3498db', '#2c3e50', '#f1c40f', '#2980b9'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.25)'
  },
  'style-7': {
    id: 'style-7',
    name: 'Klasszikus',
    background: '#ffffff',
    wordColors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7'],
    textColor: '#2c3e50',
    cardColor: 'rgba(0, 0, 0, 0.1)',
    font: 'Impact',
    rotate: () => Math.random() > 0.5 ? 0 : 90,
    fontWeight: (d) => d.value > 1 ? 'bold' : 'normal'
  }
};

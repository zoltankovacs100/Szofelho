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
    background: '#0b0b0d',
    wordColors: ['#ff8a3a', '#f6ad55', '#2ec4b6', '#2bb68a', '#c56cf0', '#e2e8f0', '#fbd38d', '#94a3b8'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.2)',
    useCanvas: true,
    font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
  },
  'style-8': {
    id: 'style-8',
    name: 'Montserrat Modern',
    background: '#0b0b0d',
    wordColors: [
      '#f2c94c', // sárga
      '#f2994a', // narancs
      '#eb5757', // piros
      '#2d9cdb', // kék
      '#56ccf2', // világoskék
      '#27ae60', // zöld
      '#6fcf97', // világoszöld
      '#9b51e0', // lila
      '#bb6bd9', // világoslila
      '#333333'  // sötétszürke
    ],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.2)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, -10*Math.PI/180, 10*Math.PI/180, -20*Math.PI/180, 20*Math.PI/180],
    baseFontPx: 18,
    maxFontPx: 110,
    padding: 3,
    spiralStep: 3,
    iterationsPerWord: 3000,
    hoverTooltip: true
  }
};

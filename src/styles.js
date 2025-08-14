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
  },
  'style-9': {
    id: 'style-9',
    name: 'Roboto Clean',
    background: '#ffffff',
    wordColors: ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#ff9800', '#795548', '#607d8b'],
    textColor: '#333333',
    cardColor: 'rgba(255, 255, 255, 0.9)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
    rotations: [0, 0, 0, 0, -5*Math.PI/180, 5*Math.PI/180],
    baseFontPx: 16,
    maxFontPx: 100,
    padding: 2,
    spiralStep: 2,
    iterationsPerWord: 2500,
    hoverTooltip: true
  },
  'style-10': {
    id: 'style-10',
    name: 'Open Sans Friendly',
    background: '#f8f9fa',
    wordColors: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'],
    textColor: '#495057',
    cardColor: 'rgba(255, 255, 255, 0.8)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Open Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, -3*Math.PI/180, 3*Math.PI/180],
    baseFontPx: 18,
    maxFontPx: 105,
    padding: 3,
    spiralStep: 2.5,
    iterationsPerWord: 2800,
    hoverTooltip: true
  },
  'style-11': {
    id: 'style-11',
    name: 'Lato Elegant',
    background: '#2c3e50',
    wordColors: ['#ecf0f1', '#3498db', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.3)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Lato, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, 0, -8*Math.PI/180, 8*Math.PI/180, -15*Math.PI/180, 15*Math.PI/180],
    baseFontPx: 17,
    maxFontPx: 108,
    padding: 2.5,
    spiralStep: 3,
    iterationsPerWord: 3200,
    hoverTooltip: true
  },
  'style-12': {
    id: 'style-12',
    name: 'Poppins Geometric',
    background: '#1a1a2e',
    wordColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(0, 0, 0, 0.4)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, -12*Math.PI/180, 12*Math.PI/180, -25*Math.PI/180, 25*Math.PI/180],
    baseFontPx: 19,
    maxFontPx: 115,
    padding: 3.5,
    spiralStep: 3.5,
    iterationsPerWord: 3500,
    hoverTooltip: true
  },
  'style-13': {
    id: 'style-13',
    name: 'Inter Tech',
    background: '#0d1117',
    wordColors: ['#58a6ff', '#7ee787', '#f85149', '#f0883e', '#db61a2', '#79c0ff', '#a371f7', '#ff7b72'],
    textColor: '#c9d1d9',
    cardColor: 'rgba(0, 0, 0, 0.5)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, 0, -6*Math.PI/180, 6*Math.PI/180],
    baseFontPx: 16,
    maxFontPx: 95,
    padding: 2,
    spiralStep: 2.5,
    iterationsPerWord: 3000,
    hoverTooltip: true
  },
  'style-14': {
    id: 'style-14',
    name: 'Nunito Rounded',
    background: '#667eea',
    wordColors: ['#ffffff', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a'],
    textColor: '#FFFFFF',
    cardColor: 'rgba(255, 255, 255, 0.2)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Nunito, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, -4*Math.PI/180, 4*Math.PI/180, -8*Math.PI/180, 8*Math.PI/180],
    baseFontPx: 18,
    maxFontPx: 110,
    padding: 3,
    spiralStep: 3,
    iterationsPerWord: 2800,
    hoverTooltip: true
  },
  'style-15': {
    id: 'style-15',
    name: 'Source Sans Pro',
    background: '#f5f5f5',
    wordColors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1', '#3498db', '#e74c3c'],
    textColor: '#2c3e50',
    cardColor: 'rgba(255, 255, 255, 0.7)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Source Sans Pro, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, 0, -2*Math.PI/180, 2*Math.PI/180],
    baseFontPx: 17,
    maxFontPx: 102,
    padding: 2.5,
    spiralStep: 2.8,
    iterationsPerWord: 2600,
    hoverTooltip: true
  },
  'style-16': {
    id: 'style-16',
    name: 'Ubuntu Linux',
    background: '#2d3748',
    wordColors: ['#68d391', '#4fd1c7', '#63b3ed', '#f6ad55', '#fc8181', '#b794f4', '#f687b3', '#a0aec0'],
    textColor: '#e2e8f0',
    cardColor: 'rgba(0, 0, 0, 0.3)',
    useCanvas: true,
    useNewWordCloud: true,
    font: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    rotations: [0, 0, 0, -7*Math.PI/180, 7*Math.PI/180, -14*Math.PI/180, 14*Math.PI/180],
    baseFontPx: 18,
    maxFontPx: 108,
    padding: 3,
    spiralStep: 3.2,
    iterationsPerWord: 3100,
    hoverTooltip: true
  }
};

// Simple localStorage-based mock database to replace Firebase
// This provides the same API as Firebase but stores data locally

const STORAGE_KEY = 'szofelho_data';

// Helper functions
function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: {}, words: {} };
  } catch (e) {
    return { sessions: {}, words: {} };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Mock auth
export const auth = {};

export function onAuthStateChanged(auth, callback) {
  // Always return a mock user
  const mockUser = { uid: 'mock-user' };
  setTimeout(() => callback(mockUser), 0);
  return () => {}; // unsubscribe function
}

export function signInAnonymously(auth) {
  return Promise.resolve({ user: { uid: 'mock-user' } });
}

export function signInWithEmailAndPassword(auth, email, password) {
  return Promise.resolve({ user: { uid: 'mock-user', email } });
}

// Mock Firestore
export const db = {};

export function collection(db, ...segments) {
  return { path: segments.join('/') };
}

export function doc(db, ...segments) {
  return { path: segments.join('/'), id: segments[segments.length - 1] };
}

export function query(collectionRef, ...constraints) {
  return { collection: collectionRef.path, constraints };
}

export function where(field, op, value) {
  return { field, op, value };
}

export function orderBy(field, direction = 'asc') {
  return { field, direction };
}

export function serverTimestamp() {
  return { seconds: Math.floor(Date.now() / 1000) };
}

export function onSnapshot(ref, callback, onError) {
  try {
    const data = loadData();
    
    if (ref.collection === 'sessions') {
      const sessions = Object.values(data.sessions || {});
      const docs = sessions.map(session => ({
        id: session.id,
        data: () => session
      }));
      callback({ docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) });
    } else if (ref.collection && ref.collection.includes('/words')) {
      const sessionId = ref.collection.split('/')[1];
      const words = data.words[sessionId] || [];
      const docs = words.map(word => ({
        id: word.id,
        data: () => word
      }));
      callback({ docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) });
    } else if (ref.path && ref.path.includes('sessions/')) {
      const sessionId = ref.path.split('/')[1];
      const session = data.sessions[sessionId];
      callback({
        exists: () => !!session,
        data: () => session
      });
    }
  } catch (e) {
    if (onError) onError(e);
  }
  
  return () => {}; // unsubscribe function
}

export async function addDoc(collectionRef, data) {
  console.log('addDoc called with:', collectionRef.path, data);
  const dbData = loadData();
  
  if (collectionRef.path === 'sessions') {
    const id = generateId();
    const session = {
      id,
      ...data,
      createdAt: data.createdAt || { seconds: Math.floor(Date.now() / 1000) }
    };
    console.log('Creating session:', session);
    dbData.sessions[id] = session;
    saveData(dbData);
    console.log('Session saved, new data:', dbData);
    return { id };
  } else if (collectionRef.path.includes('/words')) {
    const sessionId = collectionRef.path.split('/')[1];
    const id = generateId();
    const word = {
      id,
      ...data,
      createdAt: data.createdAt || { seconds: Math.floor(Date.now() / 1000) }
    };
    if (!dbData.words[sessionId]) {
      dbData.words[sessionId] = [];
    }
    dbData.words[sessionId].push(word);
    saveData(dbData);
    return { id };
  }
  
  throw new Error('Unknown collection');
}

export async function getDocs(queryRef) {
  const data = loadData();

  if (queryRef.collection && queryRef.collection.startsWith('sessions/')) {
    const sessionId = queryRef.collection.split('/')[1];
    const words = data.words[sessionId] || [];
    const docs = words.map(word => ({
      id: word.id,
      data: () => word
    }));
    return { docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
  }
  
  if (queryRef.collection === 'sessions') {
    let sessions = Object.values(data.sessions || {});

    if (queryRef.constraints) {
      queryRef.constraints.forEach(constraint => {
        if (constraint.field === 'createdAt' && constraint.direction === 'desc') {
          sessions.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        }
      });
    }

    const docs = sessions.map(session => ({
      id: session.id,
      data: () => session
    }));
    return { docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
  }
  
  return { docs: [], empty: true, forEach: () => {} };
}

export async function updateDoc(docRef, data) {
  const dbData = loadData();
  
  if (docRef.path.includes('sessions/')) {
    const sessionId = docRef.path.split('/')[1];
    if (dbData.sessions[sessionId]) {
      dbData.sessions[sessionId] = { ...dbData.sessions[sessionId], ...data };
      saveData(dbData);
    }
  }
}

export async function deleteDoc(docRef) {
  const dbData = loadData();
  
  if (docRef.path.includes('sessions/')) {
    const sessionId = docRef.path.split('/')[1];
    delete dbData.sessions[sessionId];
    delete dbData.words[sessionId];
    saveData(dbData);
  }
}

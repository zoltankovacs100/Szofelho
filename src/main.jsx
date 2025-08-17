import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from './localDb';
import { auth } from './localDb';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import GuestLogin from './pages/GuestLogin';
import WordCloud from './pages/WordCloud';
import PinRedirect from './pages/PinRedirect';
import './style.css';
import './fonts.css';

const ProtectedRoute = ({ user, children }) => {
  // JELSZÓ VÉDETTSÉG KIKAPCSOLVA - 2025.08.14 11:30
  // if (!user) {
  //   return <Navigate to="/admin/login" replace />;
  // }
  return children;
};

const App = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Betöltés...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Routes */}
        <Route path="/" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/session/:sessionId" element={<WordCloud />} />
        <Route path="/pin" element={<GuestLogin />} />
        <Route path="/:pin" element={<PinRedirect />} />

        {/* Admin Routes - JELSZÓ VÉDETTSÉG KIKAPCSOLVA */}
        <Route path="/admin/login" element={<Navigate to="/admin/dashboard" />} />
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

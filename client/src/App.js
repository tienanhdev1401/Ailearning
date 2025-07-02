// src/App.js
import React, { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, AuthContext } from './context/AuthContext';
import axiosInstance, { setupInterceptors } from './services/axiosInstance';

const SetupAxios = ({ children }) => {
  const { accessToken, setAccessToken } = useContext(AuthContext);

  useEffect(() => {
    setupInterceptors(() => accessToken, setAccessToken);
  }, [accessToken, setAccessToken]);

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SetupAxios>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </SetupAxios>
    </AuthProvider>
  );
}

export default App;

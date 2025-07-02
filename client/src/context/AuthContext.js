// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { refreshToken } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); // chờ refresh khi app load

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const data = await refreshToken();
        setAccessToken(data.accessToken);
      } catch (err) {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessToken();
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
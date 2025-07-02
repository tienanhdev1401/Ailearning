// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { accessToken, loading } = useContext(AuthContext);

  if (loading) return <p>Đang xác thực...</p>;
  return accessToken ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ accessToken, children }) {
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;

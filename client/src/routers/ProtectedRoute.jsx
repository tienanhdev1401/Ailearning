import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import LoadingSpinner from "../component/LoadingSpinner";

function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null); // null = loading

  useEffect(() => {
    const checkAccess = async () => {
      let accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split(".")[1]));
          const now = Date.now() / 1000;
          if (payload.exp > now) {
            setIsAuthorized(true);
            return;
          }
        } catch {}
      }

      try {
        const res = await api.post("/auth/refresh");
        localStorage.setItem("accessToken", res.data.accessToken);
        setIsAuthorized(true);
      } catch (err) {
        console.log(err);
        setIsAuthorized(false);
      }
    };

    checkAccess();
  }, []);

  if (isAuthorized === null) {
    // Hiển thị loading spinner
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

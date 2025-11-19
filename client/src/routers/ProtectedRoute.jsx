import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import LoadingSpinner from "../component/LoadingSpinner";

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    console.error("Token decode failed", error);
    return null;
  }
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [authState, setAuthState] = useState({ status: "loading", reason: null });

  useEffect(() => {
    const checkAccess = async () => {
      const ensureRoleAllowed = (payload) => {
        if (!allowedRoles.length) return true;
        if (!payload?.role) return false;
        return allowedRoles.includes(payload.role);
      };

      let accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        const payload = decodeToken(accessToken);
        const now = Date.now() / 1000;
        if (payload && payload.exp > now) {
          if (ensureRoleAllowed(payload)) {
            setAuthState({ status: "allowed", reason: null });
            return;
          }
          setAuthState({ status: "denied", reason: "forbidden" });
          return;
        }
      }

      try {
        const res = await api.post("/auth/refresh");
        localStorage.setItem("accessToken", res.data.accessToken);
        const payload = decodeToken(res.data.accessToken);
        if (ensureRoleAllowed(payload)) {
          setAuthState({ status: "allowed", reason: null });
        } else {
          setAuthState({ status: "denied", reason: "forbidden" });
        }
      } catch (err) {
        console.error(err);
        setAuthState({ status: "denied", reason: "unauthenticated" });
      }
    };

    checkAccess();
  }, [allowedRoles]);

  if (authState.status === "loading") {
    return <LoadingSpinner />;
  }

  if (authState.status === "denied") {
    if (authState.reason === "forbidden") {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

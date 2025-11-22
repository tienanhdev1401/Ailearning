import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import LoadingSpinner from "../component/LoadingSpinner";
import { decodeToken } from "../utils/jwt";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [authState, setAuthState] = useState({ status: "loading", reason: null });
  const authContext = useAuth();
  const contextAccessToken = authContext?.accessToken ?? null;
  const setContextAccessToken = authContext?.setAccessToken;

  const normalizedAllowedRoles = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return [];
    }
    return Array.from(new Set(allowedRoles)).sort();
  }, [allowedRoles]);

  const allowedRoleSet = useMemo(() => new Set(normalizedAllowedRoles), [normalizedAllowedRoles]);

  const ensureRoleAllowed = useCallback((payload) => {
    if (allowedRoleSet.size === 0) return true;
    if (!payload?.role) return false;
    return allowedRoleSet.has(payload.role);
  }, [allowedRoleSet]);

  useEffect(() => {
    const checkAccess = async () => {
      let accessToken = contextAccessToken ?? localStorage.getItem("accessToken");

      if (accessToken) {
        const payload = decodeToken(accessToken);
        const now = Date.now() / 1000;
        if (payload && payload.exp > now) {
          if (ensureRoleAllowed(payload)) {
            setAuthState((prev) => (prev.status === "allowed" && prev.reason === null
              ? prev
              : { status: "allowed", reason: null }));
            if (setContextAccessToken && contextAccessToken !== accessToken) {
              setContextAccessToken(accessToken);
            }
            return;
          }
          setAuthState((prev) => (prev.status === "denied" && prev.reason === "forbidden"
            ? prev
            : { status: "denied", reason: "forbidden" }));
          return;
        }
      }

      try {
        const res = await api.post("/auth/refresh");
        localStorage.setItem("accessToken", res.data.accessToken);
        if (setContextAccessToken && contextAccessToken !== res.data.accessToken) {
          setContextAccessToken(res.data.accessToken);
        }
        const payload = decodeToken(res.data.accessToken);
        if (ensureRoleAllowed(payload)) {
          setAuthState((prev) => (prev.status === "allowed" && prev.reason === null
            ? prev
            : { status: "allowed", reason: null }));
        } else {
          setAuthState((prev) => (prev.status === "denied" && prev.reason === "forbidden"
            ? prev
            : { status: "denied", reason: "forbidden" }));
        }
      } catch (err) {
        console.error(err);
        localStorage.removeItem("accessToken");
        if (setContextAccessToken && contextAccessToken !== null) {
          setContextAccessToken(null);
        }
        setAuthState((prev) => (prev.status === "denied" && prev.reason === "unauthenticated"
          ? prev
          : { status: "denied", reason: "unauthenticated" }));
      }
    };

    checkAccess();
  }, [contextAccessToken, ensureRoleAllowed, setContextAccessToken]);

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

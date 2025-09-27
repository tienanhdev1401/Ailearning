import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./client/pages/LoginPage";
import HomePage from "./client/pages/HomePage";
import GrammarCheckerPage from "./client/pages/GrammarCheckerPage";
import ClientLayout from "./layout/ClientLayout";
import AdminLayout from "./layout/AdminLayout";
import ForgetPassword from "./client/pages/ForgetPasswordPage";
import ProtectedRoute from "./routers/ProtectedRoute";

import Dashboard from "./admin/pages/Dashboard";
import VideoPraticePage from "./client/pages/VideoPraticePage";
import SpeakingVideoPraticePage from "./client/pages/SpeakingVideoPraticePage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ClientLayout><HomePage /></ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/grammar"
        element={
          <ProtectedRoute>
            <ClientLayout><GrammarCheckerPage /></ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route path="/video" element={<VideoPraticePage />} />
      <Route path="/speak" element={<SpeakingVideoPraticePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout><Dashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

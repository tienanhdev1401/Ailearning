import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import GrammarCheckerPage from "./pages/GrammarCheckerPage";
import Layout from './components/Layout';
import ForgetPassword from "./pages/ForgetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><HomePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/grammar"
        element={
          <ProtectedRoute>
            <Layout><GrammarCheckerPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
    </Routes>
  );
}

export default App;

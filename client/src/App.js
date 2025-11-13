import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./client/pages/LoginPage";
import HomePage from "./client/pages/HomePage";
import GrammarCheckerPage from "./client/pages/GrammarCheckerPage";
import ClientLayout from "./layout/ClientLayout";
import AdminLayout from "./layout/AdminLayout";
import ForgotPasswordPage from "./client/pages/ForgotPasswordPage";
import ProtectedRoute from "./routers/ProtectedRoute";

import Dashboard from "./admin/pages/Dashboard";
import VideoPraticePage from "./client/pages/VideoPraticePage";
import SpeakingVideoPraticePage from "./client/pages/SpeakingVideoPraticePage";

import StudentChat from "./client/pages/StudentChat";
import StaffChat from "./admin/pages/StaffChat";
import AiChatExperience from "./client/pages/AiChatExperience";

import ReasonPage from "./client/pages/muticheckPage/ReasonPage";
import GoalPage from "./client/pages/muticheckPage/GoalPage";
import ChooseLevelPage from "./client/pages/muticheckPage/ChooseLevelPage";
import ChooseTopicPage from "./client/pages/muticheckPage/ChooseTopicPage";
import KnowLevelPage from "./client/pages/muticheckPage/KnowLevelPage";
import FindLevelPage from "./client/pages/muticheckPage/FindLevelPage";

import RoadmapListPage from "./client/pages/RoadMapListPage";
import RoadMapPage from "./client/pages/RoadMapPage";

import DayDetailPage from "./client/pages/DayDetailPage";
import ProfilePage from "./client/pages/ProfilePage";

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/video" element={<VideoPraticePage />} />
      <Route path="/speak" element={<SpeakingVideoPraticePage />} />

      <Route
        path="/experience/ai-chat"
        element={
          <ProtectedRoute>
            <ClientLayout><AiChatExperience /></ClientLayout>
          </ProtectedRoute>
        }
      />

      
      <Route path="/welcome/reason" element={<ReasonPage />} />
      <Route path="/welcome/goal" element={<GoalPage />} />
      <Route path="/welcome/level" element={<ChooseLevelPage />} />
      <Route path="/welcome/topic" element={<ChooseTopicPage />} />
      <Route path="/welcome/proficiency" element={<KnowLevelPage />} />
      <Route path="/welcome/placement" element={<FindLevelPage />} />


      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ClientLayout><ProfilePage /></ClientLayout>
          </ProtectedRoute>
        }
      />


      <Route path="/roadmaps" element={
        <ProtectedRoute>
          <ClientLayout><RoadmapListPage /></ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/roadmaps/:id/days" element={
        <ProtectedRoute>
          <ClientLayout><RoadMapPage /></ClientLayout>
        </ProtectedRoute>
      } />

      <Route path="/days/:dayId" element={
        <ProtectedRoute>
          <DayDetailPage />
        </ProtectedRoute>
      } />

      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout><Dashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/student" 
        element={
          <ProtectedRoute>
            <StudentChat />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/staff" 
        element={
          <ProtectedRoute>
            <StaffChat />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;

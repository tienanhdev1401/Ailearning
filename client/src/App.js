import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./client/pages/LoginPage";
import HomePage from "./client/pages/HomePage";
import GrammarCheckerPage from "./client/pages/GrammarCheckerPage";
import ClientLayout from "./layout/ClientLayout";
import AdminLayout from "./layout/AdminLayout";
import DashboardPage from "./admin/pages/DashboardPage";
import CalendarPage from "./admin/pages/CalendarPage";
import UsersPage from "./admin/pages/UsersPage";
import ReportsPage from "./admin/pages/ReportsPage";
import RoadmapsPage from "./admin/pages/RoadmapsPage";
import RoadmapDaysPage from "./admin/pages/RoadmapDaysPage";
import StaffPage from "./admin/pages/StaffPage";
import MessagesPage from "./admin/pages/MessagesPage";
import ForgotPasswordPage from "./client/pages/ForgotPasswordPage";
import ProtectedRoute from "./routers/ProtectedRoute";

import VideoPraticePage from "./client/pages/VideoPraticePage";
import SpeakingVideoPraticePage from "./client/pages/SpeakingVideoPraticePage";

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

import LessonTopicPage from "./client/pages/LessonTopicPage";
import TopicDetailPage from "./client/pages/LessonTopicDetailPage";
import USER_ROLE from "./enums/userRole.enum";
import ActivityManagerPage from "./admin/pages/ActivityManagerPage";
import SupportChatWidget from "./component/SupportChatWidget";

import LessonManagerPage from "./admin/pages/LessonManagerPage";

function App() {
  return (
    <>
      <SupportChatWidget />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <HomePage />
              </ClientLayout>
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
      
      <Route
        path="/video/:lessonId"
        element={
          <ProtectedRoute>
            <ClientLayout><VideoPraticePage /></ClientLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/speak/:lessonId"
        element={
          <ProtectedRoute>
            <ClientLayout><SpeakingVideoPraticePage /></ClientLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/topics"
        element={
          <ProtectedRoute>
            <ClientLayout><LessonTopicPage /></ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/topics/:topic"
        element={
          <ProtectedRoute>
            <ClientLayout><TopicDetailPage/></ClientLayout>
          </ProtectedRoute>
        }
      />


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
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><DashboardPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><UsersPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN]}>
            <AdminLayout><StaffPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><ReportsPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><MessagesPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/calendar"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><CalendarPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/lessons"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><LessonManagerPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/roadmaps"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><RoadmapsPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/roadmaps/:roadmapId/days"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><RoadmapDaysPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/days/:dayId/activities"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.STAFF]}>
            <AdminLayout><ActivityManagerPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

export default App;

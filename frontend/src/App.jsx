// frontend/src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Navbar from "./components/Layout/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Activities from "./pages/Activities";
import Goals from "./pages/Goals";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import PublicRoute from "./components/Auth/PublicRoute";
import LoadingSpinner from "./components/UI/LoadingSpinner";
import { useNotificationStore } from "./store/notificationStore";
import Steps from "./pages/Steps";
import Sleep from "./pages/Sleep";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeAwareToaster from "./components/UI/ThemeAwareToaster";

import DashboardLayout from "./components/Layout/DashboardLayout";
import Overview from "./pages/Overview";
import AICoach from "./pages/AICoach";
import Challenges from "./pages/Challenges";
import Insights from "./pages/Insights";
import ARFitness from "./pages/ARFitness";

function App() {
  const { user, loading, initializeSession } = useAuthStore(); // Get initializeSession
  const { fetchNotifications, checkWaterReminder } = useNotificationStore();

  // --- UPDATED: Call initializeSession only once on app startup ---
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(checkWaterReminder, 3600000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, checkWaterReminder]);

  // This loading check is now the main gatekeeper for the entire app.
  // Nothing will render until the initial session check is complete.
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Router>
          {user && <Navbar />}
          <main
            className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 ${
              user ? "pt-16" : ""
            }`}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="overview" element={<Overview />} />
                <Route path="ai-coach" element={<AICoach />} />
                <Route path="challenges" element={<Challenges />} />
                <Route path="insights" element={<Insights />} />
                <Route path="ar-fitness" element={<ARFitness />} />
                <Route
                  index
                  element={<Navigate to="/dashboard/overview" replace />}
                />
              </Route>

              <Route
                path="/"
                element={<Navigate to="/dashboard/overview" replace />}
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <Activities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/steps"
                element={
                  <ProtectedRoute>
                    <Steps />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sleep"
                element={
                  <ProtectedRoute>
                    <Sleep />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <ThemeAwareToaster />
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;

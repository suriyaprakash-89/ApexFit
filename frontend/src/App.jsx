// frontend/src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Navbar from "./components/Layout/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Activities from "./pages/Activities";
import Goals from "./pages/Goals";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LoadingSpinner from "./components/UI/LoadingSpinner";
import { useNotificationStore } from "./store/notificationStore";
import Steps from "./pages/Steps";
import Sleep from "./pages/Sleep";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeAwareToaster from "./components/UI/ThemeAwareToaster";

function App() {
  const { user, loading } = useAuthStore();
  const { fetchNotifications, checkWaterReminder } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Check for water reminders every hour
      const interval = setInterval(checkWaterReminder, 3600000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, checkWaterReminder]);

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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
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

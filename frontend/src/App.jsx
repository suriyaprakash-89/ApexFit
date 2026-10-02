// frontend/src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import ProtectedRoute from "./components/Auth/ProtectedRoute";
import PublicRoute from "./components/Auth/PublicRoute";
import LoadingSpinner from "./components/UI/LoadingSpinner";
import ThemeAwareToaster from "./components/UI/ThemeAwareToaster";
import ConfirmDialog from "./components/UI/ConfirmDialog";
import AppShell from "./components/Layout/AppShell";

// Every page is its own chunk, so heavy pages (AR/TensorFlow, charts) only
// download when they are opened.
const Landing = lazy(() => import("./pages/Landing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Overview = lazy(() => import("./pages/Overview"));
const Activities = lazy(() => import("./pages/Activities"));
const Steps = lazy(() => import("./pages/Steps"));
const Sleep = lazy(() => import("./pages/Sleep"));
const Goals = lazy(() => import("./pages/Goals"));
const AICoach = lazy(() => import("./pages/AICoach"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Insights = lazy(() => import("./pages/Insights"));
const ARFitness = lazy(() => import("./pages/ARFitness"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  const { loading, initializeSession } = useAuthStore();

  // Start the auth session listener once on app startup
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Prevent scroll/wheel on number inputs
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.type === "number") {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel, { passive: false });
  }, []);

  // Nothing renders until the initial session check is complete.
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Marketing: landing for visitors, signed-in users go straight to the app */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Signed-out pages */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          {/* Reached from the email link with a temporary recovery session */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Signed-in app: one shell (sidebar / bottom nav) for every page */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/steps" element={<Steps />} />
            <Route path="/sleep" element={<Sleep />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/coach" element={<AICoach />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/ar-fitness" element={<ARFitness />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Old URLs keep working */}
          <Route path="/dashboard/overview" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/ai-coach" element={<Navigate to="/coach" replace />} />
          <Route path="/dashboard/challenges" element={<Navigate to="/challenges" replace />} />
          <Route path="/dashboard/insights" element={<Navigate to="/insights" replace />} />
          <Route path="/dashboard/ar-fitness" element={<Navigate to="/ar-fitness" replace />} />
        </Routes>
      </Suspense>
      <ConfirmDialog />
      <ThemeAwareToaster />
    </Router>
  );
}

export default App;

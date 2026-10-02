// frontend/src/components/Auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../UI/LoadingSpinner";
import { isAdminUser } from "../Layout/navigation";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Remember where the user was going so login can send them back
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // UI-only check; the backend enforces admin rights from the profiles table.
  if (adminOnly && !isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

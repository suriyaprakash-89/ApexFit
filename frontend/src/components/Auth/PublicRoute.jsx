// frontend/src/components/Auth/PublicRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../UI/LoadingSpinner";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    // If we are still checking for a session, show a loading spinner
    return <LoadingSpinner />;
  }

  if (user) {
    // Signed-in users don't need the login/register pages
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;

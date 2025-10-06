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
    // If the user IS logged in, redirect them away from this public page
    // to the main dashboard overview.
    return <Navigate to="/dashboard/overview" replace />;
  }

  // If the user is NOT logged in, show the requested page (e.g., Login or Register)
  return children;
};

export default PublicRoute;
